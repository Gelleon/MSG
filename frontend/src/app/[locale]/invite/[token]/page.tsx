'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from '@/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'valid' | 'error' | 'success'>('loading');
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  
  const t = useTranslations('Invite');
  const tCommon = useTranslations('Common');
  const tAuth = useTranslations('Auth');

  useEffect(() => {
    if (!isAuthenticated()) {
        return;
    }

    api.get(`/invitations/${token}`)
      .then(res => {
          setInviteInfo(res.data);
          setStatus('valid');
      })
      .catch(err => {
          console.error(err);
          setStatus('error');
      });
  }, [token, isAuthenticated]);

  const handleAccept = async () => {
      try {
          await api.post('/invitations/accept', { token });
          toast.success(t('success'));
          router.push('/dashboard');
      } catch (err) {
          toast.error(t('failed'));
      }
  };

  if (!isAuthenticated()) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
              <Card className="w-full max-w-md">
                  <CardHeader>
                      <CardTitle>{t('authRequired')}</CardTitle>
                      <CardDescription>{t('authDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button className="w-full" onClick={() => router.push(`/register?callbackUrl=/invite/${token}`)}>
                          {tAuth('createAccountAction')}
                      </Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{tCommon('invite')}</CardTitle>
          <CardDescription>
            {status === 'loading' && t('verifying')}
            {status === 'error' && t('invalid')}
            {status === 'valid' && t('invitedTo', { roomName: inviteInfo?.room?.name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {status === 'valid' && (
               <div className="space-y-4">
                   <p className="text-sm text-muted-foreground">
                       {t('invitedBy', { userName: inviteInfo?.creator?.name })}
                   </p>
                   <div className="grid grid-cols-2 gap-2">
                       <Button className="w-full" onClick={handleAccept}>{t('acceptJoin')}</Button>
                       <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>{tCommon('cancel')}</Button>
                   </div>
               </div>
           )}
           {status === 'error' && (
               <Button className="w-full" onClick={() => router.push('/dashboard')}>{t('goToDashboard')}</Button>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
