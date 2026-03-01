import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { VersionProvider } from "@/contexts/VersionContext";
import { getItemsIndex, getMachines } from "@/lib/data";

export const metadata: Metadata = {
  title: "GregDex - GTNH Wiki",
  description:
    "Item and recipe database for GregTech: New Horizons. Search 47,000+ items and 246,000+ recipes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GregDex",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let itemCount = 0;
  let recipeCount = 0;
  let machineCount = 0;
  try {
    const items = getItemsIndex();
    const machines = getMachines();
    itemCount = items.length;
    machineCount = machines.length;
    recipeCount = machines.reduce((sum, m) => sum + m.recipeCount, 0);
  } catch {
    // data not yet generated
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="font-sans antialiased">
        <VersionProvider>
          <AppShell stats={{ itemCount, recipeCount, machineCount }}>
            {children}
          </AppShell>
        </VersionProvider>
      </body>
    </html>
  );
}
