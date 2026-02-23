import React from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Mail, Phone, User as UserIcon, ExternalLink } from 'lucide-react';

interface ProfileInfoProps {
  user: User;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const t = useTranslations('Profile');

  // Mock data for missing fields
  const displayPhone = user.phone || t('notProvided');

  const InfoItem = ({ icon: Icon, label, value, href }: { icon: any, label: string, value: string, href?: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-semibold hover:underline flex items-center gap-1 truncate text-foreground">
            {value} <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        ) : (
          <p className="text-sm font-semibold truncate text-foreground">{value}</p>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full border-none shadow-md bg-background/50 backdrop-blur-sm profile-dashboard__card profile-dashboard__card--glass profile-dashboard__card--hoverable">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-primary" />
          {t('contactInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <InfoItem 
          icon={Mail} 
          label={t('email')} 
          value={user.email || user.username} 
          href={`mailto:${user.email || user.username}`}
        />
        <InfoItem 
          icon={Phone} 
          label={t('phone')} 
          value={displayPhone} 
          href={user.phone ? `tel:${user.phone}` : undefined}
        />
      </CardContent>
    </Card>
  );
}
