"use client";

import NextImage from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Globe,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import type { PageBlock } from "./PageEditor";

type ViewportSize = "desktop" | "tablet" | "mobile";

interface PagePreviewProps {
  pageTitle: string;
  blocks: PageBlock[];
  slug: string;
  isPublished: boolean;
}

const VIEWPORT_CONFIG: Record<
  ViewportSize,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; }>;
    width: string;
  }
> = {
  desktop: { label: "Desktop", icon: Monitor, width: "100%" },
  tablet: { label: "Tablet", icon: Tablet, width: "768px" },
  mobile: { label: "Mobile", icon: Smartphone, width: "375px" },
};

function PreviewBlock({ block }: { block: PageBlock; }) {
  switch (block.type) {
    case "heading":
      return (
        <h1 className="text-3xl font-bold text-zinc-900 py-2">
          {block.content.text || <span className="text-zinc-300 italic">Untitled Heading</span>}
        </h1>
      );
    case "paragraph":
      return (
        <p className="text-zinc-600 leading-relaxed py-2">
          {block.content.text || (
            <span className="text-zinc-300 italic">
              Empty paragraph...
            </span>
          )}
        </p>
      );
    case "image":
      return block.content.src
        ? (
          <div className="relative w-full h-80 rounded-lg overflow-hidden my-2">
            <NextImage
              src={block.content.src}
              alt={block.content.alt ?? ""}
              fill
              className="object-cover"
            />
          </div>
        )
        : (
          <div className="w-full h-48 my-2 bg-zinc-100 rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center">
            <p className="text-sm text-zinc-400">Image placeholder</p>
          </div>
        );
    case "divider":
      return <hr className="border-zinc-200 my-4" />;
    case "quote":
      return (
        <blockquote className="border-l-4 border-purple-400 pl-4 my-4">
          <p className="text-zinc-600 italic text-lg">
            {block.content.text || "Empty quote..."}
          </p>
          {block.content.attribution && (
            <cite className="text-sm text-zinc-400 not-italic mt-1 block">
              {block.content.attribution}
            </cite>
          )}
        </blockquote>
      );
    case "hero":
      return (
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-12 text-white text-center my-4">
          <h2 className="text-4xl font-bold mb-4">Hero Section</h2>
          <p className="text-purple-100 text-lg mb-6">
            Your compelling headline goes here
          </p>
          <button className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-lg">
            Get Started
          </button>
        </div>
      );
    case "features":
      return (
        <div className="grid grid-cols-3 gap-4 my-4">
          {["Feature One", "Feature Two", "Feature Three"].map(f => (
            <div
              key={f}
              className="bg-zinc-50 rounded-lg p-5 border border-zinc-200"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg mb-3" />
              <h3 className="font-semibold text-zinc-800 mb-1">{f}</h3>
              <p className="text-sm text-zinc-500">
                Description of this feature.
              </p>
            </div>
          ))}
        </div>
      );
    case "testimonials":
      return (
        <div className="bg-zinc-50 rounded-xl p-8 my-4 text-center">
          <p className="text-zinc-600 text-lg italic mb-4">
            "This product changed everything for our team."
          </p>
          <p className="text-sm font-semibold text-zinc-700">— Customer Name</p>
        </div>
      );
    case "pricing":
      return (
        <div className="grid grid-cols-2 gap-4 my-4">
          {["Starter", "Pro"].map((tier, i) => (
            <div
              key={tier}
              className={`rounded-xl p-6 border ${
                i === 1
                  ? "border-purple-300 bg-purple-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <h3 className="font-bold text-zinc-900 mb-1">{tier}</h3>
              <div className="text-3xl font-black text-zinc-900 mb-4">
                {i === 0 ? "$0" : "$29"}
                <span className="text-base font-normal text-zinc-500">/mo</span>
              </div>
              <button
                className={`w-full py-2 rounded-lg font-medium text-sm ${
                  i === 1
                    ? "bg-purple-600 text-white"
                    : "border border-zinc-300 text-zinc-700"
                }`}
              >
                Get {tier}
              </button>
            </div>
          ))}
        </div>
      );
    case "contact":
      return (
        <div className="bg-zinc-50 rounded-xl p-8 my-4 space-y-3">
          <h3 className="text-xl font-bold text-zinc-900">Contact Us</h3>
          <input
            className="w-full border border-zinc-200 rounded-lg p-3 text-sm"
            placeholder="Your name"
            readOnly
          />
          <input
            className="w-full border border-zinc-200 rounded-lg p-3 text-sm"
            placeholder="your@email.com"
            readOnly
          />
          <textarea
            className="w-full border border-zinc-200 rounded-lg p-3 text-sm h-24 resize-none"
            placeholder="Message..."
            readOnly
          />
          <button className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            Send Message
          </button>
        </div>
      );
    default:
      return (
        <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-lg p-8 my-2 text-center">
          <p className="text-sm text-zinc-400 capitalize">
            {String(block.type)} block
          </p>
        </div>
      );
  }
}

export function PagePreview(
  { pageTitle, blocks, slug, isPublished }: PagePreviewProps,
) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/30 shrink-0">
        <div className="flex items-center gap-1 bg-zinc-800/80 rounded-lg p-1">
          {(Object.keys(VIEWPORT_CONFIG) as ViewportSize[]).map(v => {
            const cfg = VIEWPORT_CONFIG[v];
            const Icon = cfg.icon;
            return (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewport === v
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title={cfg.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {isPublished && (
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 border border-green-800/30 rounded-full px-2.5 py-1">
              <Globe className="w-3 h-3" />
              <span>/{slug}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-white"
            onClick={() => setRefreshKey(k => k + 1)}
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          {isPublished && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-white"
              title="Open live page"
              asChild
            >
              <a href={`/${slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-auto bg-zinc-950 flex justify-center p-4">
        <div
          key={refreshKey}
          style={{ width: VIEWPORT_CONFIG[viewport].width, maxWidth: "100%" }}
          className="bg-white rounded-lg shadow-xl overflow-auto transition-all duration-300"
        >
          <div className="p-8 min-h-full">
            {/* Page header */}
            <header className="mb-8">
              <h1 className="text-4xl font-black text-zinc-900">
                {pageTitle || "Untitled Page"}
              </h1>
            </header>

            {/* Blocks */}
            <div>
              {sortedBlocks.length === 0
                ? (
                  <div className="py-20 text-center">
                    <p className="text-zinc-300 text-sm">
                      No content yet. Add blocks in the editor.
                    </p>
                  </div>
                )
                : (
                  sortedBlocks.map(block => <PreviewBlock key={block.id} block={block} />)
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
