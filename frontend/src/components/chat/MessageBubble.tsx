'use client';

import { memo } from 'react';
import { useAuthStore } from '@/lib/store';
import { getApiBaseUrl } from '@/lib/api';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  Trash2, 
  Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AudioPlayer } from './AudioPlayer';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { name: string; email: string; role?: string };
  createdAt: string;
  roomId: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  translations?: string;
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isSameSender: boolean;
  showDate: boolean;
  showAvatar: boolean;
  showName: boolean;
  showTranslations: boolean;
  onDelete: (id: string) => void;
  onInviteToPrivate: (userId: string) => void;
  onImageClick: (url: string) => void;
  deletingId: string | null;
}

export default memo(function MessageBubble({
  message,
  isMe,
  isSameSender,
  showDate,
  showAvatar,
  showName,
  showTranslations,
  onDelete,
  onInviteToPrivate,
  onImageClick,
  deletingId
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const t = useTranslations('Chat');

  const getAttachmentUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${getApiBaseUrl()}${url}`;
  };

  const getDownloadUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const filename = url.split('/').pop();
    if (!filename) return getAttachmentUrl(url);
    return `${getApiBaseUrl()}/files/download/${filename}`;
  };

  const getTranslation = (translationsStr?: string) => {
    if (!translationsStr) return null;
    try {
        const t = JSON.parse(translationsStr);
        const values = Object.values(t);
        return values.length > 0 ? values[0] as string : null;
    } catch (e) {
        return null;
    }
  };

  return (
    <div className="w-full">
       {showDate && (
          <div className="flex justify-center my-6">
             <span className="text-[11px] font-medium text-muted-foreground/50 bg-secondary/30 px-3 py-1 rounded-full select-none">
                {format(new Date(message.createdAt), 'MMMM d, yyyy')}
             </span>
          </div>
       )}

      <div className={cn(
          "flex gap-3 group px-1 transition-opacity duration-500 animate-in fade-in slide-in-from-bottom-2",
          isMe ? "justify-end" : "justify-start",
          !isSameSender && !showDate ? "mt-4" : "mt-0.5"
      )}>
          {/* Avatar Gutter */}
          {!isMe && (
              <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                  {showAvatar ? (
                      <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm cursor-pointer hover:ring-primary/30 transition-all">
                          <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                              {message.sender?.name?.[0]?.toUpperCase() || 'U'}
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
                      {message.sender?.name}
                  </span>
              )}

              <ContextMenu>
              <ContextMenuTrigger>
              <div className={cn(
                  "relative px-4 py-2.5 text-[15px] shadow-sm transition-all duration-200 max-w-full border hover:shadow-md",
                isMe 
                    ? "bg-primary text-primary-foreground rounded-xl rounded-tr-sm border-primary/20" 
                    : "bg-white dark:bg-zinc-900 text-foreground rounded-xl rounded-tl-sm border-border hover:border-primary/20",
            )}>
                {/* Attachment */}
                {message.attachmentUrl && (
                    <div className="mb-2">
                        {message.attachmentType === 'image' ? (
                            <div className="relative rounded-lg overflow-hidden mb-1 group/image cursor-zoom-in bg-black/5">
                                 <img 
                                    src={getAttachmentUrl(message.attachmentUrl)} 
                                    alt="Attachment" 
                                    className="w-auto h-auto max-w-full max-h-[240px] object-contain rounded-lg transition-transform duration-300 hover:scale-[1.01]" 
                                    loading="lazy"
                                    onClick={() => onImageClick(getAttachmentUrl(message.attachmentUrl || ''))}
                                 />
                            </div>
                          ) : message.attachmentType === 'audio/webm' ? (
                              <AudioPlayer 
                                  src={getAttachmentUrl(message.attachmentUrl)} 
                                  isMe={isMe} 
                              />
                          ) : (
                              <a 
                                  href={getDownloadUrl(message.attachmentUrl)} 
                                  target="_blank"  
                                  rel="noopener noreferrer"
                                  download={message.attachmentName || true}
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
                                      <p className="font-medium text-xs truncate opacity-90">{message.attachmentName || 'Attachment'}</p>
                                      <p className="text-[10px] opacity-70 uppercase font-semibold tracking-wide">{message.attachmentUrl.split('.').pop()}</p>
                                  </div>
                                  <Download size={14} className="opacity-70 group-hover/file:translate-y-0.5 transition-transform" />
                              </a>
                          )}
                      </div>
                  )}

                   {/* Message Content */}
                  {message.content && (
                      <div className="whitespace-pre-wrap break-words leading-relaxed tracking-wide">
                          {message.content}
                      </div>
                  )}

                   {/* Translation */}
                   {showTranslations && getTranslation(message.translations) && (
                      <div className={cn(
                          "mt-2 pt-2 border-t text-xs italic",
                          isMe ? "border-white/20 text-white/90" : "border-border text-muted-foreground"
                      )}>
                          {getTranslation(message.translations)}
                      </div>
                   )}

                   {/* Time Inside Bubble */}
                   <div className={cn(
                       "flex justify-end items-center mt-1 select-none",
                       isMe ? "text-white/60" : "text-muted-foreground/60"
                   )}>
                       <span className="text-[10px] font-medium">
                          {format(new Date(message.createdAt), 'HH:mm')}
                       </span>
                   </div>

                   {/* Delete Action (Hover) */}
                   {isMe && (
                    <div className="absolute top-1/2 -translate-y-1/2 -left-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground/50 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(message.id);
                            }}
                            disabled={deletingId === message.id}
                          >
                            <Trash2 size={12} />
                          </Button>
                    </div>
                   )}

              </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                   <ContextMenuItem 
                       disabled={isMe || user?.role === 'CLIENT' || message.sender?.role === 'CLIENT'}
                       onClick={() => onInviteToPrivate(message.senderId)}
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
});