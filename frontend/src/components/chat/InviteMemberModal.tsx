import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { adminService, User } from '@/lib/admin-service';
import api from '@/lib/api';
import { Loader2, Search, Check, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import { useTranslations } from 'next-intl';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export default function InviteMemberModal({ isOpen, onClose, roomId }: InviteMemberModalProps) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  
  const t = useTranslations('Dialogs.invite');
  const tCommon = useTranslations('Common');
  const tRoomMembers = useTranslations('RoomMembers');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users with search query
      // Using a larger limit to show more potential candidates
      const res = await adminService.getUsers({
        page: 1,
        limit: 50,
        search
      });
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      toast.error(t('fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    setInviting(true);
    try {
      await api.post(`/rooms/${roomId}/members`, { userIds: selectedUsers });
      toast.success(t('success', {count: selectedUsers.length}));
      onClose();
      setSelectedUsers([]);
      setSearch('');
    } catch (error) {
      console.error(error);
      toast.error(t('error'));
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border h-[300px]">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  {t('noUsersFound')}
                </div>
              ) : (
                <div className="p-1 space-y-1">
                  {users.map((user) => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-muted"
                        )}
                        onClick={() => toggleUser(user.id)}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                          isSelected 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-muted-foreground"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.name?.substring(0, 2).toUpperCase() || user.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name || tRoomMembers('unknown')}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleInvite} disabled={selectedUsers.length === 0 || inviting}>
            {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('inviteBtn', {count: selectedUsers.length})}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
