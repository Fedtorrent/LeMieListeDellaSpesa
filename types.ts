export const Category = {
  ORTOFRUTTA: 'Ortofrutta',
  MACELLERIA: 'Carne',
  PESCHERIA: 'Pesce',
  LATTICINI: 'Latticini e Uova',
  DISPENSA: 'Dispensa',
  SURGELATI: 'Surgelati',
  BEVANDE: 'Bevande',
  CASA: 'Casa e Pulizia',
  VARIE: 'Altro'
} as const;

export type SortMode = 'category' | 'alpha' | 'alpha-desc' | 'usage' | 'custom';

export interface ProductMetadata {
  normalizedName: string;
  category: string;
  emoji: string;
}

export interface GroceryItem {
  id: string; // UUID
  productId: string; // UUID riferimento al catalogo
  isChecked: boolean;
  quantity: number;
  unit: string;
  notes: string | null;
  updatedAt: number;
  customMetadata?: ProductMetadata;
}

export interface ShoppingList {
  id: string; // UUID
  name: string;
  items: GroceryItem[];
  isLocal: boolean;
  updatedAt: number;
  familyId?: string;
}

export interface ProductDatabaseEntry extends ProductMetadata {
  id: string; // UUID
  usageCount: number;
  updatedAt: number;
  familyId: string | null; // NULL = Master
}

export interface AppConfig {
  categoryColors: Record<string, string>;
  emojiLibrary: string[];
}
