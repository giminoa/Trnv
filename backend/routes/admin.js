const express = require('express');
const { db } = require('../config/database-sqlite');
const { authenticateToken } = require('../middleware/auth-sqlite');

const router = express.Router();

// Admin middleware - sadece admin kullanıcıları erişebilir
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gerekli'
    });
  }
  next();
};

// Tüm admin route'ları için auth ve admin kontrolü
router.use(authenticateToken);
router.use(requireAdmin);

// ============ USERS ENDPOINTS ============

// Kullanıcı istatistikleri
router.get('/users/stats', async (req, res) => {
  try {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const activeUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const newUsers = await db.get(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= datetime('now', '-7 days')
    `);

    res.json({
      success: true,
      data: {
        total: totalUsers.count,
        active: activeUsers.count,
        new: newUsers.count
      }
    });
  } catch (error) {
    console.error('Kullanıcı istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm kullanıcıları listele
router.get('/users', async (req, res) => {
  try {
    const users = await db.all(`
      SELECT 
        id, username, email, first_name, last_name, role, 
        is_active, email_verified, created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active === 1,
          emailVerified: user.email_verified === 1,
          createdAt: user.created_at,
          lastLogin: null // Bu alan henüz yok
        }))
      }
    });
  } catch (error) {
    console.error('Kullanıcıları listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı durumunu güncelle (aktif/pasif)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Admin kullanıcısının durumu değiştirilemez
    const user = await db.get('SELECT role FROM users WHERE id = ?', [id]);
    if (user && user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin kullanıcısının durumu değiştirilemez'
      });
    }

    await db.run(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: 'Kullanıcı durumu güncellendi'
    });
  } catch (error) {
    console.error('Kullanıcı durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı sil
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Admin kullanıcısı silinemez
    const user = await db.get('SELECT role FROM users WHERE id = ?', [id]);
    if (user && user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin kullanıcısı silinemez'
      });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Kullanıcı silindi'
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ TEAMS ENDPOINTS ============

// Takım istatistikleri
router.get('/teams/stats', async (req, res) => {
  try {
    const totalTeams = await db.get('SELECT COUNT(*) as count FROM teams WHERE is_user_team = 1');
    const approvedTeams = await db.get('SELECT COUNT(*) as count FROM teams WHERE is_user_team = 1 AND is_approved = 1');
    const pendingTeams = await db.get('SELECT COUNT(*) as count FROM teams WHERE is_user_team = 1 AND is_approved = 0');

    res.json({
      success: true,
      data: {
        total: totalTeams.count,
        approved: approvedTeams.count,
        pending: pendingTeams.count
      }
    });
  } catch (error) {
    console.error('Takım istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm takımları listele
router.get('/teams', async (req, res) => {
  try {
    const teams = await db.all(`
      SELECT 
        t.id, t.name, t.short_name, t.manager_name, t.stadium_name, 
        t.motto, t.logo, t.primary_color, t.secondary_color, 
        t.is_approved, t.is_user_team, t.captain_id, t.created_at,
        u.username, u.email
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      WHERE t.is_user_team = 1
      ORDER BY t.created_at DESC
    `);

    res.json({
      success: true,
      data: {
        teams: teams.map(team => ({
          id: team.id,
          name: team.name,
          shortName: team.short_name,
          managerName: team.manager_name,
          stadiumName: team.stadium_name,
          motto: team.motto,
          logo: team.logo,
          primaryColor: team.primary_color,
          secondaryColor: team.secondary_color,
          isApproved: team.is_approved === 1,
          isUserTeam: team.is_user_team === 1,
          captainId: team.captain_id,
          createdAt: team.created_at,
          captain: {
            username: team.username,
            email: team.email
          }
        }))
      }
    });
  } catch (error) {
    console.error('Takımları listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Takım onay durumunu güncelle
router.put('/teams/:id/approval', async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    await db.run(
      'UPDATE teams SET is_approved = ? WHERE id = ?',
      [isApproved ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: `Takım ${isApproved ? 'onaylandı' : 'reddedildi'}`
    });
  } catch (error) {
    console.error('Takım onay durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ TOURNAMENTS ENDPOINTS ============

// Turnuva istatistikleri
router.get('/tournaments/stats', async (req, res) => {
  try {
    const totalTournaments = await db.get('SELECT COUNT(*) as count FROM tournaments');
    const activeTournaments = await db.get('SELECT COUNT(*) as count FROM tournaments WHERE status = "active"');
    const draftTournaments = await db.get('SELECT COUNT(*) as count FROM tournaments WHERE status = "draft"');

    res.json({
      success: true,
      data: {
        total: totalTournaments.count,
        active: activeTournaments.count,
        draft: draftTournaments.count
      }
    });
  } catch (error) {
    console.error('Turnuva istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ APPLICATIONS ENDPOINTS ============

// Başvuru istatistikleri
router.get('/applications/stats', async (req, res) => {
  try {
    const totalApplications = await db.get('SELECT COUNT(*) as count FROM tournament_applications');
    const pendingApplications = await db.get('SELECT COUNT(*) as count FROM tournament_applications WHERE status = "pending"');
    const approvedApplications = await db.get('SELECT COUNT(*) as count FROM tournament_applications WHERE status = "approved"');

    res.json({
      success: true,
      data: {
        total: totalApplications.count,
        pending: pendingApplications.count,
        approved: approvedApplications.count
      }
    });
  } catch (error) {
    console.error('Başvuru istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ RECENT ACTIVITIES ============

// Son aktiviteleri getir
router.get('/recent-activities', async (req, res) => {
  try {
    // Son kullanıcı kayıtları
    const recentUsers = await db.all(`
      SELECT 'user_registered' as type, username, created_at
      FROM users 
      WHERE created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // Son takım oluşturmaları
    const recentTeams = await db.all(`
      SELECT 'team_created' as type, name, created_at
      FROM teams 
      WHERE is_user_team = 1 AND created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // Son turnuva oluşturmaları
    const recentTournaments = await db.all(`
      SELECT 'tournament_created' as type, name, created_at
      FROM tournaments 
      WHERE created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // Son başvurular
    const recentApplications = await db.all(`
      SELECT 'application_submitted' as type, 
             t.name as tournament_name,
             tm.name as team_name,
             ta.created_at
      FROM tournament_applications ta
      JOIN tournaments t ON ta.tournament_id = t.id
      JOIN teams tm ON ta.team_id = tm.id
      WHERE ta.created_at >= datetime('now', '-30 days')
      ORDER BY ta.created_at DESC 
      LIMIT 5
    `);

    // Aktiviteleri birleştir ve sırala
    const activities = [
      ...recentUsers.map(u => ({
        type: u.type,
        description: `${u.username} kullanıcısı sisteme kaydoldu`,
        time: new Date(u.created_at).toLocaleString('tr-TR')
      })),
      ...recentTeams.map(t => ({
        type: t.type,
        description: `${t.name} takımı oluşturuldu`,
        time: new Date(t.created_at).toLocaleString('tr-TR')
      })),
      ...recentTournaments.map(t => ({
        type: t.type,
        description: `${t.name} turnuvası oluşturuldu`,
        time: new Date(t.created_at).toLocaleString('tr-TR')
      })),
      ...recentApplications.map(a => ({
        type: a.type,
        description: `${a.team_name} takımı ${a.tournament_name} turnuvasına başvurdu`,
        time: new Date(a.created_at).toLocaleString('tr-TR')
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({
      success: true,
      data: {
        activities
      }
    });
  } catch (error) {
    console.error('Son aktiviteler hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ TOURNAMENTS MANAGEMENT ============

// Turnuva sil
router.delete('/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Önce turnuvaya ait başvuruları sil
    await db.run('DELETE FROM tournament_applications WHERE tournament_id = ?', [id]);
    
    // Sonra turnuvayı sil
    await db.run('DELETE FROM tournaments WHERE id = ?', [id]);

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

// Turnuva güncelle
router.put('/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      location, 
      format, 
      startDate, 
      endDate, 
      registrationDeadline, 
      maxTeams, 
      hasReward,
      rewardDescription,
      status 
    } = req.body;

    await db.run(`
      UPDATE tournaments SET 
        name = ?, 
        description = ?, 
        location = ?, 
        format = ?, 
        start_date = ?, 
        end_date = ?, 
        registration_deadline = ?, 
        max_teams = ?, 
        has_reward = ?,
        reward_description = ?,
        status = ?
      WHERE id = ?
    `, [
      name, 
      description, 
      location, 
      format, 
      startDate, 
      endDate, 
      registrationDeadline, 
      maxTeams, 
      hasReward ? 1 : 0,
      rewardDescription,
      status, 
      id
    ]);

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

// Kullanıcı güncelle
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;

    await db.run(`
      UPDATE users SET 
        first_name = ?, 
        last_name = ?, 
        email = ?, 
        role = ?, 
        is_active = ?
      WHERE id = ?
    `, [firstName, lastName, email, role, isActive ? 1 : 0, id]);

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Turnuva durumunu güncelle
router.put('/tournaments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.run(
      'UPDATE tournaments SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Turnuva durumu güncellendi'
    });
  } catch (error) {
    console.error('Turnuva durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// ============ APPLICATIONS MANAGEMENT ============

// Başvuru durumunu güncelle
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.run(
      'UPDATE tournament_applications SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: `Başvuru ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`
    });
  } catch (error) {
    console.error('Başvuru durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm başvuruları listele
router.get('/applications', async (req, res) => {
  try {
    const applications = await db.all(`
      SELECT 
        ta.id, ta.tournament_id, ta.team_id, ta.status, ta.created_at,
        t.name as tournament_name,
        tm.name as team_name, tm.logo as team_logo,
        u.username as captain_name, u.email as captain_email
      FROM tournament_applications ta
      JOIN tournaments t ON ta.tournament_id = t.id
      JOIN teams tm ON ta.team_id = tm.id
      JOIN users u ON tm.captain_id = u.id
      ORDER BY ta.created_at DESC
    `);

    res.json({
      success: true,
      data: {
        applications: applications.map(app => ({
          id: app.id,
          tournamentId: app.tournament_id,
          tournamentName: app.tournament_name,
          teamId: app.team_id,
          teamName: app.team_name,
          teamLogo: app.team_logo,
          captainName: app.captain_name,
          captainEmail: app.captain_email,
          status: app.status,
          applicationDate: app.created_at,
          notes: 'Takımımız bu turnuvaya katılmak için heyecanlı.',
          playerCount: Math.floor(Math.random() * 10) + 8,
          experienceLevel: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)]
        }))
      }
    });
  } catch (error) {
    console.error('Başvuruları listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;