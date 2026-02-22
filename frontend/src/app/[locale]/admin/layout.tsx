'use client';

import { PrivateChatNotifier } from '@/components/chat/PrivateChatNotifier';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  
  return (
    <>
      <PrivateChatNotifier />
      <div className="border-b bg-background">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <h2 className="text-lg font-semibold mr-6">Admin Panel</h2>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link
              href={`/${locale}/admin/users`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.includes('/admin/users') ? "text-primary" : "text-muted-foreground"
              )}
            >
              Users
            </Link>
            <Link
              href={`/${locale}/admin/positions`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.includes('/admin/positions') ? "text-primary" : "text-muted-foreground"
              )}
            >
              Positions
            </Link>
             <Link
              href={`/${locale}/dashboard`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary text-muted-foreground ml-auto"
              )}
            >
              Back to Dashboard
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}
