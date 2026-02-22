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
import './profile.css';

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
    <div className="container max-w-7xl py-6 lg:py-8 space-y-6 lg:space-y-8 px-4 sm:px-6 profile-container">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-sm lg:text-base">
                {tCommon('settings')}
            </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
        <aside className="lg:w-80 w-full flex-shrink-0 space-y-4 lg:space-y-6 profile-sidebar-sticky profile-sidebar">
            <UserProfileCard user={user} onAvatarUpload={handleAvatarUpload} />

            <TabsList className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible h-auto w-full justify-start gap-1 bg-muted/50 p-1 rounded-lg lg:bg-transparent lg:p-0 scrollbar-none profile-tabs-list">
                <TabsTrigger 
                    value="general" 
                    className="flex-shrink-0 flex-1 lg:flex-none w-auto lg:w-full justify-center lg:justify-start px-2 py-2 lg:px-4 lg:py-2.5 h-auto text-xs sm:text-sm lg:text-sm data-[state=active]:bg-background lg:data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm lg:data-[state=active]:shadow-none data-[state=active]:text-foreground lg:data-[state=active]:text-primary font-medium transition-all hover:bg-muted whitespace-nowrap rounded-md lg:rounded-none lg:border-l-2 lg:border-transparent lg:data-[state=active]:border-primary profile-tab-trigger"
                >
                    <User className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden sm:inline lg:inline">{t('general')}</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="notifications" 
                    className="flex-shrink-0 flex-1 lg:flex-none w-auto lg:w-full justify-center lg:justify-start px-2 py-2 lg:px-4 lg:py-2.5 h-auto text-xs sm:text-sm lg:text-sm data-[state=active]:bg-background lg:data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm lg:data-[state=active]:shadow-none data-[state=active]:text-foreground lg:data-[state=active]:text-primary font-medium transition-all hover:bg-muted whitespace-nowrap rounded-md lg:rounded-none lg:border-l-2 lg:border-transparent lg:data-[state=active]:border-primary profile-tab-trigger"
                >
                    <Bell className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden sm:inline lg:inline">{t('notifications')}</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="preferences" 
                    className="flex-shrink-0 flex-1 lg:flex-none w-auto lg:w-full justify-center lg:justify-start px-2 py-2 lg:px-4 lg:py-2.5 h-auto text-xs sm:text-sm lg:text-sm data-[state=active]:bg-background lg:data-[state=active]:bg-primary/10 data-[state=active]:shadow-sm lg:data-[state=active]:shadow-none data-[state=active]:text-foreground lg:data-[state=active]:text-primary font-medium transition-all hover:bg-muted whitespace-nowrap rounded-md lg:rounded-none lg:border-l-2 lg:border-transparent lg:data-[state=active]:border-primary profile-tab-trigger"
                >
                    <Settings className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden sm:inline lg:inline">{tCommon('language')}</span>
                </TabsTrigger>
                
                 <div className="hidden lg:block pt-4 mt-4 border-t w-full flex-shrink-0">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-4 py-2.5 h-auto whitespace-nowrap profile-button"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        {tCommon('logout')}
                    </Button>
                </div>
            </TabsList>

            <div className="lg:hidden w-full">
                <Button 
                    variant="outline" 
                    className="w-full justify-center text-destructive hover:text-destructive hover:bg-destructive/10 profile-button"
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
