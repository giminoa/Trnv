const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireOrganizer, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Turnuva maçlarını listele
router.get('/tournament/:tournamentId', optionalAuth, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const groupId = req.query.groupId || '';
    const round = req.query.round || '';

    let whereClause = 'WHERE m.tournament_id = ?';
    let params = [tournamentId];

    if (status) {
      whereClause += ' AND m.status = ?';
      params.push(status);
    }

    if (groupId) {
      whereClause += ' AND m.group_id = ?';
      params.push(groupId);
    }

    if (round) {
      whereClause += ' AND m.round_number = ?';
      params.push(round);
    }

    const connection = await pool.getConnection();

    // Toplam maç sayısı
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM matches m ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Maçları getir
    const [matches] = await connection.execute(
      `SELECT 
        m.id, m.match_date, m.venue, m.round_name, m.round_number,
        m.home_score, m.away_score, m.home_penalty_score, m.away_penalty_score,
        m.status, m.match_duration, m.extra_time_duration, m.referee,
        ht.name as home_team_name, ht.logo as home_team_logo,
        at.name as away_team_name, at.logo as away_team_logo,
        g.name as group_name
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN groups g ON m.group_id = g.id
       ${whereClause}
       ORDER BY m.match_date ASC, m.id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Maç listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Maç detayını getir
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    // Maç bilgilerini getir
    const [matches] = await connection.execute(
      `SELECT 
        m.*, 
        ht.name as home_team_name, ht.logo as home_team_logo,
        at.name as away_team_name, at.logo as away_team_logo,
        g.name as group_name, t.name as tournament_name
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN groups g ON m.group_id = g.id
       LEFT JOIN tournaments t ON m.tournament_id = t.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Maç bulunamadı'
      });
    }

    const match = matches[0];

    // Maç olaylarını getir
    const [events] = await connection.execute(
      `SELECT 
        me.id, me.event_type, me.minute, me.description,
        t.name as team_name, p.name as player_name
       FROM match_events me
       LEFT JOIN teams t ON me.team_id = t.id
       LEFT JOIN players p ON me.player_id = p.id
       WHERE me.match_id = ?
       ORDER BY me.minute ASC, me.id ASC`,
      [matchId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        match: {
          ...match,
          events
        }
      }
    });

  } catch (error) {
    console.error('Maç detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yeni maç oluştur
router.post('/', authenticateToken, requireOrganizer, [
  body('tournamentId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir turnuva seçiniz'),
  body('homeTeamId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir ev sahibi takım seçiniz'),
  body('awayTeamId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir deplasman takımı seçiniz'),
  body('matchDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir maç tarihi giriniz')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const {
      tournamentId, homeTeamId, awayTeamId, groupId, matchDate,
      venue, roundName, roundNumber, matchDuration, referee
    } = req.body;

    // Aynı takımlar kontrol
    if (homeTeamId === awayTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Bir takım kendisiyle maç yapamaz'
      });
    }

    const connection = await pool.getConnection();

    // Turnuva yetki kontrolü
    const [tournaments] = await connection.execute(
      'SELECT created_by FROM tournaments WHERE id = ?',
      [tournamentId]
    );

    if (tournaments.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Turnuva bulunamadı'
      });
    }

    if (tournaments[0].created_by !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu turnuvada maç oluşturma yetkiniz yok'
      });
    }

    // Takımların turnuvada olup olmadığını kontrol et
    const [teams] = await connection.execute(
      `SELECT COUNT(*) as count FROM teams 
       WHERE tournament_id = ? AND id IN (?, ?) AND is_approved = TRUE`,
      [tournamentId, homeTeamId, awayTeamId]
    );

    if (teams[0].count !== 2) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Seçilen takımlar bu turnuvada yer almıyor'
      });
    }

    // Maçı oluştur
    const [result] = await connection.execute(
      `INSERT INTO matches (
        tournament_id, group_id, home_team_id, away_team_id, match_date,
        venue, round_name, round_number, match_duration, referee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tournamentId, groupId || null, homeTeamId, awayTeamId, matchDate || null,
        venue || null, roundName || null, roundNumber || 1, matchDuration || 90, referee || null
      ]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Maç başarıyla oluşturuldu',
      data: {
        matchId: result.insertId
      }
    });

  } catch (error) {
    console.error('Maç oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Maç sonucunu güncelle
router.put('/:id/result', authenticateToken, [
  body('homeScore')
    .isInt({ min: 0 })
    .withMessage('Geçerli bir ev sahibi skoru giriniz'),
  body('awayScore')
    .isInt({ min: 0 })
    .withMessage('Geçerli bir deplasman skoru giriniz'),
  body('homePenaltyScore')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Geçerli bir penaltı skoru giriniz'),
  body('awayPenaltyScore')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Geçerli bir penaltı skoru giriniz')
], async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const {
      homeScore, awayScore, homePenaltyScore, awayPenaltyScore,
      extraTimeDuration, status
    } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const connection = await pool.getConnection();

    // Maç yetki kontrolü
    const [matches] = await connection.execute(
      `SELECT m.tournament_id, t.created_by 
       FROM matches m
       LEFT JOIN tournaments t ON m.tournament_id = t.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Maç bulunamadı'
      });
    }

    if (matches[0].created_by !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu maçın sonucunu güncelleme yetkiniz yok'
      });
    }

    // Maç sonucunu güncelle
    await connection.execute(
      `UPDATE matches SET 
        home_score = ?, away_score = ?, 
        home_penalty_score = ?, away_penalty_score = ?,
        extra_time_duration = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        homeScore, awayScore,
        homePenaltyScore || 0, awayPenaltyScore || 0,
        extraTimeDuration || 0, status || 'finished',
        matchId
      ]
    );

    // Puan durumunu güncelle (sadece bitmiş maçlar için)
    if (status === 'finished') {
      await updateStandings(connection, matchId);
    }

    connection.release();

    res.json({
      success: true,
      message: 'Maç sonucu başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Maç sonucu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Maça olay ekle (gol, kart vs.)
router.post('/:id/events', authenticateToken, [
  body('teamId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir takım seçiniz'),
  body('eventType')
    .isIn(['goal', 'yellow_card', 'red_card', 'substitution', 'own_goal'])
    .withMessage('Geçerli bir olay tipi seçiniz'),
  body('minute')
    .isInt({ min: 0, max: 200 })
    .withMessage('Geçerli bir dakika giriniz')
], async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { teamId, playerId, eventType, minute, description } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const connection = await pool.getConnection();

    // Maç yetki kontrolü
    const [matches] = await connection.execute(
      `SELECT m.tournament_id, t.created_by, m.home_team_id, m.away_team_id
       FROM matches m
       LEFT JOIN tournaments t ON m.tournament_id = t.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Maç bulunamadı'
      });
    }

    const match = matches[0];

    if (match.created_by !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu maça olay ekleme yetkiniz yok'
      });
    }

    // Takımın maçta olup olmadığını kontrol et
    if (teamId !== match.home_team_id && teamId !== match.away_team_id) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Seçilen takım bu maçta yer almıyor'
      });
    }

    // Oyuncu kontrolü (varsa)
    if (playerId) {
      const [players] = await connection.execute(
        'SELECT id FROM players WHERE id = ? AND team_id = ?',
        [playerId, teamId]
      );

      if (players.length === 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Seçilen oyuncu bu takımda yer almıyor'
        });
      }
    }

    // Olayı ekle
    const [result] = await connection.execute(
      `INSERT INTO match_events (match_id, team_id, player_id, event_type, minute, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [matchId, teamId, playerId || null, eventType, minute, description || null]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Maç olayı başarıyla eklendi',
      data: {
        eventId: result.insertId
      }
    });

  } catch (error) {
    console.error('Maç olayı ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Fikstür oluştur
router.post('/tournament/:tournamentId/generate-fixtures', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const connection = await pool.getConnection();

    // Turnuva yetki kontrolü
    const [tournaments] = await connection.execute(
      'SELECT created_by, type, status FROM tournaments WHERE id = ?',
      [tournamentId]
    );

    if (tournaments.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Turnuva bulunamadı'
      });
    }

    const tournament = tournaments[0];

    if (tournament.created_by !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu turnuvada fikstür oluşturma yetkiniz yok'
      });
    }

    // Onaylanmış takımları getir
    const [teams] = await connection.execute(
      'SELECT id, name, group_id FROM teams WHERE tournament_id = ? AND is_approved = TRUE',
      [tournamentId]
    );

    if (teams.length < 2) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Fikstür oluşturmak için en az 2 onaylanmış takım gerekli'
      });
    }

    // Mevcut maçları sil
    await connection.execute('DELETE FROM matches WHERE tournament_id = ?', [tournamentId]);

    let matchesCreated = 0;

    if (tournament.type === 'league') {
      // Lig usulü - herkes herkesle
      matchesCreated = await generateLeagueFixtures(connection, tournamentId, teams);
    } else if (tournament.type === 'group' || tournament.type === 'world_cup' || tournament.type === 'champions_league') {
      // Grup sistemi
      matchesCreated = await generateGroupFixtures(connection, tournamentId, teams);
    }

    connection.release();

    res.json({
      success: true,
      message: 'Fikstür başarıyla oluşturuldu',
      data: {
        matchesCreated,
        teamsCount: teams.length
      }
    });

  } catch (error) {
    console.error('Fikstür oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Puan durumunu güncelle
async function updateStandings(connection, matchId) {
  try {
    // Maç bilgilerini getir
    const [matches] = await connection.execute(
      `SELECT tournament_id, group_id, home_team_id, away_team_id, 
              home_score, away_score, home_penalty_score, away_penalty_score
       FROM matches WHERE id = ?`,
      [matchId]
    );

    if (matches.length === 0) return;

    const match = matches[0];
    const { tournament_id, group_id, home_team_id, away_team_id, home_score, away_score } = match;

    // Maç sonucunu belirle
    let homePoints = 0, awayPoints = 0;
    let homeWon = 0, homeDraw = 0, homeLost = 0;
    let awayWon = 0, awayDraw = 0, awayLost = 0;

    if (home_score > away_score) {
      homePoints = 3;
      awayPoints = 0;
      homeWon = 1;
      awayLost = 1;
    } else if (home_score < away_score) {
      homePoints = 0;
      awayPoints = 3;
      homeLost = 1;
      awayWon = 1;
    } else {
      homePoints = 1;
      awayPoints = 1;
      homeDraw = 1;
      awayDraw = 1;
    }

    // Ev sahibi takım puan durumu
    await connection.execute(
      `INSERT INTO standings (tournament_id, group_id, team_id, played, won, drawn, lost, goals_for, goals_against, points)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       played = played + 1,
       won = won + ?,
       drawn = drawn + ?,
       lost = lost + ?,
       goals_for = goals_for + ?,
       goals_against = goals_against + ?,
       points = points + ?`,
      [
        tournament_id, group_id, home_team_id, homeWon, homeDraw, homeLost, home_score, away_score, homePoints,
        homeWon, homeDraw, homeLost, home_score, away_score, homePoints
      ]
    );

    // Deplasman takımı puan durumu
    await connection.execute(
      `INSERT INTO standings (tournament_id, group_id, team_id, played, won, drawn, lost, goals_for, goals_against, points)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       played = played + 1,
       won = won + ?,
       drawn = drawn + ?,
       lost = lost + ?,
       goals_for = goals_for + ?,
       goals_against = goals_against + ?,
       points = points + ?`,
      [
        tournament_id, group_id, away_team_id, awayWon, awayDraw, awayLost, away_score, home_score, awayPoints,
        awayWon, awayDraw, awayLost, away_score, home_score, awayPoints
      ]
    );

  } catch (error) {
    console.error('Puan durumu güncelleme hatası:', error);
  }
}

// Lig usulü fikstür oluştur
async function generateLeagueFixtures(connection, tournamentId, teams) {
  let matchesCreated = 0;
  
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      await connection.execute(
        `INSERT INTO matches (tournament_id, home_team_id, away_team_id, round_name, round_number)
         VALUES (?, ?, ?, ?, ?)`,
        [tournamentId, teams[i].id, teams[j].id, 'Lig', 1]
      );
      matchesCreated++;
    }
  }
  
  return matchesCreated;
}

// Grup sistemi fikstür oluştur
async function generateGroupFixtures(connection, tournamentId, teams) {
  let matchesCreated = 0;
  
  // Grupları al
  const [groups] = await connection.execute(
    'SELECT id FROM groups WHERE tournament_id = ? ORDER BY display_order',
    [tournamentId]
  );
  
  for (const group of groups) {
    const groupTeams = teams.filter(team => team.group_id === group.id);
    
    if (groupTeams.length >= 2) {
      // Grup içi lig usulü
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          await connection.execute(
            `INSERT INTO matches (tournament_id, group_id, home_team_id, away_team_id, round_name, round_number)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tournamentId, group.id, groupTeams[i].id, groupTeams[j].id, 'Grup Aşaması', 1]
          );
          matchesCreated++;
        }
      }
    }
  }
  
  return matchesCreated;
}

module.exports = router;