"use client";

import { useCallback, useState } from "react";
import { usePageBuilderMcp } from "./hooks/usePageBuilderMcp";
import { PageList } from "./components/PageList";
import { PageEditor } from "./components/PageEditor";
import { BlockPalette } from "./components/BlockPalette";
import { PublishControls } from "./components/PublishControls";
import { PagePreview } from "./components/PagePreview";
import type { Page } from "./components/PageList";
import type { PageBlock } from "./components/PageEditor";
import type { BlockType } from "./components/BlockPalette";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Layers,
  Layout,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

const MOCK_PAGES: Page[] = [
  {
    id: "page-1",
    title: "Home",
    slug: "home",
    status: "published",
    updatedAt: "2 hours ago",
  },
  {
    id: "page-2",
    title: "About Us",
    slug: "about",
    status: "draft",
    updatedAt: "Yesterday",
  },
];

export function PageBuilderClient() {
  const { mutations } = usePageBuilderMcp();

  // Pages state
  const [pages, setPages] = useState<Page[]>(MOCK_PAGES);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    MOCK_PAGES[0]?.id ?? null,
  );

  // Editor state
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [pageTitle, setPageTitle] = useState("Home");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>("just now");
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<"pages" | "blocks">(
    "pages",
  );

  const selectedPage = pages.find(p => p.id === selectedPageId) ?? null;
  const currentStatus = selectedPage?.status ?? "draft";
  const currentSlug = selectedPage?.slug ?? "";

  const handleSelectPage = useCallback((id: string) => {
    setSelectedPageId(id);
    const page = pages.find(p => p.id === id);
    if (page) setPageTitle(page.title);
    setBlocks([]);
  }, [pages]);

  const handleCreatePage = useCallback(async () => {
    try {
      await mutations.createPage.mutateAsync({ title: "New Page" });
    } catch {
      // Optimistic local create
    }
    const newPage: Page = {
      id: generateId(),
      title: "New Page",
      slug: `page-${generateId().slice(0, 6)}`,
      status: "draft",
      updatedAt: "just now",
    };
    setPages(prev => [...prev, newPage]);
    setSelectedPageId(newPage.id);
    setPageTitle(newPage.title);
    setBlocks([]);
    toast.success("Page created");
  }, [mutations.createPage]);

  const handleDeletePage = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    if (selectedPageId === id) {
      const remaining = pages.filter(p => p.id !== id);
      setSelectedPageId(remaining[0]?.id ?? null);
    }
    toast.success("Page deleted");
  }, [pages, selectedPageId]);

  const handleDuplicatePage = useCallback((id: string) => {
    const source = pages.find(p => p.id === id);
    if (!source) return;
    const duplicate: Page = {
      ...source,
      id: generateId(),
      title: `${source.title} (Copy)`,
      slug: `${source.slug}-copy`,
      status: "draft",
      updatedAt: "just now",
    };
    setPages(prev => [...prev, duplicate]);
    toast.success("Page duplicated");
  }, [pages]);

  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock: PageBlock = {
      id: generateId(),
      type,
      content: {},
      order: blocks.length,
    };
    setBlocks(prev => [...prev, newBlock]);
    mutations.addBlock.mutateAsync({ type, pageId: selectedPageId }).catch(
      () => {},
    );
    setActiveLeftTab("pages");
  }, [blocks.length, mutations.addBlock, selectedPageId]);

  const handleMoveBlock = useCallback(
    (id: string, direction: "up" | "down") => {
      setBlocks(prev => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(b => b.id === id);
        if (idx < 0) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
        const swapBlock = sorted[swapIdx];
        const currentBlock = sorted[idx];
        if (!swapBlock || !currentBlock) return prev;
        const updated = sorted.map((block, i) => {
          if (i === idx) return { ...block, order: swapBlock.order };
          if (i === swapIdx) return { ...block, order: currentBlock.order };
          return block;
        });
        return updated;
      });
    },
    [],
  );

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleUpdateBlockContent = useCallback(
    (id: string, key: string, value: string) => {
      setBlocks(prev =>
        prev.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b)
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await mutations.updatePage.mutateAsync({
        id: selectedPageId,
        title: pageTitle,
        blocks,
      });
      setLastSavedAt("just now");
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [mutations.updatePage, selectedPageId, pageTitle, blocks]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await mutations.publishPage.mutateAsync({ id: selectedPageId });
      setPages(prev =>
        prev.map(p => (p.id === selectedPageId ? { ...p, status: "published" } : p))
      );
      toast.success("Page published!");
    } catch {
      toast.error("Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }, [mutations.publishPage, selectedPageId]);

  const handleSchedule = useCallback(
    (publishAt: string) => {
      setPages(prev =>
        prev.map(p => (p.id === selectedPageId ? { ...p, status: "scheduled" } : p))
      );
      toast.success(`Scheduled for ${new Date(publishAt).toLocaleString()}`);
    },
    [selectedPageId],
  );

  const handleUnpublish = useCallback(() => {
    setPages(prev => prev.map(p => (p.id === selectedPageId ? { ...p, status: "draft" } : p)));
    toast.success("Page unpublished");
  }, [selectedPageId]);

  const handleAiGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await mutations.aiGeneratePage.mutateAsync({
        prompt: `A modern page for: ${pageTitle}`,
      });
      // Optimistic mock blocks until real API returns
      const generated: PageBlock[] = [
        { id: generateId(), type: "hero", content: {}, order: 0 },
        { id: generateId(), type: "features", content: {}, order: 1 },
        { id: generateId(), type: "testimonials", content: {}, order: 2 },
        { id: generateId(), type: "contact", content: {}, order: 3 },
      ];
      setBlocks(generated);
      toast.success("Page generated with AI!");
    } catch {
      toast.error("Failed to generate. Please ensure you are logged in.");
    } finally {
      setIsGenerating(false);
    }
  }, [mutations.aiGeneratePage, pageTitle]);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top toolbar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/store"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Back to store"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-zinc-400 hover:text-white lg:hidden"
            onClick={() => setShowSidebar(s => !s)}
          >
            <PanelLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-purple-400 shrink-0" />
            <span className="font-semibold tracking-tight hidden sm:block">
              Page Builder
            </span>
          </div>

          {selectedPage && (
            <>
              <span className="text-zinc-700 hidden sm:block">/</span>
              <span className="text-sm text-zinc-400 truncate max-w-[140px] hidden sm:block">
                {selectedPage.title}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block ${
                  currentStatus === "published"
                    ? "bg-green-900/50 text-green-400"
                    : currentStatus === "scheduled"
                    ? "bg-amber-900/50 text-amber-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {currentStatus === "published"
                  ? "Live"
                  : currentStatus === "scheduled"
                  ? "Scheduled"
                  : "Draft"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 text-xs ${
              showPreview ? "text-purple-400" : "text-zinc-400 hover:text-white"
            }`}
            onClick={() => setShowPreview(s => !s)}
          >
            {showPreview
              ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </>
              )
              : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </>
              )}
          </Button>

          {!showPreview && (
            <PublishControls
              status={currentStatus}
              isSaving={isSaving}
              isPublishing={isPublishing}
              lastSavedAt={lastSavedAt}
              slug={currentSlug}
              onSave={handleSave}
              onPublish={handlePublish}
              onSchedule={handleSchedule}
              onUnpublish={handleUnpublish}
            />
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — Pages + Block Palette */}
        <aside
          className={`${
            showSidebar ? "flex" : "hidden"
          } w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col shrink-0 lg:flex`}
        >
          {/* Tab switcher */}
          <div className="flex border-b border-zinc-800 shrink-0">
            <button
              onClick={() => setActiveLeftTab("pages")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeLeftTab === "pages"
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Pages
            </button>
            <button
              onClick={() => setActiveLeftTab("blocks")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeLeftTab === "blocks"
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Blocks
            </button>
          </div>

          {/* Tab content */}
          {activeLeftTab === "pages"
            ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                <PageList
                  pages={pages}
                  selectedPageId={selectedPageId}
                  onSelectPage={handleSelectPage}
                  onCreatePage={handleCreatePage}
                  onDeletePage={handleDeletePage}
                  onDuplicatePage={handleDuplicatePage}
                />
              </div>
            )
            : <BlockPalette onAddBlock={handleAddBlock} />}
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {showPreview
            ? (
              <PagePreview
                pageTitle={pageTitle}
                blocks={blocks}
                slug={currentSlug}
                isPublished={currentStatus === "published"}
              />
            )
            : (
              <div className="flex-1 overflow-y-auto bg-zinc-900/20 flex flex-col items-center p-6 scrollbar-hide">
                {selectedPage
                  ? (
                    <PageEditor
                      blocks={blocks}
                      pageTitle={pageTitle}
                      isGenerating={isGenerating}
                      onUpdatePageTitle={setPageTitle}
                      onMoveBlock={handleMoveBlock}
                      onDeleteBlock={handleDeleteBlock}
                      onUpdateBlockContent={handleUpdateBlockContent}
                      onAiGenerate={handleAiGenerate}
                    />
                  )
                  : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Layout className="w-7 h-7 text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-400">
                          No page selected
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Select a page from the sidebar
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
