import React from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Settings } from 'lucide-react';
import { GeneralSettings } from './GeneralSettings';
import { NotificationSettings } from './NotificationSettings';
import { PreferenceSettings } from './PreferenceSettings';
import { User as UserType } from '@/lib/store';

interface ProfileEditModalProps {
  user: UserType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateUser: (updates: Partial<UserType>) => void;
}

export function ProfileEditModal({ user, isOpen, onOpenChange, onUpdateUser }: ProfileEditModalProps) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editProfile')}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('general')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t('notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{tCommon('language')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-0">
            <GeneralSettings user={user} onUpdate={onUpdateUser} />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <NotificationSettings user={user} onUpdate={onUpdateUser} />
          </TabsContent>
          
          <TabsContent value="preferences" className="mt-0">
            <PreferenceSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
