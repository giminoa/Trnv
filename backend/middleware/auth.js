const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT token doğrulama middleware'i
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim token\'ı gerekli'
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcının hala aktif olup olmadığını kontrol et
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token veya kullanıcı aktif değil'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token süresi dolmuş'
      });
    }
    
    console.error('Auth middleware hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Rol kontrolü middleware'i
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    next();
  };
};

// Admin kontrolü
const requireAdmin = requireRole('admin');

// Organizatör veya admin kontrolü
const requireOrganizer = requireRole(['admin', 'organizer']);

// Opsiyonel auth - token varsa doğrula, yoksa devam et
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );
    connection.release();

    req.user = users.length > 0 ? users[0] : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireOrganizer,
  optionalAuth
};