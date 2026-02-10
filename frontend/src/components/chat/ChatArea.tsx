'use client';

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import type { UIEvent, WheelEvent } from 'react';
import { useChatStore, Message } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isSameDay } from 'date-fns';
import { Languages, MessageSquare, Check, CheckCheck, FileText, Download, Eye, EyeOff, Trash2, Mic, Play, Pause, Lock } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn, getUserDisplayName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { getUserColor, getColorByIndex } from '@/lib/color-utils';
import { useAppearanceStore } from '@/lib/appearance-store';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import MessageBubble from './MessageBubble';
import { MessageHistoryDialog } from './MessageHistoryDialog';

export default function ChatArea() {
  const { messages, currentRoomId, deleteMessage, socket, loadMoreMessages, isLoadingHistory, hasMoreMessages, setReplyingTo, fetchReplyMessage, setEditingMessage, markRoomAsRead, typingUsers } = useChatStore();
  const { user } = useAuthStore();
  const currentRoom = useChatStore(state => state.rooms.find(r => r.id === state.currentRoomId));
  
  console.log(`[ChatArea] Rendering for room ${currentRoomId}, messages count: ${messages.length}`);

  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isLoadingMoreRef = useRef<boolean>(false);
  const lastLoadAtRef = useRef<number>(0);

  const [showTranslations, setShowTranslations] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [unreadBoundary, setUnreadBoundary] = useState<Date | null>(null);
  const initializedRoomIdRef = useRef<string | null>(null);
  const t = useTranslations('Chat');
  const tCommon = useTranslations('Common');
  const { customColorIndex } = useAppearanceStore();
  const { resolvedTheme } = useTheme();

  const hasScrolledToBottomRef = useRef<boolean>(false);

  // Set unread boundary when entering room
  useEffect(() => {
    if (currentRoomId && currentRoomId !== initializedRoomIdRef.current && currentRoom?.members && user?.id) {
        const member = currentRoom.members.find((m: any) => m.userId === user.id);
        if (member?.lastReadAt) {
            setUnreadBoundary(new Date(member.lastReadAt));
        } else {
            setUnreadBoundary(null);
        }
        initializedRoomIdRef.current = currentRoomId;
    } else if (currentRoomId !== initializedRoomIdRef.current) {
        // Reset if room changed but data not ready (will retry when data arrives)
        setUnreadBoundary(null);
    }
  }, [currentRoomId, currentRoom, user?.id]);

  // Mark as read when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (currentRoomId && document.visibilityState === 'visible') {
        markRoomAsRead(currentRoomId);
      }
    };

    window.addEventListener('focus', handleFocus);
    // Also check on mount/change if visible
    if (document.visibilityState === 'visible' && currentRoomId) {
       markRoomAsRead(currentRoomId);
    }

    return () => window.removeEventListener('focus', handleFocus);
  }, [currentRoomId, markRoomAsRead]);

  // Mark as read when scrolling to bottom
  useEffect(() => {
    if (!bottomRef.current || !currentRoomId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && document.visibilityState === 'visible') {
          markRoomAsRead(currentRoomId);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [currentRoomId, markRoomAsRead, messages.length]); // Re-attach when messages change to ensure observer is correct

  // Reset scroll state when room changes
  useEffect(() => {
    lastMessageIdRef.current = null;
    prevScrollHeightRef.current = 0;
    isLoadingMoreRef.current = false;
    hasScrolledToBottomRef.current = false;
  }, [currentRoomId]);

  const getScrollContainer = useCallback(() => {
    if (!scrollAreaRef.current) return null;
    return scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
  }, []);

  useEffect(() => {
    if (isLoadingMoreRef.current) {
      const scrollContainer = getScrollContainer();
      if (scrollContainer) {
        const newScrollHeight = scrollContainer.scrollHeight;
        const diff = newScrollHeight - prevScrollHeightRef.current;
        
        if (diff > 0) {
          scrollContainer.scrollTop += diff;
        }
        isLoadingMoreRef.current = false;
      }
    }
  }, [messages, getScrollContainer]);

  useLayoutEffect(() => {
    if (!bottomRef.current || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage.id;
    const prevLastMessageId = lastMessageIdRef.current;
    
    // Initial scroll for this room
    if (!hasScrolledToBottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        hasScrolledToBottomRef.current = true;
        lastMessageIdRef.current = lastMessageId;
        return;
    }
    
    // New message handling
    if (lastMessageId !== prevLastMessageId) {
        lastMessageIdRef.current = lastMessageId;

        // Don't auto-scroll if we just loaded history
        if (isLoadingMoreRef.current) return;

        const isMe = lastMessage?.senderId === user?.id;
        if (isMe) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
            const scrollContainer = getScrollContainer();
            if (scrollContainer) {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
                if (isNearBottom) {
                    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            } else {
                 // Fallback if scroll container not found (e.g. strict mode init)
                 const rect = bottomRef.current.getBoundingClientRect();
                 const isNearBottom = rect.top < window.innerHeight + 100;
                 if (isNearBottom) {
                     bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                 }
            }
        }
    }
  }, [messages, currentRoomId, user?.id, getScrollContainer]);

  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const handleLoadMore = () => {
      prevScrollHeightRef.current = scrollContainer.scrollHeight;
      isLoadingMoreRef.current = true;
      loadMoreMessages().catch(() => {
        isLoadingMoreRef.current = false;
      });
    };

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && hasMoreMessages && !isLoadingHistory) {
                console.log('[ChatArea] Infinite scroll triggered');
                handleLoadMore();
            }
        },
        { 
          root: scrollContainer,
          threshold: 0.1 
        }
    );

    if (topRef.current) {
        observer.observe(topRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreMessages, isLoadingHistory, loadMoreMessages, getScrollContainer]);

  // Keep view at bottom if content resizes (e.g. images load) and we were at bottom
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const observer = new ResizeObserver(() => {
       if (!hasScrolledToBottomRef.current) return;
       
       const scrollContainer = getScrollContainer();
       if (!scrollContainer) return;

       const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
       const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
       
       // If close to bottom (e.g. within 250px), maintain bottom position
       if (distanceFromBottom < 250) {
           bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
       }
    });

    observer.observe(contentElement);
    return () => observer.disconnect();
  }, [getScrollContainer]);

  const handleManualLoadMore = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      prevScrollHeightRef.current = scrollContainer.scrollHeight;
      isLoadingMoreRef.current = true;
    }
    
    loadMoreMessages().catch(() => {
      isLoadingMoreRef.current = false;
    });
  };

  const canLoadMore = useCallback((scrollTop: number) => {
    const now = Date.now();
    if (now - lastLoadAtRef.current < 400) return false;
    if (scrollTop > 10) return false;
    if (!hasMoreMessages || isLoadingHistory || isLoadingMoreRef.current) return false;
    lastLoadAtRef.current = now;
    return true;
  }, [hasMoreMessages, isLoadingHistory]);

  const triggerLoadMore = useCallback((scrollContainer: HTMLElement) => {
    prevScrollHeightRef.current = scrollContainer.scrollHeight;
    isLoadingMoreRef.current = true;
    loadMoreMessages().catch(() => {
      isLoadingMoreRef.current = false;
    });
  }, [loadMoreMessages]);

  const handleScrollCapture = useCallback((e: UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (canLoadMore(target.scrollTop)) {
      triggerLoadMore(target);
    }
  }, [canLoadMore, triggerLoadMore]);

  const handleWheelCapture = useCallback((e: WheelEvent<HTMLDivElement>) => {
    if (e.deltaY >= 0) return;
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;
    if (canLoadMore(scrollContainer.scrollTop)) {
      triggerLoadMore(scrollContainer);
    }
  }, [canLoadMore, getScrollContainer, triggerLoadMore]);

  const handleInviteToPrivate = useCallback((userId: string) => {
      if (!socket) return;
      socket.emit('startPrivateSession', { 
        userIds: [userId],
        sourceRoomId: currentRoomId 
      }, (response: any) => {
          if (response && response.error) {
              console.error('Failed to start private session:', response.error);
              toast.error(tCommon('error'), {
                  description: response.error
              });
          }
      });
  }, [socket, currentRoomId, tCommon]);

  const handleReply = useCallback((message: Message) => {
      setReplyingTo(message);
      fetchReplyMessage(message.id);
  }, [setReplyingTo, fetchReplyMessage]);

  const scrollToMessage = useCallback((messageId: string) => {
      const element = document.getElementById(`message-${messageId}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedMessageId(messageId);
          setTimeout(() => setHighlightedMessageId(null), 2000);
      } else {
          toast.info(t('messageNotFoundInView'));
      }
  }, [t]);

  const handleDelete = useCallback(async (messageId: string) => {
    if (window.confirm(t('deleteMessageConfirm'))) {
      setDeletingId(messageId);
      deleteMessage(messageId);
      // Reset deleting state after a short delay (UI will update via socket event)
      setTimeout(() => setDeletingId(null), 2000);
    }
  }, [t, deleteMessage]);

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

  return (
    <div 
        ref={scrollAreaRef}
        className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-background/50"
    >
      
      <ScrollArea 
        className="flex-1 min-h-0 px-4 md:px-6" 
        onScrollCapture={handleScrollCapture}
        onWheelCapture={handleWheelCapture}
      >
        <div ref={contentRef} className="space-y-6 pb-4 max-w-4xl mx-auto w-full pt-6">
          <div ref={topRef} className="h-px w-full" />
          
          {hasMoreMessages && !isLoadingHistory && (
             <div className="flex justify-center py-2 opacity-0 hover:opacity-100 transition-opacity">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleManualLoadMore}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Загрузить предыдущие сообщения
                </Button>
             </div>
          )}
          
          {isLoadingHistory && (
             <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
             </div>
          )}

          {messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isMe = msg.senderId === user?.id;
            const isSameSender = prevMsg?.senderId === msg.senderId;
            const showDate = !prevMsg || !isSameDay(new Date(prevMsg.createdAt), new Date(msg.createdAt));
            const showAvatar = !isMe && (!isSameSender || showDate);
            const showName = !isMe && (!isSameSender || showDate);

            // Unread divider logic
            const msgDate = new Date(msg.createdAt);
            const isUnread = unreadBoundary && msgDate > unreadBoundary;
            const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;
            const showUnreadDivider = isUnread && (!prevMsgDate || (unreadBoundary && prevMsgDate <= unreadBoundary));

            return (
                <div key={msg.id} className="flex flex-col w-full">
                    {showUnreadDivider && (
                        <div className="w-full flex items-center justify-center my-4 animate-in fade-in zoom-in duration-300">
                             <div className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-primary/20 backdrop-blur-sm select-none">
                                 {t('newMessages')}
                             </div>
                        </div>
                    )}
                    <MessageBubble 
                        message={msg}
                        isMe={isMe}
                        isSameSender={isSameSender}
                        showDate={showDate}
                        showAvatar={showAvatar}
                        showName={showName}
                        showTranslations={showTranslations}
                        onDelete={handleDelete}
                        onInviteToPrivate={handleInviteToPrivate}
                        onReply={handleReply}
                        onReplyClick={scrollToMessage}
                        isHighlighted={highlightedMessageId === msg.id}
                        onEdit={setEditingMessage}
                        onViewHistory={setViewingHistoryId}
                        onImageClick={setSelectedImage}
                        deletingId={deletingId}
                    />
                </div>
            );
          })}
          
          {currentRoomId && typingUsers[currentRoomId] && typingUsers[currentRoomId].filter(u => u.userId !== user?.id).length > 0 && (
             <div className="flex items-center gap-2 px-4 py-1 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 ml-10">
                 <div className="flex gap-1 items-center h-4">
                     <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                     <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                     <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                 </div>
                 <span className="text-xs font-medium opacity-80">
                     {typingUsers[currentRoomId].filter(u => u.userId !== user?.id).length === 1 
                         ? (
                            <>
                                <span style={{ 
                                    color: getUserColor(
                                        typingUsers[currentRoomId].filter(u => u.userId !== user?.id)[0].userId, 
                                        typingUsers[currentRoomId].filter(u => u.userId !== user?.id)[0].username, 
                                        resolvedTheme
                                    ) 
                                }}>
                                    {getUserDisplayName(typingUsers[currentRoomId].filter(u => u.userId !== user?.id)[0] as any)}
                                </span>
                                {` ${t('isTyping')}`}
                            </>
                         )
                         : t('multipleTyping')
                     }
                 </span>
             </div>
          )}
          
          <div ref={bottomRef} />
        </div>
      </ScrollArea>


      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none overflow-hidden flex items-center justify-center">
            {selectedImage && (
                <div className="relative w-full h-full flex items-center justify-center">
                     <img 
                        src={selectedImage} 
                        alt={t('fullSizeAttachment')} 
                        className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
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

      <MessageHistoryDialog 
        open={!!viewingHistoryId} 
        onOpenChange={(open) => !open && setViewingHistoryId(null)} 
        messageId={viewingHistoryId || ''} 
        roomId={currentRoomId || ''}
      />
    </div>
  );
}
