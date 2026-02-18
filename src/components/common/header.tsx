"use client";

import { MobileNav } from "./sidebar";

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 md:px-6">
      <MobileNav />
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
