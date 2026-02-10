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

export function getUserDisplayName(user: { id?: string; name?: string | null; email?: string | null; username?: string | null } | null | undefined): string {
  if (!user) return 'Пользователь';
  if (user.name) return user.name;
  if (user.username) return user.username;
  if (user.id) return `User ${user.id.slice(0, 8)}`; // Use ID segment as identifier if name is missing
  return 'Пользователь';
}
