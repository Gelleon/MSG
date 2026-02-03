
import { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/store';
import { cn, stringToColor } from '@/lib/utils';
import { RotateCw, Lock, MoreVertical, Search, Phone, Video, Languages, UserPlus, Hash, Shield, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PrivateSessionModal from './PrivateSessionModal';
import InviteModal from './InviteModal';
import { Separator } from '@/components/ui/separator';
import { useRouter, usePathname } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatHeader() {
  const { rooms, currentRoomId, socket } = useChatStore();
  const { user } = useAuthStore();
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);
  
  const locale = useLocale();
  const tChat = useTranslations('Chat');
  const tDialogs = useTranslations('Dialogs');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (nextLocale: string) => {
    router.replace(pathname, {locale: nextLocale});
  };
  
  const currentRoom = rooms.find((r) => r.id === currentRoomId);

  useEffect(() => {
    if (!socket) return;

    const handleClosed = ({ roomId }: { roomId: string }) => {
      if (currentRoomId === roomId) {
         toast.info(tChat('sessionEnded'));
         router.push('/dashboard'); 
      }
    };

    socket.on('privateSessionClosed', handleClosed);
    return () => {
      socket.off('privateSessionClosed', handleClosed);
    };
  }, [socket, currentRoomId, router]);

  if (!currentRoom) return null;

  const isPrivate = currentRoom.isPrivate;

  // Roles allowed to start private session
  const canStartPrivate = !isPrivate && user?.role && ['OWNER', 'ADMIN', 'MANAGER'].includes(user.role.toUpperCase());
  // Roles allowed to invite
  const canInvite = user?.role && ['OWNER', 'ADMIN', 'MANAGER'].includes(user.role.toUpperCase());

  const canCloseSession = isPrivate && user?.role && ['ADMIN', 'MANAGER'].includes(user.role.toUpperCase());

  const handleCloseSession = () => {
    if (!socket || !currentRoom) return;
    socket.emit('closePrivateSession', { roomId: currentRoom.id });
    setIsCloseAlertOpen(false);
  };

  return (
    <>
      <div className={cn("h-[72px] flex items-center justify-between px-6 backdrop-blur sticky top-0 z-20 w-full shadow-sm transition-colors duration-300", 
        isPrivate 
        ? "bg-secondary/40 supports-[backdrop-filter]:bg-secondary/20 border-b border-border/50" 
        : "bg-background/95 supports-[backdrop-filter]:bg-background/60"
      )}>
        <div className="flex items-center gap-3">
           <Avatar className={cn("h-10 w-10 border shadow-sm cursor-pointer hover:opacity-90 transition-opacity", isPrivate ? "border-primary/20" : "border-border/50")}>
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentRoom.id}`} />
              <AvatarFallback 
                style={{ backgroundColor: isPrivate ? undefined : stringToColor(currentRoom.name, 70, 95), color: isPrivate ? undefined : stringToColor(currentRoom.name, 80, 40) }}
                className={cn("font-bold text-xs", isPrivate ? "bg-secondary text-secondary-foreground" : "")}>
                  {isPrivate ? <Lock className="w-4 h-4" /> : currentRoom.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
           </Avatar>
           <div className="flex flex-col justify-center cursor-pointer group">
              <div className="flex items-center gap-2">
                {isPrivate ? <Shield className="w-3.5 h-3.5 text-primary" /> : <Hash className="w-3.5 h-3.5 text-muted-foreground/70" />}
                <h2 className="text-[17px] font-bold text-foreground leading-none tracking-tight group-hover:underline decoration-2 decoration-primary/30 underline-offset-4">{currentRoom.name}</h2>
              </div>
              <span className="text-[13px] text-muted-foreground mt-1 flex items-center gap-1.5 truncate max-w-[300px]">
                {currentRoom.description || (isPrivate ? tChat('encrypted') : tChat('publicChannel'))}
              </span>
           </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
           <LanguageSwitcher />

           {canCloseSession && (
             <Button 
                variant="destructive" 
                size="sm"
                className="h-8 rounded-full px-4 text-xs font-semibold shadow-sm mr-2 hidden sm:flex animate-in fade-in zoom-in-95"
                onClick={() => setIsCloseAlertOpen(true)}
                title={tChat('endSession')}
             >
                <XCircle className="w-3 h-3 mr-1.5" />
                {tChat('endSession')}
             </Button>
           )}

           {canInvite && (
             <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsInviteModalOpen(true)}
                title={tChat('inviteToRoom')}
             >
                <UserPlus className="w-4 h-4" />
             </Button>
           )}
           {canStartPrivate && (
             <Button 
                variant="default" 
                size="sm"
                className="h-8 rounded-full px-4 text-xs font-semibold shadow-sm mr-2 hidden sm:flex"
                onClick={() => setIsPrivateModalOpen(true)}
                title={tChat('privateSession')}
             >
                <Lock className="w-3 h-3 mr-1.5" />
                {tChat('privateSession')}
             </Button>
           )}
        </div>
      </div>
      
      <PrivateSessionModal 
        isOpen={isPrivateModalOpen} 
        onClose={() => setIsPrivateModalOpen(false)} 
        roomId={currentRoom.id}
      />
      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        roomId={currentRoom.id}
      />
      
      <Dialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <DialogContent className="sm:max-w-md border-destructive/20 shadow-lg shadow-destructive/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold text-xl">
              <AlertTriangle className="h-6 w-6" />
              {tDialogs('endSession.title')}
            </DialogTitle>
            <DialogDescription asChild className="py-4 text-foreground/80 leading-relaxed">
              <div>
                {tDialogs('endSession.description')} <br />
                <span className="font-semibold text-destructive mt-2 block">{tDialogs('endSession.warning')}</span>
                <ul className="list-disc pl-5 mt-3 space-y-1.5 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                  <li>{tDialogs('endSession.point1')}</li>
                  <li>{tDialogs('endSession.point2')}</li>
                  <li>{tDialogs('endSession.point3')}</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCloseAlertOpen(false)} className="font-medium">
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleCloseSession} className="font-bold shadow-md hover:shadow-lg transition-all">
              <XCircle className="w-4 h-4 mr-2" />
              {tDialogs('endSession.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
