-- Turnuva Yönetim Sistemi Veritabanı Şeması
-- Oluşturulma Tarihi: 2024

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS turnuva_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE turnuva_db;

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'organizer', 'participant') DEFAULT 'participant',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
);

-- Turnuvalar tablosu
CREATE TABLE IF NOT EXISTS tournaments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('league', 'group', 'world_cup', 'champions_league') NOT NULL,
    status ENUM('draft', 'registration', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    registration_start DATE,
    registration_end DATE,
    max_participants INT DEFAULT 32,
    current_participants INT DEFAULT 0,
    group_count INT DEFAULT 1,
    match_duration INT DEFAULT 90,
    has_extra_time BOOLEAN DEFAULT FALSE,
    has_penalties BOOLEAN DEFAULT FALSE,
    logo VARCHAR(255),
    rules TEXT,
    prize_info TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_creator (created_by)
);

-- Takımlar tablosu
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(10),
    logo VARCHAR(255),
    captain_id INT,
    tournament_id INT NOT NULL,
    group_id INT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT FALSE,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_group (group_id),
    INDEX idx_captain (captain_id),
    UNIQUE KEY unique_team_tournament (name, tournament_id)
);

-- Gruplar tablosu
CREATE TABLE IF NOT EXISTS groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    UNIQUE KEY unique_group_tournament (name, tournament_id)
);

-- Maçlar tablosu
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    group_id INT,
    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,
    match_date DATETIME,
    venue VARCHAR(100),
    round_name VARCHAR(50),
    round_number INT DEFAULT 1,
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    home_penalty_score INT DEFAULT 0,
    away_penalty_score INT DEFAULT 0,
    status ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled') DEFAULT 'scheduled',
    match_duration INT DEFAULT 90,
    extra_time_duration INT DEFAULT 0,
    referee VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_group (group_id),
    INDEX idx_teams (home_team_id, away_team_id),
    INDEX idx_date (match_date),
    INDEX idx_status (status),
    INDEX idx_round (round_number)
);

-- Puan durumu tablosu
CREATE TABLE IF NOT EXISTS standings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    group_id INT,
    team_id INT NOT NULL,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    drawn INT DEFAULT 0,
    lost INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    goal_difference INT GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    points INT DEFAULT 0,
    position INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_group (group_id),
    INDEX idx_team (team_id),
    INDEX idx_points (points DESC),
    INDEX idx_position (position),
    UNIQUE KEY unique_team_group (team_id, group_id, tournament_id)
);

-- Oyuncular tablosu
CREATE TABLE IF NOT EXISTS players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    jersey_number INT,
    position VARCHAR(50),
    age INT,
    is_captain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team (team_id),
    UNIQUE KEY unique_jersey_team (jersey_number, team_id)
);

-- Maç olayları tablosu (goller, kartlar vs.)
CREATE TABLE IF NOT EXISTS match_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    player_id INT,
    event_type ENUM('goal', 'yellow_card', 'red_card', 'substitution', 'own_goal') NOT NULL,
    minute INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL,
    INDEX idx_match (match_id),
    INDEX idx_team (team_id),
    INDEX idx_player (player_id),
    INDEX idx_event_type (event_type)
);

-- Turnuva ayarları tablosu
CREATE TABLE IF NOT EXISTS tournament_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    UNIQUE KEY unique_setting_tournament (tournament_id, setting_key)
);

-- Sistem ayarları tablosu
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
);

-- Başlangıç verilerini ekle
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', 'Turnuva Yönetim Sistemi', 'Site adı'),
('site_description', 'Profesyonel turnuva yönetim platformu', 'Site açıklaması'),
('max_file_size', '5242880', 'Maksimum dosya boyutu (byte)'),
('allowed_file_types', 'jpg,jpeg,png,gif', 'İzin verilen dosya türleri'),
('default_match_duration', '90', 'Varsayılan maç süresi (dakika)'),
('points_for_win', '3', 'Galibiyet puanı'),
('points_for_draw', '1', 'Beraberlik puanı'),
('points_for_loss', '0', 'Mağlubiyet puanı');

-- Admin kullanıcısı oluştur (şifre: admin123)
INSERT IGNORE INTO users (username, email, password_hash, role, first_name, last_name, is_active, email_verified) VALUES
('admin', 'admin@turnuva.taktisyen.net', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'User', TRUE, TRUE);