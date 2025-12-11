// Theme colors and styles for the app
// Dark Mode with Orange Accents - Inspired by user reference

export const colors = {
  // Brand Identity
  brand: {
    orange: '#FF5E00', // Vibrant Orange (Primary Action)
    orangeDark: '#D14D00', // Hover/Active states
    orangeLight: '#FF8533', // Highlights
  },

  // Semantic Aliases (Use these in components)
  primary: '#FF5E00', 
  primaryHover: '#D14D00',
  
  // Backgrounds
  background: '#0F0F0F', // Main app background (Deep dark)
  surface: '#18181b', // Cards, Sidebars, Modals (Slightly lighter)
  surfaceHighlight: '#27272a', // Hover states on lists
  inputBackground: '#121212', // Input fields
  
  // Text
  textPrimary: '#FFFFFF', // Headings, main text
  textSecondary: '#A1A1AA', // Subtitles, descriptions (Zinc-400)
  textMuted: '#71717a', // Placeholders, disabled text (Zinc-500)
  textOnPrimary: '#FFFFFF', // Text on orange buttons
  
  // Borders & Dividers
  border: '#27272a', // Subtle borders (Zinc-800)
  borderFocus: '#FF5E00', // Focus state for inputs
  
  // Status
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
  
  // Maps/Vis
  routeColor: '#FF5E00',
  poiColor: '#FFFFFF',
};

// Common styles to reuse
export const layout = {
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export const shadows = {
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  none: {
    shadowOpacity: 0,
    elevation: 0,
  }
};

export default {
  colors,
  layout,
  shadows,
};
