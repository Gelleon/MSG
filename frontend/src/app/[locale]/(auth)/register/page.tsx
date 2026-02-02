'use client';

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Hero Content */}
        <div className="hidden lg:flex flex-col space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              MSG
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              {tAuth('joinThousands')}
            </p>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center gap-4 bg-card/50 p-4 rounded-xl border backdrop-blur-sm">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">{tAuth('joinDesc')}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <Card className="w-full max-w-md mx-auto shadow-2xl border-primary/10 backdrop-blur-sm bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">{tAuth('createAccountAction')}</CardTitle>
            <CardDescription>
              {tAuth('enterInfo')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{tAuth('fullName')}</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-secondary/50"
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
                  className="bg-secondary/50"
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
                  className="bg-secondary/50"
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
              </div>
              <p className="text-xs text-muted-foreground px-1">
                {tAuth('passwordMinLength')}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full font-semibold" disabled={isLoading} size="lg">
                {isLoading ? tCommon('loading') : tAuth('createAccountAction')}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {tAuth('alreadyHaveAccount')}{" "}
                <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
                  {tAuth('signIn')}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
