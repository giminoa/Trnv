const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database-sqlite');
const { authenticateToken, requireOrganizer } = require('../middleware/auth-sqlite');

const router = express.Router();

// Turnuvaya başvuru yap
router.post('/tournaments/:tournamentId/apply', authenticateToken, [
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mesaj en fazla 500 karakter olabilir')
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

    const tournamentId = parseInt(req.params.tournamentId);
    const { message } = req.body;

    // Kullanıcının takımını bul
    const userTeam = await db.get(
      'SELECT id FROM teams WHERE captain_id = ? AND is_user_team = 1',
      [req.user.id]
    );

    if (!userTeam) {
      return res.status(400).json({
        success: false,
        message: 'Başvuru yapmak için önce bir takım oluşturmalısınız'
      });
    }

    // Turnuva var mı kontrol et
    const tournament = await db.get(
      'SELECT id, name, status, max_participants, current_participants FROM tournaments WHERE id = ?',
      [tournamentId]
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Turnuva bulunamadı'
      });
    }

    // Turnuva durumu kontrolü
    if (tournament.status !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Bu turnuva için başvuru kabul edilmiyor'
      });
    }

    // Turnuva dolu mu kontrol et
    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Turnuva dolu, başvuru kabul edilmiyor'
      });
    }

    // Daha önce başvuru yapılmış mı kontrol et
    const existingApplication = await db.get(
      'SELECT id FROM tournament_applications WHERE tournament_id = ? AND team_id = ?',
      [tournamentId, userTeam.id]
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bu turnuvaya zaten başvuru yapmışsınız'
      });
    }

    // Başvuruyu oluştur (varsayılan olarak pending)
    const applicationStatus = 'pending';
    const result = await db.run(`
      INSERT INTO tournament_applications (
        tournament_id, team_id, message, status
      ) VALUES (?, ?, ?, ?)
    `, [tournamentId, userTeam.id, message || null, applicationStatus]);

    res.status(201).json({
      success: true,
      message: 'Başvurunuz başarıyla gönderildi',
      data: {
        applicationId: result.lastID,
        status: applicationStatus,
        tournamentName: tournament.name
      }
    });

  } catch (error) {
    console.error('Başvuru hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Turnuva başvurularını listele (organizatör için)
router.get('/tournaments/:tournamentId/applications', authenticateToken, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const status = req.query.status || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Turnuva sahibi kontrolü
    const tournament = await db.get(
      'SELECT created_by FROM tournaments WHERE id = ?',
      [tournamentId]
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Turnuva bulunamadı'
      });
    }

    if (tournament.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu turnuvanın başvurularını görme yetkiniz yok'
      });
    }

    let whereClause = 'WHERE ta.tournament_id = ?';
    let params = [tournamentId];

    if (status) {
      whereClause += ' AND ta.status = ?';
      params.push(status);
    }

    // Toplam başvuru sayısı
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM tournament_applications ta ${whereClause}`,
      params
    );

    // Başvuruları getir
    const applications = await db.all(`
      SELECT 
        ta.id, ta.status, ta.message, ta.application_date, ta.reviewed_at,
        t.id as team_id, t.name as team_name, t.logo as team_logo, 
        t.stadium_name, t.manager_name, t.motto,
        u.username as captain_username, u.first_name, u.last_name, u.email,
        reviewer.username as reviewer_username,
        g.name as group_name
      FROM tournament_applications ta
      LEFT JOIN teams t ON ta.team_id = t.id
      LEFT JOIN users u ON t.captain_id = u.id
      LEFT JOIN users reviewer ON ta.reviewed_by = reviewer.id
      LEFT JOIN groups g ON ta.group_id = g.id
      ${whereClause}
      ORDER BY ta.application_date DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Başvuru listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Başvuru durumunu güncelle (onay/red)
