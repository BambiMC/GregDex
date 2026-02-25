"use client";

import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';

interface SaveButtonProps {
  id: string;
  type: 'item' | 'fluid' | 'recipe' | 'material' | 'bee' | 'ore';
  displayName: string;
  version?: string;
  metadata?: {
    modId?: string;
    machine?: string;
    recipeType?: string;
  };
  className?: string;
}

export default function SaveButton({
  id,
  type,
  displayName,
  version,
  metadata,
  className = '',
}: SaveButtonProps) {
  const { saveItem, removeSavedItem, isSaved } = useUserData();
  const [isAnimating, setIsAnimating] = useState(false);
  const saved = isSaved(id);

  const handleClick = () => {
    setIsAnimating(true);
    
    if (saved) {
      removeSavedItem(id);
    } else {
      saveItem({
        id,
        type,
        displayName,
        version,
        metadata,
      });
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        saved
          ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/20'
          : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-border-default'
      } ${isAnimating ? 'scale-95' : 'scale-100'} ${className}`}
      title={saved ? 'Gespeichert - Klicken zum Entfernen' : 'Speichern'}
    >
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${
          saved ? 'fill-current' : 'fill-none'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span className="hidden sm:inline">
        {saved ? 'Gespeichert' : 'Speichern'}
      </span>
    </button>
  );
}
