// FIX: Define and export the Carpet interface. This file should only contain type definitions.
export interface Carpet {
  id: string;
  imageUrl: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  size: string[];
  pattern: string;
  texture: string;
  yarnType: string[];
  type: string;
  description: string;
  isFavorite: boolean;
  createdAt: string; // ISO date string
  barcodeId?: string;
  qrCodeId?: string;
}

// -- Settings Context Types --
export type Theme = 'light' | 'dark';

// FIX: Defined Language type here and exported it to resolve the import error in other files.
export type Language = 'en' | 'tr';

export interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

// -- Toast Context Types --
export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}