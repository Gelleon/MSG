'use client';

import { memo } from 'react';
import { useAuthStore } from '@/lib/store';
import { getApiBaseUrl } from '@/lib/api';
import { format } from 'date-fns';
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
import { useTranslations } from 'next-intl';
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
  const isReplyingToThis = useChatStore(state => state.replyingTo?.id === message.id);
  const isResolvingReply = useChatStore(state => state.loadingReplyId === message.id);
  const t = useTranslations('Chat');
  const tCommon = useTranslations('Common');

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
                              {getUserDisplayName(message.sender).substring(0, 1).toUpperCase()}
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
                      {getUserDisplayName(message.sender)}
                  </span>
              )}

              <ContextMenu>
              <ContextMenuTrigger>
              <div className={cn(
                  "relative px-4 py-2.5 text-[15px] shadow-sm transition-all duration-200 max-w-full border hover:shadow-md",
                isMe 
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm border-primary/20 shadow-md" 
                    : "bg-white dark:bg-zinc-900 text-foreground rounded-2xl rounded-tl-sm border-border hover:border-primary/20 shadow-sm",
                isReplyingToThis && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}>
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

                   {/* Time Inside Bubble & Reply Button */}
                   <div className={cn(
                       "flex justify-end items-center mt-1 select-none gap-1.5",
                       isMe ? "text-white/70" : "text-muted-foreground/70"
                   )}>
                       <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isResolvingReply) {
                                    onReply(message);
                                }
                            }}
                            disabled={isResolvingReply}
                            className={cn(
                                "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center mr-2",
                                isMe ? "hover:text-white" : "hover:text-primary",
                                isResolvingReply && "opacity-100 cursor-wait"
                            )}
                            aria-label={t('reply')}
                            title={t('reply')}
                       >
                           {isResolvingReply ? (
                               <Loader2 size={12} className="animate-spin" />
                           ) : (
                               <Reply size={12} />
                           )}
                       </button>

                       {message.isEdited && (
                           <span className="text-[10px] italic opacity-80 mr-1" title={message.updatedAt ? format(new Date(message.updatedAt), 'PPpp') : undefined}>
                               {t('edited')}
                           </span>
                       )}

                       <span className="text-[10px] font-medium">
                          {format(new Date(message.createdAt), 'HH:mm')}
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
              </ContextMenuContent>
              </ContextMenu>
          </div>
      </div>
    </div>
  );
});