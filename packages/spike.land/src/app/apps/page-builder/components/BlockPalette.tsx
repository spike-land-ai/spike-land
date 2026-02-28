"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Code2,
  Columns,
  CreditCard,
  Image,
  LayoutGrid,
  List,
  Mail,
  MessageSquare,
  Minus,
  Quote,
  Star,
  Type,
  Video,
} from "lucide-react";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "embed"
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "contact"
  | "video"
  | "divider"
  | "columns"
  | "list"
  | "quote";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; }>;
  category: "content" | "layout" | "sections";
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Content
  {
    type: "heading",
    label: "Heading",
    description: "H1–H6 text",
    icon: Type,
    category: "content",
  },
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Rich text block",
    icon: Type,
    category: "content",
  },
  {
    type: "image",
    label: "Image",
    description: "Photo or graphic",
    icon: Image,
    category: "content",
  },
  {
    type: "video",
    label: "Video",
    description: "Embed a video",
    icon: Video,
    category: "content",
  },
  {
    type: "embed",
    label: "Embed",
    description: "iFrame or code snippet",
    icon: Code2,
    category: "content",
  },
  {
    type: "list",
    label: "List",
    description: "Ordered or unordered list",
    icon: List,
    category: "content",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Blockquote with attribution",
    icon: Quote,
    category: "content",
  },
  // Layout
  {
    type: "columns",
    label: "Columns",
    description: "Multi-column layout",
    icon: Columns,
    category: "layout",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal rule",
    icon: Minus,
    category: "layout",
  },
  // Sections
  {
    type: "hero",
    label: "Hero Section",
    description: "Full-width hero banner",
    icon: LayoutGrid,
    category: "sections",
  },
  {
    type: "features",
    label: "Features Grid",
    description: "3- or 4-column features",
    icon: Star,
    category: "sections",
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer quotes",
    icon: MessageSquare,
    category: "sections",
  },
  {
    type: "pricing",
    label: "Pricing Table",
    description: "Pricing tiers",
    icon: CreditCard,
    category: "sections",
  },
  {
    type: "contact",
    label: "Contact Form",
    description: "Lead capture form",
    icon: Mail,
    category: "sections",
  },
];

const CATEGORIES: { key: BlockDefinition["category"]; label: string; }[] = [
  { key: "content", label: "Content" },
  { key: "layout", label: "Layout" },
  { key: "sections", label: "Sections" },
];

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-5">
        {CATEGORIES.map(category => {
          const blocks = BLOCK_DEFINITIONS.filter(b => b.category === category.key);
          return (
            <div key={category.key}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 px-1 mb-2">
                {category.label}
              </p>
              <div className="space-y-1">
                {blocks.map(block => {
                  const Icon = block.icon;
                  return (
                    <button
                      key={block.type}
                      onClick={() => onAddBlock(block.type)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800/50 bg-zinc-900/40 hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all cursor-pointer group text-left"
                      title={block.description}
                    >
                      <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-purple-900/40 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                          {block.label}
                        </p>
                        <p className="text-[10px] text-zinc-600 truncate">
                          {block.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
