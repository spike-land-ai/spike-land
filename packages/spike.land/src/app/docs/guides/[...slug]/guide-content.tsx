"use client";

import { MarkdownRenderer } from "@/components/docs/MarkdownRenderer";

interface GuideContentProps {
  content: string;
}

export function GuideContent({ content }: GuideContentProps) {
  return <MarkdownRenderer content={content} />;
}
