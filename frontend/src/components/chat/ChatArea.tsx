'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isSameDay } from 'date-fns';
import { Languages, MessageSquare, Check, CheckCheck, FileText, Download, Eye, EyeOff, Trash2, Mic, Play, Pause, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { AudioPlayer } from './AudioPlayer';

const LANGUAGES = [
  { code: 'ru', name: 'Russian' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
];

export default function ChatArea() {
  const { messages, currentRoomId, deleteMessage, socket } = useChatStore();
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTranslations, setShowTranslations] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const t = useTranslations('Chat');
  const tCommon = useTranslations('Common');

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInviteToPrivate = (userId: string) => {
      if (!socket) return;
      socket.emit('startPrivateSession', { 
        userIds: [userId],
        sourceRoomId: currentRoomId 
      }, (response: any) => {
          if (response && response.error) {
              console.error('Failed to start private session:', response.error);
              // You might want to use a toast here
          }
      });
  };

  const handleDelete = async (messageId: string) => {
    if (window.confirm(t('deleteMessageConfirm'))) {
      setDeletingId(messageId);
      deleteMessage(messageId);
      // Reset deleting state after a short delay (UI will update via socket event)
      setTimeout(() => setDeletingId(null), 2000);
    }
  };

  const getTranslation = (translationsStr?: string) => {
      if (!translationsStr) return null;
      try {
          const t = JSON.parse(translationsStr);
          // Return the first available translation value
          const values = Object.values(t);
          return values.length > 0 ? values[0] as string : null;
      } catch (e) {
          return null;
      }
  };

  if (!currentRoomId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/30 dark:bg-zinc-950/30">
        <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border">
            <MessageSquare size={40} className="text-primary/40" />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-2">{t('noChatSelected')}</h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center leading-relaxed">
          {t('chooseConversation')}
        </p>
      </div>
    );
  }

  const getAttachmentUrl = (url: string) => {
      if (url.startsWith('http')) return url;
      return `http://localhost:4000${url}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-background/50">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
         <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranslations(!showTranslations)}
            className="text-muted-foreground hover:text-foreground"
         >
            {showTranslations ? (
                <>
                    <Languages className="h-4 w-4 mr-2" />
                    {t('hideTranslations')}
                </>
            ) : (
                <>
                    <Languages className="h-4 w-4 mr-2" />
                    {t('showTranslations')}
                </>
            )}
         </Button>
      </div>
      <ScrollArea className="flex-1 h-full px-4 md:px-8">
        <div className="space-y-6 pb-4 max-w-4xl mx-auto w-full pt-6">
          {messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isMe = msg.senderId === user?.id;
            const isSameSender = prevMsg?.senderId === msg.senderId;
            const showDate = !prevMsg || !isSameDay(new Date(prevMsg.createdAt), new Date(msg.createdAt));
            const showAvatar = !isMe && (!isSameSender || showDate);
            const showName = !isMe && (!isSameSender || showDate);

            return (
              <div key={msg.id} className="w-full">
                 {showDate && (
                    <div className="flex justify-center my-8">
                       <span className="text-xs font-medium text-muted-foreground/60 select-none">
                          {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                       </span>
                    </div>
                 )}

                <div className={cn(
                    "flex gap-3 group px-1 transition-opacity duration-500 animate-in fade-in slide-in-from-bottom-2",
                    isMe ? "justify-end" : "justify-start",
                    !isSameSender && !showDate ? "mt-4" : "mt-1"
                )}>
                    {/* Avatar Gutter */}
                    {!isMe && (
                        <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                            {showAvatar ? (
                                <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm">
                                    <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                                        {msg.sender?.name?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            ) : <div className="w-8" />}
                        </div>
                    )}

                    <div className={cn(
                        "flex flex-col max-w-[85%] md:max-w-[75%] lg:max-w-[65%]",
                        isMe ? "items-end" : "items-start"
                    )}>
                        {showName && (
                            <span className="text-[11px] font-semibold text-muted-foreground ml-1 mb-1 px-1">
                                {msg.sender?.name}
                            </span>
                        )}

                        <ContextMenu>
                        <ContextMenuTrigger>
                        <div className={cn(
                            "relative px-5 py-3 text-[15px] shadow-sm transition-all duration-200 max-w-full",
                            isMe 
                                ? "bg-primary text-primary-foreground rounded-3xl rounded-tr-md" 
                                : "bg-secondary text-secondary-foreground rounded-3xl rounded-tl-md",
                        )}>
                            {/* Attachment */}
                            {msg.attachmentUrl && (
                                <div className="mb-2">
                                    {msg.attachmentType === 'image' ? (
                                        <div className="relative rounded-lg overflow-hidden mb-1 group/image cursor-zoom-in">
                                             <img 
                                                src={getAttachmentUrl(msg.attachmentUrl)} 
                                                alt="Attachment" 
                                                className="w-auto h-auto max-w-full max-h-[60vh] object-contain rounded-lg transition-transform duration-300 hover:scale-[1.01]" 
                                                loading="lazy"
                                                onClick={() => setSelectedImage(getAttachmentUrl(msg.attachmentUrl || ''))}
                                             />
                                        </div>
                                    ) : msg.attachmentType === 'audio/webm' ? (
                                        <AudioPlayer 
                                            src={getAttachmentUrl(msg.attachmentUrl)} 
                                            isMe={isMe} 
                                        />
                                    ) : (
                                        <a 
                                            href={getAttachmentUrl(msg.attachmentUrl)} 
                                            target="_blank"  
                                            rel="noopener noreferrer"
                                            download={msg.attachmentName || true}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 group/file",
                                                isMe ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-muted/50 border-border hover:bg-muted"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded transition-colors",
                                                isMe ? "bg-white/20 text-white" : "bg-background text-primary shadow-sm"
                                            )}>
                                                <FileText size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-xs truncate opacity-90">{msg.attachmentName || 'Attachment'}</p>
                                                <p className="text-[10px] opacity-70 uppercase font-semibold tracking-wide">{msg.attachmentUrl.split('.').pop()}</p>
                                            </div>
                                            <Download size={14} className="opacity-70 group-hover/file:translate-y-0.5 transition-transform" />
                                        </a>
                                    )}
                                </div>
                            )}

                             {/* Message Content */}
                            {msg.content && (
                                <div className="whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.content}
                                </div>
                            )}

                             {/* Translation */}
                             {showTranslations && getTranslation(msg.translations) && (
                                <div className={cn(
                                    "mt-2 pt-2 border-t text-xs italic",
                                    isMe ? "border-white/20 text-white/90" : "border-border text-muted-foreground"
                                )}>
                                    {getTranslation(msg.translations)}
                                </div>
                             )}

                             {/* Meta: Time & Actions */}
                             <div className={cn(
                                 "flex items-center gap-2 select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-1/2 -translate-y-1/2",
                                 isMe ? "-left-16 flex-row-reverse" : "-right-16"
                             )}>
                                 <span className="text-[11px] font-medium text-muted-foreground/60">
                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                 </span>
                                 {isMe && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground/50 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                                      onClick={() => handleDelete(msg.id)}
                                      disabled={deletingId === msg.id}
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                 )}
                             </div>
                        </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                             <ContextMenuItem 
                                 disabled={isMe || user?.role === 'CLIENT' || msg.sender?.role === 'CLIENT'}
                                 onClick={() => handleInviteToPrivate(msg.senderId)}
                             >
                                 <Lock className="w-4 h-4 mr-2" />
                                 {t('inviteToPrivate')}
                             </ContextMenuItem>
                        </ContextMenuContent>
                        </ContextMenu>
                    </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none overflow-hidden flex items-center justify-center">
            {selectedImage && (
                <div className="relative w-full h-full flex items-center justify-center">
                     <img 
                        src={selectedImage} 
                        alt={t('fullSizeAttachment')} 
                        className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                     />
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full"
                        onClick={() => setSelectedImage(null)}
                     >
                        <EyeOff size={20} />
                     </Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}