'use client';

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LanguageSwitcher from '@/components/LanguageSwitcher';
import api from '@/lib/api';
import { MessageSquare, ArrowRight, Loader2 } from 'lucide-react';

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
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">{tAuth('resetPasswordTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {tAuth('resetPasswordDesc')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
            <Label htmlFor="password">{tAuth('newPassword')}</Label>
            <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
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
            className="h-12 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
            />
        </div>
        <p className="text-xs text-muted-foreground px-1">
            {tAuth('passwordMinLength')}
        </p>
        
        <Button type="submit" className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all duration-300" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {tCommon('loading')}
            </>
          ) : (
            <>
              {tCommon('save')} <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium transition-colors">
          {tAuth('backToLogin')}
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
          {/* Left Panel - Branding */}
          <div className="hidden lg:flex flex-col justify-between bg-muted p-10 text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/90 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            
            <div className="relative z-10 flex items-center gap-3 font-bold text-2xl tracking-tight">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner ring-1 ring-white/20">
                <MessageSquare className="text-white" size={24} />
              </div>
              <span className="text-white font-bold tracking-wide">MSG.</span>
            </div>

            <div className="relative z-10 max-w-lg space-y-6">
              <blockquote className="text-2xl font-medium leading-relaxed tracking-tight text-white/90">
                "We protect your data with industry-standard encryption. Your privacy is our priority."
              </blockquote>
              <div className="flex items-center gap-4 pt-4">
                 <div className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-bold text-lg text-white shadow-lg backdrop-blur-sm">SP</div>
                 <div>
                   <div className="font-semibold text-lg text-white">Sarah Parker</div>
                   <div className="text-white/70 text-sm font-medium">CTO, SecureNet</div>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="flex items-center justify-center p-8 lg:p-12 bg-background relative">
            <div className="absolute top-6 right-6 z-20">
              <LanguageSwitcher />
            </div>
            <Suspense fallback={<div>Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
    );
}
