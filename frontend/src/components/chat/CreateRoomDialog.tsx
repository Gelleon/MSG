'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function CreateRoomDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createRoom = useChatStore((state) => state.createRoom);
  const joinRoom = useChatStore((state) => state.joinRoom);
  const { user } = useAuthStore();
  const tDialogs = useTranslations('Dialogs');
  const tCommon = useTranslations('Common');

  const canCreate = user?.role === 'ADMIN'; // Check roles

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const newRoom = await createRoom(name, description);
      setOpen(false);
      setName('');
      setDescription('');
      toast.success(tDialogs('createRoom.success'));

      if (newRoom && newRoom.id) {
        try {
          await joinRoom(newRoom.id);
        } catch (joinError) {
          console.error('Failed to auto-join room:', joinError);
          toast.error(tCommon('errors.autoJoinFailed') || 'Failed to join room automatically');
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Failed to create room', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!canCreate) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val) setError(null);
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent p-0">
            <Plus size={14} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border border-border shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-inset ring-primary/20">
             <Plus className="text-primary" size={24} />
          </div>
          <DialogTitle className="text-center text-xl">{tDialogs('createRoom.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {tDialogs('createRoom.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">{tDialogs('createRoom.nameLabel')}</Label>
            <div className="relative group">
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                    }}
                    className={`h-10 bg-muted/30 border-muted-foreground/20 focus-visible:ring-offset-0 focus-visible:border-primary/50 transition-all ${error ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                    placeholder={tDialogs('createRoom.namePlaceholder')}
                    required
                />
            </div>
            {error && (
                <div className="flex items-center gap-1 text-red-500 text-xs ml-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}
            <p className="text-[10px] text-muted-foreground ml-1">
              {tDialogs('createRoom.uniqueName')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">{tDialogs('createRoom.descLabel')} <span className="text-muted-foreground/50 font-normal normal-case">({tCommon('optional')})</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tDialogs('createRoom.descPlaceholder')}
              className="resize-none min-h-[80px] bg-muted/30 border-muted-foreground/20 focus-visible:ring-offset-0 focus-visible:border-primary/50 transition-all"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/25 transition-all duration-300">{tDialogs('createRoom.submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
