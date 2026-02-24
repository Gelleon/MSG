import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';
import api, { getApiBaseUrl } from './api';
import { useAuthStore, User } from './store';
import { toast } from 'sonner';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { 
    name: string | null; 
    email: string; 
    role?: string;
    position?: {
      nameRu: string;
      nameZh: string;
    };
  };
  createdAt: string;
  roomId: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  translations?: string;
  replyToId?: string;
  replyTo?: Message;
  updatedAt?: string;
  isEdited?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
}

export interface RoomMember {
  userId: string;
  roomId: string;
  lastReadAt: string;
  role?: string;
  user?: User;
  name?: string | null;
  email?: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
  members?: RoomMember[];
  users?: User[];
  isPrivate?: boolean;
  parentRoomId?: string;
  parentRoom?: {
    id: string;
    name: string;
  };
}

interface ChatState {
  socket: Socket | null;
  rooms: Room[];
  currentRoomId: string | null;
  messages: Message[];
  isConnected: boolean;
  translationTargetLang: string;
  replyingTo: Message | null;
  loadingReplyId: string | null;
  editingMessage: Message | null;
  
  isLoadingHistory: boolean;
  hasMoreMessages: boolean;
  typingUsers: Record<string, { userId: string; username: string; name?: string; email?: string }[]>;
  
