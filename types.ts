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
  createdAt: string; 
  barcodeId?: string;
  qrCodeId?: string;
}

export type Theme = 'light' | 'dark';

export type Language = 'en' | 'tr';

export interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

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