'use client';

import { PrivateChatNotifier } from '@/components/chat/PrivateChatNotifier';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Admin');
  
  return (
    <>
      <PrivateChatNotifier />
      <div className="border-b bg-background">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <h2 className="text-lg font-semibold mr-6">{t('title')}</h2>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link
              href={`/${locale}/admin/users`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.includes('/admin/users') ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t('users')}
            </Link>
            <Link
              href={`/${locale}/admin/positions`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.includes('/admin/positions') ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t('positions')}
            </Link>
             <Link
              href={`/${locale}/dashboard`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary text-muted-foreground ml-auto"
              )}
            >
              {t('backToApp')}
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}
