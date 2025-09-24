const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database path
const dbPath = path.join(__dirname, '..', 'database', 'turnuva.db');

// Create connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite bağlantı hatası:', err.message);
  } else {
    console.log('✅ SQLite veritabanına başarıyla bağlandı');
  }
});

// Promise wrapper for SQLite
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await dbAsync.get('SELECT 1 as test');
    console.log('✅ SQLite veritabanı bağlantısı test edildi');
    return true;
  } catch (error) {
    console.error('❌ SQLite bağlantı testi hatası:', error.message);
    return false;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('📊 SQLite veritabanı tabloları oluşturuluyor...');
    
    // Enable foreign keys
    await dbAsync.run('PRAGMA foreign_keys = ON');
    
    // Users table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'participant' CHECK(role IN ('admin', 'organizer', 'participant')),
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        avatar TEXT,
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tournaments table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK(type IN ('league', 'group', 'world_cup', 'champions_league')),
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'registration', 'active', 'completed', 'cancelled')),
        start_date DATE,
        end_date DATE,
        registration_start DATE,
        registration_end DATE,
        application_deadline DATE,
        max_participants INTEGER DEFAULT 32,
        current_participants INTEGER DEFAULT 0,
        group_count INTEGER DEFAULT 1,
        max_teams_per_group INTEGER DEFAULT 4,
        match_duration INTEGER DEFAULT 90,
        has_extra_time BOOLEAN DEFAULT 0,
        has_penalties BOOLEAN DEFAULT 0,
        auto_approve BOOLEAN DEFAULT 0,
        logo TEXT,
        rules TEXT,
        prize_info TEXT,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Teams table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        short_name TEXT,
        logo TEXT,
        captain_id INTEGER,
        tournament_id INTEGER NOT NULL,
        group_id INTEGER,
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_approved BOOLEAN DEFAULT 0,
        contact_email TEXT,
        contact_phone TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        UNIQUE(name, tournament_id)
      )
    `);

    // Groups table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        UNIQUE(name, tournament_id)
      )
    `);

    // Tournament Applications table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS tournament_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        message TEXT,
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        group_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
        UNIQUE(tournament_id, team_id)
      )
    `);

    // Matches table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        group_id INTEGER,
        home_team_id INTEGER NOT NULL,
        away_team_id INTEGER NOT NULL,
        match_date DATETIME,
        venue TEXT,
        round_name TEXT,
        round_number INTEGER DEFAULT 1,
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        home_penalty_score INTEGER DEFAULT 0,
        away_penalty_score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
        match_duration INTEGER DEFAULT 90,
        extra_time_duration INTEGER DEFAULT 0,
        referee TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
        FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    // Standings table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS standings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        group_id INTEGER,
        team_id INTEGER NOT NULL,
        played INTEGER DEFAULT 0,
        won INTEGER DEFAULT 0,
        drawn INTEGER DEFAULT 0,
        lost INTEGER DEFAULT 0,
        goals_for INTEGER DEFAULT 0,
        goals_against INTEGER DEFAULT 0,
        goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
        points INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE(team_id, group_id, tournament_id)
      )
    `);

    // Players table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        jersey_number INTEGER,
        position TEXT,
        age INTEGER,
        is_captain BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE(jersey_number, team_id)
      )
    `);

    // Match events table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS match_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        player_id INTEGER,
        event_type TEXT NOT NULL CHECK(event_type IN ('goal', 'yellow_card', 'red_card', 'substitution', 'own_goal')),
        minute INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
      )
    `);

    // Tournament settings table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS tournament_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        setting_key TEXT NOT NULL,
        setting_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        UNIQUE(tournament_id, setting_key)
      )
    `);

    // System settings table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default system settings
    const defaultSettings = [
      ['site_name', 'Turnuva Yönetim Sistemi', 'Site adı'],
      ['site_description', 'Profesyonel turnuva yönetim platformu', 'Site açıklaması'],
      ['max_file_size', '5242880', 'Maksimum dosya boyutu (byte)'],
      ['allowed_file_types', 'jpg,jpeg,png,gif', 'İzin verilen dosya türleri'],
      ['default_match_duration', '90', 'Varsayılan maç süresi (dakika)'],
      ['points_for_win', '3', 'Galibiyet puanı'],
      ['points_for_draw', '1', 'Beraberlik puanı'],
      ['points_for_loss', '0', 'Mağlubiyet puanı']
    ];

    for (const [key, value, description] of defaultSettings) {
      await dbAsync.run(
        'INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
        [key, value, description]
      );
    }

    // Insert admin user (password: admin123)
    await dbAsync.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name, is_active, email_verified) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'admin', 
      'admin@turnuva.taktisyen.net', 
      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
      'admin', 
      'Admin', 
      'User', 
      1, 
      1
    ]);

    console.log('✅ SQLite veritabanı başarıyla başlatıldı');
    console.log('📊 Tüm tablolar oluşturuldu');
    console.log('🔑 Admin kullanıcısı hazır (admin@turnuva.taktisyen.net / admin123)');
    
    return true;
  } catch (error) {
    console.error('❌ SQLite veritabanı başlatma hatası:', error.message);
    return false;
  }
};

module.exports = {
  db: dbAsync,
  testConnection,
  initializeDatabase
};