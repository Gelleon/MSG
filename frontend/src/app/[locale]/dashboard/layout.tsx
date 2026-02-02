'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';
import Sidebar from '@/components/chat/Sidebar';
import { PrivateChatNotifier } from '@/components/chat/PrivateChatNotifier';
import { Menu, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const { connect, disconnect } = useChatStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated()) {
      router.push('/login');
    } else {
        connect();
    }
    
    return () => {
        disconnect();
    }
  }, [isAuthenticated, router, connect, disconnect, isMounted]);

  if (!isMounted || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden font-sans">
      {/* Global Header */}
      <PrivateChatNotifier />
      <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 shrink-0 bg-background/95 backdrop-blur z-50">
         <div className="flex items-center gap-4 md:gap-10">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[320px] sm:w-[350px]">
                <Sidebar className="w-full border-r-0" />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                    <MessageSquare className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-primary font-bold text-lg tracking-wide hidden sm:block">MSG APP</h1>
            </div>
         </div>
      </header>
     
     {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex h-full">
            <Sidebar />
        </div>
        <main className="flex-1 flex flex-col h-full min-w-0 bg-background/50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
