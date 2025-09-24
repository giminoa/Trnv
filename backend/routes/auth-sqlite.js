const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database-sqlite');
const { authenticateToken } = require('../middleware/auth-sqlite');

const router = express.Router();

// JWT token oluştur
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Kullanıcı kaydı
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Kullanıcı adı 3-50 karakter arası olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ad en fazla 50 karakter olabilir'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Soyad en fazla 50 karakter olabilir')
], async (req, res) => {
  try {
    // Validation hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veriler',
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName, phone } = req.body;

    // Kullanıcı adı ve email kontrolü
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı veya email zaten kullanılıyor'
      });
    }

    // Şifreyi hashle
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı kaydet
    const result = await db.run(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, phone) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName || null, lastName || null, phone || null]
    );

    // Token oluştur
    const token = generateToken(result.lastID);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi',
      data: {
        user: {
          id: result.lastID,
          username,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          role: 'participant'
        },
        token
      }
    });

  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı girişi
router.post('/login', [
  body('email')
    .notEmpty()
    .withMessage('Email gerekli'),
  body('password')
    .notEmpty()
    .withMessage('Şifre gerekli')
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

    const { email, password } = req.body;

    // Kullanıcıyı bul (username veya email ile)
    const user = await db.get(
      `SELECT id, username, email, password_hash, role, first_name, last_name, is_active 
       FROM users 
       WHERE (username = ? OR email = ?) AND is_active = 1`,
      [email, email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Token oluştur
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Profil bilgilerini getir
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT id, username, email, first_name, last_name, phone, avatar, role, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

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
          createdAt: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Token doğrulama
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token geçerli',
    data: {
      user: req.user
    }
  });
});

// Çıkış (client-side token silme)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Başarıyla çıkış yapıldı'
  });
});

module.exports = router;