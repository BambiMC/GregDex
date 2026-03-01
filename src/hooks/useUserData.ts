"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SavedItem,
  HistoryItem,
  UserData,
  STORAGE_KEYS,
} from "@/types/user-data";

const DEFAULT_USER_DATA: UserData = {
  savedItems: { items: [] },
  viewHistory: { items: [] },
};

export function useUserData() {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserData({
          savedItems: parsed.savedItems || { items: [] },
          viewHistory: parsed.viewHistory || { items: [] },
        });
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to save user data:", error);
      }
    }
  }, [userData, isLoading]);

  // Saved items management
  const saveItem = useCallback((item: Omit<SavedItem, "savedAt">) => {
    const savedItem: SavedItem = {
      ...item,
      savedAt: new Date().toISOString(),
    };

    setUserData((prev) => {
      const newItems = [
        // Remove if already exists, then add to beginning
        ...prev.savedItems.items.filter((i) => i.id !== item.id),
        savedItem,
      ];
      return {
        ...prev,
        savedItems: {
          items: newItems,
        },
      };
    });
  }, []);

  const removeSavedItem = useCallback((id: string) => {
    setUserData((prev) => ({
      ...prev,
      savedItems: {
        items: prev.savedItems.items.filter((item) => item.id !== id),
      },
    }));
  }, []);

  const isSaved = useCallback((id: string) => {
    return userData.savedItems.items.some((item) => item.id === id);
  }, [userData.savedItems.items]);

  // View history management
  const addToHistory = useCallback((item: Omit<HistoryItem, "viewedAt">) => {
    const historyItem: HistoryItem = {
      ...item,
      viewedAt: new Date().toISOString(),
    };

    setUserData((prev) => {
      // Remove if already exists, then add to beginning
      const filtered = prev.viewHistory.items.filter((i) => i.id !== item.id);
      return {
        ...prev,
        viewHistory: {
          items: [historyItem, ...filtered].slice(0, 50), // Keep only last 50 items
        },
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setUserData((prev) => ({
      ...prev,
      viewHistory: { items: [] },
    }));
  }, []);

  return {
    savedItems: userData.savedItems.items,
    viewHistory: userData.viewHistory.items,
    saveItem,
    removeSavedItem,
    isSaved,
    addToHistory,
    clearHistory,
    isLoading,
  };
}
