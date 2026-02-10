
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

const LIGHT_BG = { r: 255, g: 255, b: 255 };
const DARK_BG = { r: 15, g: 23, b: 42 };

function hslToRgb(h: number, s: number, l: number) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function srgbToLinear(value: number) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(rgb: { r: number; g: number; b: number }) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: { r: number; g: number; b: number }, background: { r: number; g: number; b: number }) {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getAccessibleLightness(h: number, s: number, theme: string | undefined) {
  const bg = theme === 'dark' ? DARK_BG : LIGHT_BG;
  const targetRatio = 4.5;
  const start = theme === 'dark' ? 72 : 36;
  if (theme === 'dark') {
    for (let l = start; l <= 90; l += 1) {
      const ratio = contrastRatio(hslToRgb(h, s, l), bg);
      if (ratio >= targetRatio) return l;
    }
    return 90;
  }

  for (let l = start; l >= 15; l -= 1) {
    const ratio = contrastRatio(hslToRgb(h, s, l), bg);
    if (ratio >= targetRatio) return l;
  }
  return 15;
}

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
    const lightness = getAccessibleLightness(h, s, theme);
    return `hsl(${h}, ${s}%, ${lightness}%)`;
}

// Generate all available colors for the picker
export function getAllUserColors(theme: string | undefined = 'light'): { color: string, index: number }[] {
    return USER_COLOR_PALETTE.map((_, index) => ({
        color: getColorByIndex(index, theme),
        index
    }));
}
