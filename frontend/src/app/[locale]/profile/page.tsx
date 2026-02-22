'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import './profile.css';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { ProfileSkills } from '@/components/profile/ProfileSkills';
import { ProfileProjects } from '@/components/profile/ProfileProjects';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const { user, updateUser } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      // This is mainly handled by the components inside the modal, 
      // but we can pass this down if needed for optimistic updates or callback
      updateUser(updates);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        
        {/* Header Section */}
        <ProfileHeader 
            user={user} 
            onAvatarUpload={handleAvatarUpload} 
            onEditProfile={() => setIsEditModalOpen(true)}
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Info & Skills */}
            <div className="lg:col-span-4 space-y-6">
                <div className="h-full">
                    <ProfileInfo user={user} />
                </div>
                <div className="h-full">
                     <ProfileSkills />
                </div>
            </div>

            {/* Right Column: Stats & Projects */}
            <div className="lg:col-span-8 space-y-6">
                 {/* Stats Row */}
                <div>
                    <ProfileStats />
                </div>

                {/* Projects Row */}
                <div className="h-full">
                    <ProfileProjects />
                </div>
            </div>
        </div>

        {/* Edit Modal */}
        <ProfileEditModal 
            user={user} 
            isOpen={isEditModalOpen} 
            onOpenChange={setIsEditModalOpen}
            onUpdateUser={handleUpdateUser}
        />
      </div>
    </div>
  );
}
