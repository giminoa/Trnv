import React from 'react';
import { XMarkIcon, DocumentTextIcon, UserGroupIcon, CalendarIcon, UserIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

const ApplicationDetailModal = ({ application, isOpen, onClose }) => {
  if (!isOpen || !application) return null;

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Beklemede' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Onaylandı' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Reddedildi' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getExperienceBadge = (level) => {
    const badges = {
      beginner: { color: 'bg-gray-100 text-gray-800', label: 'Başlangıç' },
      intermediate: { color: 'bg-blue-100 text-blue-800', label: 'Orta' },
      advanced: { color: 'bg-purple-100 text-purple-800', label: 'İleri' }
    };

    const badge = badges[level] || badges.beginner;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Başvuru Detayları</h3>
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
              {application.teamLogo ? (
                <img
                  src={application.teamLogo}
                  alt={`${application.teamName} logosu`}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{application.teamName}</h4>
                <p className="text-sm text-gray-600">{application.tournamentName}</p>
              </div>
            </div>
            {getStatusBadge(application.status)}
          </div>

          {/* Takım Bilgileri */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Takım Bilgileri</h5>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kaptan</p>
                  <p className="text-sm font-medium text-gray-900">{application.captainName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">İletişim</p>
                  <p className="text-sm font-medium text-gray-900">{application.captainEmail}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Oyuncu Sayısı</p>
                  <p className="text-sm font-medium text-gray-900">{application.playerCount} oyuncu</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Deneyim Seviyesi</p>
                  <div className="mt-1">
                    {getExperienceBadge(application.experienceLevel)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Başvuru Bilgileri */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Başvuru Bilgileri</h5>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Başvuru Tarihi</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(application.applicationDate).toLocaleDateString('tr-TR')} - {new Date(application.applicationDate).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Başvuru ID</p>
                  <p className="text-sm font-medium text-gray-900">#{application.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notlar */}
          {application.notes && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Takım Notları
              </h5>
              <p className="text-sm text-gray-700 italic">"{application.notes}"</p>
            </div>
          )}

          {/* Turnuva Bilgileri */}
          <div className="border-t border-gray-200 pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Turnuva</h5>
            <p className="text-sm text-gray-600">{application.tournamentName}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  // Reddetme işlemi burada yapılabilir
                  onClose();
                }}
                className="btn-danger"
              >
                Reddet
              </button>
              <button
                onClick={() => {
                  // Onaylama işlemi burada yapılabilir
                  onClose();
                }}
                className="btn-primary"
              >
                Onayla
              </button>
            </>
          )}
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

export default ApplicationDetailModal;