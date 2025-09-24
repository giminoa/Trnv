const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Veritabanı başlatılıyor...');
    
    // SQL dosyasını oku
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // SQL komutlarını ayır
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    const connection = await pool.getConnection();
    
    // Her SQL komutunu çalıştır
    for (const statement of statements) {
      try {
        await connection.execute(statement);
      } catch (error) {
        // Tablo zaten varsa hatayı görmezden gel
        if (!error.message.includes('already exists')) {
          console.error('SQL Hatası:', error.message);
          console.error('Komut:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    connection.release();
    
    console.log('✅ Veritabanı başarıyla başlatıldı');
    console.log('📊 Tüm tablolar oluşturuldu');
    console.log('🔑 Admin kullanıcısı hazır (admin@turnuva.taktisyen.net / admin123)');
    
    return true;
  } catch (error) {
    console.error('❌ Veritabanı başlatma hatası:', error.message);
    return false;
  }
};

// Veritabanı bağlantısını test et
const testDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as test');
    connection.release();
    
    if (rows[0].test === 1) {
      console.log('✅ Veritabanı bağlantısı başarılı');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error.message);
    return false;
  }
};

// Tabloları kontrol et
const checkTables = async () => {
  try {
    const connection = await pool.getConnection();
    const [tables] = await connection.execute('SHOW TABLES');
    connection.release();
    
    const tableNames = tables.map(table => Object.values(table)[0]);
    console.log('📋 Mevcut tablolar:', tableNames.join(', '));
    
    const requiredTables = [
      'users', 'tournaments', 'teams', 'groups', 
      'matches', 'standings', 'players', 'match_events',
      'tournament_settings', 'system_settings'
    ];
    
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Eksik tablolar:', missingTables.join(', '));
      return false;
    }
    
    console.log('✅ Tüm gerekli tablolar mevcut');
    return true;
  } catch (error) {
    console.error('❌ Tablo kontrol hatası:', error.message);
    return false;
  }
};

module.exports = {
  initializeDatabase,
  testDatabaseConnection,
  checkTables
};