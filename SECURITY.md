# Güvenlik Dokümantasyonu

Bu dokümantasyon, projenin güvenlik özelliklerini ve production deployment için güvenlik gereksinimlerini açıklar.

## Uygulanan Güvenlik Önlemleri

### 1. Security Headers

Middleware aracılığıyla tüm HTTP response'lara güvenlik header'ları eklenir:

- **X-Frame-Options: DENY** - Clickjacking koruması
- **X-Content-Type-Options: nosniff** - MIME type sniffing koruması
- **X-XSS-Protection: 1; mode=block** - XSS koruması
- **Referrer-Policy: strict-origin-when-cross-origin** - Referrer bilgisi kontrolü
- **Content-Security-Policy (CSP)** - XSS ve injection saldırılarına karşı koruma
- **Strict-Transport-Security (HSTS)** - HTTPS zorunluluğu (production'da)

### 2. Rate Limiting

Tüm public API endpoint'leri rate limiting ile korunur:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 | 1 dakika |
| `/api/geocode/*` | 30 | 1 dakika |
| `/api/route/directions` | 20 | 1 dakika |
| `/api/auth/check` | 60 | 1 dakika |
| `/api/auth/logout` | 10 | 1 dakika |

**Not**: Şu anda in-memory store kullanılıyor. Production için Redis kullanılması önerilir.

### 3. Input Validation & Sanitization

Tüm kullanıcı input'ları validate edilir ve sanitize edilir:

- **Email Validation**: Format kontrolü ve sanitization
- **String Sanitization**: HTML tag temizleme, XSS koruması
- **Coordinate Validation**: Geçerli aralık kontrolü
- **Request Size Limits**: DoS saldırılarına karşı koruma
- **JSON Parsing**: Güvenli JSON parse (safeJsonParse)

### 4. Authentication & Authorization

- **HttpOnly Cookies**: XSS saldırılarına karşı token koruması
- **Secure Cookies**: Production'da HTTPS only
- **SameSite: Lax**: CSRF koruması
- **Token Validation**: Token format ve uzunluk kontrolü
- **Session Management**: 7 günlük session süresi

### 5. Error Handling

Production'da hassas bilgiler gizlenir:

- Generic error mesajları
- Stack trace'ler sadece development'ta
- Güvenli error logging (hassas bilgiler loglanmaz)

### 6. CORS Protection

- Allowed origins kontrolü
- Credentials desteği
- Preflight request handling

### 7. Environment Variable Security

- `.env.local` git'e commit edilmez
- Environment variable validation
- Production'da eksik env var kontrolü

## Production Deployment Güvenlik Checklist

### Öncesi

- [ ] Tüm environment variable'lar production değerleriyle dolduruldu
- [ ] `ALLOWED_ORIGINS` production domain'leri ile güncellendi
- [ ] Google Maps API key'de domain restriction eklendi
- [ ] HTTPS sertifikası yapılandırıldı
- [ ] `.env.local` dosyası git'e commit edilmedi

### Rate Limiting

- [ ] Redis kuruldu ve yapılandırıldı (önerilir)
- [ ] Rate limit değerleri production trafiğine göre ayarlandı
- [ ] Rate limit monitoring kuruldu

### Monitoring & Logging

- [ ] Error tracking sistemi kuruldu (Sentry, vb.)
- [ ] Log aggregation yapılandırıldı
- [ ] Security event monitoring aktif
- [ ] Health check endpoint test edildi

### Infrastructure

- [ ] Firewall kuralları yapılandırıldı
- [ ] DDoS koruması aktif
- [ ] SSL/TLS sertifikası geçerli
- [ ] Backup stratejisi belirlendi

## API Key Güvenliği

### Google Maps API Key

1. Google Cloud Console'da API key oluşturun
2. **HTTP referrer restrictions** ekleyin:
   - Production domain: `https://yourdomain.com/*`
   - Development: `http://localhost:3000/*`
3. Sadece gerekli API'leri aktif edin:
   - Maps JavaScript API
   - Directions API
   - Geocoding API

### Geocoding API Token

- Token'ı environment variable olarak saklayın
- Token'ı query parameter yerine header'da göndermeyi tercih edin (API destekliyorsa)
- Token rotation stratejisi uygulayın

## Güvenlik Açığı Bildirimi

Güvenlik açığı bulursanız, lütfen doğrudan repository'ye issue açmak yerine:

1. Güvenlik açığını detaylı açıklayın
2. Etkilenen bileşenleri belirtin
3. Olası çözüm önerileri sunun

## Güvenlik Güncellemeleri

Düzenli olarak:

- [ ] `npm audit` çalıştırın ve güvenlik açıklarını düzeltin
- [ ] Dependencies'i güncel tutun
- [ ] Security advisories'i takip edin
- [ ] Log dosyalarını inceleyin

## Ek Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
