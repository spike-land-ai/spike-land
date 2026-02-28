"use client";

import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

export default function DocsLayout(
  { children }: { children: React.ReactNode; },
) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#040408] selection:bg-primary/30">
      {/* Mobile Header */}
      <div className="lg:hidden border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/docs">
            <span className="font-bold font-heading">Documentation</span>
          </Link>
          {isMounted
            ? (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">
                    Documentation Navigation
                  </SheetTitle>
                  <DocsSidebar onLinkClick={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
            )
            : (
              <Button variant="ghost" size="icon" aria-label="Toggle menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            )}
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-background/50 backdrop-blur-sm">
          <DocsSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="container mx-auto py-8 px-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
