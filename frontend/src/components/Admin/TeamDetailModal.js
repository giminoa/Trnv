import React from 'react';
import { XMarkIcon, UserGroupIcon, BuildingOfficeIcon, UserIcon, ChatBubbleLeftRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const TeamDetailModal = ({ team, isOpen, onClose }) => {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Takım Detayları</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Logo ve Temel Bilgiler */}
          <div className="flex items-center space-x-4">
            {team.logo ? (
              <img
                src={team.logo}
                alt={`${team.name} logosu`}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
              >
                {team.shortName || team.name.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
              <p className="text-sm text-gray-500">@{team.captain?.username}</p>
              {team.isApproved ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Onaylandı
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <XCircleIcon className="h-3 w-3 mr-1" />
                  Beklemede
                </span>
              )}
            </div>
          </div>

          {/* Detay Bilgileri */}
          <div className="space-y-3">
            {team.shortName && (
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Takım Kısaltması</p>
                  <p className="text-sm font-medium text-gray-900">{team.shortName}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Menejer</p>
                <p className="text-sm font-medium text-gray-900">{team.managerName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Stadyum</p>
                <p className="text-sm font-medium text-gray-900">{team.stadiumName}</p>
              </div>
            </div>

            {team.motto && (
              <div className="flex items-center space-x-3">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Motto</p>
                  <p className="text-sm font-medium text-gray-900 italic">"{team.motto}"</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Kuruluş Tarihi</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(team.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>

            {team.primaryColor && team.secondaryColor && (
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 rounded-full border border-gray-300" style={{ backgroundColor: team.primaryColor }}></div>
                <div>
                  <p className="text-sm text-gray-500">Takım Renkleri</p>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: team.primaryColor }}
                    ></div>
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: team.secondaryColor }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">
                      {team.primaryColor} / {team.secondaryColor}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Kaptan İletişim</p>
                <p className="text-sm font-medium text-gray-900">{team.captain?.email}</p>
              </div>
            </div>
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

export default TeamDetailModal;