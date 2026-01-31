'use client';

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from '@/components/LanguageSwitcher';
import api from '@/lib/api';

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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md mx-auto shadow-2xl border-primary/10 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">{tAuth('forgotPasswordTitle')}</CardTitle>
          <CardDescription>
            {tAuth('forgotPasswordDesc')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isSent ? (
              <div className="space-y-2">
                <Label htmlFor="email">{tAuth('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/50"
                />
              </div>
            ) : (
              <div className="text-center p-4 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                {tAuth('resetLinkSent')}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!isSent && (
              <Button type="submit" className="w-full font-semibold" disabled={isLoading} size="lg">
                {isLoading ? tCommon('loading') : tAuth('sendResetLink')}
              </Button>
            )}
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
                {tAuth('backToLogin')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
