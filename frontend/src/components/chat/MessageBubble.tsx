'use client';

import { memo, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { getApiBaseUrl } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useTheme } from 'next-themes';
import { getUserColor, getColorByIndex } from '@/lib/color-utils';
import { useAppearanceStore } from '@/lib/appearance-store';
import { 
  FileText, 
  Download, 
  Trash2, 
  Lock,
  Reply,
  Pencil,
  History,
  Loader2,
  CornerDownRight,
  Copy,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { cn, getUserDisplayName } from '@/lib/utils';
import { useChatStore, Message } from '@/lib/chat-store';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AudioPlayer } from './AudioPlayer';

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
  onReply: (message: Message) => void;
  onReplyClick?: (id: string, triggerId?: string) => void;
  isHighlighted?: boolean;
  onEdit: (message: Message) => void;
  onViewHistory: (id: string) => void;
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
  onReply,
  onReplyClick,
  isHighlighted,
  onEdit,
  onViewHistory,
  onImageClick,
  deletingId
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const { customColorIndex } = useAppearanceStore();
  const { resolvedTheme } = useTheme();
  const isReplyingToThis = useChatStore(state => state.replyingTo?.id === message.id);
  const isResolvingReply = useChatStore(state => state.loadingReplyId === message.id);
  const t = useTranslations('Chat');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const format = useFormatter();

  const replyBtnRef = useRef<HTMLButtonElement>(null);

  // Monitoring for disappearing reply button
  useEffect(() => {
    // Check after mount to ensure styles are applied
    const timer = setTimeout(() => {
      if (replyBtnRef.current) {
        const style = window.getComputedStyle(replyBtnRef.current);
        // It should always be visible now
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
           logger.logVisibilityIssue('MessageBubble', `ReplyButton-${message.id}`, {
             messageId: message.id,
             isMe,
             styles: {
               display: style.display,
               visibility: style.visibility,
               opacity: style.opacity
             }
           });
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [message.id, isMe]);

  const handleCopy = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString();

    if (selectedText && selectedText.length > 0) {
        navigator.clipboard.writeText(selectedText);
        toast.success(t('copied'));
    } else if (message.content) {
        navigator.clipboard.writeText(message.content);
        toast.success(t('copied'));
    }
  };

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
    <div id={`message-${message.id}`} className={cn(
        "w-full transition-colors duration-1000",
        isHighlighted && "bg-primary/10 rounded-lg -mx-2 px-2 py-1"
    )}>
       {showDate && (
          <div className="flex justify-center my-6 sticky top-2 z-10">
             <span className="text-[11px] font-medium text-muted-foreground/80 bg-background/80 backdrop-blur-sm border border-border/50 px-3 py-1 rounded-full shadow-sm select-none">
                {format.dateTime(new Date(message.createdAt), { year: 'numeric', month: 'long', day: 'numeric' })}
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
                              {getUserDisplayName(message.sender).substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                  ) : <div className="w-8" />}
              </div>
          )}

          <div className={cn(
              "flex flex-col min-w-0 max-w-[calc(100vw-3.5rem)] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[65%]",
              isMe ? "items-end" : "items-start"
          )}>
              <ContextMenu>
              <ContextMenuTrigger>
              <div className={cn(
                  "relative px-4 py-2.5 text-[15px] shadow-sm transition-all duration-200 max-w-full border hover:shadow-md min-w-0",
                isMe 
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm border-primary/20 shadow-md" 
                    : "bg-white dark:bg-zinc-900 text-foreground rounded-2xl rounded-tl-sm border-border hover:border-primary/20 shadow-sm",
                isReplyingToThis && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}>
                {/* Username */}
                {!isMe && showName && (
                    <div 
                       className="flex items-center mb-1 max-w-full select-none cursor-pointer hover:opacity-80 transition-opacity"
                       style={{ 
                           color: getUserColor(message.senderId, getUserDisplayName(message.sender), resolvedTheme) 
                       }}
                       onClick={(e) => {
                           e.stopPropagation();
                           // Future: Open profile or mention
                       }}
                     >
                        <span className="text-xs font-bold truncate min-w-0">
                          {getUserDisplayName(message.sender)}
                        </span>
                        {message.sender?.position && (
                          <span className="ml-2 text-[11px] text-white font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: 'lab(33.9588% 50.4109 -83.9808)' }}>
                            {locale === 'ru' ? message.sender.position.nameRu : message.sender.position.nameZh}
                          </span>
                        )}
                    </div>
                )}
                {/* Replied Message */}
                {message.replyTo && (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (message.replyToId && onReplyClick) {
                                onReplyClick(message.replyToId, message.id);
                            }
                        }}
                        className={cn(
                        "mb-2 relative group/reply cursor-pointer",
                        isMe ? "text-white/90" : "text-muted-foreground"
                    )}>
                        <div className={cn(
                            "absolute top-0 bottom-0 -left-2 w-[2px] rounded-full transition-colors",
                            isMe ? "bg-white/30 group-hover/reply:bg-white/50" : "bg-primary/30 group-hover/reply:bg-primary/50"
                        )} />
                        
                        <div className={cn(
                            "ml-1 pl-2 py-1 rounded transition-colors",
                             isMe ? "hover:bg-white/10" : "hover:bg-primary/5"
                        )}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <CornerDownRight size={12} className="opacity-70" />
                                <span className="text-xs font-semibold opacity-90">{getUserDisplayName(message.replyTo.sender)}</span>
                            </div>
                            <div className="text-xs opacity-80 line-clamp-1 truncate max-w-[200px] pl-4">
                                {message.replyTo.content || t('attachment')}
                            </div>
                        </div>
                    </div>
                )}

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
                                    decoding="async"
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
                      <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed tracking-wide text-[15px] md:text-sm">
                          {message.content.split(/(@[\w\u0400-\u04FF]+)(?=\s|$|[.,!?;:])/g).map((part, index) => {
                              if (part.startsWith('@') && part.length > 1) {
                                  return (
                                      <span 
                                          key={index} 
                                          className={cn(
                                              "font-semibold hover:underline cursor-pointer inline-flex items-center max-w-full break-all",
                                              "px-1.5 py-0.5 mx-0.5 rounded transition-all duration-200",
                                              "text-sm md:text-xs sm:text-sm",
                                              isMe 
                                                  ? "bg-white/20 text-white hover:bg-white/30 shadow-sm" 
                                                  : "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm"
                                          )}
                                      >
                                          {part.slice(1)}
                                      </span>
                                  );
                              }
                              return part;
                          })}
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

                   {/* Time Inside Bubble & Reply Button */}
                   <div className={cn(
                       "flex justify-end items-center mt-1 select-none gap-1.5",
                       isMe ? "text-white/70" : "text-muted-foreground/70"
                   )}>
                       <button 
                            ref={replyBtnRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isResolvingReply) {
                                    onReply(message);
                                }
                            }}
                            disabled={isResolvingReply}
                            className={cn(
                                // Layout & Visibility
                                "flex items-center justify-center transition-all duration-200 relative z-10",
                                "opacity-100 focus:opacity-100", // Always visible to fix disappearing issues on touch devices/tablets
                                
                                // Size & Touch Target (min 44x44 for mobile, adjust margins to fit)
                                "h-11 w-11 md:h-8 md:w-8 -my-2.5 md:-my-1.5 mr-1 rounded-full",
                                "active:scale-95 hover:bg-black/5 dark:hover:bg-white/10",
                                
                                // Colors
                                isMe 
                                    ? "text-white/90 hover:text-white hover:bg-white/10" 
                                    : "text-primary/90 hover:text-primary hover:bg-primary/10",
                                
                                isResolvingReply && "opacity-100 cursor-wait"
                            )}
                            aria-label={t('reply')}
                            title={t('reply')}
                       >
                           {isResolvingReply ? (
                               <Loader2 size={14} className="animate-spin" />
                           ) : (
                               <Reply size={14} strokeWidth={2} />
                           )}
                       </button>

                        {message.isEdited && (
                           <span className="text-xs md:text-[10px] italic opacity-80 mr-1" title={message.updatedAt ? format.dateTime(new Date(message.updatedAt), { dateStyle: 'medium', timeStyle: 'short' }) : undefined}>
                               {t('edited')}
                           </span>
                       )}

                       <span className="text-xs md:text-[10px] font-medium">
                          {format.dateTime(new Date(message.createdAt), { hour: '2-digit', minute: '2-digit', hour12: false })}
                       </span>
                       
                       {isMe && (
                           <span className="ml-0.5" title={message.status || 'sent'}>
                                {message.status === 'read' ? (
                                    <CheckCheck size={14} className="text-blue-200" /> 
                                ) : message.status === 'delivered' ? (
                                    <CheckCheck size={14} />
                                ) : message.status === 'pending' ? (
                                    <Clock size={12} />
                                ) : (
                                    <Check size={14} />
                                )}
                           </span>
                       )}
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
                   <ContextMenuItem onClick={() => onReply(message)}>
                       <Reply className="w-4 h-4 mr-2" />
                       {t('reply')}
                   </ContextMenuItem>
                   <ContextMenuItem onClick={handleCopy}>
                       <Copy className="w-4 h-4 mr-2" />
                       {t('copy')}
                   </ContextMenuItem>
                   {isMe && message.content && (
                       <ContextMenuItem onClick={() => onEdit(message)}>
                           <Pencil className="w-4 h-4 mr-2" />
                           {tCommon('edit')}
                       </ContextMenuItem>
                   )}
                   {message.isEdited && (
                       <ContextMenuItem onClick={() => onViewHistory(message.id)}>
                           <History className="w-4 h-4 mr-2" />
                           {t('viewHistory')}
                       </ContextMenuItem>
                   )}
                   <ContextMenuItem 
                       disabled={isMe || (user?.role?.toUpperCase() === 'CLIENT') || (message.sender?.role?.toUpperCase() === 'CLIENT')}
                       onClick={() => onInviteToPrivate(message.senderId)}
                   >
                       <Lock className="w-4 h-4 mr-2" />
                       {t('inviteToPrivate')}
                   </ContextMenuItem>
                   {isMe && (
                       <ContextMenuItem 
                           onClick={() => onDelete(message.id)}
                           className="text-destructive focus:text-destructive"
                       >
                           <Trash2 className="w-4 h-4 mr-2" />
                           {tCommon('delete')}
                       </ContextMenuItem>
                   )}
              </ContextMenuContent>
              </ContextMenu>
          </div>
      </div>
    </div>
  );
});
