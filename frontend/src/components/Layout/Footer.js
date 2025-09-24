import React from 'react';
import { Link } from 'react-router-dom';
import { TrophyIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <TrophyIcon className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">taktisyen.net</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Türkiyenin Football Manager topluluğu Taktisyen.net'in özel turnuva sistemidir. Turnuvalarımız ile ilgili istatistik verileri, puan durumları, fikstürler görüntülenebilecektir.
            </p>
            <p className="text-sm text-gray-400">
              <a 
                href="https://forum.taktisyen.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                forum.taktisyen.net
              </a> ile entegre çalışır.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/turnuvalar" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Turnuvalar
                </Link>
              </li>
              <li>
                <Link 
                  to="/takimlar" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Takımlar
                </Link>
              </li>
              <li>
                <Link 
                  to="/turnuva-olustur" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Turnuva Oluştur
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Destek</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://taktisyen.net" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Blog
                </a>
              </li>
              <li>
                <a 
                  href="https://t.me/+POq3Uq2CHdwyNDU8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@taktisyen.net"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  İletişim
                </a>
              </li>
              <li>
                <span className="text-gray-300">
                  Yardım Merkezi
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {currentYear} Turnuva Yönetim Sistemi. Tüm hakları saklıdır.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button 
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Gizlilik Politikası
              </button>
              <button 
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Kullanım Şartları
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;