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
