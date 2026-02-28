"use client";

import { AlbumCard } from "@/components/enhance/AlbumCard";
import { BatchEnhanceProgress } from "@/components/enhance/BatchEnhanceProgress";
import { EnhancementSettings } from "@/components/enhance/EnhancementSettings";
import { ImageComparisonSlider } from "@/components/enhance/ImageComparisonSlider";
import {
  type EnhancementTierType,
  TierSelectionCheckboxes,
} from "@/components/enhance/TierSelectionCheckboxes";
import { CreditBalanceDisplay } from "@/components/enhance/CreditBalanceDisplay";
import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { useState } from "react";

export default function EnhancePage() {
  // State for interactive examples
  const [selectedTiers, setSelectedTiers] = useState<EnhancementTierType[]>([
    "TIER_1K",
  ]);

  // Mock data
  const mockAlbum = {
    id: "1",
    name: "Vacation 2023",
    privacy: "PRIVATE" as const,
    imageCount: 12,
    previewImages: [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
        name: "Beach",
      },
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
        name: "Mountain",
      },
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
        name: "Forest",
      },
    ],
  };

  const mockBatchImages = [
    {
      imageId: "1",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop",
      status: "COMPLETED" as const,
    },
    {
      imageId: "2",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop",
      status: "PROCESSING" as const,
    },
    {
      imageId: "3",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop",
      status: "PENDING" as const,
    },
    {
      imageId: "4",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=100&h=100&fit=crop",
      status: "FAILED" as const,
      error: "Processing failed",
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Enhancement Components"
        description="Components for image enhancement workflows including before/after comparison, tier selection, batch processing progress, album management, and credit balance displays."
        usage="Use these components to build AI-powered image enhancement pipelines with tier-based pricing, batch operations, and visual comparison tools."
      />

      <UsageGuide
        dos={[
          "Use ImageComparisonSlider to let users see the difference between original and enhanced images.",
          "Use EnhancementSettings to present tier options with real-time cost calculation before processing.",
          "Use TierSelectionCheckboxes for multi-tier batch processing workflows.",
          "Use BatchEnhanceProgress to show real-time status of each image in a batch operation.",
          "Use CreditBalanceDisplay to keep users informed of their remaining balance and enhancement estimates.",
        ]}
        donts={[
          "Don't start enhancement without confirming the user has sufficient credits via CreditBalanceDisplay.",
          "Don't use BatchEnhanceProgress without providing a tier -- it determines the cost display.",
          "Don't render ImageComparisonSlider without both originalUrl and enhancedUrl -- show a placeholder instead.",
          "Don't allow tier selection when the user balance is zero -- disable the checkboxes.",
        ]}
      />

      {/* ImageComparisonSlider */}
      <ComponentSample
        title="Image Comparison Slider"
        description="Interactive before/after slider for comparing original and enhanced images. Drag the handle to reveal differences."
      >
        <div className="max-w-2xl">
          <ImageComparisonSlider
            originalUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=60"
            enhancedUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&sat=20"
            width={16}
            height={9}
          />
        </div>
      </ComponentSample>

      {/* EnhancementSettings */}
      <ComponentSample
        title="Enhancement Settings"
        description="Tier selection panel with cost calculation. Shows available enhancement tiers and computes the total cost based on the user's current balance."
      >
        <div className="max-w-md">
          <EnhancementSettings
            onEnhance={async () => {}}
            currentBalance={100}
            isProcessing={false}
            completedVersions={[]}
          />
        </div>
      </ComponentSample>

      {/* TierSelectionCheckboxes */}
      <ComponentSample
        title="Tier Selection Checkboxes"
        description="Multi-select tier checkboxes for batch processing. Each tier shows resolution and cost, with disabled state when balance is insufficient."
      >
        <div className="max-w-md">
          <TierSelectionCheckboxes
            selectedTiers={selectedTiers}
            onSelectionChange={setSelectedTiers}
            userBalance={50}
          />
        </div>
      </ComponentSample>

      {/* BatchEnhanceProgress */}
      <ComponentSample
        title="Batch Enhance Progress"
        description="Progress tracking for batch enhancement operations. Shows per-image status (completed, processing, pending, failed) with thumbnails."
      >
        <div className="max-w-3xl">
          <BatchEnhanceProgress
            images={mockBatchImages}
            tier="TIER_2K"
          />
        </div>
      </ComponentSample>

      {/* AlbumCard */}
      <ComponentSample
        title="Album Card"
        description="Compact card for displaying album information with preview thumbnails, image count, and privacy status."
      >
        <div className="w-64">
          <AlbumCard album={mockAlbum} onClick={() => {}} />
        </div>
      </ComponentSample>

      {/* CreditBalanceDisplay */}
      <ComponentSample
        title="Credit Balance Display"
        description="Displays the workspace credit balance with optional enhancement cost estimates. Updates in real-time as credits are consumed."
      >
        <div className="max-w-md">
          <CreditBalanceDisplay showEstimates={true} />
        </div>
      </ComponentSample>

      <CodePreview
        title="Enhancement Component Usage"
        code={`import { ImageComparisonSlider } from "@/components/enhance/ImageComparisonSlider";
import { EnhancementSettings } from "@/components/enhance/EnhancementSettings";
import { BatchEnhanceProgress } from "@/components/enhance/BatchEnhanceProgress";

// Before/after comparison
<ImageComparisonSlider
  originalUrl="/images/original.jpg"
  enhancedUrl="/images/enhanced.jpg"
  width={16}
  height={9}
/>

// Enhancement settings with tier selection
<EnhancementSettings
  onEnhance={async () => { /* trigger API */ }}
  currentBalance={100}
  isProcessing={false}
  completedVersions={[]}
/>

// Batch progress tracking
<BatchEnhanceProgress
  images={batchImages}
  tier="TIER_2K"
/>`}
        tabs={[
          {
            label: "Comparison",
            code:
              `import { ImageComparisonSlider } from "@/components/enhance/ImageComparisonSlider";

<ImageComparisonSlider
  originalUrl="/images/original.jpg"
  enhancedUrl="/images/enhanced.jpg"
  width={16}
  height={9}
/>`,
          },
          {
            label: "Settings",
            code: `import { EnhancementSettings } from "@/components/enhance/EnhancementSettings";

<EnhancementSettings
  onEnhance={async () => { /* start enhancement */ }}
  currentBalance={100}
  isProcessing={false}
  completedVersions={[]}
/>`,
          },
          {
            label: "Batch",
            code: `import { BatchEnhanceProgress } from "@/components/enhance/BatchEnhanceProgress";
import { TierSelectionCheckboxes } from "@/components/enhance/TierSelectionCheckboxes";

<TierSelectionCheckboxes
  selectedTiers={selectedTiers}
  onSelectionChange={setSelectedTiers}
  userBalance={50}
/>

<BatchEnhanceProgress images={batchImages} tier="TIER_2K" />`,
          },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "ImageComparisonSlider uses a draggable handle with aria-label and keyboard support (arrow keys to move).",
          "TierSelectionCheckboxes uses native checkbox semantics with descriptive labels for each tier.",
          "BatchEnhanceProgress uses aria-live regions to announce status changes for screen readers.",
          "AlbumCard is a focusable button element with descriptive aria-label including album name and image count.",
          "CreditBalanceDisplay uses semantic heading structure and aria-live for balance updates.",
          "All interactive elements have visible focus indicators meeting WCAG 2.1 AA requirements.",
        ]}
      />

      <RelatedComponents currentId="enhance" />
    </div>
  );
}
