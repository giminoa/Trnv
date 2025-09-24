import React, { useState } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UserEditModal = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || 'participant',
    isActive: user?.isActive || true
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // API çağrısı burada yapılacak
      await onSave(user.id, formData);
      toast.success('Kullanıcı başarıyla güncellendi');
      onClose();
    } catch (error) {
      toast.error('Kullanıcı güncellenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Kullanıcı Düzenle</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad
            </label>
            <div className="relative">
              <UserIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="pl-10 input-field"
                placeholder="Ad"
              />
            </div>
          </div>

          {/* Soyad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soyad
            </label>
            <div className="relative">
              <UserIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="pl-10 input-field"
                placeholder="Soyad"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta
            </label>
            <div className="relative">
              <EnvelopeIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 input-field"
                placeholder="E-posta"
                required
              />
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <div className="relative">
              <ShieldCheckIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="pl-10 input-field"
              >
                <option value="participant">Katılımcı</option>
                <option value="organizer">Organizatör</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Aktif Durumu */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Kullanıcı aktif
            </label>
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

export default UserEditModal;