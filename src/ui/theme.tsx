import { createContext, useContext } from 'react';

export const light = { bg: '#F4F2E9', surface: '#FFFEF7', text: '#202D26', muted: '#606E64', line: '#DCDDD0', accent: '#276447', soft: '#E6EBD9', inverse: '#FFFFFF', danger: '#AD3F2D' };
export const dark = { bg: '#141C18', surface: '#1F2A23', text: '#ECEFE3', muted: '#ABB7A8', line: '#344239', accent: '#AACF96', soft: '#303E2D', inverse: '#162115', danger: '#FFAA93' };
export type Colors = typeof light;
export const ThemeContext = createContext<Colors>(light);
export const useTheme = () => useContext(ThemeContext);
