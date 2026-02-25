"use client";

import { useState } from 'react';
import SavedItemsList from '@/components/saved/SavedItemsList';
import ViewHistoryList from '@/components/saved/ViewHistoryList';

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Gespeichert
        </h1>
        <p className="text-text-muted">
          Verwalte deine gespeicherten Items und sieh deinen Verlauf ein
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-default mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'saved'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Gespeicherte Items
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Verlauf
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'saved' ? <SavedItemsList /> : <ViewHistoryList />}
      </div>
    </div>
  );
}
