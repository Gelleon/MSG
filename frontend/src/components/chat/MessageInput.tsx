'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, File, Loader2, Smile, Mic, StopCircle, Trash2, Play, Pause, Wand2, Pencil, CornerDownRight } from 'lucide-react';
import api from '@/lib/api';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { getUserColor, getColorByIndex } from '@/lib/color-utils';
import { useAppearanceStore } from '@/lib/appearance-store';

interface Attachment {
  file: File;
  preview?: string;
  type: 'image' | 'file';
}

interface MentionUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status?: 'online' | 'offline';
}

export default function MessageInput() {
  const t = useTranslations('Chat');
  const tCommon = useTranslations('Common');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Mention states
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isMentionLoading, setIsMentionLoading] = useState(false);
  const [mentionTotal, setMentionTotal] = useState(0);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { theme, resolvedTheme } = useTheme();
  const { user: currentUser } = useAuthStore();
  const { customColorIndex } = useAppearanceStore();
  
  const { sendMessage, editMessage, currentRoomId, replyingTo, setReplyingTo, editingMessage, setEditingMessage, startTyping, stopTyping } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!showMentionPopup || !currentRoomId) {
        setMentionResults([]);
        return;
    }

    const timer = setTimeout(async () => {
        setIsMentionLoading(true);
        try {
            const res = await api.get(`/rooms/${currentRoomId}/members`, {
                params: { search: mentionQuery, limit: 5 }
            });
            setMentionResults(res.data.data);
            setMentionTotal(res.data.total);
        } catch (e) {
            console.error(e);
        } finally {
            setIsMentionLoading(false);
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [mentionQuery, currentRoomId, showMentionPopup]);

  const selectMention = (user: MentionUser) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const caretPos = textarea.selectionStart;
      const text = content;
      const textBeforeCaret = text.slice(0, caretPos);
      const lastAtPos = textBeforeCaret.lastIndexOf('@');
      
      if (lastAtPos !== -1) {
          // Remove the query part from the original text position
          const prefix = text.slice(0, lastAtPos);
          const suffix = text.slice(caretPos);
          const textWithoutMention = (prefix + suffix).trim(); // Clean up potential double spaces
          
          const displayName = getUserDisplayName(user);
          const mentionText = `@${displayName} `;
          
          // Prepend the mention to the start of the message
          // If there are existing mentions or text, this puts the new mention first
          const newContent = mentionText + textWithoutMention;
          
          setContent(newContent);
          setShowMentionPopup(false);
          
          setTimeout(() => {
              if (textareaRef.current) {
                  // Position cursor immediately after the inserted mention
                  const newCursorPos = mentionText.length;
                  textareaRef.current.focus();
                  textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
              }
          }, 0);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;

    // Mention logic
    const caretPos = e.target.selectionStart;
    const textBeforeCaret = newValue.slice(0, caretPos);
    const lastAtPos = textBeforeCaret.lastIndexOf('@');
    
    let showPopup = false;
    if (lastAtPos !== -1) {
        // Check if @ is start of line or preceded by space
        if (lastAtPos === 0 || /\s/.test(textBeforeCaret[lastAtPos - 1])) {
            const query = textBeforeCaret.slice(lastAtPos + 1);
            // Only allow if no spaces in query (simple username/name search)
            if (!/\s/.test(query)) {
                setMentionQuery(query);
                setShowMentionPopup(true);
                setMentionIndex(0);
                showPopup = true;
            }
        }
    }
    
    if (!showPopup) {
        setShowMentionPopup(false);
    }

    if (currentRoomId) {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            startTyping(currentRoomId);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            stopTyping(currentRoomId);
        }, 3000);
    }
  };

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [editingMessage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error(t('micError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
        stopRecording();
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice-message.webm');
        const uploadRes = await api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const filename = uploadRes.data.filename;

        const transcribeRes = await api.post('/transcription/transcribe', { filename });
        setContent((prev) => prev + (prev ? ' ' : '') + transcribeRes.data.text);
    } catch (err) {
        console.error('Transcription failed:', err);
        toast.error(t('transcribeError'));
    } finally {
        setIsTranscribing(false);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setContent('');
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!content.trim() && !attachment && !audioBlob) || !currentRoomId || isUploading) return;

    let attachmentUrl = undefined;
    let attachmentType = undefined;
    let attachmentName = undefined;

    setIsUploading(true);

    try {
        if (audioBlob) {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice-message.webm');
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            attachmentUrl = response.data.url;
            attachmentType = 'audio/webm';
            attachmentName = t('voiceMessage');
        } else if (attachment) {
            const formData = new FormData();
            formData.append('file', attachment.file);
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            attachmentUrl = response.data.url;
            attachmentType = attachment.type;
            attachmentName = attachment.file.name;
        }

        if (editingMessage) {
            editMessage(editingMessage.id, content);
            setEditingMessage(null);
        } else {
            sendMessage(content, attachmentUrl, attachmentType, attachmentName);
        }
        
        setContent('');
        setAttachment(null);
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingDuration(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    } catch (error) {
        console.error('Failed to send message', error);
    } finally {
        setIsUploading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPopup && (mentionResults.length > 0 || isMentionLoading)) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionIndex(prev => (prev > 0 ? prev - 1 : mentionResults.length - 1));
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionIndex(prev => (prev < mentionResults.length - 1 ? prev + 1 : 0));
            return;
        }
        if ((e.key === 'Enter' || e.key === 'Tab') && mentionResults.length > 0) {
            e.preventDefault();
            selectMention(mentionResults[mentionIndex]);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setShowMentionPopup(false);
            return;
        }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : undefined;

    setAttachment({
        file,
        preview,
        type: isImage ? 'image' : 'file'
    });
  };
  
  const removeAttachment = () => {
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!currentRoomId) return null;

  return (
    <div className="p-3 bg-background/95 border-t border-border/30 z-20 sticky bottom-0 w-full backdrop-blur supports-[backdrop-filter]:bg-background/80">
       <div className="max-w-4xl mx-auto w-full relative">
           
           {/* Emoji Picker */}
           {showEmojiPicker && (
               <>
                 <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowEmojiPicker(false)} 
                 />
                 <div className="absolute bottom-full right-0 mb-3 z-20 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 zoom-in-95 origin-bottom-right border border-border/50">
                    <EmojiPicker 
                        theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                        emojiStyle={EmojiStyle.APPLE}
                        onEmojiClick={onEmojiClick}
                        width={320}
                        height={400}
                        lazyLoadEmojis={true}
                        searchDisabled={false}
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                    />
                 </div>
               </>
           )}

           {/* Previews Container */}
           <div className="absolute bottom-full left-0 w-full flex flex-col gap-2 pb-2 px-1">
               {/* Mention Popup */}
               {showMentionPopup && (
                   <div className="bg-popover border border-border shadow-lg rounded-xl overflow-hidden mb-2 w-64 animate-in fade-in slide-in-from-bottom-2 z-50">
                       <div className="p-2 border-b border-border/50 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{tCommon('members')}</span>
                            {mentionTotal > 0 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-medium">{mentionTotal}</span>}
                       </div>
                       <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 p-1">
                           {isMentionLoading ? (
                               <div className="flex items-center justify-center p-4 text-muted-foreground">
                                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                   <span className="text-xs">{tCommon('loading')}...</span>
                               </div>
                           ) : mentionResults.length === 0 ? (
                               <div className="p-3 text-center text-xs text-muted-foreground">
                                   {tCommon('noResults')}
                               </div>
                           ) : (
                               mentionResults.map((user, index) => (
                                   <button
                                       key={user.id}
                                       className={cn(
                                           "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                                           index === mentionIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                                       )}
                                       onClick={() => selectMention(user)}
                                       onMouseEnter={() => setMentionIndex(index)}
                                   >
                                       <Avatar className="h-6 w-6">
                                           <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
                                           <AvatarFallback className="text-[10px]">
                                               {getUserDisplayName(user).substring(0, 2).toUpperCase()}
                                           </AvatarFallback>
                                       </Avatar>
                                       <div className="flex flex-col min-w-0 flex-1">
                                           <span 
                                               className="font-medium truncate text-xs"
                                               style={{ 
                                                   color: (currentUser?.id === user.id && customColorIndex !== null) 
                                                       ? getColorByIndex(customColorIndex, resolvedTheme) 
                                                       : getUserColor(user.id, getUserDisplayName(user), resolvedTheme) 
                                               }}
                                           >
                                               {getUserDisplayName(user)}
                                           </span>
                                           <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                                       </div>
                                       {index === mentionIndex && <CornerDownRight className="h-3 w-3 opacity-50" />}
                                   </button>
                               ))
                           )}
                       </div>
                   </div>
               )}

               {/* Edit Preview */}
               {editingMessage && (
                   <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 rounded-lg border border-border shadow-lg p-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 max-w-xl">
                       <div className="w-1 self-stretch bg-blue-500 rounded-full" />
                       <div className="flex-1 min-w-0">
                           <div className="text-xs font-semibold text-blue-500 mb-0.5 flex items-center gap-1">
                               <Pencil size={12} />
                               {tCommon('edit')}
                           </div>
                           <div className="text-xs text-muted-foreground truncate">
                               {editingMessage.content}
                           </div>
                       </div>
                       <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-6 w-6 rounded-full -mr-1" 
                           onClick={cancelEdit}
                       >
                           <X size={14} />
                       </Button>
                   </div>
               )}

               {/* Reply Preview */}
               {replyingTo && !editingMessage && (
                   <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 rounded-lg border border-border shadow-lg p-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 max-w-xl">
                       <div className="w-1 self-stretch bg-primary rounded-full" />
                       <div className="flex-1 min-w-0">
                           <div 
                               id="reply-preview-label" 
                               className="text-xs font-semibold mb-0.5"
                               style={{ 
                                   color: (currentUser?.id === replyingTo.senderId && customColorIndex !== null) 
                                       ? getColorByIndex(customColorIndex, resolvedTheme) 
                                       : getUserColor(replyingTo.senderId, replyingTo.sender?.name || '', resolvedTheme) 
                               }}
                           >
                               {t('replyTo')} {replyingTo.sender?.name}
                           </div>
                           <div className="text-xs text-muted-foreground truncate">
                               {replyingTo.content || (replyingTo.attachmentName ? t('attachment') : '')}
                           </div>
                       </div>
                       <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-6 w-6 rounded-full -mr-1" 
                           onClick={() => setReplyingTo(null)}
                       >
                           <X size={14} />
                       </Button>
                   </div>
               )}

               {/* Attachment Preview */}
               {attachment && (
                   <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 rounded-lg border border-border shadow-lg p-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 w-fit max-w-xl">
                       {attachment.type === 'image' && attachment.preview ? (
                           <div className="h-10 w-10 rounded overflow-hidden bg-muted relative shrink-0">
                               <img src={attachment.preview} alt="Preview" className="h-full w-full object-cover" />
                           </div>
                       ) : (
                           <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                               <File size={18} />
                           </div>
                       )}
                       <div className="flex flex-col min-w-0">
                           <span className="text-xs font-medium truncate max-w-[200px]">{attachment.file.name}</span>
                           <span className="text-[10px] text-muted-foreground">{(attachment.file.size / 1024).toFixed(1)} KB</span>
                       </div>
                       <button onClick={removeAttachment} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                           <X size={14} />
                       </button>
                   </div>
               )}
           </div>

           {/* Voice Recorder UI */}
           {(isRecording || audioBlob) ? (
               <div className="flex items-center gap-2 bg-secondary/60 p-2 rounded-xl transition-all shadow-sm h-[52px]">
                   {isRecording ? (
                       <>
                           <div className="flex items-center gap-3 px-2 flex-1 animate-in fade-in slide-in-from-bottom-1">
                               <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                               <span className="text-sm font-medium tabular-nums min-w-[40px]">{formatTime(recordingDuration)}</span>
                               <span className="text-xs text-muted-foreground">Recording...</span>
                           </div>
                           <Button variant="ghost" size="icon" onClick={cancelRecording} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9">
                               <X size={20} />
                           </Button>
                           <Button size="icon" onClick={stopRecording} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 w-9 shadow-sm">
                               <StopCircle size={20} />
                           </Button>
                       </>
                   ) : (
                       <>
                           <Button variant="ghost" size="icon" onClick={cancelRecording} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9">
                               <Trash2 size={20} />
                           </Button>
                           
                           <Button variant="ghost" size="icon" onClick={togglePlayback} className={`rounded-full h-9 w-9 ${isPlaying ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted"}`}>
                               {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                           </Button>
                           
                           <div className="flex-1 h-8 bg-background/50 rounded-full flex items-center justify-center px-4 mx-1 relative overflow-hidden">
                               <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
                                   <div className={`h-full bg-primary ${isPlaying ? 'animate-[pulse_1s_infinite]' : ''}`} style={{ width: '100%' }} />
                               </div>
                               <span className="ml-3 text-xs tabular-nums font-medium">{formatTime(recordingDuration)}</span>
                           </div>

                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={handleTranscribe} 
                             disabled={isTranscribing}
                             className={`text-muted-foreground hover:text-primary rounded-full h-9 w-9 ${isTranscribing ? 'bg-primary/10 text-primary' : ''}`}
                             title="Transcribe to text"
                           >
                              {isTranscribing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                           </Button>

                           <Button onClick={() => handleSubmit()} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9 shadow-sm">
                              <Send size={18} className="ml-0.5" />
                           </Button>
                       </>
                   )}
               </div>
           ) : (
           <div className="flex items-end gap-2 bg-secondary/60 p-1.5 rounded-3xl transition-all shadow-sm hover:bg-secondary/80 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/10 focus-within:shadow-md">
               
               <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   onChange={handleFileChange} 
                   accept="image/*,.pdf,.doc,.docx,.txt"
               />
               
               <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-background shrink-0"
                   onClick={handleFileClick}
                   disabled={isUploading}
               >
                   <Paperclip size={20} />
               </Button>

               <Textarea
                   ref={textareaRef}
                   value={content}
                   onChange={handleInputChange}
                   onKeyDown={handleKeyDown}
                   placeholder={replyingTo ? `${t('replyTo')} ${replyingTo.sender?.name}...` : t('typeMessage')}
                   aria-label={replyingTo ? `${t('replyTo')} ${replyingTo.sender?.name}` : t('typeMessage')}
                   aria-describedby={replyingTo ? "reply-preview-label" : undefined}
                   className="min-h-[40px] max-h-[150px] py-2.5 px-2 bg-transparent border-none focus-visible:ring-0 resize-none shadow-none text-[15px] leading-relaxed scrollbar-thin scrollbar-thumb-muted-foreground/20"
                   rows={1}
               />

               <div className="flex items-center gap-1 shrink-0 pb-0.5">
                   <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-background transition-colors ${showEmojiPicker ? 'text-primary bg-background shadow-sm' : ''}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                   >
                        <Smile size={20} />
                   </Button>

                   {!content && !attachment && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-background"
                            onClick={startRecording}
                        >
                            <Mic size={20} />
                        </Button>
                   )}
                   
                   {(content || attachment) && (
                       <Button 
                           onClick={() => handleSubmit()} 
                           disabled={isUploading || (!content.trim() && !attachment)}
                           size="icon"
                           className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all animate-in zoom-in-50 duration-200"
                       >
                           {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                       </Button>
                   )}
               </div>
           </div>
           )}
           
           <div className="mt-2 text-center">
               <p className="text-[10px] text-muted-foreground/60">
                   Press <kbd className="font-sans px-1 py-0.5 bg-muted rounded border border-border/50 text-foreground/70">Enter</kbd> to send, <kbd className="font-sans px-1 py-0.5 bg-muted rounded border border-border/50 text-foreground/70">Shift + Enter</kbd> for new line
               </p>
           </div>
       </div>
    </div>
  );
}
