'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, User, Shield, Trash2, AlertTriangle, FileText, Clock, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';
import { toast } from 'sonner';
import { useTranslations, useFormatter } from 'next-intl';

interface RoomMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: string;
  status: 'online' | 'offline'; // This will be mocked for now as per backend
}

interface ActionLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  admin: { name: string | null; email: string };
  target: { name: string | null; email: string } | null;
}

interface RoomMembersResponse {
  data: RoomMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RoomMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export default function RoomMembersDialog({ isOpen, onClose, roomId, roomName }: RoomMembersDialogProps) {
  const t = useTranslations('RoomMembers');
  const tCommon = useTranslations('Common');
  const format = useFormatter();

  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [view, setView] = useState<'members' | 'logs'>('members');
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsHasMore, setLogsHasMore] = useState(true);

  const { user: currentUser } = useAuthStore();
  const { socket } = useChatStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<RoomMember | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removing, setRemoving] = useState(false);

  // Debounced search reset
  useEffect(() => {
    if (view === 'members') {
        setPage(1);
        setMembers([]); // Clear current list on search change
    }
  }, [search, view]);

  useEffect(() => {
    if (!socket) return;

    const handleUserRemoved = (data: { userId: string; roomId: string; reason?: string }) => {
      if (data.roomId === roomId) {
        setMembers(prev => prev.filter(m => m.id !== data.userId));
        setTotal(prev => Math.max(0, prev - 1));
        
        // Refresh logs if viewing logs
        if (view === 'logs') {
            setLogsPage(1);
            fetchLogs();
        }

        if (data.userId === currentUser?.id) {
             onClose();
             toast.error(`${t('youRemoved')}: ${data.reason || t('noReason')}`);
        }
      }
    };

    socket.on('userRemoved', handleUserRemoved);
    return () => {
      socket.off('userRemoved', handleUserRemoved);
    };
  }, [socket, roomId, currentUser, onClose, view, t]);

  useEffect(() => {
    if (isOpen) {
        if (view === 'members') {
            fetchMembers();
        } else {
            fetchLogs();
        }
    } else {
        // Reset state when closed
        setMembers([]);
        setPage(1);
        setSearch('');
        setLogs([]);
        setLogsPage(1);
        setView('members');
    }
  }, [isOpen, page, search, view, logsPage]);

  const handleRemoveClick = (member: RoomMember) => {
    setUserToRemove(member);
    setRemoveReason('');
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!userToRemove) return;
    setRemoving(true);
    try {
      await api.delete(`/rooms/${roomId}/members/${userToRemove.id}`, {
        params: { reason: removeReason }
      });
      toast.success(t('removedSuccess', { name: userToRemove.name || userToRemove.email }));
      setConfirmOpen(false);
      setUserToRemove(null);
      // Logs will be updated via socket or manual refresh if needed
    } catch (error: any) {
      console.error('Failed to remove user', error);
      toast.error(error.response?.data?.message || t('removeFail'));
    } finally {
      setRemoving(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get<RoomMembersResponse>(`/rooms/${roomId}/members`, {
        params: {
          page,
          limit: 20,
          search
        }
      });
      
      if (page === 1) {
        setMembers(res.data.data);
      } else {
        setMembers(prev => [...prev, ...res.data.data]);
      }
      
      setTotal(res.data.total);
      setHasMore(page < res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get<{ data: ActionLog[]; total: number; totalPages: number }>(`/rooms/${roomId}/logs`, {
        params: { page: logsPage, limit: 20 }
      });
      if (logsPage === 1) {
        setLogs(res.data.data);
      } else {
        setLogs(prev => [...prev, ...res.data.data]);
      }
      setLogsHasMore(logsPage < res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
        if (view === 'members' && !loading && hasMore) {
            setPage(prev => prev + 1);
        } else if (view === 'logs' && !logsLoading && logsHasMore) {
            setLogsPage(prev => prev + 1);
        }
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between mb-2">
             <DialogTitle className="flex items-center gap-2">
                {view === 'members' ? <User className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                {view === 'members' ? `${t('title')} - ${roomName}` : t('logsTitle')}
                {view === 'members' && (
                    <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {total}
                    </span>
                )}
             </DialogTitle>
             {currentUser?.role === 'ADMIN' && (
                 <div className="flex gap-1 bg-muted p-1 rounded-xl">
                     <Button 
                        variant={view === 'members' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => setView('members')}
                     >
                        {t('membersTab')}
                     </Button>
                     <Button 
                        variant={view === 'logs' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => setView('logs')}
                     >
                        {t('logsTab')}
                     </Button>
                 </div>
             )}
          </div>
        </DialogHeader>

        {view === 'members' && (
            <div className="px-6 py-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder={t('searchPlaceholder')}
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            </div>
        )}

        <ScrollArea className="flex-1 p-6 pt-0" onScrollCapture={handleScroll}>
          {view === 'members' ? (
              <div className="space-y-4">
                {members.length === 0 && !loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    {t('noMembers')}
                </div>
                ) : (
                <div className="space-y-3">
                    {members.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                        <div className="relative">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                            <AvatarFallback>
                                {getUserDisplayName(member).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                            member.status === 'online' ? "bg-green-500" : "bg-gray-400"
                        )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                            {getUserDisplayName(member)}
                            </span>
                            {member.role === 'ADMIN' && (
                            <Shield className="h-3 w-3 text-primary fill-primary/20" />
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                            <span>{member.email}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('joined')} {format.dateTime(new Date(member.joinedAt), { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        </div>

                        <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                            {member.role}
                        </div>
                        {currentUser?.role === 'ADMIN' && member.id !== currentUser.id && (
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveClick(member)}
                            title={t('remove')}
                            >
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        </div>
                    </div>
                    ))}
                </div>
                )}
                
                {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
                )}
              </div>
          ) : (
              <div className="space-y-4">
                  {logs.length === 0 && !logsLoading ? (
                      <div className="text-center py-12 text-muted-foreground">
                          {t('noLogs')}
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {logs.map((log) => (
                              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card text-sm">
                                  <div className="flex-1 text-sm">
                                      <span className="font-medium">
                                          {getUserDisplayName(log.admin)}
                                      </span>{" "}
                                      <span className="text-muted-foreground">
                                          {log.action === "KICK" && t("kicked")}
                                          {log.action === "BAN" && t("banned")}
                                          {log.action === "UNBAN" && t("unbanned")}
                                          {log.action === "MUTE" && t("muted")}
                                          {log.action === "UNMUTE" && t("unmuted")}
                                      </span>{" "}
                                      <span className="font-medium">
                                          {log.target ? getUserDisplayName(log.target) : t('unknown')}
                                      </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                                      {format.dateTime(new Date(log.createdAt), { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                   {logsLoading && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                    )}
              </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('removeTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('removeDesc', { name: getUserDisplayName(userToRemove) })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">{t('reasonLabel')}</label>
          <Textarea
            placeholder={t('reasonPlaceholder')}
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={removing}>{tCommon('cancel')}</Button>
          <Button variant="destructive" onClick={confirmRemove} disabled={removing}>
            {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}