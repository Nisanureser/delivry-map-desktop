/**
 * useDebounce Hook
 * Değer değişikliklerini geciktirir (API çağrılarını optimize etmek için)
 * 
 * @param value - Debounce edilecek değer
 * @param delay - Gecikme süresi (ms)
 * @returns Debounce edilmiş değer
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Zamanlayıcı başlat
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Yeni değer gelirse önceki zamanlayıcıyı iptal et
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
