# Turnuva Yönetim Sistemi - Gereksinim Dökümanı

## 1. GENEL BİLGİLER

**Proje Adı:** Turnuva Yönetim Sistemi  
**Domain:** turnuva.taktisyen.net  
**Ana Forum:** forum.taktisyen.net  
**Dil:** Türkçe  

## 2. TEMEL ÖZELLİKLER

### 2.1 Kullanıcı Yönetimi
- **Kayıt/Giriş Sistemi**
  - Email ile kayıt
  - Şifre sıfırlama
  - Profil yönetimi
  
- **Yetki Seviyeleri**
  - Admin: Tüm yetkiler
  - Turnuva Organizatörü: Turnuva oluşturma/yönetme
  - Katılımcı: Turnuvalara katılma

### 2.2 Turnuva Oluşturma ve Yönetimi

#### Turnuva Tipleri
1. **Lig Usulü**
   - Herkes herkesle oynar
   - Puan sistemi: Galibiyet 3, Beraberlik 1, Mağlubiyet 0

2. **Grup Sistemi** 
   - 2, 4, 8 grup seçeneği
   - Grup içi lig usulü
   - Gruplardan çıkma kuralları

3. **Dünya Kupası Formatı**
   - Grup aşaması + Eleme turları
   - 8 grup, her gruptan 2 takım çıkar
   - 16'lı final → 8'li final → Yarı final → Final

4. **Şampiyonlar Ligi Formatı**
   - Grup aşaması (8 grup, 4 takım)
   - Her gruptan 2 takım çıkar
   - 16'lı final → 8'li final → Yarı final → Final

#### Turnuva Ayarları
- **Temel Bilgiler**
  - Turnuva adı
  - Açıklama/Kurallar (Rich text editor)
  - Başlangıç tarihi
  - Katılımcı sayısı limiti
  - Kayıt başlangıç/bitiş tarihi

- **Format Ayarları**
  - Turnuva tipi seçimi
  - Grup sayısı (gerekirse)
  - Maç süresi
  - Uzatma/penaltı kuralları

### 2.3 Takım Yönetimi
- **Takım Ekleme**
  - Manuel takım ekleme (admin)
  - Takım başvuru sistemi
  - Takım onaylama/reddetme

- **Takım Bilgileri**
  - Takım adı
  - Logo yükleme
  - Kaptan bilgisi
  - Oyuncu listesi

### 2.4 Fikstür Sistemi
- **Otomatik Fikstür Çekme**
  - Grup aşaması fikstürleri
  - Eleme tur fikstürleri
  - Tarih/saat ataması

- **Manuel Fikstür Düzenleme**
  - Maç tarihi/saati değiştirme
  - Saha ataması
  - Erteleme/iptal işlemleri

### 2.5 Maç ve Sonuç Yönetimi
- **Maç Sayfası**
  - Takım bilgileri
  - Maç detayları
  - Canlı skor (opsiyonel)
  - Maç özeti/notlar

- **Sonuç Girme**
  - Skor girme
  - Gol atan oyuncular
  - Kartlar (sarı/kırmızı)
  - Maç raporu

### 2.6 Puan Durumu ve İstatistikler
- **Grup Puan Durumu**
  - Oynadığı maç sayısı
  - Galibiyet/Beraberlik/Mağlubiyet
  - Attığı/Yediği gol
  - Averaj
  - Puan

- **Genel İstatistikler**
  - En golcü takım
  - En az gol yiyen takım
  - En golcü oyuncu
  - Kart istatistikleri

## 3. TEKNIK GEREKSINIMLER

### 3.1 Frontend
- **Responsive tasarım** (mobil uyumlu)
- **Modern UI/UX** 
- **Hızlı navigasyon**
- **AJAX ile dinamik içerik**

### 3.2 Backend
- **RESTful API** yapısı
- **Database optimizasyonu**
- **Session yönetimi**
- **Security** (SQL injection, XSS koruması)

### 3.3 Sayfa Yapısı
```
/                       # Ana sayfa
/turnuvalar            # Turnuva listesi
/turnuva/[id]          # Turnuva detay
/turnuva/[id]/fikstur  # Fikstür
/turnuva/[id]/puan     # Puan durumu
/turnuva/[id]/maç/[id] # Maç detay
/admin                 # Admin panel
/profil                # Kullanıcı profil
/kayit                 # Kayıt ol
/giris                 # Giriş yap
```

