'use client';

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { MessageSquare, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const router = useRouter();
  const tAuth = useTranslations('Auth');
  const tCommon = useTranslations('Common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error(tAuth('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }
    
    if (password.length < 8) {
        toast.error(tAuth('passwordMinLength'));
        setIsLoading(false);
        return;
    }

    try {
      await register(username, email.trim(), password, fullName);
      toast.success(tAuth('registrationSuccess'));
      router.push("/login");
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || tAuth('registrationFailed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-muted p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/90 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex items-center gap-3 font-bold text-2xl tracking-tight">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner ring-1 ring-white/20">
            <MessageSquare className="text-white" size={24} />
          </div>
          <span className="text-white font-bold tracking-wide">MSG.</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed tracking-tight text-white/90">
            "Join thousands of teams that use MSG to collaborate seamlessly across borders and languages."
          </blockquote>
          <div className="flex items-center gap-4 pt-4">
             <div className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-bold text-lg text-white shadow-lg backdrop-blur-sm">JD</div>
             <div>
               <div className="font-semibold text-lg text-white">Jane Doe</div>
               <div className="text-white/70 text-sm font-medium">Engineering Lead, GlobalSys</div>
             </div>
           </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 bg-background relative overflow-y-auto">
        <div className="absolute top-6 right-6 z-20">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[450px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-foreground">{tAuth('createAccountAction')}</h1>
            <p className="text-sm text-muted-foreground">
              {tAuth('enterInfo')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{tAuth('fullName')}</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{tCommon('username')}</Label>
              <Input
                id="username"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="password">{tCommon('password')}</Label>
                  <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
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
                  className="h-11 bg-secondary/30 border-input focus-visible:ring-primary/30 transition-all"
                  />
              </div>
            </div>
            <p className="text-xs text-muted-foreground px-1">
              {tAuth('passwordMinLength')}
            </p>
            
            <Button type="submit" className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all duration-300 mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <>
                  {tAuth('createAccountAction')} <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {tAuth('alreadyHaveAccount')}{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium transition-colors">
              {tAuth('signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
