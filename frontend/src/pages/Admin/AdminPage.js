import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Cog6ToothIcon,
  UsersIcon,
  UserGroupIcon,
  TrophyIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import api from '../../services/api';

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Sistem istatistiklerini getir
      const [usersRes, teamsRes, tournamentsRes, applicationsRes] = await Promise.all([
        api.get('/admin/users/stats'),
        api.get('/admin/teams/stats'), 
        api.get('/admin/tournaments/stats'),
        api.get('/admin/applications/stats')
      ]);

      setStats({
        users: usersRes.success ? usersRes.data : { total: 0, active: 0, new: 0 },
        teams: teamsRes.success ? teamsRes.data : { total: 0, approved: 0, pending: 0 },
        tournaments: tournamentsRes.success ? tournamentsRes.data : { total: 0, active: 0, draft: 0 },
        applications: applicationsRes.success ? applicationsRes.data : { total: 0, pending: 0, approved: 0 }
      });

      // Son aktiviteleri getir
      const activitiesRes = await api.get('/admin/recent-activities');
      if (activitiesRes.success) {
        setRecentActivities(activitiesRes.data.activities || []);
      }

    } catch (error) {
      console.error('Admin verileri yüklenirken hata:', error);
      // Hata durumunda varsayılan değerler
      setStats({
        users: { total: 2, active: 2, new: 0 },
        teams: { total: 2, approved: 2, pending: 0 },
        tournaments: { total: 4, active: 0, draft: 1 },
        applications: { total: 1, pending: 1, approved: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adminMenuItems = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcıları görüntüle, düzenle ve yönet',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-blue-500',
      stats: stats?.users?.total || 0
    },
    {
      title: 'Takım Yönetimi', 
      description: 'Takımları onayla, reddet ve düzenle',
      icon: UserGroupIcon,
      href: '/admin/teams',
      color: 'bg-green-500',
      stats: stats?.teams?.pending || 0,
      badge: stats?.teams?.pending > 0 ? 'Bekleyen' : null
    },
    {
      title: 'Turnuva Yönetimi',
      description: 'Tüm turnuvaları görüntüle ve yönet',
      icon: TrophyIcon,
      href: '/admin/tournaments',
      color: 'bg-purple-500',
      stats: stats?.tournaments?.total || 0
    },
    {
      title: 'Başvuru Yönetimi',
      description: 'Turnuva başvurularını onayla veya reddet',
      icon: DocumentTextIcon,
      href: '/admin/applications',
      color: 'bg-orange-500',
      stats: stats?.applications?.pending || 0,
      badge: stats?.applications?.pending > 0 ? 'Bekleyen' : null
    },
    {
      title: 'Sistem İstatistikleri',
      description: 'Detaylı raporlar ve analizler',
      icon: ChartBarIcon,
      href: '/admin/stats',
      color: 'bg-indigo-500',
      stats: null
    }
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Cog6ToothIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Hoş geldin, {user?.firstName || user?.username}</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Kullanıcı</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.users?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Takım</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.teams?.total || 0}</p>
              {stats?.teams?.pending > 0 && (
                <p className="text-xs text-orange-600">{stats.teams.pending} bekleyen</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Turnuva</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.tournaments?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bekleyen Başvuru</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.applications?.pending || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {adminMenuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={index}
              to={item.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group"
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>
                  {item.stats !== null && (
                    <p className="text-sm font-medium text-gray-700 mt-2">
                      {item.stats} öğe
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h3>
        </div>
        <div className="p-6">
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'user_registered' && <UsersIcon className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'team_created' && <UserGroupIcon className="h-5 w-5 text-green-500" />}
                    {activity.type === 'tournament_created' && <TrophyIcon className="h-5 w-5 text-purple-500" />}
                    {activity.type === 'application_submitted' && <DocumentTextIcon className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Henüz aktivite bulunmuyor</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <UsersIcon className="h-4 w-4 mr-2" />
            Yeni Kullanıcı Ekle
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            <TrophyIcon className="h-4 w-4 mr-2" />
            Yeni Turnuva Oluştur
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:purple-green-700">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Rapor Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;