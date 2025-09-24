import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import api from '../../services/api';

const TeamDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/teams/user-team/${id}`);
        
        if (response.success) {
          setTeam(response.data.team);
        } else {
          setError('Takım bulunamadı');
        }
      } catch (error) {
        console.error('Takım detay hatası:', error);
        setError('Takım bilgileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTeam();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Takım Bulunamadı'}
          </h1>
          <p className="text-gray-600 mb-4">
            Aradığınız takım mevcut değil veya erişim yetkiniz bulunmuyor.
          </p>
          <Link to="/takımlar" className="btn-primary">
            Takımlara Dön
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && team.captain_id === user.id;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/takımlar"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Takımlara Dön
        </Link>
      </div>

      {/* Team Header */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={`${team.name} logosu`}
                  className="h-20 w-20 rounded-full object-cover border-4 border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-4 border-gray-200">
                  <UsersIcon className="h-10 w-10 text-white" />
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {team.name}
                </h1>
                {team.motto && (
                  <p className="text-lg text-blue-600 italic mb-2">
                    "{team.motto}"
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    <span>{team.stadium_name || 'Stadyum belirtilmemiş'}</span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>Menejer: {team.manager_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {isOwner && (
              <Link
                to="/menejer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Düzenle
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Team Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Team Details */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Takım Bilgileri
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Takım Adı
                </dt>
                <dd className="text-lg text-gray-900">{team.name}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Stadyum
                </dt>
                <dd className="text-lg text-gray-900">
                  {team.stadium_name || 'Belirtilmemiş'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Menejer
                </dt>
                <dd className="text-lg text-gray-900">{team.manager_name}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Kuruluş Tarihi
                </dt>
                <dd className="text-lg text-gray-900">
                  {new Date(team.created_at).toLocaleDateString('tr-TR')}
                </dd>
              </div>

              {team.motto && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Motto
                  </dt>
                  <dd className="text-lg text-gray-900 italic">
                    "{team.motto}"
                  </dd>
                </div>
              )}
            </div>

            {/* Captain Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Kaptan Bilgileri
              </h3>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {team.captain_username}
                  </p>
                  {(team.first_name || team.last_name) && (
                    <p className="text-sm text-gray-600">
                      {team.first_name} {team.last_name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">{team.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              İstatistikler
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm text-gray-600">Turnuvalar</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">0</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Maçlar</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">0</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Galibiyet</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">0</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-gray-600">Mağlubiyet</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">0</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Beraberlik</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">0</span>
              </div>
            </div>
          </div>

          {/* Team Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              İşlemler
            </h3>
            
            <div className="space-y-3">
              <Link
                to="/turnuvalar"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
              >
                Turnuvalara Katıl
              </Link>
              
              {isOwner && (
                <Link
                  to="/menejer"
                  className="block w-full text-center border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Takımı Yönet
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Son Aktiviteler
          </h3>
        </div>
        <div className="px-6 py-8">
          <div className="text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Henüz aktivite yok
            </h4>
            <p className="text-gray-600">
              Bu takım henüz herhangi bir turnuvaya katılmamış.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailPage;