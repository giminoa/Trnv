import React, { useState } from 'react';
import { XMarkIcon, TrophyIcon, CalendarIcon, MapPinIcon, UserGroupIcon, GiftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TournamentEditModal = ({ tournament, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    description: tournament?.description || '',
    location: tournament?.location || '',
    format: tournament?.format || 'knockout',
    startDate: tournament?.startDate ? tournament.startDate.split('T')[0] : '',
    endDate: tournament?.endDate ? tournament.endDate.split('T')[0] : '',
    registrationDeadline: tournament?.registrationDeadline ? tournament.registrationDeadline.split('T')[0] : '',
    maxTeams: tournament?.maxTeams || 16,
    hasReward: tournament?.hasReward || false,
    rewardDescription: tournament?.rewardDescription || '',
    status: tournament?.status || 'draft'
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !tournament) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // API çağrısı burada yapılacak
      await onSave(tournament.id, formData);
      toast.success('Turnuva başarıyla güncellendi');
      onClose();
    } catch (error) {
      toast.error('Turnuva güncellenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalMatches = () => {
    const participants = parseInt(formData.maxTeams);
    const format = formData.format;
    
    if (!participants || participants < 4) return { total: 0, perTeam: 0 };
    
    switch (format) {
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Turnuva Düzenle</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Turnuva Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turnuva Adı
            </label>
            <div className="relative">
              <TrophyIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="pl-10 input-field"
                placeholder="Turnuva adı"
                required
              />
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Turnuva açıklaması"
            />
          </div>

          {/* Konum ve Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konum
              </label>
              <div className="relative">
                <MapPinIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="pl-10 input-field"
                  placeholder="Şehir"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="input-field"
              >
                <option value="league">Lig Formatı - Herkes herkesle içsaha-dışsaha</option>
                <option value="world_cup">Dünya Kupası - 4'lü gruplar, tarafsız sahada 1 kez</option>
                <option value="champions_league">Eski Şampiyonlar Ligi - 4'lü gruplar, içsaha-dışsaha 2 maç</option>
              </select>
            </div>
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <div className="relative">
                <CalendarIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="pl-10 input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <div className="relative">
                <CalendarIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="pl-10 input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kayıt Sonu
              </label>
              <div className="relative">
                <CalendarIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="pl-10 input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Maksimum Takım */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksimum Takım
              </label>
              <div className="relative">
                <UserGroupIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  name="maxTeams"
                  value={formData.maxTeams}
                  onChange={handleChange}
                  className="pl-10 input-field"
                  min="4"
                  max="64"
                  required
                />
              </div>
              
              {formData.format === 'league' && (
                <p className="text-xs text-gray-500 mt-1">
                  Lig formatında istediğiniz takım sayısını girebilirsiniz (4-64 arası)
                </p>
              )}
              
              {/* Toplam Maç Sayısı Gösterimi */}
              {formData.maxTeams && formData.format && (
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
                    {formData.format === 'league' && 'Her takım diğer takımlarla 2 kez (içsaha-dışsaha) oynar'}
                    {formData.format === 'world_cup' && 'Grup aşaması + Eleme turları (tek maç)'}
                    {formData.format === 'champions_league' && 'Grup aşaması + Eleme turları (final hariç çift maç)'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="draft">Taslak</option>
                <option value="active">Aktif</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            </div>
          </div>

          {/* Ödül Sistemi */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                name="hasReward"
                checked={formData.hasReward}
                onChange={handleChange}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label className="ml-2 flex items-center text-sm font-medium text-gray-900">
                <GiftIcon className="h-4 w-4 mr-1 text-yellow-600" />
                Bu turnuvada ödül var
              </label>
            </div>

            {formData.hasReward && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ödül Açıklaması
                </label>
                <textarea
                  name="rewardDescription"
                  value={formData.rewardDescription}
                  onChange={handleChange}
                  rows={3}
                  className="input-field"
                  placeholder="Örn: Football Manager 2024 oyunu, Fiziksel kupa, Madalya, vb."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kazananlara verilecek ödülleri detaylı olarak açıklayın
                </p>
              </div>
            )}
          </div>

          {/* Butonlar */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentEditModal;