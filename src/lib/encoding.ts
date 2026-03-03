// Shared ID encoding helper (safe for server and client)
export function encodeId(id: string): string {
  // Replace pipe characters which are invalid in filenames/URLs
  const sanitized = id.replace(/\|/g, "_");

  // Base64 encode in a Node-friendly and browser-friendly way
  const base64 =
    typeof window === "undefined"
      ? Buffer.from(sanitized, "utf8").toString("base64")
      : btoa(sanitized);

  // Convert to base64url (safe for filenames/urls)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default encodeId;
