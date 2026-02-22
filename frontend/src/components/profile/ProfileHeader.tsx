import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { User } from '@/lib/store';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { Button } from '@/components/ui/button';
import { Edit, MapPin, Calendar, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  user: User;
  onAvatarUpload: (url: string) => void;
  onEditProfile: () => void;
}

export function ProfileHeader({ user, onAvatarUpload, onEditProfile }: ProfileHeaderProps) {
  const t = useTranslations('Profile');
  const locale = useLocale();

  // Mock data for display purposes
  const joinDate = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const location = "Moscow, Russia";
  
  // Determine position name based on locale
  const positionName = user.position 
    ? (locale === 'ru' ? user.position.nameRu : user.position.nameZh) 
    : t('noPosition');

  return (
    <Card className="relative overflow-hidden border-none shadow-lg bg-background profile-dashboard__card profile-dashboard__card--glass profile-dashboard__card--hoverable group">
      {/* Background Banner */}
      <div className="h-32 md:h-48 w-full bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 md:-mt-16 gap-6">
          {/* Avatar Section */}
          <div className="relative z-10 profile-header__avatar-frame rounded-full p-1 bg-background shadow-xl">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden bg-background">
               <AvatarUpload 
                user={user}
                onUploadSuccess={onAvatarUpload} 
                className="h-full w-full object-cover"
                avatarClassName="w-full h-full"
              />
            </div>
          </div>

          {/* User Info Section */}
          <div className="flex-1 pt-2 md:pb-2 space-y-2 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                  {user.name || user.username}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-medium">{positionName}</span>
                  <span className="text-border mx-1">|</span>
                  <Badge variant="secondary" className="rounded-full px-3 font-normal">
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-3">
                 <Button onClick={onEditProfile} className="shadow-sm gap-2">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('editProfile')}</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {location}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {t('joined')} {joinDate}
              </div>
            </div>
          </div>

          {/* Quick Stats Section (Desktop) */}
          <div className="hidden md:flex gap-6 pb-2 mr-4">
            <div className="text-center group/stat cursor-default">
              <div className="text-2xl font-bold text-primary group-hover/stat:scale-110 transition-transform">124</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('tasks')}</div>
            </div>
            <div className="text-center group/stat cursor-default">
              <div className="text-2xl font-bold text-primary group-hover/stat:scale-110 transition-transform">12</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('projects')}</div>
            </div>
            <div className="text-center group/stat cursor-default">
              <div className="text-2xl font-bold text-primary group-hover/stat:scale-110 transition-transform">4.9</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('rating')}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
