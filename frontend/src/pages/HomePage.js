import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { tournamentsAPI } from '../services/api';
import { 
  TrophyIcon, 
  UsersIcon, 
  CalendarIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const HomePage = () => {
  // Fetch active tournaments
  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery(
    'activeTournaments',
    () => tournamentsAPI.getTournaments({ limit: 6 }),
    { staleTime: 5 * 60 * 1000 }
  );

  // Fetch recent tournaments for stats
  const { data: recentTournamentsData } = useQuery(
    'recentTournaments',
    () => tournamentsAPI.getTournaments({ limit: 3 }),
    { staleTime: 5 * 60 * 1000 }
  );

  const activeTournaments = tournamentsData?.data?.tournaments || [];
  const recentTournaments = recentTournamentsData?.data?.tournaments || [];

  const features = [
    {
      icon: TrophyIcon,
      title: 'Taktisyen.net Turnuva Sistemi',
      description: 'Farklı formatlarla turnuvalar oluşturun ve yönetin',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: UsersIcon,
      title: 'Takım Organizasyonu',
      description: 'Takımları kolayca kaydedin ve gruplandırın',
      color: 'text-green-600 bg-green-100',
    },
    {
      icon: CalendarIcon,
      title: 'Fikstür Sistemi',
      description: 'Otomatik fikstür oluşturma ve maç programlama',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      icon: ChartBarIcon,
      title: 'İstatistikler',
      description: 'Detaylı puan durumu ve performans analizi',
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  const stats = [
    {
      label: 'Aktif Turnuvalar',
      value: activeTournaments.length,
      icon: TrophyIcon,
      color: 'text-blue-600',
    },
    {
      label: 'Toplam Turnuvalar',
      value: recentTournaments.length > 0 ? '10+' : '0',
      icon: CalendarIcon,
      color: 'text-green-600',
    },
    {
      label: 'Kayıtlı Takımlar',
      value: '50+',
      icon: UsersIcon,
      color: 'text-purple-600',
    },
    {
      label: 'Tamamlanan Maçlar',
      value: '100+',
      icon: FireIcon,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Taktisyen.net
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Takımını oluştur ve turnuvalara kayıt ol, oyun zevkini bir adım öteye taşı!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/turnuvalar"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center"
              >
                Turnuvaları Keşfet
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/kayit"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200 inline-flex items-center justify-center"
              >
                Hemen Başla
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Taktisyen Turnuva Sistemi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Taktisyen Turnuva Sistemi Versiyon 2
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Tournaments Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Son Turnuvalar
            </h2>
            <Link
              to="/turnuvalar"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
            >
              Tümünü Gör
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {tournamentsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : activeTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTournaments.map((tournament) => (
                <div key={tournament.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tournament.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : tournament.status === 'registration'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tournament.status === 'active' ? 'Aktif' : 
                         tournament.status === 'registration' ? 'Kayıt Açık' : 'Taslak'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {tournament.type === 'league' ? 'Lig' :
                         tournament.type === 'group' ? 'Grup' :
                         tournament.type === 'world_cup' ? 'Dünya Kupası' :
                         'Şampiyonlar Ligi'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tournament.name}
                    </h3>
                    
                    {tournament.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {tournament.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>
                        {tournament.current_participants}/{tournament.max_participants} Takım
                      </span>
                      {tournament.start_date && (
                        <span>
                          {new Date(tournament.start_date).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                    
                    <Link
                      to={`/turnuva/${tournament.id}`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Detayları Gör
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz aktif turnuva yok
              </h3>
              <p className="text-gray-600 mb-4">
                İlk turnuvayı oluşturmak için hemen başlayın.
              </p>
              <Link
                to="/turnuva-olustur"
                className="btn-primary"
              >
                Turnuva Oluştur
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Hemen Başlamaya Hazır mısınız?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Oyun zevkini bir adım öteye taşıyın.
          </p>
          <Link
            to="/kayit"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center"
          >
            Ücretsiz Hesap Oluştur
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;