'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Bell, Settings, LogOut } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { GeneralSettings } from '@/components/profile/GeneralSettings';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { PreferenceSettings } from '@/components/profile/PreferenceSettings';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Handle tab from URL
  const defaultTab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'general';

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;
    
    try {
        const response = await api.patch(`/users/${user.id}`, {
            avatarUrl: url
        });
        updateUser(response.data);
        toast.success(t('saveSuccess'));
    } catch (error) {
        console.error('Failed to update avatar url in profile', error);
        toast.error(tCommon('error'));
    }
  };

  const handleLogout = () => {
      logout();
      router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">
                {tCommon('settings')}
            </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="flex flex-col md:flex-row gap-8 w-full">
        <aside className="md:w-1/4 w-full flex-shrink-0 space-y-6 md:sticky md:top-20 self-start">
            <UserProfileCard user={user} onAvatarUpload={handleAvatarUpload} />

            <TabsList className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible h-auto w-full justify-start gap-1 bg-muted/50 p-1 rounded-lg md:bg-transparent md:p-0 scrollbar-none">
                <TabsTrigger 
                    value="general" 
                    className="flex-shrink-0 flex-1 md:flex-none w-auto md:w-full justify-center md:justify-start px-4 py-2.5 h-auto data-[state=active]:bg-background md:data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm md:data-[state=active]:shadow-none data-[state=active]:text-foreground md:data-[state=active]:text-primary font-medium transition-all hover:bg-muted whitespace-nowrap rounded-md md:rounded-none md:border-l-2 md:border-transparent md:data-[state=active]:border-primary"
                >
                    <User className="mr-2 md:mr-3 h-4 w-4" />
                    {t('general')}
                </TabsTrigger>
                <TabsTrigger 
                    value="notifications" 
                    className="flex-shrink-0 flex-1 md:flex-none w-auto md:w-full justify-center md:justify-start px-4 py-2.5 h-auto data-[state=active]:bg-background md:data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm md:data-[state=active]:shadow-none data-[state=active]:text-foreground md:data-[state=active]:text-primary font-medium transition-all hover:bg-muted whitespace-nowrap rounded-md md:rounded-none md:border-l-2 md:border-transparent md:data-[state=active]:border-primary"
                >
                    <Bell className="mr-2 md:mr-3 h-4 w-4" />
                    {t('notifications')}
                </TabsTrigger>
                <TabsTrigger 
                    value="preferences" 
                    className="flex-shrink-0 flex-1 md:flex-none w-auto md:w-full justify-center md:justify-start px-4 py-2.5 h-auto data-[state=active]:bg-background md:data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm md:data-[state=active]:shadow-none data-[state=active]:text-foreground md:data-[state=active]:text-primary font-medium transition-all hover:bg-muted whitespace-nowrap rounded-md md:rounded-none md:border-l-2 md:border-transparent md:data-[state=active]:border-primary"
                >
                    <Settings className="mr-2 md:mr-3 h-4 w-4" />
                    {tCommon('language')}
                </TabsTrigger>
                
                 <div className="hidden md:block pt-4 mt-4 border-t w-full flex-shrink-0">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-4 py-2.5 h-auto whitespace-nowrap"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        {tCommon('logout')}
                    </Button>
                </div>
            </TabsList>

            <div className="md:hidden w-full">
                <Button 
                    variant="outline" 
                    className="w-full justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {tCommon('logout')}
                </Button>
            </div>
        </aside>
        
        <div className="flex-1 space-y-6">
            <TabsContent value="general" className="mt-0 space-y-6">
                <GeneralSettings user={user} onUpdate={updateUser} />
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-0 space-y-6">
                <NotificationSettings user={user} onUpdate={updateUser} />
            </TabsContent>

             <TabsContent value="preferences" className="mt-0 space-y-6">
                <PreferenceSettings />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
