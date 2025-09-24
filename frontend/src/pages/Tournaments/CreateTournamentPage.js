import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentsAPI } from '../../services/api';
import { TrophyIcon, GiftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const CreateTournamentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'league',
    maxParticipants: 16,
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    groupCount: 4,
    matchDuration: 90,
    hasExtraTime: false,
    hasPenalties: false,
    rules: '',
    hasReward: false,
    rewardDescription: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateTotalMatches = () => {
    const participants = parseInt(formData.maxParticipants);
    const type = formData.type;
    
    if (!participants || participants < 4) return { total: 0, perTeam: 0 };
    
    switch (type) {
      case 'league':
        // Lig formatı: Her takım 15 rakiple 2 kez oynar (içsaha-dışsaha)
        const leaguePerTeam = (participants - 1) * 2; // Her takım için maç sayısı
        const leagueTotal = (participants * (participants - 1)); // Toplam maç sayısı
        return { total: leagueTotal, perTeam: leaguePerTeam };
        
      case 'world_cup':
        // Dünya Kupası: Grup aşaması + Eleme turları
        const groups = Math.ceil(participants / 4);
        const groupMatches = groups * 6; // Her grupta 6 maç (4 takım x 3 / 2)
        
        // Eleme turları hesaplama
        let eliminationMatches = 0;
        if (groups === 4) {
          // 4 grup: Her gruptan 2 takım çıkar (8 takım)
          eliminationMatches = 4 + 2 + 1; // Çeyrek final + Yarı final + Final
        } else if (groups === 8) {
          // 8 grup: Her gruptan 2 takım çıkar (16 takım)
          eliminationMatches = 8 + 4 + 2 + 1; // Son 16 + Çeyrek + Yarı + Final
        }
        
        const wcTotal = groupMatches + eliminationMatches;
        const wcPerTeam = Math.round((groupMatches * 4) / participants); // Ortalama grup maçları
        return { total: wcTotal, perTeam: wcPerTeam };
        
      case 'champions_league':
        // Şampiyonlar Ligi: Grup aşaması + Eleme turları (final hariç çift maç)
        const clGroups = Math.ceil(participants / 4);
        const clGroupMatches = clGroups * 12; // Her grupta 12 maç (4 takım x 3 x 2)
        
        // Eleme turları hesaplama (final hariç çift maç)
        let clEliminationMatches = 0;
        if (clGroups === 4) {
          // 4 grup: Her gruptan 2 takım çıkar (8 takım)
          clEliminationMatches = (4 * 2) + (2 * 2) + 1; // Çeyrek (çift) + Yarı (çift) + Final (tek)
        } else if (clGroups === 8) {
          // 8 grup: Her gruptan 2 takım çıkar (16 takım)
          clEliminationMatches = (8 * 2) + (4 * 2) + (2 * 2) + 1; // Son 16 (çift) + Çeyrek (çift) + Yarı (çift) + Final (tek)
        }
        
        const clTotal = clGroupMatches + clEliminationMatches;
        const clPerTeam = Math.round((clGroupMatches * 4) / participants); // Ortalama grup maçları
        return { total: clTotal, perTeam: clPerTeam };
        
      default:
        return { total: 0, perTeam: 0 };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await tournamentsAPI.createTournament(formData);
      
      if (response.success) {
        toast.success('Turnuva başarıyla oluşturuldu!');
        navigate(`/turnuva/${response.data.tournamentId}`);
      } else {
        toast.error(response.message || 'Turnuva oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Turnuva oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const tournamentTypes = [
    { value: 'league', label: 'Lig Formatı', description: 'Herkes herkesle içsaha-dışsaha oynar' },
    { value: 'world_cup', label: 'Dünya Kupası Formatı', description: '4\'lü gruplar, herkes herkesle tarafsız sahada 1 kez' },
    { value: 'champions_league', label: 'Eski Şampiyonlar Ligi Formatı', description: '4\'lü gruplar, herkes herkesle içsaha-dışsaha 2 maç' }
  ];

  const participantOptions = [4, 8, 16, 24, 32, 48, 64];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yeni Turnuva Oluştur</h1>
              <p className="text-sm text-gray-500">
                Turnuva bilgilerini doldurun ve organizasyonunuzu başlatın
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Turnuva Adı *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Örn: 2024 Yaz Turnuvası"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Turnuva hakkında kısa bir açıklama yazın..."
                />
              </div>
            </div>
          </div>

          {/* Tournament Format */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Turnuva Formatı</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Turnuva Tipi *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournamentTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                        formData.type === type.value
                          ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex flex-1">
                        <div className="flex flex-col">
                          <span className="block text-sm font-medium text-gray-900">
                            {type.label}
                          </span>
                          <span className="mt-1 flex items-center text-sm text-gray-500">
                            {type.description}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                    Maksimum Katılımcı Sayısı *
                  </label>
                  
                  {formData.type === 'league' ? (
                    // Lig formatı için manuel input
                    <input
                      type="number"
                      name="maxParticipants"
                      id="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleChange}
                      className="input-field mt-1"
                      min="4"
                      max="64"
                      placeholder="Takım sayısını girin (4-64)"
                      required
                    />
                  ) : (
                    // Diğer formatlar için dropdown
                    <select
                      name="maxParticipants"
                      id="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleChange}
                      className="input-field mt-1"
                    >
                      {participantOptions.map((num) => (
                        <option key={num} value={num}>{num} Takım</option>
                      ))}
                    </select>
                  )}
                  
                  {formData.type === 'league' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Lig formatında istediğiniz takım sayısını girebilirsiniz (4-64 arası)
                    </p>
                  )}
                  
                  {/* Toplam Maç Sayısı Gösterimi */}
                  {formData.maxParticipants && formData.type && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-blue-900">
                            Takım Başı Maç:
                          </span>
                          <div className="text-lg font-bold text-blue-600">
                            {calculateTotalMatches().perTeam} maç
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-blue-900">
                            Turnuva Geneli:
                          </span>
                          <div className="text-lg font-bold text-blue-600">
                            {calculateTotalMatches().total} maç
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        {formData.type === 'league' && 'Her takım diğer takımlarla 2 kez (içsaha-dışsaha) oynar'}
                        {formData.type === 'world_cup' && 'Grup aşaması + Eleme turları (tek maç)'}
                        {formData.type === 'champions_league' && 'Grup aşaması + Eleme turları (final hariç çift maç)'}
                      </p>
                    </div>
                  )}
                </div>

                {(formData.type === 'world_cup' || formData.type === 'champions_league') && (
                  <div>
                    <label htmlFor="groupCount" className="block text-sm font-medium text-gray-700">
                      Grup Sayısı
                    </label>
                    <select
                      name="groupCount"
                      id="groupCount"
                      value={formData.groupCount}
                      onChange={handleChange}
                      className="input-field mt-1"
                    >
                      <option value={4}>4 Grup</option>
                      <option value={8}>8 Grup</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.type === 'world_cup' 
                        ? 'Her grupta takımlar tarafsız sahada 1 kez karşılaşır'
                        : 'Her grupta takımlar içsaha-dışsaha 2 kez karşılaşır'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tarihler</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="registrationStart" className="block text-sm font-medium text-gray-700">
                  Kayıt Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  name="registrationStart"
                  id="registrationStart"
                  value={formData.registrationStart}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label htmlFor="registrationEnd" className="block text-sm font-medium text-gray-700">
                  Kayıt Bitiş Tarihi
                </label>
                <input
                  type="date"
                  name="registrationEnd"
                  id="registrationEnd"
                  value={formData.registrationEnd}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Turnuva Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Turnuva Bitiş Tarihi
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>
            </div>
          </div>

          {/* Match Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Maç Ayarları</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="matchDuration" className="block text-sm font-medium text-gray-700">
                  Maç Süresi (dakika)
                </label>
                <input
                  type="number"
                  name="matchDuration"
                  id="matchDuration"
                  min="45"
                  max="120"
                  value={formData.matchDuration}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hasExtraTime"
                  id="hasExtraTime"
                  checked={formData.hasExtraTime}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasExtraTime" className="ml-2 block text-sm text-gray-900">
                  Uzatma süresi var
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hasPenalties"
                  id="hasPenalties"
                  checked={formData.hasPenalties}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasPenalties" className="ml-2 block text-sm text-gray-900">
                  Penaltı atışları var
                </label>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ek Bilgiler</h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="rules" className="block text-sm font-medium text-gray-700">
                  Kurallar ve Açıklamalar
                </label>
                <textarea
                  name="rules"
                  id="rules"
                  rows={4}
                  value={formData.rules}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Turnuva kuralları, katılım şartları ve diğer önemli bilgileri buraya yazın..."
                />
              </div>

              {/* Ödül Sistemi */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    name="hasReward"
                    id="hasReward"
                    checked={formData.hasReward}
                    onChange={handleChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasReward" className="ml-2 flex items-center text-sm font-medium text-gray-900">
                    <GiftIcon className="h-4 w-4 mr-1 text-yellow-600" />
                    Bu turnuvada ödül var
                  </label>
                </div>

                {formData.hasReward && (
                  <div>
                    <label htmlFor="rewardDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Ödül Açıklaması
                    </label>
                    <textarea
                      name="rewardDescription"
                      id="rewardDescription"
                      rows={3}
                      value={formData.rewardDescription}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Örn: Football Manager 2024 oyunu, Fiziksel kupa, Madalya, vb."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Kazananlara verilecek ödülleri detaylı olarak açıklayın
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/turnuvalar')}
              className="btn-secondary"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? <LoadingSpinner size="small" /> : 'Turnuva Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTournamentPage;