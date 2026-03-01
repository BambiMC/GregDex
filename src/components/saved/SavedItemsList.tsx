"use client";

import Link from "next/link";
import { useUserData } from "@/hooks/useUserData";
import { SavedItem } from "@/types/user-data";
import ItemIcon from "@/components/ItemIcon";

function getItemLink(item: SavedItem): string {
  switch (item.type) {
    case "item":
      return `/items/${item.id.replace(/:/g, "-")}`;
    case "fluid":
      return `/fluids-gases/${item.id}`;
    case "recipe":
      if (item.metadata?.machine) {
        return `/recipes/${item.metadata.machine}?recipe=${item.id}`;
      }
      return `/recipes/${item.id}`;
    case "material":
      return `/materials/${item.id}`;
    case "bee":
      return `/bees/${item.id}`;
    case "ore":
      return `/ores/${item.id}`;
    default:
      return "/";
  }
}

function getTypeLabel(type: SavedItem["type"]): string {
  switch (type) {
    case "item":
      return "Item";
    case "fluid":
      return "Fluid";
    case "recipe":
      return "Rezept";
    case "material":
      return "Material";
    case "bee":
      return "Biene";
    case "ore":
      return "Erz";
    default:
      return type;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Gerade eben";
  if (diffHours < 24)
    return `Vor ${diffHours} ${diffHours === 1 ? "Stunde" : "Stunden"}`;
  if (diffDays < 7)
    return `Vor ${diffDays} ${diffDays === 1 ? "Tag" : "Tagen"}`;

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SavedItemsList() {
  const { savedItems, removeSavedItem } = useUserData();

  if (savedItems.length === 0) {
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
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Keine gespeicherten Items
        </h3>
        <p className="text-text-muted">
          Speichere Items, Rezepte und mehr für schnellen Zugriff
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {savedItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border-default bg-bg-elevated hover:bg-bg-secondary transition-colors group"
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
              Gespeichert {formatDate(item.savedAt)}
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={() => removeSavedItem(item.id)}
            className="flex-shrink-0 p-1.5 rounded-md text-text-muted hover:text-text-danger hover:bg-bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Entfernen"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
