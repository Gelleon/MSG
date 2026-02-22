'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface AvatarUploadProps {
  user: {
    name?: string;
    avatarUrl?: string;
  };
  onUploadSuccess: (url: string) => void;
  className?: string;
}

export function AvatarUpload({ user, onUploadSuccess, className }: AvatarUploadProps) {
  const t = useTranslations('Profile');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  }, []);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('invalidFileType'));
      return false;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(t('fileTooLarge'));
      return false;
    }

    return true;
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            URL.revokeObjectURL(img.src);
            return reject(new Error('Failed to get canvas context'));
        }

        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
            URL.revokeObjectURL(img.src);
            if (blob) {
                const resizedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                });
                resolve(resizedFile);
            } else {
                reject(new Error('Canvas to Blob failed'));
            }
        }, file.type, 0.9); // 0.9 quality
      };
      img.onerror = (error) => {
          URL.revokeObjectURL(img.src);
          reject(error);
      };
    });
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    
    // Create preview immediately for better UX
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // Resize image before upload
      const resizedFile = await resizeImage(file);
      
      const formData = new FormData();
      formData.append('file', resizedFile);

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { url } = response.data;
      onUploadSuccess(url);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload avatar');
      // Revert preview on error
      setPreviewUrl(null); 
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div 
        className={cn(
          "relative group cursor-pointer rounded-full transition-all duration-200",
          isDragging && "ring-4 ring-primary/50 scale-105",
          isUploading && "opacity-70 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
          <AvatarImage 
            src={previewUrl || user.avatarUrl} 
            alt={user.name || 'User avatar'} 
            className="object-cover"
          />
          <AvatarFallback className="text-4xl bg-primary/10 text-primary font-semibold">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
          <Upload className="h-8 w-8 text-white drop-shadow-md" />
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className="font-medium text-sm">{t('profilePicture')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('uploadDesc')}
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
      />
    </div>
  );
}
