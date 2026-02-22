import { useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { User } from '@/lib/store';

interface UserProfileCardProps {
  user: User;
  onAvatarUpload: (url: string) => Promise<void>;
}

export function UserProfileCard({ user, onAvatarUpload }: UserProfileCardProps) {
  const locale = useLocale();

  return (
    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-muted/20 profile-card">
      <div className="h-24 bg-primary/10 w-full relative profile-avatar-container">
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <AvatarUpload 
            user={{ name: user.name, avatarUrl: user.avatarUrl }} 
            onUploadSuccess={onAvatarUpload}
            className="h-24 w-24 border-4 border-background shadow-lg"
          />
        </div>
      </div>
      <CardContent className="pt-14 pb-6 text-center space-y-2 profile-card-content">
        <h3 className="text-lg font-semibold">{user.name}</h3>
        <p className="text-sm text-muted-foreground break-all">{user.email}</p>
        <div className="flex justify-center gap-2 pt-2 flex-wrap">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 uppercase">
            {user.role}
          </span>
          {user.position && (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-2">
              {locale === 'ru' ? user.position.nameRu : user.position.nameZh}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
