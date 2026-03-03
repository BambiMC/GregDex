// Client-safe utility functions for item ID handling

export function createReadableItemId(id: string): string {
  // Convert item IDs like "gregtech:gt.metaitem.01:32741" to readable format
  // Replace colons with hyphens, but keep dots as dots
  // Also replace pipe characters which can break filesystem paths on Windows
  return id.replace(/:/g, "-").replace(/\|/g, "_");
}

export function parseReadableItemId(readableId: string): string {
  // Convert readable format back to original item ID
  // Replace hyphens back to colons
  return readableId.replace(/-/g, ":").replace(/_/g, "|");
}

export function isReadableItemId(id: string): boolean {
  // Check if this looks like a readable ID (contains hyphens but no colons)
  // OR if it's a simple fluid name without special encoding characters
  const hasHyphensNoColons = id.includes("-") && !id.includes(":");
  const isSimpleFluidName = !id.includes(":") && !id.match(/[A-Za-z0-9]{20,}/); // Not base64-like
  return hasHyphensNoColons || isSimpleFluidName;
}
