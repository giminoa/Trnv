import React from 'react';
import { XMarkIcon, TrophyIcon, CalendarIcon, MapPinIcon, CurrencyDollarIcon, UserGroupIcon, GiftIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

const TournamentDetailModal = ({ tournament, isOpen, onClose }) => {
  if (!isOpen || !tournament) return null;

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: 'Taslak' },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Aktif' },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'Tamamlandı' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'İptal' }
    };

    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getFormatLabel = (format) => {
    const labels = {
      league: 'Lig Formatı (İçsaha-Dışsaha)',
      world_cup: 'Dünya Kupası (4\'lü Gruplar, Tarafsız Saha)',
      champions_league: 'Eski Şampiyonlar Ligi (4\'lü Gruplar, İçsaha-Dışsaha)'
    };
    return labels[format] || format;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Turnuva Detayları</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Başlık ve Durum */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{tournament.name}</h4>
                <p className="text-sm text-gray-600">{tournament.description}</p>
              </div>
            </div>
            {getStatusBadge(tournament.status)}
          </div>

          {/* Detay Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Konum</p>
                  <p className="text-sm font-medium text-gray-900">{tournament.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <TrophyIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Format</p>
                  <p className="text-sm font-medium text-gray-900">{getFormatLabel(tournament.format)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Katılımcılar</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tournament.teamsCount}/{tournament.maxTeams} takım
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Başlangıç</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(tournament.startDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Bitiş</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(tournament.endDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kayıt Sonu</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(tournament.registrationDeadline).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Finansal Bilgiler */}
          {tournament.hasReward && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <GiftIcon className="h-4 w-4 mr-2 text-yellow-600" />
                Turnuva Ödülleri
              </h5>
              <p className="text-sm text-gray-700">
                {tournament.rewardDescription || 'Ödül açıklaması belirtilmemiş.'}
              </p>
            </div>
          )}

          {/* İstatistikler */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">İstatistikler</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Toplam Başvuru</p>
                <p className="text-lg font-semibold text-blue-600">{tournament.applicationsCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Onaylı Takım</p>
                <p className="text-lg font-semibold text-green-600">{tournament.teamsCount}</p>
              </div>
            </div>
          </div>

          {/* Oluşturulma Tarihi */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Oluşturulma: {new Date(tournament.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailModal;