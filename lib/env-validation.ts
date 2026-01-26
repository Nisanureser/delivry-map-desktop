/**
 * Environment Variable Validation
 * Production'a geçmeden önce tüm gerekli environment variable'ların varlığını kontrol eder
 */

interface EnvConfig {
  API_URL: string;
  ADRES_API_URL: string;
  ADRES_API_TOKEN: string;
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  ALLOWED_ORIGINS: string; // Production'da zorunlu
}

const requiredEnvVars = [
  'API_URL',
  'ADRES_API_URL',
  'ADRES_API_TOKEN',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
] as const;

/**
 * Environment variable'ları validate eder
 * @throws Error eğer gerekli bir env var eksikse
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Production'da ALLOWED_ORIGINS zorunlu
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS.trim() === '') {
      missing.push('ALLOWED_ORIGINS');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.\n' +
        (process.env.NODE_ENV === 'production' && missing.includes('ALLOWED_ORIGINS')
          ? '\n  SECURITY WARNING: ALLOWED_ORIGINS is required in production for CORS protection!'
          : '')
    );
  }
}

/**
 * Type-safe environment config getter
 */
export function getEnvConfig(): EnvConfig {
  validateEnv();

  return {
    API_URL: process.env.API_URL!,
    ADRES_API_URL: process.env.ADRES_API_URL!,
    ADRES_API_TOKEN: process.env.ADRES_API_TOKEN!,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    NODE_ENV: (process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'],
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '', // Production'da validateEnv() zaten kontrol ediyor
  };
}
