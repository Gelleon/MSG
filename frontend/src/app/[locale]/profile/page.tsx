'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { useRouter } from '@/navigation';
import { Loader2, Home, User, Settings, LogOut, Menu } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import './profile.css';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Since we only have one main view now, we don't strictly need tabs, 
  // but we keep the structure for future extensibility or if we want to add more views.
  const [activeTab, setActiveTab] = useState('profile');

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

  const handleUpdateUser = (updates: any) => {
      updateUser(updates);
  };
  
  const handleLogout = () => {
      logout();
      router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const NavContent = () => (
      <nav className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 font-medium" 
            onClick={() => router.push('/dashboard')}
          >
              <Home className="w-5 h-5" />
              {tCommon('dashboard')}
          </Button>
          <Button 
            variant={activeTab === 'profile' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-medium"
            onClick={() => setActiveTab('profile')}
          >
              <User className="w-5 h-5" />
              {t('title')}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 font-medium"
            onClick={() => setIsEditModalOpen(true)}
          >
              <Settings className="w-5 h-5" />
              {tCommon('settings')}
          </Button>
          <div className="pt-4 mt-4 border-t">
            <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
                onClick={handleLogout}
            >
                <LogOut className="w-5 h-5" />
                {tCommon('logout')}
            </Button>
          </div>
      </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-sm p-6 space-y-8 h-screen sticky top-0">
          <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {user.name?.[0] || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                  <span className="font-bold truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
          </div>
          <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {user.name?.[0] || 'U'}
              </div>
              <span className="font-bold text-lg">{t('title')}</span>
          </div>
          <Sheet>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <Menu className="w-5 h-5" />
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                  <div className="p-6 space-y-8">
                       <div className="flex items-center gap-3 px-2">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                              {user.name?.[0] || 'U'}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                              <span className="font-bold truncate">{user.name}</span>
                              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                          </div>
                      </div>
                      <NavContent />
                  </div>
              </SheetContent>
          </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20 md:pb-0">
            {activeTab === 'profile' && (
                <>
                    <ProfileHeader 
                        user={user} 
                        onAvatarUpload={handleAvatarUpload} 
                        onEditProfile={() => setIsEditModalOpen(true)}
                    />
                    
                    <div className="grid gap-6">
                        <ProfileInfo user={user} />
                    </div>
                </>
            )}
        </div>

        <ProfileEditModal 
            user={user} 
            isOpen={isEditModalOpen} 
            onOpenChange={setIsEditModalOpen}
            onUpdateUser={handleUpdateUser}
        />
      </main>
      
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t flex justify-around p-2 z-50 safe-area-bottom">
          <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto py-2 rounded-xl" onClick={() => router.push('/dashboard')}>
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tCommon('dashboard')}</span>
          </Button>
          <Button variant={activeTab === 'profile' ? 'secondary' : 'ghost'} size="icon" className="flex flex-col gap-1 h-auto py-2 rounded-xl" onClick={() => setActiveTab('profile')}>
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t('title')}</span>
          </Button>
           <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto py-2 rounded-xl" onClick={() => setIsEditModalOpen(true)}>
              <Settings className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tCommon('settings')}</span>
          </Button>
      </nav>
    </div>
  );
}
