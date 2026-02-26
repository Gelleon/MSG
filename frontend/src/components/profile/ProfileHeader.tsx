import React, { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { User } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { Button } from '@/components/ui/button';
import { Edit, Calendar, Briefcase, Clock, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, zhCN } from 'date-fns/locale';

interface ProfileHeaderProps {
  user: User;
  onAvatarUpload: (url: string) => void;
  onEditProfile: () => void;
}

export function ProfileHeader({ user, onAvatarUpload, onEditProfile }: ProfileHeaderProps) {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const { userPresence, fetchUserPresence } = useChatStore();

  useEffect(() => {
    if (user.id) {
      fetchUserPresence(user.id);
    }
  }, [user.id, fetchUserPresence]);

  const presence = userPresence[user.id];
  const status = presence?.status || user.status || 'OFFLINE';
  const lastSeen = presence?.lastSeen || user.lastSeen;

  const getStatusText = () => {
    if (status === 'ONLINE') return t('online');
    if (status === 'DND') return t('dnd');
    
    if (lastSeen) {
      const date = new Date(lastSeen);
      const timeStr = formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: locale === 'ru' ? ru : zhCN 
      });
      return t('lastSeen', { time: timeStr });
    }
    
    return t('offline');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'DND': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Mock data for display purposes
  const joinDate = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  
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
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden bg-background relative">
               <AvatarUpload 
                user={user}
                onUploadSuccess={onAvatarUpload} 
                className="h-full w-full object-cover"
                avatarClassName="w-full h-full"
              />
              <div className={cn(
                "absolute bottom-4 right-4 h-6 w-6 rounded-full border-4 border-background shadow-lg",
                getStatusColor()
              )} />
            </div>
          </div>

          {/* User Info Section */}
          <div className="flex-1 pt-2 md:pb-2 space-y-2 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                    {user.name || user.username}
                  </h1>
                  <Badge variant="outline" className="h-fit py-0.5 border-primary/20 bg-primary/5 text-primary">
                    {status === 'ONLINE' ? t('online') : status === 'DND' ? t('dnd') : t('offline')}
                  </Badge>
                </div>
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
                 <Button onClick={onEditProfile} variant="outline" className="shadow-sm gap-2">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('editProfile')}</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary/60" />
                <span className="text-xs uppercase tracking-wider font-medium opacity-70">{t('joined')}</span>
                <span className="font-semibold text-foreground/80">{joinDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary/60" />
                <span className="text-xs uppercase tracking-wider font-medium opacity-70">{t('status')}</span>
                <span className={cn(
                  "font-semibold",
                  status === 'ONLINE' ? "text-green-600 dark:text-green-400" : 
                  status === 'DND' ? "text-red-600 dark:text-red-400" : "text-foreground/80"
                )}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
