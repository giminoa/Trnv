# Turnuva Yönetim Sistemi - Kurulum Rehberi

Bu rehber, turnuva yönetim sistemini hosting sağlayıcınıza nasıl yükleyeceğinizi adım adım açıklar.

https://github.com/giminoa/Trnv.git

## 📋 Sistem Gereksinimleri

### Backend Gereksinimleri
- **Node.js**: v16.0.0 veya üzeri
- **npm**: v7.0.0 veya üzeri
- **SQLite**: v3.0 veya üzeri (çoğu hosting'de varsayılan olarak gelir)
- **Port**: 5000 (veya hosting sağlayıcınızın belirlediği port)

### Frontend Gereksinimleri
- **Node.js**: v16.0.0 veya üzeri
- **npm**: v7.0.0 veya üzeri
- **Web Server**: Apache, Nginx veya benzeri

## 🚀 Kurulum Adımları

### 1. Dosyaları Hosting'e Yükleme

#### FTP/SFTP ile Yükleme
```bash
# Tüm proje dosyalarını hosting'inizin ana dizinine yükleyin
# Örnek dizin yapısı:
/public_html/
├── backend/
├── frontend/
├── package.json
├── README.md
└── KURULUM.md
```

#### Git ile Yükleme (Önerilen)
```bash
# Proje dosyalarını indirin ve klasöre gidin
# Not: GitHub repository'si artık mevcut değil
# Mevcut proje dosyalarını kullanın
cd trnv
```

### 2. Backend Kurulumu

#### 2.1 Backend Dizinine Geçin
```bash
cd backend
```

#### 2.2 Bağımlılıkları Yükleyin
```bash
npm install
```

#### 2.3 Çevre Değişkenlerini Ayarlayın
```bash
# .env dosyasını oluşturun
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
# Sunucu Ayarları
PORT=5000
NODE_ENV=production

# JWT Ayarları
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d

# Veritabanı Ayarları
DB_PATH=./database/turnuva.db

# CORS Ayarları
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=15

# Upload Ayarları
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

#### 2.4 Veritabanını Başlatın
```bash
npm run init-db
```

#### 2.5 Backend'i Başlatın
```bash
# Geliştirme için
npm run dev

# Prodüksiyon için
npm start
```

### 3. Frontend Kurulumu

#### 3.1 Frontend Dizinine Geçin
```bash
cd ../frontend
```

#### 3.2 Bağımlılıkları Yükleyin
```bash
npm install
```

#### 3.3 Prodüksiyon Build'i Oluşturun
```bash
npm run build
```

#### 3.4 Build Dosyalarını Web Sunucusuna Kopyalayın
```bash
# Apache için (public_html dizinine)
cp -r build/* /path/to/public_html/

# Nginx için
cp -r build/* /var/www/html/
```

### 4. Web Sunucusu Konfigürasyonu

#### Apache (.htaccess)
Frontend dizininde `.htaccess` dosyası oluşturun:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# CORS Headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

#### Nginx Konfigürasyonu
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 5. Process Manager (PM2) Kurulumu

Backend'in sürekli çalışması için PM2 kullanın:

```bash
# PM2'yi global olarak yükleyin
npm install -g pm2

# Backend dizininde ecosystem dosyası oluşturun
```

`ecosystem.config.js` dosyası oluşturun:
```javascript
module.exports = {
  apps: [{
    name: 'turnuva-backend',
    script: './server.js',
    cwd: './backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

PM2'yi başlatın:
```bash
# Backend'i PM2 ile başlatın
pm2 start ecosystem.config.js

# PM2'yi sistem başlangıcında otomatik başlatın
pm2 startup
pm2 save
```

### 6. SSL Sertifikası (HTTPS)

#### Let's Encrypt ile Ücretsiz SSL
```bash
# Certbot yükleyin (Ubuntu/Debian)
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası alın
sudo certbot --nginx -d yourdomain.com

# Otomatik yenileme için cron job ekleyin
sudo crontab -e
# Şu satırı ekleyin:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Güvenlik Ayarları

#### 7.1 Firewall Konfigürasyonu
```bash
# UFW firewall (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw enable
```

#### 7.2 Güvenlik Headers
Nginx konfigürasyonuna ekleyin:
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 8. Veritabanı Yedekleme

Otomatik SQLite yedekleme scripti oluşturun:

`backup.sh` dosyası:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_PATH="/path/to/backend/database/turnuva.db"

# Yedekleme dizinini oluştur
mkdir -p $BACKUP_DIR

# Veritabanını yedekle
cp $DB_PATH $BACKUP_DIR/turnuva_backup_$DATE.db

# 30 günden eski yedekleri sil
find $BACKUP_DIR -name "turnuva_backup_*.db" -mtime +30 -delete

echo "Backup completed: turnuva_backup_$DATE.db"
```

Cron job ekleyin:
```bash
crontab -e
# Günlük yedekleme için:
0 2 * * * /path/to/backup.sh
```

### 9. Monitoring ve Loglar

#### 9.1 PM2 Monitoring
```bash
# PM2 durumunu kontrol edin
pm2 status

# Logları görüntüleyin
pm2 logs turnuva-backend

# Monitoring dashboard
pm2 monit
```

#### 9.2 Log Rotation
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 10. Domain ve DNS Ayarları

#### DNS Kayıtları
```
A Record: yourdomain.com -> YOUR_SERVER_IP
CNAME: www.yourdomain.com -> yourdomain.com
```

#### Subdomain için API
```
A Record: api.yourdomain.com -> YOUR_SERVER_IP
```

## 🔧 Sorun Giderme

### Backend Çalışmıyor
```bash
# Port kontrolü
netstat -tlnp | grep :5000

# PM2 loglarını kontrol edin
pm2 logs turnuva-backend

# Manuel başlatma testi
cd backend && npm start
```

### Frontend Görünmüyor
```bash
# Build dosyalarını kontrol edin
ls -la /path/to/public_html/

# Web sunucusu loglarını kontrol edin
tail -f /var/log/nginx/error.log
tail -f /var/log/apache2/error.log
```

### Veritabanı Sorunları
```bash
# Veritabanı dosyası izinlerini kontrol edin
ls -la backend/database/

# Veritabanını yeniden başlatın
cd backend && npm run init-db
```

## 📞 Destek

Kurulum sırasında sorun yaşarsanız:

1. **Logları kontrol edin**: PM2, Nginx/Apache logları
2. **Port durumunu kontrol edin**: `netstat -tlnp`
3. **Dosya izinlerini kontrol edin**: `ls -la`
4. **Çevre değişkenlerini kontrol edin**: `.env` dosyası

## 🎉 Kurulum Tamamlandı!

Sistem başarıyla kurulduysa:

- **Frontend**: `https://yourdomain.com`
- **Admin Panel**: `https://yourdomain.com/admin`
- **API**: `https://yourdomain.com/api`

**Varsayılan Admin Bilgileri:**
- Email: `admin@turnuva.taktisyen.net`
- Şifre: `admin123`

> ⚠️ **Güvenlik Uyarısı**: İlk girişten sonra admin şifresini mutlaka değiştirin!

## 📝 Güncelleme

Sistem güncellemesi için:

```bash
# Git ile güncelleme
git pull origin main

# Backend bağımlılıklarını güncelle
cd backend && npm install

# Frontend'i yeniden build et
cd ../frontend && npm install && npm run build

# PM2'yi yeniden başlat
pm2 restart turnuva-backend
```

---

**İyi turnuvalar! 🏆**


# Hostinger'de backend klasöründe:
npm install --production  # Sadece gerekli paketleri yükler

# .env dosyasını düzenleyin:
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://turnuva.taktisyen.net  # Kendi domain adresiniz