router.put('/applications/:applicationId/status', authenticateToken, requireOrganizer, [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Geçerli bir durum seçiniz (approved/rejected)'),
  body('groupId')
    .optional()
    .isInt()
    .withMessage('Geçerli bir grup ID\'si giriniz')
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

    const applicationId = parseInt(req.params.applicationId);
    const { status, groupId } = req.body;

    // Başvuruyu bul
    const application = await db.get(`
      SELECT ta.*, t.tournament_id, t.created_by, tour.current_participants, tour.max_participants
      FROM tournament_applications ta
      LEFT JOIN tournaments t ON ta.tournament_id = t.id
      LEFT JOIN tournaments tour ON ta.tournament_id = tour.id
      WHERE ta.id = ?
    `, [applicationId]);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Başvuru bulunamadı'
      });
    }

    // Yetki kontrolü
    if (application.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu başvuruyu güncelleme yetkiniz yok'
      });
    }

    // Zaten işlenmiş mi kontrol et
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu başvuru zaten işlenmiş'
      });
    }

    // Onay durumunda turnuva dolu mu kontrol et
    if (status === 'approved' && application.current_participants >= application.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Turnuva dolu, başvuru onaylanamıyor'
      });
    }

    // Grup kontrolü (onay durumunda)
    if (status === 'approved' && groupId) {
      const group = await db.get(
        'SELECT id FROM groups WHERE id = ? AND tournament_id = ?',
        [groupId, application.tournament_id]
      );

      if (!group) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz grup seçimi'
        });
      }
    }

    // Başvuru durumunu güncelle
    await db.run(`
      UPDATE tournament_applications 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, group_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, req.user.id, groupId || null, applicationId]);

    // Onay durumunda turnuva katılımcı sayısını artır
    if (status === 'approved') {
      await db.run(
        'UPDATE tournaments SET current_participants = current_participants + 1 WHERE id = ?',
        [application.tournament_id]
      );
    }

    res.json({
      success: true,
      message: status === 'approved' ? 'Başvuru onaylandı' : 'Başvuru reddedildi'
    });

  } catch (error) {
    console.error('Başvuru durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcının başvurularını listele
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    // Kullanıcının takımını bul
    const userTeam = await db.get(
      'SELECT id FROM teams WHERE captain_id = ? AND is_user_team = 1',
      [req.user.id]
    );

    if (!userTeam) {
      return res.json({
        success: true,
        data: {
          applications: []
        }
      });
    }

    // Başvuruları getir
    const applications = await db.all(`
      SELECT 
        ta.id, ta.status, ta.message, ta.application_date, ta.reviewed_at,
        t.id as tournament_id, t.name as tournament_name, t.type as tournament_type,
        t.start_date, t.end_date, t.logo as tournament_logo,
        g.name as group_name,
        reviewer.username as reviewer_username
      FROM tournament_applications ta
      LEFT JOIN tournaments t ON ta.tournament_id = t.id
      LEFT JOIN groups g ON ta.group_id = g.id
      LEFT JOIN users reviewer ON ta.reviewed_by = reviewer.id
      WHERE ta.team_id = ?
      ORDER BY ta.application_date DESC
    `, [userTeam.id]);

    res.json({
      success: true,
      data: {
        applications
      }
    });

  } catch (error) {
    console.error('Kullanıcı başvuruları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Başvuruyu iptal et
router.delete('/applications/:applicationId', authenticateToken, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.applicationId);

    // Başvuruyu bul
    const application = await db.get(`
      SELECT ta.*, t.captain_id 
      FROM tournament_applications ta
      LEFT JOIN teams t ON ta.team_id = t.id
      WHERE ta.id = ?
    `, [applicationId]);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Başvuru bulunamadı'
      });
    }

    // Yetki kontrolü
    if (application.captain_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu başvuruyu iptal etme yetkiniz yok'
      });
    }

    // Sadece bekleyen başvurular iptal edilebilir
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Sadece bekleyen başvurular iptal edilebilir'
      });
    }

    // Başvuruyu sil
    await db.run('DELETE FROM tournament_applications WHERE id = ?', [applicationId]);

    res.json({
      success: true,
      message: 'Başvuru başarıyla iptal edildi'
    });

  } catch (error) {
    console.error('Başvuru iptal hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Otomatik grup atama
router.post('/tournaments/:tournamentId/assign-groups', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);

    // Turnuva sahibi kontrolü
    const tournament = await db.get(
      'SELECT created_by, group_count, max_teams_per_group FROM tournaments WHERE id = ?',
      [tournamentId]
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Turnuva bulunamadı'
      });
    }

    if (tournament.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu turnuvada grup atama yetkiniz yok'
      });
    }

    // Onaylanmış ve henüz gruba atanmamış başvuruları getir
    const approvedApplications = await db.all(
      'SELECT id, team_id FROM tournament_applications WHERE tournament_id = ? AND status = ? AND group_id IS NULL',
      [tournamentId, 'approved']
    );

    if (approvedApplications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Gruba atanacak onaylanmış başvuru bulunamadı'
      });
    }

    // Grupları getir
    const groups = await db.all(
      'SELECT id FROM groups WHERE tournament_id = ? ORDER BY display_order, id',
      [tournamentId]
    );

    if (groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Turnuvada grup bulunamadı'
      });
    }

    // Takımları gruplara dağıt (round-robin)
    let groupIndex = 0;
    const maxTeamsPerGroup = tournament.max_teams_per_group || 4;

    for (const application of approvedApplications) {
      // Mevcut grupta kaç takım var kontrol et
      const currentGroupTeamCount = await db.get(
        'SELECT COUNT(*) as count FROM tournament_applications WHERE tournament_id = ? AND group_id = ?',
        [tournamentId, groups[groupIndex].id]
      );

      // Grup doluysa bir sonraki gruba geç
      if (currentGroupTeamCount.count >= maxTeamsPerGroup) {
        groupIndex = (groupIndex + 1) % groups.length;
      }

      // Takımı gruba ata
      await db.run(
        'UPDATE tournament_applications SET group_id = ? WHERE id = ?',
        [groups[groupIndex].id, application.id]
      );

      // Bir sonraki grup için index'i artır
      groupIndex = (groupIndex + 1) % groups.length;
    }

    res.json({
      success: true,
      message: `${approvedApplications.length} takım gruplara başarıyla atandı`
    });

  } catch (error) {
    console.error('Grup atama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;