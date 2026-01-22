/**
 * Auth Utilities
 * Authentication kontrolü için utility fonksiyonlar
 */

/**
 * Kullanıcının authenticated olup olmadığını kontrol eder
 * Eğer değilse, callback fonksiyonunu çağırır (örn: login modal aç)
 * 
 * @param isAuthenticated - Kullanıcı authenticated mı?
 * @param isLoading - Auth durumu yükleniyor mu?
 * @param onRequireAuth - Auth gerektiğinde çağrılacak callback
 * @returns true eğer authenticated ise, false değilse
 */
export function requireAuth(
  isAuthenticated: boolean,
  isLoading: boolean,
  onRequireAuth: () => void
): boolean {
  if (!isAuthenticated && !isLoading) {
    onRequireAuth();
    return false;
  }
  return true;
}
