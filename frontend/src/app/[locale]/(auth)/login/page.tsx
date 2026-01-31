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
      const response = await api.post('/auth/login', { email, password });
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
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-600/30 mix-blend-multiply"></div>
        
        <div className="relative z-10 flex items-center gap-3 font-bold text-2xl tracking-tight">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/10">
            <MessageSquare className="text-white fill-white/20" size={24} />
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">MSG.</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed tracking-tight text-zinc-100">
            "This platform has completely transformed how our team communicates. The real-time translation feature is a game-changer for international collaboration."
          </blockquote>
          <div className="flex items-center gap-4 pt-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 ring-2 ring-zinc-700 flex items-center justify-center font-bold text-lg shadow-lg">AS</div>
            <div>
              <div className="font-semibold text-lg">Alex Smith</div>
              <div className="text-zinc-400 text-sm font-medium">Product Manager, TechCorp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 bg-zinc-50 dark:bg-zinc-950 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px] bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tighter">{tAuth('welcomeBack')}</h1>
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
                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/30 transition-all"
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
                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/30 transition-all"
              />
            </div>
            
            {error && (
              <div className="p-3 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center justify-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/25 transition-all duration-300" disabled={isLoading}>
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
