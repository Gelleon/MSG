'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  src: string;
  isMe: boolean;
}

export function AudioPlayer({ src, isMe }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Generate pseudo-random waveform bars
  // We use useMemo to keep them constant for the component lifecycle
  const bars = useMemo(() => {
    return Array.from({ length: 40 }, () => Math.max(0.3, Math.random()));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) : 0;

  return (
    <div className={cn(
      "flex items-center gap-3 p-2 pr-4 rounded-2xl min-w-[240px] select-none",
      // Remove background here if it's already provided by the parent bubble container
      // But keeping transparent/subtle bg ensures standalone visibility
      "bg-transparent"
    )}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shrink-0 transition-all duration-200 shadow-sm",
          isMe 
            ? "bg-white/20 text-white hover:bg-white/30" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="fill-current" size={18} />
        ) : (
          <Play className="fill-current ml-0.5" size={18} />
        )}
      </Button>

      <div className="flex flex-col flex-1 gap-1 min-w-[120px]">
        {/* Waveform Visualization */}
        <div 
            className="flex items-center gap-[2px] h-8 cursor-pointer group relative"
            onClick={handleSeek}
        >
            {/* Hover overlay for seeking hint */}
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {bars.map((height, index) => {
                const barProgress = index / bars.length;
                const isPlayed = barProgress < progress;
                
                return (
                    <div
                        key={index}
                        className={cn(
                            "w-[3px] rounded-full transition-all duration-150",
                            isMe 
                                ? (isPlayed ? "bg-white" : "bg-white/30") 
                                : (isPlayed ? "bg-primary" : "bg-primary/20")
                        )}
                        style={{ 
                            height: `${height * 100}%`,
                            // Add a subtle animation when playing
                            transform: isPlaying && isPlayed ? 'scaleY(1.1)' : 'scaleY(1)'
                        }}
                    />
                );
            })}
        </div>

        <div className={cn(
            "flex justify-between text-[10px] font-medium px-0.5",
            isMe ? "text-white/80" : "text-muted-foreground"
        )}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
