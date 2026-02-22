'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export default function LocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    if (!locale) return;
    
    // Sync locale to localStorage
    localStorage.setItem('NEXT_LOCALE', locale);
    
    // Ensure cookie is also set for middleware detection
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  return null;
}
