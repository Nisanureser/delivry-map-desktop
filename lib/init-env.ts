/**
 * Environment Initialization
 * Uygulama başlangıcında environment variable'ları validate eder
 */

import { validateEnv } from './env-validation';

// Uygulama başlangıcında environment variable'ları kontrol et
// Bu dosya import edildiğinde otomatik çalışır
if (typeof window === 'undefined') {
  // Sadece server-side'da çalıştır
  try {
    validateEnv();
  } catch (error) {
    // Development'da uyarı ver, production'da hata fırlat
    if (process.env.NODE_ENV === 'production') {
      console.error(' Environment validation failed:', error);
      throw error;
    } else {
      console.warn('  Environment validation warning:', error);
    }
  }
}
