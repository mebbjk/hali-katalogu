export interface Carpet {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  price?: number;
  size?: string;
  pattern?: string;
  texture?: string;
  yarnType?: string;
  type?: 'Carpet' | 'Rug' | 'Plush';
  description: string;
  imageUrl: string; // base64 data URL
  isFavorite?: boolean;
}

export enum AppScreen {
  LIST = 'LIST',
  ADD = 'ADD',
  SEARCH = 'SEARCH',
  DETAIL = 'DETAIL',
  FAVORITES = 'FAVORITES',
  SETTINGS = 'SETTINGS',
}