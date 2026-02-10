'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, User, Shield, Trash2, AlertTriangle, FileText, Clock, Calendar, Filter, X } from 'lucide-react';
import api from '@/lib/api';
import { cn, getUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';
import { toast } from 'sonner';
import { useTranslations, useFormatter } from 'next-intl';
import { RoleBadge } from '@/components/RoleBadge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { getUserColor, getColorByIndex } from '@/lib/color-utils';
import { useAppearanceStore } from '@/lib/appearance-store';

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
  admin: { id: string; name: string | null; email: string; username?: string | null } | null;
  target: { id: string; name: string | null; email: string; username?: string | null } | null;
  ipAddress?: string;
  userAgent?: string;
  previousRole?: string;
  newRole?: string;
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
  
  // Logs Filters
  const [logSearch, setLogSearch] = useState('');
  const [logAction, setLogAction] = useState<string>('all');
  const [logAdminId, setLogAdminId] = useState<string>('all');
  const [logStartDate, setLogStartDate] = useState<string>('');
  const [logEndDate, setLogEndDate] = useState<string>('');

  const { user: currentUser } = useAuthStore();
  const { socket } = useChatStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<RoomMember | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removing, setRemoving] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [roleToConfirm, setRoleToConfirm] = useState<{ userId: string; role: string } | null>(null);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logLimit] = useState(50);

  const { customColorIndex } = useAppearanceStore();
  const { resolvedTheme } = useTheme();

  // Debounced search reset
  useEffect(() => {
    if (view === 'members') {
        setPage(1);
        setMembers([]); // Clear current list on search change
    } else {
        setLogsPage(1);
        setLogs([]);
    }
  }, [search, view, logSearch, logAction, logAdminId, logStartDate, logEndDate]);

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
        } else if (view === 'logs' && currentUser?.role === 'ADMIN') {
            fetchLogs();
        } else if (view === 'logs' && currentUser?.role !== 'ADMIN') {
            setView('members');
        }
    } else {
        // Reset state when closed
        setMembers([]);
        setPage(1);
        setSearch('');
        setLogs([]);
        setLogsPage(1);
        setView('members');
        setLogSearch('');
        setLogAction('all');
        setLogAdminId('all');
        setLogStartDate('');
        setLogEndDate('');
    }
  }, [isOpen, page, search, view, logsPage, logSearch, logAction, logAdminId, logStartDate, logEndDate]);

  const handleRemoveClick = (member: RoomMember) => {
    setUserToRemove(member);
    setRemoveReason('');
    setConfirmOpen(true);
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
        setRoleToConfirm({ userId, role: newRole });
    };

    const confirmRoleChange = async () => {
        if (!roleToConfirm) return;
        const { userId, role: newRole } = roleToConfirm;
        
        // Optimistic UI update
        const previousMembers = [...members];
        setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
        
        setChangingRole(userId);
        setRoleToConfirm(null);
        try {
            await api.patch(`/rooms/${roomId}/members/${userId}/role`, { role: newRole });
            toast.success(t('roleChangedSuccess'));
        } catch (error: any) {
            console.error('Failed to change role', error);
            toast.error(error.response?.data?.message || t('roleChangeFail'));
            // Rollback on error
            setMembers(previousMembers);
        } finally {
            setChangingRole(null);
        }
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
      const params: any = { 
          page: logsPage, 
          limit: 50 
      };
      
      if (logSearch) params.search = logSearch;
      if (logAction && logAction !== 'all') params.action = logAction;
      if (logAdminId && logAdminId !== 'all') params.adminId = logAdminId;
      if (logStartDate) params.startDate = logStartDate;
      if (logEndDate) params.endDate = logEndDate;

      const res = await api.get<{ data: ActionLog[]; total: number; totalPages: number }>(`/rooms/${roomId}/logs`, {
        params
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

        {view === 'members' ? (
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
        ) : (
            <div className="px-6 py-2 space-y-2">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchLogsPlaceholder')}
                            className="pl-9 h-9 text-xs"
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                        />
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2">
                                <Filter className="h-4 w-4" />
                                {t('filters')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">{t('filterAction')}</label>
                                    <Select value={logAction} onValueChange={setLogAction}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder={t('allActions')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('allActions')}</SelectItem>
                                            <SelectItem value="REMOVE_USER">{t('actionRemove')}</SelectItem>
                                            <SelectItem value="ADD_USER">{t('actionAdd')}</SelectItem>
                                            <SelectItem value="ROLE_CHANGED">{t('actionRole')}</SelectItem>
                                            <SelectItem value="CREATE_ROOM">{t('actionCreate')}</SelectItem>
                                            <SelectItem value="UPDATE_SETTINGS">{t('actionUpdate')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">{t('startDate')}</label>
                                        <Input 
                                            type="date" 
                                            className="h-8 text-xs" 
                                            value={logStartDate}
                                            onChange={(e) => setLogStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">{t('endDate')}</label>
                                        <Input 
                                            type="date" 
                                            className="h-8 text-xs" 
                                            value={logEndDate}
                                            onChange={(e) => setLogEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    className="w-full h-8 text-xs"
                                    onClick={() => {
                                        setLogSearch('');
                                        setLogAction('all');
                                        setLogAdminId('all');
                                        setLogStartDate('');
                                        setLogEndDate('');
                                    }}
                                >
                                    {t('resetFilters')}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
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
                        
                        <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span 
                                className="font-semibold truncate"
                                style={{ 
                                    color: (currentUser?.id === member.id && customColorIndex !== null) 
                                        ? getColorByIndex(customColorIndex, resolvedTheme) 
                                        : getUserColor(member.id, getUserDisplayName(member), resolvedTheme) 
                                }}
                            >
                            {getUserDisplayName(member)}
                            </span>
                            {member.role === 'ADMIN' && (
                            <Shield className="h-3 w-3 text-primary shrink-0 fill-primary/20" />
                            )}
                        </div>
                        <RoleBadge role={member.role} className="w-fit p-1.5 gap-2" />
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                                {t('joined')} {format.dateTime(new Date(member.joinedAt), { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            </span>
                        </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto min-w-0 flex-wrap justify-end" style={{ marginRight: '3.5cm', transform: 'translateX(-1cm)' }}>
                        {currentUser?.role?.toUpperCase() === 'ADMIN' && member.id !== currentUser.id && (
                            <>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs gap-1 text-muted-foreground hover:text-primary min-w-0 max-w-[160px]"
                                            disabled={changingRole === member.id}
                                        >
                                            {changingRole === member.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                            ) : (
                                                <Shield className="h-3 w-3 shrink-0" />
                                            )}
                                            <span className="truncate">{t('changeRole')}</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" align="end">
                                        <div className="space-y-1">
                                            {(['ADMIN', 'MANAGER', 'CLIENT'] as const).map((r) => (
                                                <Button
                                                    key={r}
                                                    variant="ghost"
                                                    className={cn(
                                                        "w-full justify-start text-xs h-8",
                                                        member.role?.toUpperCase() === r && "bg-accent"
                                                    )}
                                                    onClick={() => handleChangeRole(member.id, r)}
                                                >
                                                    <RoleBadge role={r} className="border-none bg-transparent p-0 shadow-none hover:bg-transparent hover:shadow-none" />
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 shadow-sm"
                                    onClick={() => handleRemoveClick(member)}
                                    title={t('remove')}
                                    aria-label={t('remove')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
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
                              <div key={log.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-sm">
                                  <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                          <span className="font-medium">
                                              {getUserDisplayName(log.admin)}
                                          </span>{" "}
                                          <span className="text-muted-foreground">
                                              {log.action === "KICK" && t("kicked")}
                                              {log.action === "BAN" && t("banned")}
                                              {log.action === "UNBAN" && t("unbanned")}
                                              {log.action === "MUTE" && t("muted")}
                                              {log.action === "UNMUTE" && t("unmuted")}
                                              {log.action === "CREATE_ROOM" && t("created")}
                                              {log.action === "JOIN_ROOM" && t("joinedRoom")}
                                              {log.action === "ADD_USER" && t("addedUser")}
                                              {log.action === "UPDATE_SETTINGS" && t("updatedSettings")}
                                              {log.action === "UPLOAD_FILE" && t("uploadedFile")}
                                              {log.action === "REMOVE_USER" && t("removedUser")}
                                              {log.action === "ROLE_CHANGED" && t("roleChanged")}
                                          </span>
                                          {log.target && log.target.id !== log.admin?.id && (
                                            <>
                                              {" "}
                                              <span className="font-medium">
                                                  {getUserDisplayName(log.target)}
                                              </span>
                                            </>
                                          )}
                                      </div>
                                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                                          {format.dateTime(new Date(log.createdAt), { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                      </div>
                                  </div>
                                  
                                  {log.action === 'ROLE_CHANGED' && log.previousRole && log.newRole && (
                                      <div className="flex items-center gap-2 mt-1">
                                          <RoleBadge role={log.previousRole} className="h-6 p-1 gap-1 text-[10px] border-none opacity-70" />
                                          <span className="text-muted-foreground">→</span>
                                          <RoleBadge role={log.newRole} className="h-6 p-1 gap-1 text-[10px] border-none" />
                                      </div>
                                  )}

                                  {(log.ipAddress || log.userAgent) && (
                                      <div className="flex items-center gap-3 mt-1 pt-1 border-t border-dashed">
                                          {log.ipAddress && (
                                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                  <Shield className="h-2.5 w-2.5" />
                                                  {log.ipAddress}
                                              </span>
                                          )}
                                          {log.userAgent && (
                                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[200px]" title={log.userAgent}>
                                                  <Clock className="h-2.5 w-2.5" />
                                                  {log.userAgent}
                                              </span>
                                          )}
                                      </div>
                                  )}
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
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={removing} className="w-full sm:w-auto">{tCommon('cancel')}</Button>
          <Button variant="destructive" onClick={confirmRemove} disabled={removing} className="w-full sm:w-auto">
            {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('remove')}
          </Button>
        </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={!!roleToConfirm} onOpenChange={(open) => !open && setRoleToConfirm(null)}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{t('changeRole')}</DialogTitle>
                    <DialogDescription>
                        {t('changeRoleDesc', { 
                            name: roleToConfirm ? getUserDisplayName(members.find(m => m.id === roleToConfirm.userId)) : '',
                            role: roleToConfirm ? t(`Roles.${roleToConfirm.role.toLowerCase()}` as any) : ''
                        })}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-3 sm:gap-2 mt-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setRoleToConfirm(null)}
                        className="flex-1 sm:flex-none min-w-[100px]"
                    >
                        {t('cancel')}
                    </Button>
                    <Button 
                        onClick={confirmRoleChange}
                        className="flex-1 sm:flex-none min-w-[100px]"
                    >
                        {t('confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