  connect: () => void;
  disconnect: () => void;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, description?: string) => Promise<Room>;
  updateRoom: (roomId: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string, invitationCode?: string) => void;
  loadMoreMessages: () => Promise<void>;
  leaveRoom: (roomId: string) => void;
  sendMessage: (content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setTranslationTargetLang: (lang: string) => void;
  setReplyingTo: (message: Message | null) => void;
  fetchReplyMessage: (messageId: string) => Promise<void>;
  setEditingMessage: (message: Message | null) => void;
  translateMessage: (messageId: string, targetLang: string) => Promise<void>;
  markRoomAsRead: (roomId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  rooms: [],
  currentRoomId: null,
  messages: [],
  isConnected: false,
  translationTargetLang: 'ru',
  replyingTo: null,
  loadingReplyId: null,
  editingMessage: null,
  isLoadingHistory: false,
  hasMoreMessages: true,
  typingUsers: {},

  setTranslationTargetLang: (lang: string) => set({ translationTargetLang: lang }),
  setReplyingTo: (message: Message | null) => set({ replyingTo: message }),
  fetchReplyMessage: async (messageId: string) => {
    set({ loadingReplyId: messageId });
    try {
      // Fetch fresh message details
      const response = await api.get(`/messages/${messageId}`);
      if (response.data) {
        set({ replyingTo: response.data, loadingReplyId: null });
      } else {
        throw new Error('Empty response');
      }
    } catch (error) {
      console.error('Failed to fetch reply message', error);
      // Fallback: try to find in local messages
      const localMessage = get().messages.find(m => m.id === messageId);
      if (localMessage) {
        set({ replyingTo: localMessage, loadingReplyId: null });
      } else {
        set({ loadingReplyId: null });
        toast.error('Не удалось загрузить сообщение для ответа');
      }
    }
  },
  setEditingMessage: (message: Message | null) => set({ editingMessage: message }),

  connect: () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(getApiBaseUrl(), {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      set({ isConnected: false });
    });

    socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      // You could add a toast notification here
      // alert(error); 
    });

    socket.on('newMessage', (message: Message) => {
      const { currentRoomId, rooms } = get();
      if (message.roomId === currentRoomId) {
        get().addMessage(message);
      } else {
        // Increment unread count
        const updatedRooms = rooms.map(room => {
            if (room.id === message.roomId) {
                return { ...room, unreadCount: (room.unreadCount || 0) + 1 };
            }
            return room;
        });
        set({ rooms: updatedRooms });
      }
    });

    socket.on('roomRead', ({ roomId }: { roomId: string }) => {
        const { rooms } = get();
        const userId = useAuthStore.getState().user?.id;
        
        const updatedRooms = rooms.map(room => {
            if (room.id === roomId) {
                const updatedMembers = room.members?.map(member => {
                    if (member.userId === userId) {
                        return { ...member, lastReadAt: new Date().toISOString() };
                    }
                    return member;
                });
                return { ...room, unreadCount: 0, members: updatedMembers };
            }
            return room;
        });
        set({ rooms: updatedRooms });
    });

    socket.on('messageDeleted', (messageId: string) => {
      get().removeMessage(messageId);
    });

    socket.on('messageUpdated', (message: Message) => {
      get().updateMessage(message);
    });

    socket.on('privateSessionStarted', (room: Room) => {
      const { rooms } = get();
      if (!rooms.some(r => r.id === room.id)) {
          set({ rooms: [room, ...rooms] });
      }
    });

    socket.on('privateSessionClosed', ({ roomId }: { roomId: string }) => {
      const { rooms, currentRoomId } = get();
      const updatedRooms = rooms.filter(r => r.id !== roomId);
      
      if (currentRoomId === roomId) {
         set({ rooms: updatedRooms, currentRoomId: null, messages: [] });
      } else {
         set({ rooms: updatedRooms });
      }
    });

    socket.on('typingStart', ({ roomId, userId, name, username, email }: { roomId: string, userId: string, name?: string, username: string, email?: string }) => {
        set((state) => {
            const roomTypingUsers = state.typingUsers[roomId] || [];
            if (roomTypingUsers.some(u => u.userId === userId)) {
                return state;
            }
            return {
                typingUsers: {
                    ...state.typingUsers,
                    [roomId]: [...roomTypingUsers, { userId, name, username, email }]
                }
            };
        });
    });

    socket.on('typingStop', ({ roomId, userId }: { roomId: string, userId: string }) => {
        set((state) => {
            const roomTypingUsers = state.typingUsers[roomId] || [];
            return {
                typingUsers: {
                    ...state.typingUsers,
                    [roomId]: roomTypingUsers.filter(u => u.userId !== userId)
                }
            };
        });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchRooms: async () => {
    try {
      const response = await api.get('/rooms'); // Ensure this endpoint exists
      set({ rooms: response.data });
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  },

  createRoom: async (name: string, description?: string) => {
    try {
        const response = await api.post('/rooms', { name, description });
        await get().fetchRooms();
        return response.data;
    } catch (error) {
        console.error('Failed to create room', error);
        throw error;
    }
  },

  updateRoom: async (roomId: string, data: { name?: string; description?: string }) => {
    try {
        await api.patch(`/rooms/${roomId}`, data);
        get().fetchRooms();
    } catch (error) {
        console.error('Failed to update room', error);
        throw error;
    }
  },

  deleteRoom: async (roomId: string) => {
    try {
        await api.delete(`/rooms/${roomId}`);
        const { currentRoomId } = get();
        if (currentRoomId === roomId) {
             set({ currentRoomId: null });
        }
        get().fetchRooms();
    } catch (error) {
        console.error('Failed to delete room', error);
        throw error;
    }
  },

  joinRoom: async (roomId: string, invitationCode?: string) => {
    const { socket, currentRoomId } = get();
    if (currentRoomId) {
        if(socket) socket.emit('leaveRoom', currentRoomId);
    }

    const toastId = toast.loading('Вход в комнату...');

    try {
      console.log(`[joinRoom] Starting join process for room: ${roomId} (code: ${invitationCode || 'none'})`);
      
      // 1. Join the room in DB (ensure membership) with retry mechanism
      let retries = 3;
      let delay = 1000;
      let joinResponse;

      while (retries > 0) {
        try {
            console.log(`[joinRoom] API join attempt (retries left: ${retries})`);
            joinResponse = await api.post(`/rooms/${roomId}/join`, { invitationCode });
            console.log(`[joinRoom] API join successful`);
            break;
        } catch (error) {
            console.error(`[joinRoom] Attempt failed. Retries left: ${retries - 1}`, error);
            retries--;
            if (retries === 0) throw error;
            toast.loading(`Повторная попытка входа... (${3 - retries}/3)`, { id: toastId });
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
      }

      if (!joinResponse || !joinResponse.data) {
        throw new Error('Failed to join room: No response data');
      }

      const joinedRoom = joinResponse.data;

      // Update rooms list with the joined room (handles case where room wasn't in list yet or needs update)
      set((state) => {
          const existingRoomIndex = state.rooms.findIndex(r => r.id === roomId);
          const updatedRoom = { ...joinedRoom, unreadCount: 0 }; // Reset unread count on join
          
          let newRooms;
          if (existingRoomIndex >= 0) {
              newRooms = [...state.rooms];
              newRooms[existingRoomIndex] = { ...newRooms[existingRoomIndex], ...updatedRoom };
          } else {
              newRooms = [...state.rooms, updatedRoom];
          }
          return { rooms: newRooms };
      });

      // 2. Load messages for the room
      console.log(`[joinRoom] Fetching messages for room: ${roomId}`);
      const response = await api.get(`/messages/room/${roomId}?limit=50`);
      console.log(`[joinRoom] Received ${response.data.length} messages`);

      if (!Array.isArray(response.data)) {
        console.error('[joinRoom] Invalid response structure', response.data);
        throw new Error('Invalid messages format');
      }

      set({ 
        messages: response.data, 
        currentRoomId: roomId,
        hasMoreMessages: response.data.length === 50 
      });
      
      // 3. Join via Socket
      if (socket) {
        console.log(`[joinRoom] Emitting socket joinRoom event: ${roomId}`);
        socket.emit('joinRoom', roomId);
      } else {
        console.warn(`[joinRoom] Socket not connected, skipping socket join`);
      }

      // 4. Mark as read
      api.post(`/rooms/${roomId}/read`).catch(e => console.error('[joinRoom] Failed to mark as read', e));
      
      // 5. Reset unread count in local state and clear typing users
      set((state) => ({
        rooms: state.rooms.map(r => 
          r.id === roomId ? { ...r, unreadCount: 0 } : r
        ),
        typingUsers: {
            ...state.typingUsers,
            [roomId]: []
        }
      }));

      toast.success('Вы успешно вошли в комнату', { id: toastId });

    } catch (error) {
        console.error('[joinRoom] Final failure:', error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).response?.data?.message || 'Не удалось войти в комнату';
        toast.error(errorMessage, { id: toastId });
    }
  },

  loadMoreMessages: async () => {
    const { currentRoomId, messages, isLoadingHistory, hasMoreMessages } = get();
    if (!currentRoomId || isLoadingHistory || !hasMoreMessages || messages.length === 0) return;

    set({ isLoadingHistory: true });
    try {
        const oldestMessageId = messages[0].id;
        const response = await api.get(`/messages/room/${currentRoomId}?cursor=${oldestMessageId}&limit=50`);
        
        const newMessages = response.data;
        if (newMessages.length < 50) {
            set({ hasMoreMessages: false });
        }
        
        if (newMessages.length > 0) {
            set((state) => {
                const existingIds = new Set(state.messages.map(m => m.id));
                const uniqueNewMessages = newMessages.filter((m: Message) => !existingIds.has(m.id));
                
                // If all messages were duplicates, we might want to fetch more or stop?
                // For now, just add unique ones.
                
                return {
                    messages: [...uniqueNewMessages, ...state.messages],
                    isLoadingHistory: false
                };
            });
        } else {
            set({ isLoadingHistory: false, hasMoreMessages: false });
        }
    } catch (error) {
        console.error('Failed to load more messages', error);
        toast.error('Не удалось загрузить историю сообщений');
        set({ isLoadingHistory: false });
    }
  },

  leaveRoom: (roomId: string) => {
     const { socket } = get();
     if (socket) {
         socket.emit('leaveRoom', roomId);
     }
     set({ currentRoomId: null, messages: [] });
  },

  sendMessage: (content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => {
    const { socket, currentRoomId, replyingTo } = get();
    if (socket && currentRoomId) {
      socket.emit('sendMessage', { 
        roomId: currentRoomId, 
        content,
        attachmentUrl,
        attachmentType,
        attachmentName,
        replyToId: replyingTo ? replyingTo.id : undefined
      });
      set({ replyingTo: null });
    }
  },

  startTyping: (roomId: string) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
        socket.emit('typingStart', { roomId });
    } else {
        api.post(`/rooms/${roomId}/typing`, { status: true }).catch(console.error);
    }
  },

  stopTyping: (roomId: string) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
        socket.emit('typingStop', { roomId });
    } else {
        api.post(`/rooms/${roomId}/typing`, { status: false }).catch(console.error);
    }
  },

  editMessage: (messageId: string, content: string) => {
    const { socket, currentRoomId } = get();
    if (socket && currentRoomId) {
      socket.emit('editMessage', { 
        messageId, 
        roomId: currentRoomId,
        content
      });
    }
  },

  deleteMessage: (messageId: string) => {
    const { socket, currentRoomId } = get();
    if (socket && currentRoomId) {
      socket.emit('deleteMessage', { 
        messageId, 
        roomId: currentRoomId 
      });
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  updateMessage: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
    }));
  },

  removeMessage: (messageId: string) => {
    set((state) => ({ 
      messages: state.messages.filter(m => m.id !== messageId) 
    }));
  },

  translateMessage: async (messageId: string, targetLang: string) => {
    try {
      const response = await api.post(`/messages/${messageId}/translate`, { targetLang });
      const { translatedText } = response.data;
      
      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg.id === messageId) {
            let translations: Record<string, string> = {};
            try {
                translations = msg.translations ? JSON.parse(msg.translations) : {};
            } catch {}
            
            translations[targetLang] = translatedText;
            
            return {
                ...msg,
                translations: JSON.stringify(translations)
            };
          }
          return msg;
        })
      }));
    } catch (error) {
      console.error('Failed to translate message', error);
      throw error;
    }
  },

  markRoomAsRead: async (roomId: string) => {
    const { socket } = get();
    try {
        await api.post(`/rooms/${roomId}/read`);
        if (socket) {
            socket.emit('markAsRead', roomId);
        }
        // Optimistic update
        const { rooms } = get();
        const userId = useAuthStore.getState().user?.id;
        const updatedRooms = rooms.map(r => {
            if (r.id === roomId) {
                const updatedMembers = r.members?.map(member => {
                    if (member.userId === userId) {
                        return { ...member, lastReadAt: new Date().toISOString() };
                    }
                    return member;
                });
                return { ...r, unreadCount: 0, members: updatedMembers };
            }
            return r;
        });
        set({ rooms: updatedRooms });
    } catch (error) {
        console.error('Failed to mark room as read', error);
    }
  },
}));
