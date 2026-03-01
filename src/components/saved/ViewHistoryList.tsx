"use client";

import Link from 'next/link';
import { useUserData } from '@/hooks/useUserData';
import { HistoryItem } from '@/types/user-data';
import ItemIcon from '@/components/ItemIcon';

function getItemLink(item: HistoryItem): string {
  switch (item.type) {
    case 'item':
      return `/items/${item.id.replace(/:/g, '-')}`;
    case 'fluid':
      return `/fluids-gases/${item.id}`;
    case 'recipe':
      if (item.metadata?.machine) {
        return `/recipes/${item.metadata.machine}?recipe=${item.id}`;
      }
      return `/recipes/${item.id}`;
    case 'material':
      return `/materials/${item.id}`;
    case 'bee':
      return `/bees/${item.id}`;
    case 'ore':
      return `/ores/${item.id}`;
    default:
      return '/';
  }
}

function getTypeLabel(type: HistoryItem['type']): string {
  switch (type) {
    case 'item': return 'Item';
    case 'fluid': return 'Fluid';
    case 'recipe': return 'Rezept';
    case 'material': return 'Material';
    case 'bee': return 'Biene';
    case 'ore': return 'Erz';
    default: return type;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Gerade eben';
  if (diffMinutes < 60) return `Vor ${diffMinutes} ${diffMinutes === 1 ? 'Minute' : 'Minuten'}`;
  if (diffHours < 24) return `Vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
  if (diffDays < 7) return `Vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`;
  
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ViewHistoryList() {
  const { viewHistory, clearHistory } = useUserData();

  if (viewHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-text-muted mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Kein Verlauf
        </h3>
        <p className="text-text-muted">
          Deine angesehenen Items und Rezepte erscheinen hier
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear history button */}
      <div className="flex justify-end">
        <button
          onClick={clearHistory}
          className="text-sm text-text-muted hover:text-text-danger transition-colors"
        >
          Verlauf löschen
        </button>
      </div>

      {/* History items */}
      <div className="space-y-2">
        {viewHistory.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border-default bg-bg-elevated hover:bg-bg-secondary transition-colors"
          >
            {/* Item icon */}
            <div className="flex-shrink-0">
              <ItemIcon
                itemId={item.id}
                displayName={item.displayName}
                size={40}
              />
            </div>

            {/* Item info */}
            <div className="flex-1 min-w-0">
              <Link
                href={getItemLink(item)}
                className="block hover:text-accent-primary transition-colors"
              >
                <div className="font-medium text-text-primary truncate">
                  {item.displayName}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="capitalize">{getTypeLabel(item.type)}</span>
                  {item.metadata?.modId && (
                    <>
                      <span>•</span>
                      <span>{item.metadata.modId}</span>
                    </>
                  )}
                  {item.version && (
                    <>
                      <span>•</span>
                      <span>v{item.version}</span>
                    </>
                  )}
                </div>
              </Link>
              <div className="text-xs text-text-muted mt-1">
                Angesehen {formatDate(item.viewedAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
