/**
 * useClickOutside Hook
 * Element dışına tıklanıp tıklanmadığını algılar
 * 
 * Mantık:
 * - Reusable hook (her yerde kullanılabilir)
 * - Dropdown, modal, popover gibi UI elementleri için
 * - Event listener yönetimi (cleanup ile)
 * 
 * @param ref - Kontrol edilecek element'in ref'i
 * @param callback - Dışarı tıklandığında çağrılacak fonksiyon
 */

'use client';

import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Ref var mı ve tıklanan element ref'in içinde değil mi?
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    // Event listener ekle
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup: Component unmount olduğunda listener'ı kaldır
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}
