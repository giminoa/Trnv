const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database-sqlite');
const { authenticateToken, optionalAuth } = require('../middleware/auth-sqlite');

const router = express.Router();

// Kullanıcının takımını getir
router.get('/my-team', authenticateToken, async (req, res) => {
  try {
    const team = await db.get(`
      SELECT * FROM teams 
      WHERE captain_id = ? AND is_user_team = 1
      ORDER BY created_at DESC 
      LIMIT 1
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        team: team || null
      }
    });

  } catch (error) {
    console.error('Kullanıcı takımı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı takımı oluştur
router.post('/create-user-team', authenticateToken, [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Takım adı 2-50 karakter arası olmalıdır'),
  body('stadiumName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Stadyum adı 2-50 karakter arası olmalıdır'),
  body('managerName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Menejer adı 2-50 karakter arası olmalıdır'),
  body('motto')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Motto en fazla 100 karakter olabilir'),
  body('shortName')
    .isLength({ min: 2, max: 3 })
    .withMessage('Takım kısaltması 2-3 karakter arası olmalıdır'),
  body('primaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Geçerli bir hex renk kodu giriniz'),
  body('secondaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Geçerli bir hex renk kodu giriniz')
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

    const { name, stadiumName, managerName, motto, logo, shortName, primaryColor, secondaryColor } = req.body;

    // Kullanıcının zaten takımı var mı kontrol et
    const existingTeam = await db.get(
      'SELECT id FROM teams WHERE captain_id = ? AND is_user_team = 1',
      [req.user.id]
    );

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Zaten bir takımınız var'
      });
    }

    // Takım adı benzersiz mi kontrol et
    const nameExists = await db.get(
      'SELECT id FROM teams WHERE name = ?',
      [name]
    );

    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu takım adı zaten kullanılıyor'
      });
    }

    // Takım kısaltması benzersiz mi kontrol et
    const shortNameExists = await db.get(
      'SELECT id FROM teams WHERE short_name = ?',
      [shortName.toUpperCase()]
    );

    if (shortNameExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu takım kısaltması zaten kullanılıyor'
      });
    }

    // Takımı oluştur
    const result = await db.run(`
      INSERT INTO teams (
        name, stadium_name, manager_name, motto, logo, short_name, 
        primary_color, secondary_color, captain_id, is_user_team, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `, [
      name, 
      stadiumName, 
      managerName, 
      motto || null, 
      logo || null,
      shortName.toUpperCase(),
      primaryColor || '#3B82F6',
      secondaryColor || '#1E40AF',
      req.user.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Takım başarıyla oluşturuldu',
      data: {
        teamId: result.lastID,
        name,
        stadiumName,
        managerName,
        shortName: shortName.toUpperCase()
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

// Kullanıcı takımını güncelle
router.put('/my-team', authenticateToken, [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Takım adı 2-50 karakter arası olmalıdır'),
  body('stadiumName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Stadyum adı 2-50 karakter arası olmalıdır'),
  body('managerName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Menejer adı 2-50 karakter arası olmalıdır'),
  body('motto')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Motto en fazla 100 karakter olabilir'),
  body('shortName')
    .optional()
    .isLength({ min: 2, max: 3 })
    .withMessage('Takım kısaltması 2-3 karakter arası olmalıdır'),
  body('primaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Geçerli bir hex renk kodu giriniz'),
  body('secondaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Geçerli bir hex renk kodu giriniz')
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

    // Kullanıcının takımını bul
    const team = await db.get(
      'SELECT id FROM teams WHERE captain_id = ? AND is_user_team = 1',
      [req.user.id]
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    const { name, stadiumName, managerName, motto, logo, shortName, primaryColor, secondaryColor } = req.body;

    // Takım adı değişiyorsa, başka takımda kullanılıp kullanılmadığını kontrol et
    if (name) {
      const nameExists = await db.get(
        'SELECT id FROM teams WHERE name = ? AND id != ?',
        [name, team.id]
      );

      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Bu takım adı zaten kullanılıyor'
        });
      }
    }

    // Takım kısaltması değişiyorsa, başka takımda kullanılıp kullanılmadığını kontrol et
    if (shortName) {
      const shortNameExists = await db.get(
        'SELECT id FROM teams WHERE short_name = ? AND id != ?',
        [shortName.toUpperCase(), team.id]
      );

      if (shortNameExists) {
        return res.status(400).json({
          success: false,
          message: 'Bu takım kısaltması zaten kullanılıyor'
        });
      }
    }

    // Güncelleme alanlarını hazırla
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (stadiumName !== undefined) {
      updateFields.push('stadium_name = ?');
      updateValues.push(stadiumName);
    }
    if (managerName !== undefined) {
      updateFields.push('manager_name = ?');
      updateValues.push(managerName);
    }
    if (motto !== undefined) {
      updateFields.push('motto = ?');
      updateValues.push(motto);
    }
    if (logo !== undefined) {
      updateFields.push('logo = ?');
      updateValues.push(logo);
    }
    if (shortName !== undefined) {
      updateFields.push('short_name = ?');
      updateValues.push(shortName.toUpperCase());
    }
    if (primaryColor !== undefined) {
      updateFields.push('primary_color = ?');
      updateValues.push(primaryColor);
    }
    if (secondaryColor !== undefined) {
      updateFields.push('secondary_color = ?');
      updateValues.push(secondaryColor);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan bulunamadı'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(team.id);

    // Takımı güncelle
    await db.run(
      `UPDATE teams SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Takım başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Takım güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm kullanıcı takımlarını listele
router.get('/user-teams', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = 'WHERE is_user_team = 1';
    let params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR manager_name LIKE ? OR stadium_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Toplam takım sayısı
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM teams ${whereClause}`,
      params
    );
    const total = countResult.total;

    // Takımları getir
    const teams = await db.all(`
      SELECT 
        t.id, t.name, t.stadium_name, t.manager_name, t.motto, t.logo, t.created_at,
        u.username as captain_username, u.first_name, u.last_name
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

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
router.get('/user-team/:id', optionalAuth, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);

    const team = await db.get(`
      SELECT 
        t.*, u.username as captain_username, u.first_name, u.last_name, u.email
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      WHERE t.id = ? AND t.is_user_team = 1
    `, [teamId]);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    res.json({
      success: true,
      data: {
        team
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

// Takım adı müsaitlik kontrolü
router.get('/check-name/:name', authenticateToken, async (req, res) => {
  try {
    const name = req.params.name;
    
    const existingTeam = await db.get(
      'SELECT id FROM teams WHERE name = ? AND is_user_team = 1',
      [name]
    );

    res.json({
      success: true,
      data: {
        available: !existingTeam,
        message: existingTeam ? 'Bu takım adı zaten kullanılıyor' : 'Takım adı müsait'
      }
    });

  } catch (error) {
    console.error('Takım adı kontrol hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;