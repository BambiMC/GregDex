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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        stats={stats}
      />
      <main className={`min-h-[calc(100vh-3.5rem)] pb-16 lg:pb-0 transition-all duration-200 ${sidebarCollapsed ? "lg:ml-14" : "lg:ml-60"}`}>
        {children}
      </main>
      <MobileNav />
    </>
  );
}
