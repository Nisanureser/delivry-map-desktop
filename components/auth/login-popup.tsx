/**
 * Login Popup Component
 * Giriş modalı - Sağ üstten açılan panel
 */

'use client';

import { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPopup({ isOpen, onClose }: LoginPopupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Başarılı giriş - modal'ı kapat
        onClose();
        setEmail('');
        setPassword('');
      } else {
        setError(result.error || 'Giriş başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Panel - Ortada açılır - Glassmorphism */}
      <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] glass-modal shadow-2xl animate-fade-in rounded-2xl overflow-hidden border border-white/20">
        <div className="flex flex-col max-h-[calc(100vh-2rem)]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Giriş Yap</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hesabınıza giriş yapın
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/10 dark:hover:bg-black/20 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[500px]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-3">
                  E-posta veya Kullanıcı Adı
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 dark:text-purple-400 z-10 pointer-events-none" />
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com veya kullanici_adi"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/20 bg-white/20 dark:bg-white/5 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500/40 focus:border-purple-500/60 focus:bg-white/30 dark:focus:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-3">
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 dark:text-purple-400 z-10 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-white/20 bg-white/20 dark:bg-white/5 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500/40 focus:border-purple-500/60 focus:bg-white/30 dark:focus:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-colors z-20 pointer-events-auto"
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button - Gradient */}
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full mt-6 py-2 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-purple-600 disabled:hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>

            {/* Legal Text */}
            <p className="text-xs text-center text-muted-foreground mt-6 px-2">
              Giriş yaparak{' '}
              <a href="#" className="text-purple-500 dark:text-purple-400 hover:underline">
                hizmet şartlarını
              </a>
              {' '}ve{' '}
              <a href="#" className="text-purple-500 dark:text-purple-400 hover:underline">
                gizlilik politikasını
              </a>
              {' '}kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
