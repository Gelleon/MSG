'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Lock, Loader2 } from 'lucide-react';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/store';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getUserDisplayName } from '@/lib/utils';

interface PrivateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

interface ConnectedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function PrivateSessionModal({ isOpen, onClose, roomId }: PrivateSessionModalProps) {
  const t = useTranslations('Dialogs.privateSession');
  const { socket } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && socket) {
      setLoading(true);
      
      // Fetch initial users
      socket.emit('getRoomUsers', roomId, (response: ConnectedUser[] | { error: string }) => {
        if (!Array.isArray(response) && 'error' in response) {
          console.error('Error from getRoomUsers:', response.error);
          toast.error(t('error'), {
            description: response.error
          });
          setLoading(false);
          return;
        }
        if (!Array.isArray(response)) {
          console.error('Invalid response from getRoomUsers:', response);
          setLoading(false);
          return;
        }
        // Filter CLIENT role and current user (case-insensitive check)
        const validUsers = response.filter(u => 
          u.role && u.role.toUpperCase() !== 'CLIENT' && u.id !== currentUser?.id
        );
        setUsers(validUsers);
        setLoading(false);
      });

      // Listen for updates
      const handleUserJoined = (user: ConnectedUser) => {
        if (user.role && user.role.toUpperCase() !== 'CLIENT' && user.id !== currentUser?.id) {
          setUsers(prev => {
            if (prev.some(u => u.id === user.id)) return prev;
            return [...prev, user];
          });
        }
      };

      const handleUserLeft = ({ userId }: { userId: string }) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSelectedUsers(prev => prev.filter(id => id !== userId));
      };

      socket.on('userJoined', handleUserJoined);
      socket.on('userLeft', handleUserLeft);

      return () => {
        socket.off('userJoined', handleUserJoined);
        socket.off('userLeft', handleUserLeft);
      };
    } else if (!isOpen) {
      setUsers([]);
      setSelectedUsers([]);
    }
  }, [isOpen, roomId, socket, currentUser]);

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleStart = () => {
    if (!socket || selectedUsers.length === 0 || isSubmitting) return;

    console.log('Starting private session with:', selectedUsers);
    setIsSubmitting(true);
    
    socket.emit('startPrivateSession', { 
      userIds: selectedUsers,
      sourceRoomId: roomId 
    }, (response: any) => {
      setIsSubmitting(false);
      if (response && (response.error || response.status === 'error')) {
        console.error('Failed to start private session:', response.error || response.message);
        toast.error(t('error'), {
          description: response.error || response.message || 'Unknown error occurred'
        });
      } else {
        console.log('Private session started:', response);
        toast.success(t('success'));
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {t('modalTitle')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {t('description')}
          </p>
          
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-muted-foreground gap-2">
                 <User className="h-8 w-8 opacity-20" />
                 <p>{t('noUsers')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => toggleUser(user.id)}>
                     <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
                          <AvatarFallback>{getUserDisplayName(user)[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm leading-none">{getUserDisplayName(user)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{user.role}</p>
                        </div>
                     </div>
                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedUsers.includes(user.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {selectedUsers.includes(user.id) && <User className="w-3 h-3 text-primary-foreground" />}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-3 sm:gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleStart} 
            disabled={selectedUsers.length === 0 || isSubmitting}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            {t('start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
