import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stringToColor(str: string, saturation: number = 70, lightness: number = 80): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, ${saturation}%, ${lightness}%)`;
}

export function stringToGradient(str: string): string {
  const color1 = stringToColor(str, 80, 90);
  const color2 = stringToColor(str.split('').reverse().join(''), 70, 85);
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

export function getUserDisplayName(user: { id?: string; userId?: string; name?: string | null; email?: string | null; username?: string | null } | null | undefined): string {
  if (!user) return 'Пользователь';
  if (user.name) return user.name;
  if (user.username) return user.username;
  if (user.email) return user.email; // Use email as fallback
  const id = user.id || user.userId;
  if (id) return `User ${id.slice(0, 8)}`; // Use ID segment as identifier if name is missing
  return 'Пользователь';
}

export function getRoomDisplayName(room: { name: string; isPrivate?: boolean; users?: any[]; members?: any[] }, currentUserId?: string): string {
  if (!room.isPrivate) return room.name;
  if (!currentUserId) return room.name;

  let otherUser: any = null;

  if (room.users && Array.isArray(room.users) && room.users.length > 0) {
      otherUser = room.users.find((u: any) => u && u.id !== currentUserId);
  }
  
  // Fallback to members if users not found or empty
  if (!otherUser && room.members && Array.isArray(room.members)) {
      const otherMember = room.members.find((m: any) => m.userId !== currentUserId);
      if (otherMember && otherMember.user) {
          otherUser = otherMember.user;
      }
  }

  if (otherUser) {
      return getUserDisplayName(otherUser);
  }

  // Handle self-chat (if only 1 user and it's me)
  if (room.users && room.users.length === 1 && room.users[0].id === currentUserId) {
      return getUserDisplayName(room.users[0]); // Or "Saved Messages"
  }

  return room.name;
}
