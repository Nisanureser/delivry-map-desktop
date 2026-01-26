# Teslimat Rota Planlayıcı

Next.js tabanlı teslimat noktaları için rota optimizasyonu uygulaması.

## Özellikler

- 🗺️ Harita tabanlı rota planlama
- 📍 Teslimat noktası yönetimi
- 🚀 Rota optimizasyonu
- 🔐 Güvenli authentication sistemi
- 🔍 Adres arama ve geocoding

## Gereksinimler

- Node.js 18+ 
- npm, yarn, pnpm veya bun

## Kurulum

1. Repository'yi klonlayın:
```bash
git clone <repository-url>
cd deliver-map-desktop
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment variable'ları ayarlayın:
```bash
cp .env.example .env.local
```

4. `.env.local` dosyasını düzenleyip gerekli API key'leri ve URL'leri girin.

5. Development server'ı başlatın:
```bash
npm run dev
```

6. Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Production Deployment

### Güvenlik Önlemleri

Proje production için aşağıdaki güvenlik önlemleriyle hazırlanmıştır:

✅ **Security Headers**: X-Frame-Options, CSP, HSTS, vb.
✅ **Rate Limiting**: Brute force saldırılarına karşı koruma
✅ **Input Sanitization**: XSS ve injection saldırılarına karşı koruma
✅ **Error Handling**: Production'da hassas bilgiler gizlenir
✅ **Cookie Security**: HttpOnly, Secure, SameSite ayarları
✅ **CORS Protection**: Allowed origins kontrolü
✅ **Environment Validation**: Gerekli env variable'ların kontrolü

### Production Checklist

Deployment öncesi kontrol edilmesi gerekenler:

- [ ] `.env.local` dosyasında tüm environment variable'lar dolduruldu
- [ ] `ALLOWED_ORIGINS` production domain'leri ile güncellendi
- [ ] Google Maps API key'de domain restriction eklendi
- [ ] HTTPS sertifikası yapılandırıldı
- [ ] Rate limiting için Redis kuruldu (opsiyonel, önerilir)
- [ ] Health check endpoint test edildi: `/api/health`
- [ ] Error logging/monitoring sistemi kuruldu (Sentry, vb.)

### Build ve Deploy

```bash
# Production build
npm run build

# Production server başlat
npm start
```

### Environment Variables

Production için gerekli environment variable'lar:

- `NODE_ENV=production`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `API_URL` - Backend API URL
- `ADRES_API_URL` - Geocoding API URL
- `ADRES_API_TOKEN` - Geocoding API token
- `ALLOWED_ORIGINS` - CORS için izin verilen origin'ler (virgülle ayrılmış)

Detaylı bilgi için `.env.example` dosyasına bakın.

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/check` - Auth durumu kontrolü
- `POST /api/auth/logout` - Kullanıcı çıkışı
- `GET /api/geocode/search` - Adres arama
- `GET /api/geocode/reverse` - Koordinat'tan adres
- `POST /api/route/directions` - Rota hesaplama

## Güvenlik

Tüm API endpoint'leri rate limiting ile korunmaktadır:
- Login: 5 istek/dakika
- Geocode: 30 istek/dakika
- Directions: 20 istek/dakika
- Auth Check: 60 istek/dakika

## Teknolojiler

- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS
- **Maps**: Leaflet
- **Type Safety**: TypeScript
- **Authentication**: Cookie-based auth

## Lisans

[Lisans bilgisi buraya eklenecek]
