/**
 * User Button Component
 * Sağ üstte kullanıcı butonu/sheet
 * - Giriş yapılmadıysa: "Giriş Yap" butonu
 * - Giriş yapıldıysa: Kullanıcı bilgileri sheet'i
 */

'use client';

import { useState } from 'react';
import { User, X, Mail, Phone, ChevronUp, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPopup } from './login-popup';

export function UserButton() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserSheet, setShowUserSheet] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setShowUserSheet(false);
  };

  // Giriş yapılmadıysa - "Giriş Yap" butonu
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          className="fixed top-4 right-4 z-10000 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border-2 border-red-500/80 shadow-lg hover:bg-background/90 hover:border-red-500 transition-all pointer-events-auto"
        >
          <User className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">Giriş Yap</span>
        </button>

        <LoginPopup
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  // Giriş yapıldıysa - Kullanıcı butonu ve sheet
  const displayName = user?.name || user?.email?.split('@')[0] || 'Kullanıcı';
  const truncatedName = displayName.length > 15 
    ? `${displayName.substring(0, 15)}...` 
    : displayName;

  return (
    <>
      {/* User Button */}
      <button
        onClick={() => setShowUserSheet(true)}
        className="fixed top-4 right-4 z-10000 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border-2 border-green-500/80 shadow-lg hover:bg-background/90 hover:border-green-500 transition-all pointer-events-auto"
      >
        <User className="w-4 h-4 text-foreground" />
        <span className="text-sm font-medium text-foreground">{truncatedName}</span>
      </button>

      {/* User Sheet - Sağdan açılır */}
      {showUserSheet && (
        <div className="fixed inset-0 z-10000 flex items-start justify-end animate-in fade-in duration-300">
          {/* Backdrop - Glass overlay - %50 siyah overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-300"
            onClick={() => setShowUserSheet(false)}
          />

          {/* Sheet Panel - Sağdan açılır, daha dar - Okunur vaziyette */}
          <div className="relative w-[280px] sm:w-[320px] h-full rounded-l-2xl border border-white/20 shadow-2xl p-4 z-99999 animate-in slide-in-from-right fade-in duration-300 backdrop-blur-2xl bg-white/50 dark:bg-black/90">
            <div className="flex flex-col gap-4 h-full">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-foreground font-medium text-lg">Hesabım</h2>
                <button
                  onClick={() => setShowUserSheet(false)}
                  className="rounded-lg p-1.5 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Kullanıcı bilgileri */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-foreground truncate">
                    {user?.name || displayName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </span>
                </div>
              </div>

              {/* Menü butonları */}
              <div className="flex-1 space-y-2">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-full flex items-center justify-between gap-2 rounded-xl hover:bg-white/10 transition-all duration-200 p-2"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Profil
                    </span>
                  </div>
                  {isProfileOpen ? (
                    <ChevronUp className="w-4 h-4 text-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground" />
                  )}
                </button>

                {/* Profil Detayları */}
                {isProfileOpen && (
                  <div className="ml-6 space-y-1.5">
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-sm w-full">
                      <User className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">İsim</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {user?.name || displayName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-sm w-full">
                      <Mail className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">E-posta</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {user?.phone && (
                      <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-sm w-full">
                        <Phone className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Telefon</p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Çıkış */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-2 rounded-xl mb-1 p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
