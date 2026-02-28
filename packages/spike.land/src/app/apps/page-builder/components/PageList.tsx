"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  FileEdit,
  FileText,
  Globe,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

export interface Page {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "scheduled";
  updatedAt: string;
}

interface PageListProps {
  pages: Page[];
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: () => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
}

const STATUS_CONFIG = {
  draft: { label: "Draft", className: "bg-zinc-700 text-zinc-300" },
  published: { label: "Live", className: "bg-green-900/60 text-green-400" },
  scheduled: {
    label: "Scheduled",
    className: "bg-amber-900/60 text-amber-400",
  },
} satisfies Record<Page["status"], { label: string; className: string; }>;

export function PageList({
  pages,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onDuplicatePage,
}: PageListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-zinc-300">Pages</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onCreatePage}
          title="Create new page"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {pages.length === 0
            ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    No pages yet
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Create your first page
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs"
                  onClick={onCreatePage}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Page
                </Button>
              </div>
            )
            : (
              pages.map(page => {
                const isSelected = page.id === selectedPageId;
                const statusCfg = STATUS_CONFIG[page.status];
                return (
                  <button
                    key={page.id}
                    onClick={() => onSelectPage(page.id)}
                    className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all w-full text-left ${
                      isSelected
                        ? "bg-purple-900/30 border border-purple-500/40"
                        : "hover:bg-zinc-800/60 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-purple-900/50" : "bg-zinc-800"
                      }`}
                    >
                      {page.status === "published"
                        ? <Globe className="w-3.5 h-3.5 text-green-400" />
                        : (
                          <FileEdit
                            className={`w-3.5 h-3.5 ${
                              isSelected ? "text-purple-400" : "text-zinc-500"
                            }`}
                          />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isSelected ? "text-white" : "text-zinc-300"
                        }`}
                      >
                        {page.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                        <span className="text-[10px] text-zinc-600 truncate">
                          /{page.slug}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 text-zinc-500 hover:text-white hover:bg-zinc-700"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-zinc-900 border-zinc-700 text-zinc-200 w-40"
                      >
                        <DropdownMenuItem
                          className="gap-2 hover:bg-zinc-800 cursor-pointer text-xs"
                          onClick={e => {
                            e.stopPropagation();
                            onDuplicatePage(page.id);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 hover:bg-red-900/40 text-red-400 cursor-pointer text-xs"
                          onClick={e => {
                            e.stopPropagation();
                            onDeletePage(page.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                );
              })
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
