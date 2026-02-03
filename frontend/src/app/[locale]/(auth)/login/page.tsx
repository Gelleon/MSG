'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, Link } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const tAuth = useTranslations('Auth');
  const tCommon = useTranslations('Common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      login(response.data.access_token);
      router.push(callbackUrl);
    } catch (err: any) {
      setError(tAuth('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-muted p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/90 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex items-center gap-3 font-bold text-2xl tracking-tight">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner ring-1 ring-white/20">
            <MessageSquare className="text-white" size={24} />
          </div>
          <span className="text-white font-bold tracking-wide">MSG.</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed tracking-tight text-white/90">
            "This platform has completely transformed how our team communicates. The real-time translation feature is a game-changer for international collaboration."
          </blockquote>
          <div className="flex items-center gap-4 pt-4">
            <div className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-bold text-lg text-white shadow-lg backdrop-blur-sm">AS</div>
            <div>
              <div className="font-semibold text-lg text-white">Alex Smith</div>
              <div className="text-white/70 text-sm font-medium">Product Manager, TechCorp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 bg-background relative">
        <div className="absolute top-6 right-6 z-20">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-foreground">{tAuth('welcomeBack')}</h1>
            <p className="text-sm text-muted-foreground">
              {tAuth('enterCredentials')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">{tAuth('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">{tAuth('password')}</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {tAuth('forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
              />
            </div>
            
            {error && (
              <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all duration-300" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {tAuth('loggingIn')}
                </>
              ) : (
                <>
                  {tAuth('login')} <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {tAuth('noAccount')}{" "}
            <Link 
              href="/register" 
              className="underline underline-offset-4 hover:text-primary font-medium transition-colors"
            >
              {tAuth('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
