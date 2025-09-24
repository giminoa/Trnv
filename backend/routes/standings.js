const express = require('express');
const { pool } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Turnuva puan durumunu getir
router.get('/tournament/:tournamentId', optionalAuth, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const groupId = req.query.groupId || '';

    let whereClause = 'WHERE s.tournament_id = ?';
    let params = [tournamentId];

    if (groupId) {
      whereClause += ' AND s.group_id = ?';
      params.push(groupId);
    }

    const connection = await pool.getConnection();

    // Puan durumunu getir
    const [standings] = await connection.execute(
      `SELECT 
        s.*, t.name as team_name, t.logo as team_logo,
        g.name as group_name
       FROM standings s
       LEFT JOIN teams t ON s.team_id = t.id
       LEFT JOIN groups g ON s.group_id = g.id
       ${whereClause}
       ORDER BY 
        g.display_order ASC,
        s.points DESC, 
        s.goal_difference DESC, 
        s.goals_for DESC,
        t.name ASC`,
      params
    );

    // Pozisyonları güncelle
    let currentGroup = null;
    let position = 1;
    
    for (let i = 0; i < standings.length; i++) {
      if (standings[i].group_id !== currentGroup) {
        currentGroup = standings[i].group_id;
        position = 1;
      }
      
      standings[i].position = position;
      position++;
    }

    connection.release();

    res.json({
      success: true,
      data: {
        standings
      }
    });

  } catch (error) {
    console.error('Puan durumu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Grup puan durumunu getir
router.get('/group/:groupId', optionalAuth, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const connection = await pool.getConnection();

    // Grup bilgisini getir
    const [groups] = await connection.execute(
      'SELECT id, name, tournament_id FROM groups WHERE id = ?',
      [groupId]
    );

    if (groups.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Grup bulunamadı'
      });
    }

    const group = groups[0];

    // Grup puan durumunu getir
    const [standings] = await connection.execute(
      `SELECT 
        s.*, t.name as team_name, t.logo as team_logo
       FROM standings s
       LEFT JOIN teams t ON s.team_id = t.id
       WHERE s.group_id = ?
       ORDER BY 
        s.points DESC, 
        s.goal_difference DESC, 
        s.goals_for DESC,
        t.name ASC`,
      [groupId]
    );

    // Pozisyonları güncelle
    for (let i = 0; i < standings.length; i++) {
      standings[i].position = i + 1;
    }

    connection.release();

    res.json({
      success: true,
      data: {
        group,
        standings
      }
    });

  } catch (error) {
    console.error('Grup puan durumu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Takım istatistiklerini getir
router.get('/team/:teamId', optionalAuth, async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const connection = await pool.getConnection();

    // Takım bilgisini getir
    const [teams] = await connection.execute(
      `SELECT t.*, tr.name as tournament_name, g.name as group_name
       FROM teams t
       LEFT JOIN tournaments tr ON t.tournament_id = tr.id
       LEFT JOIN groups g ON t.group_id = g.id
       WHERE t.id = ?`,
      [teamId]
    );

    if (teams.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    const team = teams[0];

    // Takım puan durumunu getir
    const [standings] = await connection.execute(
      'SELECT * FROM standings WHERE team_id = ?',
      [teamId]
    );

    // Takımın maçlarını getir
    const [matches] = await connection.execute(
      `SELECT 
        m.id, m.match_date, m.home_score, m.away_score, m.status,
        m.home_team_id, m.away_team_id,
        ht.name as home_team_name, at.name as away_team_name
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finished'
       ORDER BY m.match_date DESC`,
      [teamId, teamId]
    );

    // Son 5 maç formu
    const recentMatches = matches.slice(0, 5).map(match => {
      const isHome = match.home_team_id === teamId;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;
      
      let result = 'D'; // Draw
      if (teamScore > opponentScore) result = 'W'; // Win
      else if (teamScore < opponentScore) result = 'L'; // Loss
      
      return {
        matchId: match.id,
        date: match.match_date,
        opponent: isHome ? match.away_team_name : match.home_team_name,
        isHome,
        teamScore,
        opponentScore,
        result
      };
    });

    // Gol atan oyuncular
    const [goalScorers] = await connection.execute(
      `SELECT 
        p.name as player_name, COUNT(*) as goals
       FROM match_events me
       LEFT JOIN players p ON me.player_id = p.id
       LEFT JOIN matches m ON me.match_id = m.id
       WHERE me.team_id = ? AND me.event_type = 'goal' AND m.status = 'finished'
       GROUP BY p.id, p.name
       ORDER BY goals DESC, p.name ASC
       LIMIT 10`,
      [teamId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        team,
        standings: standings[0] || null,
        recentMatches,
        goalScorers,
        totalMatches: matches.length
      }
    });

  } catch (error) {
    console.error('Takım istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Turnuva istatistikleri
router.get('/tournament/:tournamentId/stats', optionalAuth, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const connection = await pool.getConnection();

    // Genel istatistikler
    const [generalStats] = await connection.execute(
      `SELECT 
        COUNT(DISTINCT t.id) as total_teams,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END) as finished_matches,
        COALESCE(SUM(m.home_score + m.away_score), 0) as total_goals
       FROM tournaments tr
       LEFT JOIN teams t ON tr.id = t.tournament_id AND t.is_approved = TRUE
       LEFT JOIN matches m ON tr.id = m.tournament_id
       WHERE tr.id = ?`,
      [tournamentId]
    );

    // En golcü takımlar
    const [topScoringTeams] = await connection.execute(
      `SELECT 
        t.name as team_name, t.logo as team_logo,
        s.goals_for, s.goals_against, s.goal_difference, s.points
       FROM standings s
       LEFT JOIN teams t ON s.team_id = t.id
       WHERE s.tournament_id = ?
       ORDER BY s.goals_for DESC, s.goal_difference DESC
       LIMIT 5`,
      [tournamentId]
    );

    // En az gol yiyen takımlar
    const [bestDefenseTeams] = await connection.execute(
      `SELECT 
        t.name as team_name, t.logo as team_logo,
        s.goals_for, s.goals_against, s.goal_difference, s.points
       FROM standings s
       LEFT JOIN teams t ON s.team_id = t.id
       WHERE s.tournament_id = ? AND s.played > 0
       ORDER BY s.goals_against ASC, s.goal_difference DESC
       LIMIT 5`,
      [tournamentId]
    );

    // En golcü oyuncular
    const [topScorers] = await connection.execute(
      `SELECT 
        p.name as player_name, t.name as team_name,
        COUNT(*) as goals
       FROM match_events me
       LEFT JOIN players p ON me.player_id = p.id
       LEFT JOIN teams t ON me.team_id = t.id
       LEFT JOIN matches m ON me.match_id = m.id
       WHERE m.tournament_id = ? AND me.event_type = 'goal' AND m.status = 'finished'
       GROUP BY p.id, p.name, t.name
       ORDER BY goals DESC, p.name ASC
       LIMIT 10`,
      [tournamentId]
    );

    // En çok kart gören oyuncular
    const [mostCards] = await connection.execute(
      `SELECT 
        p.name as player_name, t.name as team_name,
        COUNT(CASE WHEN me.event_type = 'yellow_card' THEN 1 END) as yellow_cards,
        COUNT(CASE WHEN me.event_type = 'red_card' THEN 1 END) as red_cards,
        COUNT(*) as total_cards
       FROM match_events me
       LEFT JOIN players p ON me.player_id = p.id
       LEFT JOIN teams t ON me.team_id = t.id
       LEFT JOIN matches m ON me.match_id = m.id
       WHERE m.tournament_id = ? AND me.event_type IN ('yellow_card', 'red_card') AND m.status = 'finished'
       GROUP BY p.id, p.name, t.name
       ORDER BY total_cards DESC, red_cards DESC, yellow_cards DESC
       LIMIT 10`,
      [tournamentId]
    );

    // Son maçlar
    const [recentMatches] = await connection.execute(
      `SELECT 
        m.id, m.match_date, m.home_score, m.away_score, m.status,
        ht.name as home_team_name, ht.logo as home_team_logo,
        at.name as away_team_name, at.logo as away_team_logo,
        g.name as group_name
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN groups g ON m.group_id = g.id
       WHERE m.tournament_id = ? AND m.status = 'finished'
       ORDER BY m.match_date DESC, m.id DESC
       LIMIT 10`,
      [tournamentId]
    );

    // Yaklaşan maçlar
    const [upcomingMatches] = await connection.execute(
      `SELECT 
        m.id, m.match_date, m.venue, m.round_name,
        ht.name as home_team_name, ht.logo as home_team_logo,
        at.name as away_team_name, at.logo as away_team_logo,
        g.name as group_name
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN groups g ON m.group_id = g.id
       WHERE m.tournament_id = ? AND m.status IN ('scheduled', 'live')
       ORDER BY m.match_date ASC, m.id ASC
       LIMIT 10`,
      [tournamentId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        generalStats: generalStats[0],
        topScoringTeams,
        bestDefenseTeams,
        topScorers,
        mostCards,
        recentMatches,
        upcomingMatches
      }
    });

  } catch (error) {
    console.error('Turnuva istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Puan durumunu yeniden hesapla
router.post('/tournament/:tournamentId/recalculate', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const connection = await pool.getConnection();

    // Mevcut puan durumunu temizle
    await connection.execute('DELETE FROM standings WHERE tournament_id = ?', [tournamentId]);

    // Bitmiş maçları getir
    const [matches] = await connection.execute(
      `SELECT id, group_id, home_team_id, away_team_id, home_score, away_score
       FROM matches 
       WHERE tournament_id = ? AND status = 'finished'`,
      [tournamentId]
    );

    // Her maç için puan durumunu güncelle
    for (const match of matches) {
      await updateStandingsFromMatch(connection, tournamentId, match);
    }

    connection.release();

    res.json({
      success: true,
      message: 'Puan durumu yeniden hesaplandı',
      data: {
        processedMatches: matches.length
      }
    });

  } catch (error) {
    console.error('Puan durumu yeniden hesaplama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Puan durumunu güncelle (yardımcı fonksiyon)
async function updateStandingsFromMatch(connection, tournamentId, match) {
  const { group_id, home_team_id, away_team_id, home_score, away_score } = match;

  // Maç sonucunu belirle
  let homePoints = 0, awayPoints = 0;
  let homeWon = 0, homeDraw = 0, homeLost = 0;
  let awayWon = 0, awayDraw = 0, awayLost = 0;

  if (home_score > away_score) {
    homePoints = 3;
    homeWon = 1;
    awayLost = 1;
  } else if (home_score < away_score) {
    awayPoints = 3;
    homeLost = 1;
    awayWon = 1;
  } else {
    homePoints = 1;
    awayPoints = 1;
    homeDraw = 1;
    awayDraw = 1;
  }

  // Ev sahibi takım
  await connection.execute(
    `INSERT INTO standings (tournament_id, group_id, team_id, played, won, drawn, lost, goals_for, goals_against, points)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     played = played + 1,
     won = won + VALUES(won),
     drawn = drawn + VALUES(drawn),
     lost = lost + VALUES(lost),
     goals_for = goals_for + VALUES(goals_for),
     goals_against = goals_against + VALUES(goals_against),
     points = points + VALUES(points)`,
    [tournamentId, group_id, home_team_id, homeWon, homeDraw, homeLost, home_score, away_score, homePoints]
  );

  // Deplasman takımı
  await connection.execute(
    `INSERT INTO standings (tournament_id, group_id, team_id, played, won, drawn, lost, goals_for, goals_against, points)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     played = played + 1,
     won = won + VALUES(won),
     drawn = drawn + VALUES(drawn),
     lost = lost + VALUES(lost),
     goals_for = goals_for + VALUES(goals_for),
     goals_against = goals_against + VALUES(goals_against),
     points = points + VALUES(points)`,
    [tournamentId, group_id, away_team_id, awayWon, awayDraw, awayLost, away_score, home_score, awayPoints]
  );
}

module.exports = router;