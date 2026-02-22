'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { toast } from 'sonner';
import { Loader2, Mail, User, Bell, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }).max(30, {
    message: "Username must not be longer than 30 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Initialize form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  // Initialize state from user
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
      });
      
      // user object might not have emailNotificationsEnabled yet if it's not updated in store type
      // We assume it's there or we fetch it
      if ('emailNotificationsEnabled' in user) {
        setEmailNotifications((user as any).emailNotificationsEnabled);
      }
    }
  }, [user, form]);

  // Handle tab from URL
  const defaultTab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'general';

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await api.patch(`/users/${user.id}`, {
        name: data.name,
      });
      
      updateUser(response.data);
      toast.success(t('saveSuccess'));
      
      // Auto-navigation after save
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;
    
    try {
        const response = await api.patch(`/users/${user.id}`, {
            avatarUrl: url
        });
        updateUser(response.data);
    } catch (error) {
        console.error('Failed to update avatar url in profile', error);
    }
  };

  const handleUpdateNotifications = async (enabled: boolean) => {
    if (!user) return;
    
    setEmailNotifications(enabled);
    
    try {
      const response = await api.patch(`/users/${user.id}`, {
        emailNotificationsEnabled: enabled,
      });
      
      updateUser(response.data);
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Failed to update notifications:', error);
      // Revert on error
      setEmailNotifications(!enabled);
      toast.error(tCommon('error'));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground">
                    {tCommon('settings')}
                </p>
            </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('general')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('notifications')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('general')}</CardTitle>
              <CardDescription>
                {t('settings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-start sm:space-x-8">
                <AvatarUpload 
                    user={{ name: user.name, avatarUrl: (user as any).avatarUrl }} 
                    onUploadSuccess={handleAvatarUpload}
                />
                <div className="flex-1 w-full space-y-4 mt-6 sm:mt-0">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{tCommon('email')}</Label>
                        <Input id="email" value={user.email} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">
                        Email cannot be changed.
                        </p>
                    </div>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{tCommon('username')}</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid gap-2 pt-2">
                            <Label>{t('language')}</Label>
                            <LanguageSwitcher />
                            <p className="text-xs text-muted-foreground">
                                {t('languageDesc')}
                            </p>
                        </div>

                        {/* Moved submit button here or keep in footer? 
                            Keeping in footer requires form context or external submit trigger.
                            To keep layout consistent with CardFooter, I'll use a hidden submit button or ref.
                            Actually, simpler to put the button in the form or handle footer click to submit form.
                        */}
                      </form>
                    </Form>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                {tCommon('cancel')}
              </Button>
              {/* Trigger form submission from outside */}
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon('save')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications')}</CardTitle>
              <CardDescription>
                {t('notificationsSettings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <Mail className="h-6 w-6 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('emailNotifications')}</Label>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
