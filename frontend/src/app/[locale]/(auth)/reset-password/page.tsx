'use client';

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LanguageSwitcher from '@/components/LanguageSwitcher';
import api from '@/lib/api';

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const tAuth = useTranslations('Auth');
  const tCommon = useTranslations('Common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        toast.error('Missing reset token');
        return;
    }
    
    if (password !== confirmPassword) {
      toast.error(tAuth('passwordsDoNotMatch'));
      return;
    }
    
    if (password.length < 8) {
        toast.error(tAuth('passwordMinLength'));
        return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success(tAuth('resetSuccess'));
      router.push("/login");
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset password. Token may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md mx-auto shadow-2xl border-primary/10 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">{tAuth('resetPasswordTitle')}</CardTitle>
          <CardDescription>
            {tAuth('resetPasswordDesc')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="password">{tAuth('newPassword')}</Label>
                <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary/50"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">{tAuth('passwordConfirm')}</Label>
                <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-secondary/50"
                />
            </div>
            <p className="text-xs text-muted-foreground px-1">
                {tAuth('passwordMinLength')}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-semibold" disabled={isLoading} size="lg">
              {isLoading ? tCommon('loading') : tCommon('save')}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
                {tAuth('backToLogin')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
  );
}

export default function ResetPasswordPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
    );
}
