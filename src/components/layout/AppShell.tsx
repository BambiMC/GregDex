"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppShell({
  children,
  stats,
}: {
  children: React.ReactNode;
  stats: { itemCount: number; recipeCount: number; machineCount: number };
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} stats={stats} />
      <main className="lg:ml-60 min-h-[calc(100vh-3.5rem)] pb-16 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
