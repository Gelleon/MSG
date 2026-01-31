import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export default function InviteModal({ isOpen, onClose, roomId }: InviteModalProps) {
  const t = useTranslations('Invite');
  const [role, setRole] = useState('CLIENT');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/invitations/create', { roomId, role });
      const link = `${window.location.origin}/invite/${response.data.token}`;
      setGeneratedLink(link);
    } catch (error) {
      toast.error(t('failedGenerate'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('copied'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modalTitle')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!generatedLink ? (
            <>
              <div className="space-y-2">
                <Label>{t('selectRole')}</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">{t('manager')}</SelectItem>
                    <SelectItem value="CLIENT">{t('client')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                {isLoading ? t('generating') : t('generateLink')}
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <Label>{t('invitationLink')}</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly />
                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('linkHelp')}
              </p>
              <Button variant="ghost" onClick={() => setGeneratedLink('')} className="w-full mt-2">
                {t('generateNew')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
