// === Saved Items ===
export interface SavedItem {
  id: string;
  type: 'item' | 'fluid' | 'recipe' | 'material' | 'bee' | 'ore';
  displayName: string;
  savedAt: string; // ISO timestamp
  version?: string;
  metadata?: {
    modId?: string;
    machine?: string;
    recipeType?: string;
    // Additional metadata based on type
  };
}

export interface SavedItemsState {
  items: SavedItem[];
}

// === View History ===
export interface HistoryItem {
  id: string;
  type: 'item' | 'fluid' | 'recipe' | 'material' | 'bee' | 'ore';
  displayName: string;
  viewedAt: string; // ISO timestamp
  version?: string;
  metadata?: {
    modId?: string;
    machine?: string;
    recipeType?: string;
  };
}

export interface ViewHistoryState {
  items: HistoryItem[];
}

// === User Data Storage ===
export interface UserData {
  savedItems: SavedItemsState;
  viewHistory: ViewHistoryState;
}

// Storage keys for localStorage
export const STORAGE_KEYS = {
  USER_DATA: 'gregdex-user-data',
} as const;
