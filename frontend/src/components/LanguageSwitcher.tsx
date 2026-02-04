'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';
import { useEffect } from 'react';

export default function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const languages = [
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'zh', label: '简体中文', flag: '🇨🇳' }
  ];

  useEffect(() => {
    // Sync with localStorage on mount if needed, or save current locale
    localStorage.setItem('NEXT_LOCALE', locale);
  }, [locale]);

  const onSelectChange = (nextLocale: string) => {
    localStorage.setItem('NEXT_LOCALE', nextLocale);
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
          <span className="text-lg">{languages.find(l => l.code === locale)?.flag || '🌐'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => onSelectChange(lang.code)}
            className={locale === lang.code ? "bg-accent" : ""}
          >
            <span className="mr-2 text-lg">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
