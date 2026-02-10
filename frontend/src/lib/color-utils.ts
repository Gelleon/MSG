
// Predefined accessible palette for user names
// Using HSL values to easily adapt to light/dark modes
// [Hue, Saturation] - Lightness will be dynamic
const USER_COLOR_PALETTE = [
  [0, 65],    // Red
  [25, 80],   // Orange
  [45, 90],   // Yellow-Orange (Adjusted)
  [85, 70],   // Lime Green
  [120, 60],  // Green
  [160, 65],  // Teal
  [190, 70],  // Cyan
  [210, 75],  // Blue
  [230, 70],  // Indigo
  [260, 65],  // Purple
  [290, 65],  // Violet
  [320, 70],  // Pink
  [340, 75],  // Rose
];

export function getUserColor(userId: string, userName: string, theme: string | undefined = 'light'): string {
  // Use userId for stability, fallback to name
  const seed = userId || userName || 'unknown';
  
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Pick from palette
  const index = Math.abs(hash) % USER_COLOR_PALETTE.length;
  return getColorByIndex(index, theme);
}

export function getColorByIndex(index: number, theme: string | undefined = 'light'): string {
    if (index < 0 || index >= USER_COLOR_PALETTE.length) return 'inherit';
    
    const [h, s] = USER_COLOR_PALETTE[index];
    
    // Accessibility adjustments based on theme
    // Light mode: darker colors for contrast against white
    // Dark mode: lighter colors for contrast against dark
    const lightness = theme === 'dark' ? 70 : 40;
    
    // Special case for yellow/lime in light mode to ensure contrast
    const finalLightness = (theme !== 'dark' && (h > 40 && h < 100)) ? 35 : lightness;
  
    return `hsl(${h}, ${s}%, ${finalLightness}%)`;
}

// Generate all available colors for the picker
export function getAllUserColors(theme: string | undefined = 'light'): { color: string, index: number }[] {
    return USER_COLOR_PALETTE.map((_, index) => ({
        color: getColorByIndex(index, theme),
        index
    }));
}
