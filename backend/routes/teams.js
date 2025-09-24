const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireOrganizer, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Turnuva takımlarını listele
router.get('/tournament/:tournamentId', optionalAuth, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const groupId = req.query.groupId || '';
    const approved = req.query.approved;

    let whereClause = 'WHERE t.tournament_id = ?';
    let params = [tournamentId];

    if (groupId) {
      whereClause += ' AND t.group_id = ?';
      params.push(groupId);
    }

    if (approved !== undefined) {
      whereClause += ' AND t.is_approved = ?';
      params.push(approved === 'true');
    }

    const connection = await pool.getConnection();

    // Toplam takım sayısı
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM teams t ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Takımları getir
    const [teams] = await connection.execute(
      `SELECT 
        t.id, t.name, t.short_name, t.logo, t.group_id, t.is_approved,
        t.contact_email, t.contact_phone, t.registration_date,
        u.username as captain_name, u.email as captain_email,
        g.name as group_name
       FROM teams t
       LEFT JOIN users u ON t.captain_id = u.id
       LEFT JOIN groups g ON t.group_id = g.id
       ${whereClause}
       ORDER BY t.registration_date DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        teams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Takım listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Takım detayını getir
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    // Takım bilgilerini getir
    const [teams] = await connection.execute(
      `SELECT 
        t.*, u.username as captain_name, u.email as captain_email,
        g.name as group_name, tr.name as tournament_name
       FROM teams t
       LEFT JOIN users u ON t.captain_id = u.id
       LEFT JOIN groups g ON t.group_id = g.id
       LEFT JOIN tournaments tr ON t.tournament_id = tr.id
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

    // Takım oyuncularını getir
    const [players] = await connection.execute(
      `SELECT id, name, jersey_number, position, age, is_captain
       FROM players 
       WHERE team_id = ? 
       ORDER BY is_captain DESC, jersey_number ASC`,
      [teamId]
    );

    // Takım istatistiklerini getir
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END) as played_matches,
        COALESCE(s.won, 0) as won,
        COALESCE(s.drawn, 0) as drawn,
        COALESCE(s.lost, 0) as lost,
        COALESCE(s.goals_for, 0) as goals_for,
        COALESCE(s.goals_against, 0) as goals_against,
        COALESCE(s.points, 0) as points
       FROM teams t
       LEFT JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
       LEFT JOIN standings s ON t.id = s.team_id
       WHERE t.id = ?`,
      [teamId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        team: {
          ...team,
          players,
          stats: stats[0]
        }
      }
    });

  } catch (error) {
    console.error('Takım detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yeni takım oluştur/başvuru yap
router.post('/', authenticateToken, [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Takım adı 2-100 karakter arası olmalıdır'),
  body('tournamentId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir turnuva seçiniz'),
  body('shortName')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Kısa ad en fazla 10 karakter olabilir'),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  body('contactPhone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Telefon en fazla 20 karakter olabilir')
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
      name, tournamentId, shortName, contactEmail, contactPhone, notes
    } = req.body;

    const connection = await pool.getConnection();

    // Turnuva kontrolü
    const [tournaments] = await connection.execute(
      'SELECT status, max_participants, current_participants FROM tournaments WHERE id = ?',
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

    // Turnuva durumu kontrolü
    if (tournament.status !== 'registration') {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bu turnuva kayıt almıyor'
      });
    }

    // Katılımcı sayısı kontrolü
    if (tournament.current_participants >= tournament.max_participants) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Turnuva dolu'
      });
    }

    // Aynı isimde takım kontrolü
    const [existingTeams] = await connection.execute(
      'SELECT id FROM teams WHERE name = ? AND tournament_id = ?',
      [name, tournamentId]
    );

    if (existingTeams.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir takım zaten var'
      });
    }

    // Kullanıcının bu turnuvada zaten takımı var mı kontrolü
    const [userTeams] = await connection.execute(
      'SELECT id FROM teams WHERE captain_id = ? AND tournament_id = ?',
      [req.user.id, tournamentId]
    );

    if (userTeams.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bu turnuvada zaten bir takımınız var'
      });
    }

    // Takımı oluştur
    const [result] = await connection.execute(
      `INSERT INTO teams (
        name, short_name, captain_id, tournament_id, contact_email, contact_phone, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, shortName || null, req.user.id, tournamentId, contactEmail || null, contactPhone || null, notes || null]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Takım başvurusu başarıyla oluşturuldu',
      data: {
        teamId: result.insertId,
        name,
        status: 'pending_approval'
      }
    });

  } catch (error) {
    console.error('Takım oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Takım bilgilerini güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    // Takım sahibi kontrolü
    const [teams] = await connection.execute(
      `SELECT t.captain_id, t.tournament_id, tr.created_by as tournament_creator
       FROM teams t
       LEFT JOIN tournaments tr ON t.tournament_id = tr.id
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

    // Sadece takım kaptanı, turnuva organizatörü veya admin güncelleyebilir
    if (team.captain_id !== req.user.id && 
        team.tournament_creator !== req.user.id && 
        req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu takımı güncelleme yetkiniz yok'
      });
    }

    const { name, shortName, contactEmail, contactPhone, notes } = req.body;

    // Güncelleme alanlarını hazırla
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      // Aynı isimde başka takım var mı kontrol et
      const [existingTeams] = await connection.execute(
        'SELECT id FROM teams WHERE name = ? AND tournament_id = ? AND id != ?',
        [name, team.tournament_id, teamId]
      );

      if (existingTeams.length > 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Bu isimde bir takım zaten var'
        });
      }

      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (shortName !== undefined) {
      updateFields.push('short_name = ?');
      updateValues.push(shortName);
    }
    if (contactEmail !== undefined) {
      updateFields.push('contact_email = ?');
      updateValues.push(contactEmail);
    }
    if (contactPhone !== undefined) {
      updateFields.push('contact_phone = ?');
      updateValues.push(contactPhone);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan bulunamadı'
      });
    }

    updateValues.push(teamId);

    await connection.execute(
      `UPDATE teams SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    connection.release();

    res.json({
      success: true,
      message: 'Takım bilgileri başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Takım güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Takım başvurusunu onayla/reddet
router.put('/:id/approval', authenticateToken, [
  body('approved')
    .isBoolean()
    .withMessage('Geçerli bir onay durumu seçiniz'),
  body('groupId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçerli bir grup seçiniz')
], async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { approved, groupId } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const connection = await pool.getConnection();

    // Yetki kontrolü
    const [teams] = await connection.execute(
      `SELECT t.tournament_id, tr.created_by as tournament_creator, t.is_approved
       FROM teams t
       LEFT JOIN tournaments tr ON t.tournament_id = tr.id
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

    // Sadece turnuva organizatörü veya admin onaylayabilir
    if (team.tournament_creator !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu takımı onaylama yetkiniz yok'
      });
    }

    // Grup kontrolü (onaylanıyorsa ve grup sistemi varsa)
    if (approved && groupId) {
      const [groups] = await connection.execute(
        'SELECT id FROM groups WHERE id = ? AND tournament_id = ?',
        [groupId, team.tournament_id]
      );

      if (groups.length === 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Geçersiz grup'
        });
      }
    }

    // Takım onayını güncelle
    await connection.execute(
      'UPDATE teams SET is_approved = ?, group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [approved, approved && groupId ? groupId : null, teamId]
    );

    // Onaylandıysa turnuva katılımcı sayısını artır
    if (approved && !team.is_approved) {
      await connection.execute(
        'UPDATE tournaments SET current_participants = current_participants + 1 WHERE id = ?',
        [team.tournament_id]
      );
    }
    // Onay kaldırıldıysa katılımcı sayısını azalt
    else if (!approved && team.is_approved) {
      await connection.execute(
        'UPDATE tournaments SET current_participants = current_participants - 1 WHERE id = ?',
        [team.tournament_id]
      );
    }

    connection.release();

    res.json({
      success: true,
      message: `Takım ${approved ? 'onaylandı' : 'reddedildi'}`
    });

  } catch (error) {
    console.error('Takım onaylama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Takımı sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    // Takım sahibi kontrolü
    const [teams] = await connection.execute(
      `SELECT t.captain_id, t.tournament_id, t.is_approved, tr.created_by as tournament_creator, tr.status
       FROM teams t
       LEFT JOIN tournaments tr ON t.tournament_id = tr.id
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

    // Sadece takım kaptanı, turnuva organizatörü veya admin silebilir
    if (team.captain_id !== req.user.id && 
        team.tournament_creator !== req.user.id && 
        req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu takımı silme yetkiniz yok'
      });
    }

    // Aktif turnuvalarda onaylanmış takımlar silinemez
    if (team.status === 'active' && team.is_approved) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Aktif turnuvalarda onaylanmış takımlar silinemez'
      });
    }

    await connection.execute('DELETE FROM teams WHERE id = ?', [teamId]);

    // Onaylanmış takımsa katılımcı sayısını azalt
    if (team.is_approved) {
      await connection.execute(
        'UPDATE tournaments SET current_participants = current_participants - 1 WHERE id = ?',
        [team.tournament_id]
      );
    }

    connection.release();

    res.json({
      success: true,
      message: 'Takım başarıyla silindi'
    });

  } catch (error) {
    console.error('Takım silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Takıma oyuncu ekle
router.post('/:id/players', authenticateToken, [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Oyuncu adı 2-100 karakter arası olmalıdır'),
  body('jerseyNumber')
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage('Forma numarası 1-99 arası olmalıdır'),
  body('position')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Pozisyon en fazla 50 karakter olabilir'),
  body('age')
    .optional()
    .isInt({ min: 16, max: 50 })
    .withMessage('Yaş 16-50 arası olmalıdır')
], async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { name, jerseyNumber, position, age, isCaptain } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const connection = await pool.getConnection();

    // Takım sahibi kontrolü
    const [teams] = await connection.execute(
      'SELECT captain_id FROM teams WHERE id = ?',
      [teamId]
    );

    if (teams.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    if (teams[0].captain_id !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu takıma oyuncu ekleme yetkiniz yok'
      });
    }

    // Forma numarası kontrolü
    if (jerseyNumber) {
      const [existingPlayers] = await connection.execute(
        'SELECT id FROM players WHERE team_id = ? AND jersey_number = ?',
        [teamId, jerseyNumber]
      );

      if (existingPlayers.length > 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Bu forma numarası zaten kullanılıyor'
        });
      }
    }

    // Oyuncuyu ekle
    const [result] = await connection.execute(
      `INSERT INTO players (team_id, name, jersey_number, position, age, is_captain)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [teamId, name, jerseyNumber || null, position || null, age || null, isCaptain || false]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Oyuncu başarıyla eklendi',
      data: {
        playerId: result.insertId,
        name,
        jerseyNumber
      }
    });

  } catch (error) {
    console.error('Oyuncu ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;