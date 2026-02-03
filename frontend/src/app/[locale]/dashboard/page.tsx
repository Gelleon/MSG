'use client';

import ChatArea from '@/components/chat/ChatArea';
import MessageInput from '@/components/chat/MessageInput';
import ChatHeader from '@/components/chat/ChatHeader';
import { useChatStore } from '@/lib/chat-store';
import { cn, stringToColor } from '@/lib/utils';
import { Lock, CornerDownRight, ShieldCheck, Grid } from 'lucide-react';

export default function DashboardPage() {
  const { rooms, currentRoomId } = useChatStore();
  const currentRoom = rooms.find(r => r.id === currentRoomId);
  const parentRoom = currentRoom?.parentRoom;

  if (parentRoom) {
    const parentColor = stringToColor(parentRoom.name, 70, 95);
    return (
       <div className="flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-500" style={{ backgroundColor: parentColor }}>
           {/* Parent Room Context Background */}
           <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                style={{ 
                    backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                    color: stringToColor(parentRoom.name, 60, 40)
                }} 
           />
           
           <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background/40 to-transparent z-0 flex items-start justify-between px-8 py-6">
               <div className="flex items-center gap-3 text-foreground/40">
                   <Grid className="w-8 h-8 opacity-40" />
                   <span className="text-4xl font-bold tracking-tight opacity-40 select-none">#{parentRoom.name}</span>
               </div>
               <span className="text-sm font-medium px-3 py-1 bg-background/40 backdrop-blur-md rounded-full border border-black/5 text-foreground/50 shadow-sm">
                   Parent Context
               </span>
           </div>
           
           {/* Nested Room Container */}
           <div className="relative z-10 flex-1 flex flex-col mx-4 mb-4 mt-20 bg-background/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-500 ease-out">
               {/* Context Indicator Strip */}
               <div className="bg-gradient-to-r from-secondary/50 to-background px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2 border-b border-border/40 backdrop-blur-md">
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-lg text-primary">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider text-[10px] font-bold">Linked</span>
                   </div>
                   <span>Private Session inside <span className="font-bold text-foreground/80 border-b border-dashed border-foreground/30">{parentRoom.name}</span></span>
                   <div className="ml-auto flex items-center gap-1.5 text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                       <ShieldCheck className="w-3.5 h-3.5" />
                       <span className="font-semibold">Secure Environment</span>
                   </div>
               </div>
               
               <ChatHeader />
               <ChatArea />
               <MessageInput />
           </div>
       </div>
    );
 }

  // Standard Room View
  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
        {/* Subtle Background Pattern for Standard Rooms */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
             style={{
                 backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                 backgroundSize: '64px 64px',
             }}
        />
        <div className="relative z-10 flex flex-col h-full">
            <ChatHeader />
            <ChatArea />
            <MessageInput />
        </div>
    </div>
  );
}
