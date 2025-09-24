import React, { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import api from '../../services/api';

const FileUpload = ({ 
  onUpload, 
  currentImage = null, 
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü
    if (file.size > maxSize) {
      toast.error(`Dosya boyutu çok büyük (maksimum ${Math.round(maxSize / 1024 / 1024)}MB)`);
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Preview oluştur
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Dosyayı yükle
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success) {
        toast.success('Logo başarıyla yüklendi');
        const imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.data.url}`;
        onUpload(imageUrl);
      } else {
        toast.error(response.message || 'Dosya yüklenirken bir hata oluştu');
        setPreview(currentImage); // Hata durumunda eski resmi geri yükle
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Dosya yüklenirken bir hata oluştu');
      setPreview(currentImage); // Hata durumunda eski resmi geri yükle
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
          isUploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="mx-auto h-32 w-32 object-cover rounded-lg"
            />
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <LoadingSpinner size="small" />
              </div>
            )}
          </div>
        ) : (
          <div>
            {isUploading ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner size="medium" />
                <p className="mt-2 text-sm text-gray-600">Yükleniyor...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium text-blue-600">Dosya seçmek için tıklayın</span>
                  {' '}veya sürükleyip bırakın
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF (maksimum {Math.round(maxSize / 1024 / 1024)}MB)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {preview && !isUploading && (
        <div className="mt-2 text-center">
          <button
            onClick={handleClick}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Değiştir
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;