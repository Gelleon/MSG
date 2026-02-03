import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { useChatStore } from '@/lib/chat-store';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MessageHistory {
  id: string;
  content: string;
  changedAt: string;
}

interface MessageHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  roomId: string;
}

export function MessageHistoryDialog({ open, onOpenChange, messageId, roomId }: MessageHistoryDialogProps) {
  const [history, setHistory] = useState<MessageHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useChatStore();
  const t = useTranslations('Chat');
  const tCommon = useTranslations('Common');

  useEffect(() => {
    if (open && messageId && roomId && socket) {
      setLoading(true);
      socket.emit('getMessageHistory', { messageId, roomId }, (data: MessageHistory[]) => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [open, messageId, roomId, socket]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('editHistory')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('noHistory')}
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {history.map((item, index) => (
                <div key={item.id} className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0">
                  <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(new Date(item.changedAt), 'PPpp')}
                  </div>
                  <div className="text-sm whitespace-pre-wrap bg-muted/30 p-2 rounded-md">
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
