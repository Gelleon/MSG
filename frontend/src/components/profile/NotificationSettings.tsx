'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Bell, Mail } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { User } from '@/lib/store';

interface NotificationSettingsProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function NotificationSettings({ user, onUpdate }: NotificationSettingsProps) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  
  // Initialize state from user props safely
  const [emailNotifications, setEmailNotifications] = useState(
    user.emailNotificationsEnabled ?? true
  );

  const handleUpdateNotifications = async (enabled: boolean) => {
    setEmailNotifications(enabled);
    
    try {
      const response = await api.patch(`/users/${user.id}`, {
        emailNotificationsEnabled: enabled,
      });
      
      onUpdate(response.data);
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Failed to update notifications:', error);
      // Revert on error
      setEmailNotifications(!enabled);
      toast.error(tCommon('error'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {t('notifications')}
        </CardTitle>
        <CardDescription>
          {t('notificationsSettings')}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 hover:bg-muted/20 transition-colors profile-card-content">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-sm sm:text-base font-medium block">{t('emailNotifications')}</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('emailNotificationsDesc')}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 ml-12 sm:ml-0 profile-switch-container">
              <Switch
                checked={emailNotifications}
                onCheckedChange={handleUpdateNotifications}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
