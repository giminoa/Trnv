import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';
import { UserIcon, PencilIcon, KeyIcon, UsersIcon, HomeIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FileUpload from '../../components/UI/FileUpload';
import api from '../../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTeam, setUserTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Kullanıcının takım bilgilerini getir
  useEffect(() => {
    const fetchUserTeam = async () => {
      try {
        setTeamLoading(true);
        const response = await api.get('/teams/my-team');
        if (response.success && response.data.team) {
          setUserTeam(response.data.team);
        }
      } catch (error) {
        console.error('Takım bilgileri alınamadı:', error);
      } finally {
        setTeamLoading(false);
      }
    };

    if (user) {
      fetchUserTeam();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await usersAPI.updateUser(user.id, formData);
      
      if (response.success) {
        updateUser(formData);
        toast.success('Profil başarıyla güncellendi');
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Profil güncellenirken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsLoading(true);

    try {
      const response = await usersAPI.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        toast.success('Şifre başarıyla değiştirildi');
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(response.message || 'Şifre değiştirilirken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Şifre değiştirilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Bilgileri</h1>
                <p className="text-sm text-gray-500">
                  Hesap bilgilerinizi görüntüleyin ve düzenleyin
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Takım Logosu */}
              {userTeam && userTeam.logo && (
                <div className="flex items-center space-x-2">
                  <img
                    src={userTeam.logo}
                    alt={`${userTeam.name} logosu`}
                    className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                  />
                  <span className="text-sm text-gray-600">{userTeam.name}</span>
                </div>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Düzenle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="px-6 py-6">
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Ad
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Soyad
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-posta
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      phone: user?.phone || ''
                    });
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? <LoadingSpinner size="small" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Kullanıcı Adı</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Rol</dt>
                <dd className="mt-1">{getRoleBadge(user?.role)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Ad Soyad</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : 'Belirtilmemiş'
                  }
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">E-posta</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.phone || 'Belirtilmemiş'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Kayıt Tarihi</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('tr-TR')
                    : 'Bilinmiyor'
                  }
                </dd>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="border-t border-gray-200 px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Şifre Değiştir</h3>
              <p className="text-sm text-gray-500">
                Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin
              </p>
            </div>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                Şifre Değiştir
              </button>
            )}
          </div>

          {isChangingPassword && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre Tekrarı
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="input-field mt-1"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? <LoadingSpinner size="small" /> : 'Şifreyi Değiştir'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Manager/Team Information Section */}
        <div className="border-t border-gray-200 px-6 py-6">
          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Menejer Bilgileri</h3>
                <p className="text-sm text-gray-500">
                  Takım ve menejerlik bilgileriniz
                </p>
              </div>
            </div>
          </div>

          {teamLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="medium" />
            </div>
          ) : userTeam ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Takım Adı</dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">{userTeam.name}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Menejer Adı</dt>
                <dd className="mt-1 text-sm text-gray-900">{userTeam.manager_name || 'Belirtilmemiş'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Stadyum</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <HomeIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {userTeam.stadium_name || 'Belirtilmemiş'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Takım Mottosu</dt>
                <dd className="mt-1 text-sm text-gray-900 italic">
                  "{userTeam.motto || 'Motto belirtilmemiş'}"
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Kuruluş Tarihi</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {userTeam.created_at 
                    ? new Date(userTeam.created_at).toLocaleDateString('tr-TR')
                    : 'Bilinmiyor'
                  }
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Durum</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userTeam.is_approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {userTeam.is_approved ? 'Onaylandı' : 'Onay Bekliyor'}
                  </span>
                </dd>
              </div>

              {userTeam.logo && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Takım Logosu</dt>
                  <dd className="mt-1">
                    <FileUpload
                      onUpload={async (url) => {
                        try {
                          const response = await api.put(`/teams/${userTeam.id}`, {
                            logo: url
                          });
                          if (response.success) {
                            setUserTeam({ ...userTeam, logo: url });
                            toast.success('Logo başarıyla güncellendi');
                          } else {
                            toast.error('Logo güncellenirken hata oluştu');
                          }
                        } catch (error) {
                          toast.error('Logo güncellenirken hata oluştu');
                        }
                      }}
                      currentImage={userTeam.logo}
                      className="max-w-xs"
                    />
                  </dd>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Takım Oluşturmamışsınız</h3>
              <p className="text-gray-600 mb-4">
                Turnuvalara katılmak için önce bir takım oluşturmalısınız.
              </p>
              <a
                href="/takım-olustur"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Takım Oluştur
              </a>
            </div>
          )}

          {userTeam && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href="/menejer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Takım Bilgilerini Düzenle
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;