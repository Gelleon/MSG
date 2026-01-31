'use client';

import { useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/lib/store';

import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
         <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse">
            <Loader2 className="text-white animate-spin" size={32} />
         </div>
         <p className="text-muted-foreground font-medium animate-pulse">Loading MSG...</p>
      </div>
    </div>
  );
}
