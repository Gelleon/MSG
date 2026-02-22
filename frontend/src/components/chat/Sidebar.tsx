'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';
import { 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  Pencil,
  Trash2,
  Copy,
  MessageSquarePlus,
  User,
  ShieldCheck
} from 'lucide-react';
import { useRouter } from '@/navigation';
import CreateRoomDialog from './CreateRoomDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import { cn, stringToColor, getUserDisplayName } from '@/lib/utils';
import { getAllUserColors, getUserColor, getColorByIndex } from '@/lib/color-utils';
import { useAppearanceStore } from '@/lib/appearance-store';
import { useTheme } from 'next-themes';
import InviteMemberModal from './InviteMemberModal';
import RoomMembersDialog from './RoomMembersDialog';
import { Lock, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';

import { useNotificationStore } from '@/lib/notification-store';
import { Label } from '@/components/ui/label';

export default function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuthStore();
  const { rooms, fetchRooms, joinRoom, currentRoomId, createRoom, updateRoom, deleteRoom } = useChatStore();
  const { soundEnabled, visualEnabled, toggleSound, toggleVisual } = useNotificationStore();
  const { customColorIndex, setCustomColorIndex } = useAppearanceStore();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  
  const tSidebar = useTranslations('Sidebar');
  const tCommon = useTranslations('Common');
  const tDialogs = useTranslations('Dialogs');
  const tSettings = useTranslations('Settings');

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<{id: string, name: string, description?: string} | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  // Invite Dialog State
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);

  // Members Dialog State
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [membersRoom, setMembersRoom] = useState<{id: string, name: string} | null>(null);

  // Settings Dialog State
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  const allowedEmails = ['svzelenin@yandex.ru', 'pallermo72@gmail.com'];
  const userEmail = user?.email || user?.username;
  const isSuperAdmin = userEmail && allowedEmails.includes(userEmail);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleEditClick = (room: {id: string, name: string, description?: string}) => {
    setRoomToEdit(room);
    setEditName(room.name);
    setEditDescription(room.description || '');
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setRoomToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDuplicateClick = async (room: {id: string, name: string, description?: string}) => {
    try {
      const newRoom = await createRoom(tSidebar('copyOf', {name: room.name}), room.description);
      if (newRoom && newRoom.id) {
        await joinRoom(newRoom.id);
      }
    } catch (error) {
      console.error("Failed to duplicate room", error);
    }
  };

  const handleInviteClick = (id: string) => {
      setInviteRoomId(id);
      setInviteDialogOpen(true);
  };

  const handleViewMembersClick = (id: string, name: string) => {
    setMembersRoom({ id, name });
    setMembersDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!roomToEdit) return;

    const name = editName.trim();
    if (!name) {
      toast.error(tDialogs('renameRoom.errorEmptyName') || 'Room name cannot be empty');
      return;
    }

    if (name.length > 100) {
      toast.error('Room name is too long (max 100 characters)');
      return;
    }

    if (editDescription && editDescription.length > 500) {
      toast.error('Description is too long (max 500 characters)');
      return;
    }

    try {
      await updateRoom(roomToEdit.id, { name, description: editDescription });
      setEditDialogOpen(false);
      setRoomToEdit(null);
      setEditName('');
      setEditDescription('');
      toast.success(tDialogs('renameRoom.success') || 'Room updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update room';
      toast.error(errorMessage);
    }
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      await deleteRoom(roomToDelete);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const displayRooms = useMemo(() => {
    // Helper to check if a room matches search
    const matchesSearch = (room: {name: string}) => 
        room.name.toLowerCase().includes(searchQuery.toLowerCase());

    const parents = rooms.filter(r => !r.parentRoomId);
    const children = rooms.filter(r => r.parentRoomId);
    
    const result: typeof rooms = [];
    const addedIds = new Set<string>();

    parents.forEach(p => {
        const pMatches = matchesSearch(p);
        const myChildren = children.filter(c => c.parentRoomId === p.id);
        const matchingChildren = myChildren.filter(c => matchesSearch(c));
        
        // Show parent if it matches OR if it has matching children (context)
        // If no search query, show everything
        if (!searchQuery || pMatches || matchingChildren.length > 0) {
            if (!addedIds.has(p.id)) {
                result.push(p);
                addedIds.add(p.id);
            }
            
            // If search query exists, only show matching children
            // If no search query, show all children
            const childrenToShow = searchQuery ? matchingChildren : myChildren;
            
            childrenToShow.forEach(c => {
                if (!addedIds.has(c.id)) {
                    result.push(c);
                    addedIds.add(c.id);
                }
            });
        }
    });
    
    // Handle orphans (children whose parents are missing or not in the main list)
    const orphans = children.filter(c => !parents.find(p => p.id === c.parentRoomId));
    orphans.forEach(c => {
         if ((!searchQuery || matchesSearch(c)) && !addedIds.has(c.id)) {
            result.push(c);
            addedIds.add(c.id);
        }
    });
    
    return result;
  }, [rooms, searchQuery]);

  return (
    <div className={cn("w-[320px] flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground font-sans", className)}>
      
      {/* Header Section */}
      <div className="p-4 space-y-4">
        {/* Branding & Actions */}
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-2.5">
             <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
               <MessageSquarePlus className="h-5 w-5 text-primary-foreground" />
             </div>
             <span className="font-bold text-xl tracking-tight text-foreground">MSG.</span>
           </div>
           <CreateRoomDialog>
             <Button variant="ghost" size="icon" className="h-11 w-11 md:h-9 md:w-9 bg-background/50 hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-xl transition-all duration-200 border border-border/40">
               <Plus className="h-5 w-5" />
             </Button>
           </CreateRoomDialog>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-200" />
          <Input 
                  placeholder={tSidebar('searchPlaceholder')}
                  className="pl-9 h-11 md:h-10 rounded-xl bg-secondary/30 border-transparent focus:bg-background focus:border-primary/20 transition-all placeholder:text-muted-foreground/50" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
            {displayRooms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3 opacity-60">
                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                        <MessageSquarePlus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                        {tSidebar('noChats')}<br/>
                        <span className="text-xs opacity-70">{tSidebar('startConversation')}</span>
                    </p>
                </div>
            )}
            
            {displayRooms.map((room) => {
                const isActive = currentRoomId === room.id;
                const isPrivate = room.isPrivate;
                const isChild = !!room.parentRoomId;
                const hasUnread = (room.unreadCount || 0) > 0;
                
                return (
                 <ContextMenu key={room.id}>
                   <ContextMenuTrigger asChild>
                     <button
                       className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 ease-out group relative border border-transparent",
                          // Active State
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-sidebar-border/50" 
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground",
                          // Child styling
                          isChild 
                            ? "ml-6 w-[calc(100%-1.5rem)] pl-3 border-l-2 border-l-border/50 rounded-l-none border-y-transparent border-r-transparent bg-transparent" 
                            : ""
                        )}
                       onClick={() => joinRoom(room.id)}
                      >
                        {/* Connecting Line for Child */}
                        {isChild && (
                           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-full bg-transparent" />
                        )}
                        <div className="relative">
                           <Avatar className={cn(
                               "h-10 w-10 border shadow-sm transition-transform duration-200 group-hover:scale-105", 
                               isPrivate ? "ring-2 ring-primary/5 border-primary/10" : "border-background",
                               isActive ? "ring-2 ring-background" : "",
                               hasUnread ? "ring-2 ring-primary border-primary" : ""
                           )}>
                               <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`} loading="lazy" decoding="async" />
                               <AvatarFallback 
                                style={{ backgroundColor: isPrivate ? undefined : stringToColor(room.name, 70, 95), color: isPrivate ? undefined : stringToColor(room.name, 80, 40) }}
                                className={cn("text-xs font-bold", isPrivate ? "bg-secondary text-secondary-foreground" : "")}>
                                    {isPrivate ? <Lock className="w-3.5 h-3.5" /> : room.name.substring(0, 2).toUpperCase()}
                               </AvatarFallback>
                           </Avatar>
                           {isChild && (
                               <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border z-20">
                                   <CornerDownRight className="w-2.5 h-2.5 text-muted-foreground" />
                               </div>
                           )}
                       </div>
                       
                       <div className="flex-1 min-w-0 flex flex-col gap-0.5 z-10">
                         <div className="flex justify-between items-center">
                           <span className={cn(
                               "text-base md:text-[14px] truncate leading-tight tracking-tight transition-all", 
                               hasUnread ? "font-bold text-foreground" : "font-semibold",
                               isActive ? "text-foreground" : "text-foreground"
                           )}>
                               {room.name}
                           </span>
                       </div>
                         <div className="flex justify-between items-center gap-2">
                             <p className={cn(
                                 "text-sm md:text-[13px] truncate flex-1 transition-colors duration-200", 
                                 hasUnread ? "text-foreground font-medium" : "text-muted-foreground/70",
                                 isActive ? "text-muted-foreground font-medium" : ""
                             )}>
                                 {room.description || (isPrivate ? tSidebar('privateSession') : tSidebar('noDescription'))}
                             </p>
                             {hasUnread && (
                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center h-4 flex items-center justify-center shadow-sm ring-2 ring-background animate-pulse">
                                    {room.unreadCount}
                                </span>
                             )}
                         </div>
                       </div>
                     </button>
                   </ContextMenuTrigger>
                   <ContextMenuContent className="w-56">
                     <ContextMenuItem onClick={() => handleViewMembersClick(room.id, room.name)}>
                        <User className="mr-2 h-4 w-4" />
                        {tSidebar('viewMembers')}
                     </ContextMenuItem>
                     {user?.role === 'ADMIN' && (
                       <ContextMenuItem onClick={() => handleInviteClick(room.id)}>
                         <Plus className="mr-2 h-4 w-4" />
                         {tSidebar('inviteMembers')}
                       </ContextMenuItem>
                     )}
                     {user?.role === 'ADMIN' && (
                       <>
                         <ContextMenuItem onClick={() => handleEditClick(room)}>
                           <Pencil className="mr-2 h-4 w-4" />
                           {tSidebar('rename')}
                         </ContextMenuItem>
                         <ContextMenuItem onClick={() => handleDuplicateClick(room)}>
                           <Copy className="mr-2 h-4 w-4" />
                           {tSidebar('duplicate')}
                         </ContextMenuItem>
                         <ContextMenuSeparator />
                         <ContextMenuItem 
                            onClick={() => handleDeleteClick(room.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                         >
                           <Trash2 className="mr-2 h-4 w-4" />
                           {tSidebar('delete')}
                         </ContextMenuItem>
                       </>
                     )}
                   </ContextMenuContent>
                 </ContextMenu>
                );
            })}
        </div>
      </ScrollArea>

      {/* User Footer */}
      <div className="p-3 mt-auto border-t border-border/40 bg-background/50 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-3 py-6 rounded-xl hover:bg-secondary/50 group transition-all duration-200">
              <div className="flex items-center gap-3 text-left w-full">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getUserDisplayName(user)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-semibold truncate text-foreground group-hover:text-foreground"
                    style={{ 
                        color: (customColorIndex !== null) 
                            ? getColorByIndex(customColorIndex, resolvedTheme) 
                            : getUserColor(user?.id || '', getUserDisplayName(user), resolvedTheme) 
                    }}
                  >
                    {getUserDisplayName(user)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs text-muted-foreground truncate">{tSidebar('online')}</p>
                  </div>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 mb-2 max-w-[calc(100vw-2rem)] overflow-x-hidden" 
            side={isMobile ? "top" : "right"}
          >
            <DropdownMenuLabel>{tSidebar('myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isSuperAdmin && (
              <>
                 <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {tSidebar('adminPanel')}
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              {tCommon('settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              {tCommon('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tDialogs('renameRoom.title')}</DialogTitle>
            <DialogDescription>
              {tDialogs('renameRoom.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={tDialogs('renameRoom.label')}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Room description"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{tCommon('cancel')}</Button>
            <Button onClick={confirmEdit}>{tDialogs('renameRoom.submit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tDialogs('deleteRoom.title')}</DialogTitle>
            <DialogDescription>
              {tDialogs('deleteRoom.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 sm:gap-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{tCommon('cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{tDialogs('deleteRoom.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Invite Member Modal */}
      {inviteRoomId && (
        <InviteMemberModal 
          isOpen={inviteDialogOpen} 
          onClose={() => {
            setInviteDialogOpen(false);
            setInviteRoomId(null);
          }} 
          roomId={inviteRoomId} 
        />
      )}

      {membersRoom && (
        <RoomMembersDialog 
          isOpen={membersDialogOpen} 
          onClose={() => {
            setMembersDialogOpen(false);
            setMembersRoom(null);
          }} 
          roomId={membersRoom.id}
          roomName={membersRoom.name}
        />
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tSettings('title')}</DialogTitle>
            <DialogDescription>
              {tSettings('description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="sound-notifications">{tSettings('soundTitle')}</Label>
                <span className="text-xs text-muted-foreground">{tSettings('soundDesc')}</span>
              </div>
              <Switch
                id="sound-notifications"
                checked={soundEnabled}
                onCheckedChange={toggleSound}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="visual-notifications">{tSettings('visualTitle')}</Label>
                <span className="text-xs text-muted-foreground">{tSettings('visualDesc')}</span>
              </div>
              <Switch
                id="visual-notifications"
                checked={visualEnabled}
                onCheckedChange={toggleVisual}
              />
            </div>
            
            {/* Color Preference */}
            <div className="flex flex-col space-y-3 pt-4 border-t">
                <div className="flex flex-col space-y-1">
                    <Label>{tSettings('colorTitle') || 'Name Color'}</Label>
                    <span className="text-xs text-muted-foreground">{tSettings('colorDesc') || 'Choose how your name appears to you'}</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                     <button
                        onClick={() => setCustomColorIndex(null)}
                        className={cn(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                            customColorIndex === null ? "border-primary" : "border-transparent opacity-50 hover:opacity-100"
                        )}
                        title="Default"
                     >
                        <span className="text-[10px] font-bold">A</span>
                     </button>
                     
                     {getAllUserColors(resolvedTheme).map(({ color, index }) => (
                        <button
                            key={index}
                            onClick={() => setCustomColorIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full border-2 transition-all",
                                customColorIndex === index ? "border-primary scale-110" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                            title={`Color ${index + 1}`}
                        />
                     ))}
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
