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
          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 hover:bg-muted/20 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base font-medium">{t('emailNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('emailNotificationsDesc')}
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={handleUpdateNotifications}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
