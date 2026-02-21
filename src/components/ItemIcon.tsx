"use client";

import { useState } from "react";

/**
 * Derives the icon filename from an item ID.
 * Item IDs are in the format "modId:itemName:metadata"
 * Icon filenames are "modId_itemName_metadata.png"
 */
function getIconPath(itemId: string): string {
  const filename = itemId.replaceAll(":", "_") + ".png";
  return `/icons/items/${filename}`;
}

export default function ItemIcon({
  itemId,
  displayName,
  size = 32,
}: {
  itemId: string;
  displayName: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="text-[10px] text-text-muted leading-none">
        {displayName.substring(0, 2)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getIconPath(itemId)}
      alt={displayName}
      width={size}
      height={size}
      className="pixelated"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
