/**
 * GCMC Platform Design System - Design Tokens
 * Professional compliance management platform theme
 */

export const designTokens = {
  colors: {
    // Primary Brand (Professional Blue-Gray)
    primary: {
      50: '#f0f4f8',
      100: '#d9e2ec',
      200: '#bcccdc',
      300: '#9fb3c8',
      400: '#829ab1',
      500: '#627d98',  // Main brand color
      600: '#486581',
      700: '#334e68',
      800: '#243b53',
      900: '#102a43',
    },
    // Accent (Trust Green - for compliance/success)
    accent: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // Main accent
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Semantic colors
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    // Neutral (Warm Gray for better readability)
    neutral: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Inter var', 'Inter', 'system-ui'],
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    // 8px base grid
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  animation: {
    duration: {
      fast: '150ms',
      base: '250ms',
      slow: '350ms',
    },
    easing: {
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export type DesignTokens = typeof designTokens;

/**
 * Convert hex color to OKLCH for Tailwind CSS v4
 * Helper function for color conversion
 */
export function hexToOklch(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

  // Convert RGB to linear RGB
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);

  // Convert linear RGB to XYZ
  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

  // Convert XYZ to Lab
  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1/3) : 7.787 * t + 16/116;
  const fx = f(x / 0.95047);
  const fy = f(y / 1.00000);
  const fz = f(z / 1.08883);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);

  // Convert Lab to LCH
  const c = Math.sqrt(a * a + bLab * bLab);
  const h = Math.atan2(bLab, a) * 180 / Math.PI;

  // Approximate OKLCH (simplified conversion)
  const oklchL = (l / 100).toFixed(3);
  const oklchC = (c / 150).toFixed(3);
  const oklchH = (h >= 0 ? h : h + 360).toFixed(3);

  return `oklch(${oklchL} ${oklchC} ${oklchH})`;
}

/**
 * Pre-computed OKLCH color values for GCMC brand
 */
export const oklchColors = {
  primary: {
    50: 'oklch(0.965 0.005 240)',
    100: 'oklch(0.910 0.010 240)',
    200: 'oklch(0.840 0.020 240)',
    300: 'oklch(0.765 0.030 240)',
    400: 'oklch(0.680 0.040 240)',
    500: 'oklch(0.570 0.050 240)',  // Main brand
    600: 'oklch(0.475 0.055 240)',
    700: 'oklch(0.390 0.060 240)',
    800: 'oklch(0.310 0.055 240)',
    900: 'oklch(0.230 0.045 240)',
  },
  accent: {
    50: 'oklch(0.980 0.020 145)',
    100: 'oklch(0.950 0.050 145)',
    200: 'oklch(0.910 0.090 145)',
    300: 'oklch(0.850 0.130 145)',
    400: 'oklch(0.780 0.165 145)',
    500: 'oklch(0.700 0.195 145)',  // Main accent
    600: 'oklch(0.600 0.190 145)',
    700: 'oklch(0.510 0.175 145)',
    800: 'oklch(0.440 0.155 145)',
    900: 'oklch(0.380 0.130 145)',
  },
  semantic: {
    success: 'oklch(0.650 0.180 155)',
    warning: 'oklch(0.750 0.150 75)',
    error: 'oklch(0.630 0.240 25)',
    info: 'oklch(0.600 0.215 250)',
  },
};
