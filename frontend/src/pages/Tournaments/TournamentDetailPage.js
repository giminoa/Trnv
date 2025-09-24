import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { tournamentsAPI, standingsAPI } from '../../services/api';
import { 
  TrophyIcon, 
  CalendarIcon, 
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: tournamentData, isLoading: tournamentLoading } = useQuery(
    ['tournament', id],
    () => tournamentsAPI.getTournament(id),
    { enabled: !!id }
  );

  const { data: statsData } = useQuery(
    ['tournamentStats', id],
    () => standingsAPI.getTournamentStats(id),
    { enabled: !!id }
  );

  const tournament = tournamentData?.data?.tournament;
  const stats = statsData?.data;

  const canApply = user && tournament && 
                   tournament.status === 'registration' && 
                   tournament.current_participants < tournament.max_participants;

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      registration: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const labels = {
      draft: 'Taslak',
      registration: 'Kayıt Açık',
      active: 'Aktif',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      league: 'Lig Usulü',
      group: 'Grup Sistemi',
      world_cup: 'Dünya Kupası Formatı',
      champions_league: 'Şampiyonlar Ligi Formatı'
    };
    return labels[type] || type;
  };

  if (tournamentLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Turnuva bulunamadı</h1>
          <p className="mt-2 text-gray-600">Aradığınız turnuva mevcut değil.</p>
          <Link to="/turnuvalar" className="mt-4 btn-primary">
            Turnuvalara Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <TrophyIcon className="h-8 w-8 text-blue-600" />
              <div>
                {getStatusBadge(tournament.status)}
                <span className="ml-2 text-sm text-gray-500">
                  {getTypeLabel(tournament.type)}
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {tournament.name}
            </h1>
            
            {tournament.description && (
              <p className="text-gray-600 mb-4">
                {tournament.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <UsersIcon className="h-4 w-4 mr-1" />
                <span>Organizatör: {tournament.creator_name}</span>
              </div>
              {tournament.start_date && (
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>
                    {new Date(tournament.start_date).toLocaleDateString('tr-TR')}
                    {tournament.end_date && (
                      <> - {new Date(tournament.end_date).toLocaleDateString('tr-TR')}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-3">
            {canApply && (
              <Link
                to={`/turnuva/${id}/basvuru`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Başvuru Yap
              </Link>
            )}
            <Link
              to={`/turnuva/${id}/fikstur`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Fikstür
            </Link>
            <Link
              to={`/turnuva/${id}/puan`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Puan Durumu
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tournament Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Turnuva Bilgileri
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Format</dt>
                <dd className="mt-1 text-sm text-gray-900">{getTypeLabel(tournament.type)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Durum</dt>
                <dd className="mt-1">{getStatusBadge(tournament.status)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Katılımcı Sayısı</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {tournament.current_participants} / {tournament.max_participants}
                </dd>
              </div>
              
              {tournament.group_count > 1 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Grup Sayısı</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tournament.group_count}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Maç Süresi</dt>
                <dd className="mt-1 text-sm text-gray-900">{tournament.match_duration} dakika</dd>
              </div>
              
              {tournament.registration_start && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Kayıt Tarihleri</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(tournament.registration_start).toLocaleDateString('tr-TR')}
                    {tournament.registration_end && (
                      <> - {new Date(tournament.registration_end).toLocaleDateString('tr-TR')}</>
                    )}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          {tournament.rules && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Kurallar ve Açıklamalar
                </h2>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700">
                {tournament.rules.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Prize Info */}
          {tournament.prize_info && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Ödül Bilgileri
                </h2>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700">
                {tournament.prize_info.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          {stats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                İstatistikler
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Toplam Takım</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.generalStats?.total_teams || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Toplam Maç</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.generalStats?.total_matches || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Oynanan Maç</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.generalStats?.finished_matches || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Toplam Gol</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.generalStats?.total_goals || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Groups */}
          {tournament.groups && tournament.groups.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gruplar
              </h3>
              
              <div className="space-y-2">
                {tournament.groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/turnuva/${id}/puan?group=${group.id}`}
                    className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {group.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Matches */}
          {stats?.recentMatches && stats.recentMatches.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Son Maçlar
              </h3>
              
              <div className="space-y-3">
                {stats.recentMatches.slice(0, 5).map((match) => (
                  <Link
                    key={match.id}
                    to={`/mac/${match.id}`}
                    className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(match.match_date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">
                        {match.home_team_name}
                      </span>
                      <span className="text-sm font-medium text-gray-900 mx-2">
                        {match.home_score} - {match.away_score}
                      </span>
                      <span className="text-sm text-gray-900 truncate">
                        {match.away_team_name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Matches */}
          {stats?.upcomingMatches && stats.upcomingMatches.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Yaklaşan Maçlar
              </h3>
              
              <div className="space-y-3">
                {stats.upcomingMatches.slice(0, 5).map((match) => (
                  <Link
                    key={match.id}
                    to={`/mac/${match.id}`}
                    className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 mb-1">
                        {match.match_date 
                          ? new Date(match.match_date).toLocaleDateString('tr-TR')
                          : 'Tarih belirlenmedi'
                        }
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">
                        {match.home_team_name}
                      </span>
                      <span className="text-xs text-gray-500 mx-2">vs</span>
                      <span className="text-sm text-gray-900 truncate">
                        {match.away_team_name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailPage;