'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useNotificationStore } from '@/lib/notification-store';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("AudioContext error", e);
  }
};

export function PrivateChatNotifier() {
  const t = useTranslations('Dialogs.privateSession');
  const { socket, joinRoom } = useChatStore();
  const { user } = useAuthStore();
  const { soundEnabled, visualEnabled } = useNotificationStore();

  useEffect(() => {
    if (!socket || !user) return;

    if (user.role === 'CLIENT') return; 

    const handlePrivateSessionStarted = (room: any) => {
        if (!visualEnabled) return;
        
        try {
            if (!room || !room.id) {
                console.error('Invalid room data received in privateSessionStarted:', room);
                return;
            }

            // Find the other user name
            // The room object from backend should have members populated now
            let displayName = 'Unknown User';
            if (room.members && Array.isArray(room.members)) {
                const otherMember = room.members.find((m: any) => m.user?.id !== user.id);
                if (otherMember && otherMember.user) {
                    displayName = otherMember.user.name || otherMember.user.email;
                }
            }

            if (soundEnabled) {
                playBeep();
            }

            toast(t('started'), {
                description: t('ready', {name: displayName}),
                action: {
                    label: t('openChat'),
                    onClick: () => {
                        joinRoom(room.id);
                    }
                },
                duration: 10000, 
                icon: <MessageSquare className="w-5 h-5 text-primary" />
            });
        } catch (error) {
            console.error('Error handling private session notification:', error);
        }
    };

    socket.on('privateSessionStarted', handlePrivateSessionStarted);

    return () => {
        socket.off('privateSessionStarted', handlePrivateSessionStarted);
    };
  }, [socket, user, soundEnabled, visualEnabled, joinRoom, t]);

  return null;
}
