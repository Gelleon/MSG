'use client';

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from '@/components/LanguageSwitcher';
import api from '@/lib/api';
import { MessageSquare, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const tAuth = useTranslations('Auth');
  const tCommon = useTranslations('Common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSent(true);
      toast.success(tAuth('resetLinkSent'));
    } catch (error: any) {
      console.error('Forgot password error:', error);
      // Detailed error handling as requested
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 404) {
             toast.error("Endpoint not found (404). Please contact support.");
        } else if (error.response.status === 400) {
             toast.error(error.response.data.message || "Bad request. Please check your email.");
        } else {
             toast.error(error.response.data.message || tAuth('error'));
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-muted p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/90 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex items-center gap-3 font-bold text-2xl tracking-tight">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner ring-1 ring-white/20">
            <MessageSquare className="text-white" size={24} />
          </div>
          <span className="text-white font-bold tracking-wide">MSG.</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed tracking-tight text-white/90">
            "Secure and reliable communication for your enterprise. We prioritize your privacy and data security."
          </blockquote>
          <div className="flex items-center gap-4 pt-4">
             <div className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-bold text-lg text-white shadow-lg backdrop-blur-sm">MS</div>
             <div>
               <div className="font-semibold text-lg text-white">Michael Scott</div>
               <div className="text-white/70 text-sm font-medium">Security Officer, DataSafe</div>
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
            <h1 className="text-3xl font-bold tracking-tighter text-foreground">{tAuth('forgotPasswordTitle')}</h1>
            <p className="text-sm text-muted-foreground">
              {tAuth('forgotPasswordDesc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isSent ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-600 dark:text-green-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-medium text-center">{tAuth('resetLinkSent')}</p>
              </div>
            )}
            
            {!isSent && (
              <Button type="submit" className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all duration-300" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {tCommon('loading')}
                  </>
                ) : (
                  <>
                    {tAuth('sendResetLink')} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium transition-colors">
              {tAuth('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
