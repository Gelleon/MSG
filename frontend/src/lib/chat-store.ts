import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';
import api from './api';
import { useAuthStore } from './store';
import { toast } from 'sonner';

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

interface Room {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
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
  
  connect: () => void;
  disconnect: () => void;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, description?: string) => Promise<Room>;
  renameRoom: (roomId: string, name: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => void;
  deleteMessage: (messageId: string) => void;
  addMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setTranslationTargetLang: (lang: string) => void;
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

  setTranslationTargetLang: (lang: string) => set({ translationTargetLang: lang }),

  connect: () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io('http://localhost:4000', {
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
        // Mark as read immediately if active
        get().markRoomAsRead(message.roomId);
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
        const updatedRooms = rooms.map(room => {
            if (room.id === roomId) {
                return { ...room, unreadCount: 0 };
            }
            return room;
        });
        set({ rooms: updatedRooms });
    });

    socket.on('messageDeleted', (messageId: string) => {
      get().removeMessage(messageId);
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

  renameRoom: async (roomId: string, name: string) => {
    try {
        await api.patch(`/rooms/${roomId}`, { name });
        get().fetchRooms();
    } catch (error) {
        console.error('Failed to rename room', error);
        throw error;
    }
  },

  deleteRoom: async (roomId: string) => {
    try {
        await api.delete(`/rooms/${roomId}`);
        const { currentRoomId, rooms } = get();
        if (currentRoomId === roomId) {
             set({ currentRoomId: null });
        }
        get().fetchRooms();
    } catch (error) {
        console.error('Failed to delete room', error);
        throw error;
    }
  },

  joinRoom: async (roomId: string) => {
    const { socket, currentRoomId } = get();
    if (currentRoomId) {
        if(socket) socket.emit('leaveRoom', currentRoomId);
    }

    try {
      console.log(`[joinRoom] Joining room: ${roomId}`);
      // 1. Join the room in DB (ensure membership) and get updated room details
      const joinResponse = await api.post(`/rooms/${roomId}/join`, {});
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
      const response = await api.get(`/messages/room/${roomId}`);
      set({ messages: response.data, currentRoomId: roomId });
      
      // 3. Join via Socket
      if (socket) {
        socket.emit('joinRoom', roomId);
      }

      // 4. Mark as read
      api.post(`/rooms/${roomId}/read`);
      
      // 5. Reset unread count in local state
      set((state) => ({
        rooms: state.rooms.map(r => 
          r.id === roomId ? { ...r, unreadCount: 0 } : r
        )
      }));

    } catch (error) {
        console.error('Failed to join room', error);
        toast.error('Failed to join room');
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
    const { socket, currentRoomId } = get();
    if (socket && currentRoomId) {
      socket.emit('sendMessage', { 
        roomId: currentRoomId, 
        content,
        attachmentUrl,
        attachmentType,
        attachmentName
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
            } catch (e) {}
            
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
        const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, unreadCount: 0 } : r);
        set({ rooms: updatedRooms });
    } catch (error) {
        console.error('Failed to mark room as read', error);
    }
  },
}));
