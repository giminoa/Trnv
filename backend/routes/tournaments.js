const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireOrganizer, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Tüm turnuvaları listele
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const type = req.query.type || '';
    const search = req.query.search || '';

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    if (search) {
      whereClause += ' AND (t.name LIKE ? OR t.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const connection = await pool.getConnection();

    // Toplam turnuva sayısı
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM tournaments t ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Turnuvaları getir
    const [tournaments] = await connection.execute(
      `SELECT 
        t.id, t.name, t.description, t.type, t.status, 
        t.start_date, t.end_date, t.registration_start, t.registration_end,
        t.max_participants, t.current_participants, t.logo, t.created_at,
        u.username as creator_name
       FROM tournaments t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        tournaments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Turnuva listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Turnuva detayını getir
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    // Turnuva bilgilerini getir
    const [tournaments] = await connection.execute(
      `SELECT 
        t.*, u.username as creator_name, u.email as creator_email
       FROM tournaments t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ?`,
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

    // Turnuva istatistiklerini getir
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(DISTINCT tm.id) as total_teams,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END) as finished_matches
       FROM tournaments t
       LEFT JOIN teams tm ON t.id = tm.tournament_id AND tm.is_approved = TRUE
       LEFT JOIN matches m ON t.id = m.tournament_id
       WHERE t.id = ?`,
      [tournamentId]
    );

    // Grupları getir (varsa)
    const [groups] = await connection.execute(
      `SELECT id, name, display_order 
       FROM groups 
       WHERE tournament_id = ? 
       ORDER BY display_order, name`,
      [tournamentId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        tournament: {
          ...tournament,
          stats: stats[0],
          groups: groups
        }
      }
    });

  } catch (error) {
    console.error('Turnuva detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yeni turnuva oluştur
router.post('/', authenticateToken, requireOrganizer, [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Turnuva adı 3-100 karakter arası olmalıdır'),
  body('type')
    .isIn(['league', 'group', 'world_cup', 'champions_league'])
    .withMessage('Geçerli bir turnuva tipi seçiniz'),
  body('maxParticipants')
    .isInt({ min: 4, max: 64 })
    .withMessage('Katılımcı sayısı 4-64 arası olmalıdır'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi giriniz'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir bitiş tarihi giriniz')
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
      name, description, type, maxParticipants, startDate, endDate,
      registrationStart, registrationEnd, groupCount, matchDuration,
      hasExtraTime, hasPenalties, rules, prizeInfo
    } = req.body;

    const connection = await pool.getConnection();

    // Turnuvayı oluştur
    const [result] = await connection.execute(
      `INSERT INTO tournaments (
        name, description, type, max_participants, start_date, end_date,
        registration_start, registration_end, group_count, match_duration,
        has_extra_time, has_penalties, rules, prize_info, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description || null, type, maxParticipants,
        startDate || null, endDate || null,
        registrationStart || null, registrationEnd || null,
        groupCount || 1, matchDuration || 90,
        hasExtraTime || false, hasPenalties || false,
        rules || null, prizeInfo || null, req.user.id
      ]
    );

    const tournamentId = result.insertId;

    // Grup sistemli turnuvalar için grupları oluştur
    if (type === 'group' || type === 'world_cup' || type === 'champions_league') {
      const numGroups = groupCount || (type === 'world_cup' ? 8 : 4);
      
      for (let i = 1; i <= numGroups; i++) {
        const groupName = String.fromCharCode(64 + i); // A, B, C, ...
        await connection.execute(
          'INSERT INTO groups (tournament_id, name, display_order) VALUES (?, ?, ?)',
          [tournamentId, `Grup ${groupName}`, i]
        );
      }
    }

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Turnuva başarıyla oluşturuldu',
      data: {
        tournamentId,
        name,
        type
      }
    });

  } catch (error) {
    console.error('Turnuva oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Turnuva güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    // Turnuva sahibi kontrolü
    const [tournaments] = await connection.execute(
      'SELECT created_by, status FROM tournaments WHERE id = ?',
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

    // Sadece turnuva sahibi veya admin güncelleyebilir
    if (tournament.created_by !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu turnuvayı güncelleme yetkiniz yok'
      });
    }

    // Aktif turnuvalarda bazı alanlar güncellenemez
    const restrictedFields = ['type', 'max_participants'];
    if (tournament.status === 'active') {
      for (const field of restrictedFields) {
        if (req.body[field] !== undefined) {
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Aktif turnuvalarda bu alan güncellenemez'
          });
        }
      }
    }

    const {
      name, description, startDate, endDate, registrationStart, registrationEnd,
      matchDuration, hasExtraTime, hasPenalties, rules, prizeInfo
    } = req.body;

    // Güncelleme alanlarını hazırla
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (startDate !== undefined) {
      updateFields.push('start_date = ?');
      updateValues.push(startDate);
    }
    if (endDate !== undefined) {
      updateFields.push('end_date = ?');
      updateValues.push(endDate);
    }
    if (registrationStart !== undefined) {
      updateFields.push('registration_start = ?');
      updateValues.push(registrationStart);
    }
    if (registrationEnd !== undefined) {
      updateFields.push('registration_end = ?');
      updateValues.push(registrationEnd);
    }
    if (matchDuration !== undefined) {
      updateFields.push('match_duration = ?');
      updateValues.push(matchDuration);
    }
    if (hasExtraTime !== undefined) {
      updateFields.push('has_extra_time = ?');
      updateValues.push(hasExtraTime);
    }
    if (hasPenalties !== undefined) {
      updateFields.push('has_penalties = ?');
      updateValues.push(hasPenalties);
    }
    if (rules !== undefined) {
      updateFields.push('rules = ?');
      updateValues.push(rules);
    }
    if (prizeInfo !== undefined) {
      updateFields.push('prize_info = ?');
      updateValues.push(prizeInfo);
    }

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan bulunamadı'
      });
    }

    updateValues.push(tournamentId);

    await connection.execute(
      `UPDATE tournaments SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    connection.release();

    res.json({
      success: true,
      message: 'Turnuva başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Turnuva güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Turnuva durumunu güncelle
router.put('/:id/status', authenticateToken, [
  body('status')
    .isIn(['draft', 'registration', 'active', 'completed', 'cancelled'])
    .withMessage('Geçerli bir durum seçiniz')
], async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { status } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum',
        errors: errors.array()
      });
    }

    const connection = await pool.getConnection();

    // Turnuva sahibi kontrolü
    const [tournaments] = await connection.execute(
      'SELECT created_by, status as current_status FROM tournaments WHERE id = ?',
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

    // Sadece turnuva sahibi veya admin durumu değiştirebilir
    if (tournament.created_by !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu turnuvanın durumunu değiştirme yetkiniz yok'
      });
    }

    await connection.execute(
      'UPDATE tournaments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, tournamentId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Turnuva durumu başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Turnuva durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Turnuvayı sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    // Turnuva sahibi kontrolü
    const [tournaments] = await connection.execute(
      'SELECT created_by, status FROM tournaments WHERE id = ?',
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

    // Sadece turnuva sahibi veya admin silebilir
    if (tournament.created_by !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Bu turnuvayı silme yetkiniz yok'
      });
    }

    // Aktif turnuvalar silinemez
    if (tournament.status === 'active') {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Aktif turnuvalar silinemez'
      });
    }

    await connection.execute('DELETE FROM tournaments WHERE id = ?', [tournamentId]);
    connection.release();

    res.json({
      success: true,
      message: 'Turnuva başarıyla silindi'
    });

  } catch (error) {
    console.error('Turnuva silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;