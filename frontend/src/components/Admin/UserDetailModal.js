import React from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const UserDetailModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      organizer: 'bg-blue-100 text-blue-800',
      participant: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      admin: 'Admin',
      organizer: 'Organizatör',
      participant: 'Katılımcı'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Kullanıcı Detayları</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Avatar ve Temel Bilgiler */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {user.firstName?.charAt(0) || user.username?.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.username
                }
              </h4>
              {getRoleBadge(user.role)}
            </div>
          </div>

          {/* Detay Bilgileri */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Kullanıcı Adı</p>
                <p className="text-sm font-medium text-gray-900">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">E-posta</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Kayıt Tarihi</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Durum</p>
                <div className="flex items-center space-x-2">
                  {user.isActive ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            </div>

            {user.lastLogin && (
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Son Giriş</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(user.lastLogin).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            )}
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

export default UserDetailModal;