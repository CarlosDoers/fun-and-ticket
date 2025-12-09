// Theme colors and styles for the app
// Neutral tones with glassmorphism effects

export const colors = {
  // Primary colors - Neutral/Slate theme
  primary: '#1e293b', // slate-800
  primaryLight: '#334155', // slate-700
  primaryDark: '#0f172a', // slate-900
  
  // Accent colors
  accent: '#3b82f6', // blue-500
  accentLight: '#60a5fa', // blue-400
  
  // Neutral backgrounds
  background: '#f1f5f9', // slate-100
  surface: '#ffffff',
  surfaceHover: '#f8fafc', // slate-50
  
  // Text colors
  textPrimary: '#1e293b', // slate-800
  textSecondary: '#64748b', // slate-500
  textMuted: '#94a3b8', // slate-400
  textOnDark: '#ffffff',
  
  // Status colors
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
  
  // Gradient colors for background
  gradientStart: '#1e293b', // slate-800
  gradientMiddle: '#334155', // slate-700
  gradientEnd: '#475569', // slate-600
  
  // POI/Map specific
  routeColor: '#3b82f6', // blue-500
  poiColor: '#f59e0b', // amber-500
};

// Glassmorphism styles
export const glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  dark: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    backdropFilter: 'blur(10px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
};

// Common shadow styles
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  colors,
  glassmorphism,
  shadows,
};
