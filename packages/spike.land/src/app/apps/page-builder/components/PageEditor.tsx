"use client";

import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Code2,
  Columns,
  CreditCard,
  GripVertical,
  Image,
  Layout,
  LayoutGrid,
  List,
  Mail,
  MessageSquare,
  Minus,
  Quote,
  Sparkles,
  Star,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import type { BlockType } from "./BlockPalette";

export interface PageBlock {
  id: string;
  type: BlockType;
  content: Record<string, string>;
  order: number;
}

interface PageEditorProps {
  blocks: PageBlock[];
  pageTitle: string;
  isGenerating: boolean;
  onUpdatePageTitle: (title: string) => void;
  onMoveBlock: (id: string, direction: "up" | "down") => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlockContent: (id: string, key: string, value: string) => void;
  onAiGenerate: () => void;
}

const BLOCK_ICONS: Record<
  BlockType,
  React.ComponentType<{ className?: string; }>
> = {
  heading: Type,
  paragraph: Type,
  image: Image,
  embed: Code2,
  hero: LayoutGrid,
  features: Star,
  testimonials: MessageSquare,
  pricing: CreditCard,
  contact: Mail,
  video: Video,
  divider: Minus,
  columns: Columns,
  list: List,
  quote: Quote,
};

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  image: "Image",
  embed: "Embed",
  hero: "Hero Section",
  features: "Features Grid",
  testimonials: "Testimonials",
  pricing: "Pricing Table",
  contact: "Contact Form",
  video: "Video",
  divider: "Divider",
  columns: "Columns",
  list: "List",
  quote: "Quote",
};

