import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  PencilIcon,
  TrophyIcon,
  CalendarIcon,
  ChartBarIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FileUpload from '../../components/UI/FileUpload';
import api from '../../services/api';

const ManagerPage = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stadiumName: '',
    managerName: '',
    motto: '',
    logo: '',
    shortName: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF'
  });

  // Takım bilgilerini getir
  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/teams/my-team');
      
      if (response.success && response.data.team) {
        const teamData = response.data.team;
        setTeam(teamData);
        setFormData({
          name: teamData.name || '',
          stadiumName: teamData.stadium_name || '',
          managerName: teamData.manager_name || '',
          motto: teamData.motto || '',
          logo: teamData.logo || '',
          shortName: teamData.short_name || '',
          primaryColor: teamData.primary_color || '#3B82F6',
          secondaryColor: teamData.secondary_color || '#1E40AF'
        });
      }
    } catch (error) {
      console.error('Takım bilgileri getirme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Takım kısaltması için büyük harf dönüşümü ve karakter sınırı
    if (name === 'shortName') {
      processedValue = value.toUpperCase().slice(0, 3);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await api.put('/teams/my-team', formData);
      
      if (response.success) {
        toast.success('Takım bilgileri başarıyla güncellendi');
        setIsEditing(false);
        await fetchTeam(); // Güncel bilgileri getir
      } else {
        toast.error(response.message || 'Güncelleme sırasında bir hata oluştu');
      }
    } catch (error) {
      toast.error('Güncelleme sırasında bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (team) {
      setFormData({
        name: team.name || '',
        stadiumName: team.stadium_name || '',
        managerName: team.manager_name || '',
        motto: team.motto || '',
        logo: team.logo || '',
        shortName: team.short_name || '',
        primaryColor: team.primary_color || '#3B82F6',
        secondaryColor: team.secondary_color || '#1E40AF'
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Takım Bulunamadı</h1>
          <p className="text-gray-600 mb-4">
            Henüz bir takımınız yok. Takım oluşturmak için aşağıdaki butona tıklayın.
          </p>
          <a
            href="/takım-olustur"
            className="btn-primary"
          >
            Takım Oluştur
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={`${team.name} logosu`}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                <p className="text-sm text-gray-500">
                  Menejer: {team.manager_name}
                </p>
                {team.motto && (
                  <p className="text-sm text-blue-600 italic">"{team.motto}"</p>
                )}
              </div>
            </div>
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

        {/* Team Info */}
        <div className="px-6 py-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4" />
                      <span>Takım Adı</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>Stadyum Adı</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="stadiumName"
                    value={formData.stadiumName}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>Menejer Adı</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4" />
                      <span>Takım Kısaltması</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="ABC"
                    minLength={2}
                    maxLength={3}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    2-3 karakter, otomatik büyük harfe çevrilir
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <SwatchIcon className="h-4 w-4" />
                      <span>Ana Renk</span>
                    </div>
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                      className="input-field flex-1"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <SwatchIcon className="h-4 w-4" />
                      <span>İkinci Renk</span>
                    </div>
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                      className="input-field flex-1"
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <PhotoIcon className="h-4 w-4" />
                    <span>Takım Logosu</span>
                  </div>
                </label>
                <FileUpload
                  onUpload={(url) => setFormData({...formData, logo: url})}
                  currentImage={formData.logo}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    <span>Motto</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="motto"
                  value={formData.motto}
                  onChange={handleChange}
                  className="input-field"
                  maxLength={100}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? <LoadingSpinner size="small" /> : 'Kaydet'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  <span>Stadyum</span>
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{team.stadium_name || 'Belirtilmemiş'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Kuruluş Tarihi</span>
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(team.created_at).toLocaleDateString('tr-TR')}
                </dd>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Turnuvalar</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maçlar</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Galibiyet</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Son Aktiviteler</h3>
        </div>
        <div className="px-6 py-6">
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz aktivite yok
            </h3>
            <p className="text-gray-600">
              Turnuvalara katıldığınızda aktiviteleriniz burada görünecek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;