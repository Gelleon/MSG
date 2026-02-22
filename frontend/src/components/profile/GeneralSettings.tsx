'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import api from '@/lib/api';
import { User as UserType } from '@/lib/store';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }).max(30, {
    message: "Username must not be longer than 30 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface GeneralSettingsProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
}

export function GeneralSettings({ user, onUpdate }: GeneralSettingsProps) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.patch(`/users/${user.id}`, {
        name: data.name,
      });
      
      onUpdate(response.data);
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {t('general')}
        </CardTitle>
        <CardDescription>
          {t('settings')}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 lg:gap-6 lg:grid-cols-2 profile-form-grid">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lg:text-base">{tCommon('username')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} className="text-sm lg:text-base" />
                    </FormControl>
                    <FormDescription className="text-xs lg:text-sm">
                      {t('usernameDesc') || 'This is your public display name.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm lg:text-base">{tCommon('email')}</Label>
                <Input id="email" value={user.email} disabled className="bg-muted/50 text-sm lg:text-base break-all" />
                <p className="text-xs lg:text-sm text-muted-foreground">
                  {t('emailDesc') || 'Email cannot be changed.'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading} size="sm" className="lg:text-sm profile-button">
                {isLoading && <Loader2 className="mr-2 h-3 w-3 lg:h-4 lg:w-4 animate-spin" />}
                {tCommon('save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