### 3.4 Database Tabloları

#### Kullanıcılar (users)
- id, username, email, password_hash, role, created_at

#### Turnuvalar (tournaments)
- id, name, description, type, status, start_date, end_date, max_participants, created_by, created_at

#### Takımlar (teams)
- id, name, logo, captain_id, tournament_id, created_at

#### Gruplar (groups)
- id, tournament_id, name, created_at

#### Maçlar (matches)
- id, tournament_id, group_id, home_team_id, away_team_id, match_date, home_score, away_score, status, round

#### Puan Durumu (standings)
- id, tournament_id, group_id, team_id, played, won, drawn, lost, goals_for, goals_against, points

## 4. ÖNEMLİ ÖZELLİKLER

### 4.1 Pagination
- Her listeleme sayfasında sayfalama
- Sayfa başına 10-20 kayıt
- "Önceki/Sonraki" ve sayfa numaraları
- URL'de sayfa bilgisi (?page=1)

### 4.2 Link Yapısı
- SEO dostu URL'ler
- Tüm linklerin çalışır olması
- Breadcrumb navigasyon
- 404 sayfa yönetimi

### 4.3 Admin Panel
- Turnuva yönetimi
- Kullanıcı yönetimi  
- Sistem ayarları
- Backup/geri yükleme

### 4.4 Güvenlik
- SQL Injection koruması
- XSS koruması
- CSRF token kullanımı
- Rate limiting
- Input validation

## 5. KULLANICI DENEYİMİ

### 5.1 Ana Sayfa
- Aktif turnuvalar
- Son sonuçlar
- Yaklaşan maçlar
- İstatistikler

### 5.2 Turnuva Sayfası
- Genel bilgiler
- Puan durumu
- Fikstür
- İstatistikler
- Tab yapısı ile organize edilmiş içerik

### 5.3 Mobil Uyumluluk
- Tüm sayfalar mobilde düzgün görünmeli
- Touch-friendly butonlar
- Hızlı yükleme

## 6. PERFORMANS GEREKSİNİMLERİ

- Sayfa yükleme süresi < 3 saniye
- Database sorguları optimize edilmeli
- Cache mekanizması kullanılmalı
- CDN desteği (statik dosyalar için)

## 7. TEST GEREKSİNİMLERİ

### 7.1 Fonksiyonel Testler
- Turnuva oluşturma
- Takım ekleme
- Fikstür çekme
- Sonuç girme
- Puan hesaplama

### 7.2 Güvenlik Testleri
- Authentication bypass
- SQL injection
- XSS saldırıları
- File upload güvenliği

## 8. DEPLOYMENT

- **Hosting:** Shared hosting uyumlu
- **PHP Version:** 7.4+ veya Node.js 16+
- **Database:** MySQL 8.0+
- **Web Server:** Apache/Nginx
- **SSL:** Zorunlu (HTTPS)

## 9. DOKÜMANTASYON

### 9.1 Kullanıcı Kılavuzu
- Turnuva oluşturma adımları
- Takım yönetimi
- Sonuç girme

### 9.2 Admin Kılavuzu  
- Sistem yönetimi
- Kullanıcı yönetimi
- Backup işlemleri

### 9.3 Teknik Dokümantasyon
- API dökümanı
- Database şeması
- Kurulum kılavuzu

## 10. ÖNCELIK SIRASI

### Faz 1 (Kritik)
1. Kullanıcı yönetimi
2. Temel turnuva oluşturma
3. Takım ekleme
4. Fikstür sistemi

### Faz 2 (Önemli)
1. Puan durumu
2. Maç sonuçları
3. Admin panel
4. İstatistikler

### Faz 3 (Ek Özellikler)
1. Gelişmiş turnuva formatları
2. Canlı skor
3. Bildirim sistemi

## 11. BAŞARILI PROJE KRİTERLERİ

✅ Tüm turnuva formatları çalışıyor  
✅ Fikstür otomatik oluşturuluyor  
✅ Puan hesaplamaları doğru  
✅ Responsive tasarım  
✅ Güvenlik açıkları yok  
✅ Hızlı performans  
✅ Kullanıcı dostu arayüz  
✅ Eksiksiz dokümantasyon  

---

**Not:** Bu sistem forum.taktisyen.net ile entegre çalışacak şekilde tasarlanmalı ve mevcut kullanıcı tabanıyla uyumlu olmalıdır.