function BlockEditor({
  block,
  index,
  totalBlocks,
  onMove,
  onDelete,
  onUpdateContent,
}: {
  block: PageBlock;
  index: number;
  totalBlocks: number;
  onMove: (id: string, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
  onUpdateContent: (id: string, key: string, value: string) => void;
}) {
  const Icon = BLOCK_ICONS[block.type];
  const label = BLOCK_LABELS[block.type];

  const renderContent = () => {
    switch (block.type) {
      case "heading":
        return (
          <Input
            value={block.content.text ?? ""}
            onChange={e => onUpdateContent(block.id, "text", e.target.value)}
            placeholder="Enter heading..."
            className="text-2xl font-bold border-0 bg-transparent focus-visible:ring-0 px-0 text-zinc-900 placeholder:text-zinc-400 h-auto"
          />
        );
      case "paragraph":
        return (
          <Textarea
            value={block.content.text ?? ""}
            onChange={e => onUpdateContent(block.id, "text", e.target.value)}
            placeholder="Enter paragraph text..."
            className="border-0 bg-transparent focus-visible:ring-0 px-0 text-zinc-700 placeholder:text-zinc-400 resize-none min-h-[80px]"
          />
        );
      case "image":
        return (
          <div className="space-y-2">
            <Input
              value={block.content.src ?? ""}
              onChange={e => onUpdateContent(block.id, "src", e.target.value)}
              placeholder="Image URL..."
              className="text-sm border-zinc-200 bg-zinc-50"
            />
            {block.content.src
              ? (
                <div className="relative w-full h-64 rounded-md overflow-hidden">
                  <NextImage
                    src={block.content.src}
                    alt={block.content.alt ?? ""}
                    fill
                    className="object-cover"
                  />
                </div>
              )
              : (
                <div className="w-full h-40 rounded-md bg-zinc-100 border-2 border-dashed border-zinc-200 flex items-center justify-center">
                  <Image className="w-8 h-8 text-zinc-300" />
                </div>
              )}
            <Input
              value={block.content.alt ?? ""}
              onChange={e => onUpdateContent(block.id, "alt", e.target.value)}
              placeholder="Alt text..."
              className="text-sm border-zinc-200 bg-zinc-50"
            />
          </div>
        );
      case "divider":
        return <hr className="border-zinc-200 my-2" />;
      case "quote":
        return (
          <div className="border-l-4 border-purple-400 pl-4 space-y-2">
            <Textarea
              value={block.content.text ?? ""}
              onChange={e => onUpdateContent(block.id, "text", e.target.value)}
              placeholder="Quote text..."
              className="border-0 bg-transparent focus-visible:ring-0 px-0 text-zinc-700 italic placeholder:text-zinc-400 resize-none min-h-[60px]"
            />
            <Input
              value={block.content.attribution ?? ""}
              onChange={e => onUpdateContent(block.id, "attribution", e.target.value)}
              placeholder="— Attribution"
              className="text-sm border-0 bg-transparent focus-visible:ring-0 px-0 text-zinc-500"
            />
          </div>
        );
      default:
        return (
          <div className="py-6 flex flex-col items-center gap-2 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
            <p className="text-sm text-zinc-400 font-medium capitalize">
              {String(block.type)} Block
            </p>
            <p className="text-xs text-zinc-300">Click to configure</p>
          </div>
        );
    }
  };

  return (
    <div className="group relative bg-white rounded-xl border border-transparent hover:border-purple-300 hover:shadow-md hover:shadow-purple-100 transition-all">
      {/* Block toolbar */}
      <div className="absolute -top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-1 bg-zinc-900 rounded-md px-2 py-1 shadow-lg">
          <Icon className="w-3 h-3 text-zinc-400" />
          <span className="text-[10px] text-zinc-400 font-medium">{label}</span>
        </div>
        <div className="flex items-center bg-zinc-900 rounded-md shadow-lg overflow-hidden">
          <button
            onClick={() => onMove(block.id, "up")}
            disabled={index === 0}
            className="px-1.5 py-1 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <GripVertical className="w-3 h-3 rotate-90 scale-y-[-1]" />
          </button>
          <button
            onClick={() => onMove(block.id, "down")}
            disabled={index === totalBlocks - 1}
            className="px-1.5 py-1 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <GripVertical className="w-3 h-3 rotate-90" />
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="px-1.5 py-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors"
            title="Delete block"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-5">{renderContent()}</div>
    </div>
  );
}

export function PageEditor({
  blocks,
  pageTitle,
  isGenerating,
  onUpdatePageTitle,
  onMoveBlock,
  onDeleteBlock,
  onUpdateBlockContent,
  onAiGenerate,
}: PageEditorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto min-h-[800px] bg-white rounded-xl shadow-2xl shadow-purple-500/10 border border-zinc-200 flex flex-col">
      {/* Page title bar */}
      <div className="border-b border-zinc-100 px-8 py-5">
        <Input
          value={pageTitle}
          onChange={e => onUpdatePageTitle(e.target.value)}
          placeholder="Untitled Page"
          className="text-3xl font-bold border-0 bg-transparent focus-visible:ring-0 px-0 text-zinc-900 placeholder:text-zinc-300 h-auto"
        />
      </div>

      {/* Blocks */}
      <div className="flex-1 p-8 space-y-4 relative">
        {blocks.length === 0
          ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-12">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] opacity-30" />
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <Layout className="w-8 h-8 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-700 mb-1.5">
                    Empty Canvas
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-xs">
                    Drag blocks from the palette on the left, or let AI generate a complete layout
                    for you.
                  </p>
                </div>
                <Button
                  onClick={onAiGenerate}
                  disabled={isGenerating}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-purple-500/20"
                >
                  <Sparkles
                    className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`}
                  />
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
            </div>
          )
          : (
            <>
              {blocks
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={index}
                    totalBlocks={blocks.length}
                    onMove={onMoveBlock}
                    onDelete={onDeleteBlock}
                    onUpdateContent={onUpdateBlockContent}
                  />
                ))}

              <button
                onClick={onAiGenerate}
                disabled={isGenerating}
                className="w-full py-4 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-purple-500 border-2 border-dashed border-zinc-200 hover:border-purple-300 rounded-xl transition-all group"
              >
                <Sparkles
                  className={`w-4 h-4 group-hover:text-purple-500 ${
                    isGenerating ? "animate-spin" : ""
                  }`}
                />
                {isGenerating ? "Generating blocks..." : "Add more with AI"}
              </button>
            </>
          )}
      </div>
    </div>
  );
}
