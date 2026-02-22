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
  const { connect, disconnect, currentRoomId } = useChatStore();
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
      <PrivateChatNotifier />
      
      {/* Mobile Header - Visible only on mobile and when no room is selected */}
      <header className={`md:hidden h-14 border-b flex items-center justify-between px-4 shrink-0 bg-sidebar/95 backdrop-blur z-50 ${currentRoomId ? 'hidden' : ''}`}>
         <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 h-11 w-11">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[320px]">
                <Sidebar className="w-full border-r-0" />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-lg text-primary">MSG.</span>
         </div>
      </header>
     
     {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex h-full w-[320px] shrink-0">
            <Sidebar className="w-full h-full border-r" />
        </div>
        <main className="flex-1 flex flex-col h-full min-w-0 bg-background relative">
          {children}
        </main>
      </div>
    </div>
  );
}
