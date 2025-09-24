const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tüm kullanıcıları listele (Admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    const connection = await pool.getConnection();

    // Toplam kullanıcı sayısı
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Kullanıcıları getir
    const [users] = await connection.execute(
      `SELECT id, username, email, first_name, last_name, role, is_active, created_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı detayını getir
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Sadece admin veya kendi profilini görebilir
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcının bilgilerini görme yetkiniz yok'
      });
    }

    const connection = await pool.getConnection();
    
    const [users] = await connection.execute(
      `SELECT id, username, email, first_name, last_name, phone, avatar, role, is_active, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcının turnuva istatistiklerini getir
    const [tournamentStats] = await connection.execute(
      `SELECT 
        COUNT(DISTINCT t.id) as created_tournaments,
        COUNT(DISTINCT tm.id) as participated_teams
       FROM users u
       LEFT JOIN tournaments t ON u.id = t.created_by
       LEFT JOIN teams tm ON u.id = tm.captain_id
       WHERE u.id = ?`,
      [userId]
    );

    connection.release();

    const user = users[0];
    const stats = tournamentStats[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
          stats: {
            createdTournaments: stats.created_tournaments,
            participatedTeams: stats.participated_teams
          }
        }
      }
    });

  } catch (error) {
    console.error('Kullanıcı detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı bilgilerini güncelle
router.put('/:id', authenticateToken, [
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ad en fazla 50 karakter olabilir'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Soyad en fazla 50 karakter olabilir'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Telefon en fazla 20 karakter olabilir'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Sadece admin veya kendi profilini güncelleyebilir
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcının bilgilerini güncelleme yetkiniz yok'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, email } = req.body;
    const connection = await pool.getConnection();

    // Email değişiyorsa, başka kullanıcıda kullanılıp kullanılmadığını kontrol et
    if (email) {
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor'
        });
      }
    }

    // Kullanıcı bilgilerini güncelle
    const updateFields = [];
    const updateValues = [];

    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan bulunamadı'
      });
    }

    updateValues.push(userId);

    await connection.execute(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Güncellenmiş kullanıcı bilgilerini getir
    const [users] = await connection.execute(
      `SELECT id, username, email, first_name, last_name, phone, role, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Kullanıcı bilgileri başarıyla güncellendi',
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı rolünü güncelle (Admin)
router.put('/:id/role', authenticateToken, requireAdmin, [
  body('role')
    .isIn(['admin', 'organizer', 'participant'])
    .withMessage('Geçerli bir rol seçiniz')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol',
        errors: errors.array()
      });
    }

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, userId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Kullanıcı rolü başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Rol güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcıyı aktif/pasif yap (Admin)
router.put('/:id/status', authenticateToken, requireAdmin, [
  body('isActive')
    .isBoolean()
    .withMessage('Geçerli bir durum seçiniz')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum',
        errors: errors.array()
      });
    }

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isActive, userId]
    );

    connection.release();

    res.json({
      success: true,
      message: `Kullanıcı ${isActive ? 'aktif' : 'pasif'} hale getirildi`
    });

  } catch (error) {
    console.error('Durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Şifre değiştir
router.put('/:id/password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre gerekli'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Sadmin veya kendi şifresini değiştirebilir
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcının şifresini değiştirme yetkiniz yok'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const connection = await pool.getConnection();

    // Mevcut şifreyi kontrol et (admin değilse)
    if (req.user.role !== 'admin') {
      const [users] = await connection.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isCurrentPasswordValid) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre yanlış'
        });
      }
    }

    // Yeni şifreyi hashle ve güncelle
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await connection.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;