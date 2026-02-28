"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Code,
  Hash,
  Heading1,
  Heading2,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  X,
} from "lucide-react";
import type { Post } from "../types";

interface PostEditorProps {
  post: Post;
  onChange: (updates: Partial<Post>) => void;
  isSaving: boolean;
}

interface ToolbarItem {
  icon?: React.ComponentType<{ className?: string; }>;
  label?: string;
  action?: string;
  type?: "separator";
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { icon: Heading1, label: "Heading 1", action: "h1" },
  { icon: Heading2, label: "Heading 2", action: "h2" },
  { type: "separator" },
  { icon: Bold, label: "Bold", action: "bold" },
  { icon: Italic, label: "Italic", action: "italic" },
  { type: "separator" },
  { icon: List, label: "Bullet List", action: "ul" },
  { icon: ListOrdered, label: "Numbered List", action: "ol" },
  { type: "separator" },
  { icon: Quote, label: "Blockquote", action: "quote" },
  { icon: Code, label: "Code Block", action: "code" },
  { type: "separator" },
  { icon: Link, label: "Insert Link", action: "link" },
  { icon: Image, label: "Insert Image", action: "image" },
];

const MARKDOWN_WRAP: Record<string, [string, string]> = {
  bold: ["**", "**"],
  italic: ["_", "_"],
  code: ["```\n", "\n```"],
  quote: ["> ", ""],
  h1: ["# ", ""],
  h2: ["## ", ""],
  ul: ["- ", ""],
  ol: ["1. ", ""],
  link: ["[", "](url)"],
  image: ["![alt](", ")"],
};

function applyMarkdown(
  textarea: HTMLTextAreaElement,
  action: string,
  onChange: (updates: Partial<Post>) => void,
) {
  const wrap = MARKDOWN_WRAP[action];
  if (!wrap) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  const [prefix, suffix] = wrap;
  const newValue = `${before}${prefix}${selected || action}${suffix}${after}`;
  onChange({ content: newValue });

  requestAnimationFrame(() => {
    textarea.focus();
    const newPos = start + prefix.length + (selected || action).length;
    textarea.setSelectionRange(newPos, newPos);
  });
}

export function PostEditor({ post, onChange, isSaving }: PostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tagInput, setTagInput] = useState("");

  function handleToolbarAction(action: string) {
    if (!textareaRef.current) return;
    applyMarkdown(textareaRef.current, action, onChange);
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,$/, "");
      if (newTag && !post.tags.includes(newTag)) {
        onChange({ tags: [...post.tags, newTag] });
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && post.tags.length > 0) {
      onChange({ tags: post.tags.slice(0, -1) });
    }
  }

  function removeTag(tag: string) {
    onChange({ tags: post.tags.filter(t => t !== tag) });
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [post.content]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title & Excerpt */}
      <div className="px-6 pt-6 pb-2">
        <input
          type="text"
          value={post.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="Post title..."
          className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600 focus:outline-none leading-tight"
        />
        <textarea
          value={post.excerpt}
          onChange={e => onChange({ excerpt: e.target.value })}
          placeholder="Short excerpt for previews and SEO..."
          rows={2}
          className="w-full mt-2 bg-transparent text-sm text-zinc-400 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Tags */}
      <div className="px-6 pb-3">
        <div className="flex items-center flex-wrap gap-1.5 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50 min-h-9">
          <Hash className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {post.tags.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className="gap-1 text-xs border-orange-500/30 text-orange-400 bg-orange-500/10 pl-2 pr-1 py-0"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-white transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={post.tags.length === 0
              ? "Add tags (Enter or comma)..."
              : ""}
            className="flex-1 min-w-20 bg-transparent text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      <Separator className="bg-zinc-800/50" />

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-zinc-800/50 overflow-x-auto scrollbar-none">
        {TOOLBAR_ITEMS.map((item, idx) => {
          if (item.type === "separator") {
            return (
              <div
                key={idx}
                className="w-px h-4 bg-zinc-700/50 mx-1 shrink-0"
              />
            );
          }
          const Icon = item.icon;
          if (!Icon || !item.action) return null;
          return (
            <button
              key={idx}
              type="button"
              title={item.label}
              onClick={() => handleToolbarAction(item.action!)}
              className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
        {isSaving && (
          <span className="ml-auto text-[11px] text-zinc-500 font-mono shrink-0 pl-4">
            Saving...
          </span>
        )}
      </div>

      {/* Markdown Textarea */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <textarea
          ref={textareaRef}
          value={post.content}
          onChange={e => onChange({ content: e.target.value })}
          placeholder="Write your post in Markdown..."
          className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed font-mono"
          style={{ minHeight: "300px" }}
        />
      </div>
    </div>
  );
}
