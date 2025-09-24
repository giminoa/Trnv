import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FileUpload from '../../components/UI/FileUpload';
import api from '../../services/api';

const CreateTeamPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stadiumName: '',
    managerName: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.username || '',
    motto: '',
    logo: '',
    shortName: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.shortName.length < 2) {
      toast.error('Takım kısaltması en az 2 karakter olmalıdır');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/teams/create-user-team', formData);
      
      if (response.success) {
        toast.success('Takım başarıyla oluşturuldu!');
        navigate('/menejer');
      } else {
        toast.error(response.message || 'Takım oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Takım oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <UsersIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Takım Oluştur
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Turnuvalara katılmak için takımınızı oluşturun
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Takım Adı */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>Takım Adı</span>
                </div>
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Örn: Galatasaray"
                />
              </div>
            </div>

            {/* Takım Kısaltması */}
            <div>
              <label htmlFor="shortName" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>Takım Kısaltması</span>
                </div>
              </label>
              <div className="mt-1">
                <input
                  id="shortName"
                  name="shortName"
                  type="text"
                  value={formData.shortName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="GS"
                  minLength={2}
                  maxLength={3}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                2-3 karakter, otomatik büyük harfe çevrilir
              </p>
            </div>

            {/* Stadyum Adı */}
            <div>
              <label htmlFor="stadiumName" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  <span>Stadyum Adı</span>
                </div>
              </label>
              <div className="mt-1">
                <input
                  id="stadiumName"
                  name="stadiumName"
                  type="text"
                  required
                  value={formData.stadiumName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Örn: Türk Telekom Stadyumu"
                />
              </div>
            </div>

            {/* Menejer Adı */}
            <div>
              <label htmlFor="managerName" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Menejer Adı</span>
                </div>
              </label>
              <div className="mt-1">
                <input
                  id="managerName"
                  name="managerName"
                  type="text"
                  required
                  value={formData.managerName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Menejer adınız"
                />
              </div>
            </div>

            {/* Takım Renkleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-2">
                    <SwatchIcon className="h-4 w-4" />
                    <span>Ana Renk</span>
                  </div>
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
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
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-2">
                    <SwatchIcon className="h-4 w-4" />
                    <span>İkinci Renk</span>
                  </div>
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
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

            {/* Motto */}
            <div>
              <label htmlFor="motto" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span>Takım Mottosu</span>
                </div>
              </label>
              <div className="mt-1">
                <input
                  id="motto"
                  name="motto"
                  type="text"
                  value={formData.motto}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Örn: Asla Pes Etme!"
                  maxLength={100}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Takımınızı temsil eden kısa bir slogan (opsiyonel)
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <PhotoIcon className="h-4 w-4" />
                  <span>Takım Logosu</span>
                </div>
              </label>
              <FileUpload
                onUpload={(url) => setFormData({ ...formData, logo: url })}
                currentImage={formData.logo}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Takımınızı temsil eden bir logo yükleyin (opsiyonel)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Takım Oluşturma Hakkında
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Takım adınız benzersiz olmalıdır</li>
                      <li>Takım kısaltması benzersiz olmalıdır</li>
                      <li>Daha sonra takım bilgilerinizi güncelleyebilirsiniz</li>
                      <li>Takımınızla turnuvalara katılabilirsiniz</li>
                      <li>Menejer sayfanızda takım istatistiklerinizi görebilirsiniz</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoadingSpinner size="small" /> : 'Takım Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamPage;