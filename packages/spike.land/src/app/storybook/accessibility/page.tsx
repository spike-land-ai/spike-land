"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  Section,
  UsageGuide,
} from "@/components/storybook";
import { ContrastCheckerDemo } from "@/components/storybook/ContrastCheckerDemo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, MousePointer2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Keyboard Cheat Sheet
// ---------------------------------------------------------------------------

const keyboardShortcuts = [
  {
    keys: ["Tab"],
    description: "Next element",
    icon: <ArrowRight className="h-3 w-3" />,
  },
  {
    keys: ["Shift", "Tab"],
    description: "Previous element",
    icon: <ArrowLeft className="h-3 w-3" />,
  },
  {
    keys: ["Enter", "Space"],
    description: "Activate",
    icon: null,
  },
  {
    keys: ["Escape"],
    description: "Close / Cancel",
    icon: null,
  },
  {
    keys: ["\u2191", "\u2193", "\u2190", "\u2192"],
    description: "Navigate within",
    icon: null,
  },
];

function KeyCap({ children }: { children: React.ReactNode; }) {
  return (
    <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 rounded px-2 py-1 font-mono text-xs shadow-sm">
      {children}
    </span>
  );
}

function KeyboardCheatSheet() {
  return (
    <div className="space-y-3">
      {keyboardShortcuts.map((shortcut, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 rounded-lg bg-muted"
        >
          <div className="flex items-center gap-1 min-w-[140px] flex-shrink-0">
            {shortcut.keys.map((k, ki) => (
              <span key={ki} className="flex items-center gap-1">
                <KeyCap>{k}</KeyCap>
                {ki < shortcut.keys.length - 1 && (
                  <span className="text-muted-foreground text-xs">+</span>
                )}
              </span>
            ))}
            {shortcut.icon && (
              <span className="ml-1 text-muted-foreground">
                {shortcut.icon}
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {shortcut.description}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Focus Indicator Showcase
// ---------------------------------------------------------------------------

function FocusIndicatorShowcase() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tab through the elements below to see the cyan focus ring style in action. The{" "}
        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          focus-visible
        </code>{" "}
        pseudo-class ensures focus rings only appear during keyboard navigation, not mouse clicks.
      </p>
      <div className="flex flex-wrap gap-4 items-center p-6 rounded-xl bg-muted/50 border border-border">
        <Button className="focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2">
          Button
        </Button>
        <Input
          placeholder="Input field"
          className="w-40 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="focus-demo-checkbox"
            className="focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
          />
          <Label htmlFor="focus-demo-checkbox">Checkbox</Label>
        </div>
        <RadioGroup defaultValue="option-a" className="flex gap-3">
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="option-a"
              id="radio-a"
              className="focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
            />
            <Label htmlFor="radio-a">Radio A</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="option-b"
              id="radio-b"
              className="focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
            />
            <Label htmlFor="radio-b">Radio B</Label>
          </div>
        </RadioGroup>
        <a
          href="#focus-anchor"
          onClick={e => e.preventDefault()}
          className="text-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 rounded"
        >
          Link
        </a>
      </div>
      <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-sm">
        <span className="font-medium text-cyan-400">
          Cyan focus ring style:
        </span>{" "}
        <code className="font-mono text-xs">
          focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2
        </code>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Touch Target Checker
// ---------------------------------------------------------------------------

function TouchTargetChecker() {
  const [showTargets, setShowTargets] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        WCAG 2.5.5 requires interactive elements to have a minimum touch target size of{" "}
        <span className="font-medium text-foreground">44 x 44 CSS pixels</span>. Toggle the overlay
        to visualise the actual tap areas.
      </p>

      <div className="flex items-start gap-8 p-6 rounded-xl bg-muted/50 border border-border">
        {/* Properly sized button */}
        <div className="space-y-2 text-center">
          <div className="relative inline-flex">
            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 font-medium text-sm"
              style={{ minWidth: 44, minHeight: 44 }}
              type="button"
            >
              <MousePointer2 className="h-4 w-4" />
              <span>Good</span>
            </button>
            {showTargets && (
              <span className="absolute inset-0 rounded-lg ring-2 ring-green-500 ring-offset-2 pointer-events-none" />
            )}
          </div>
          <p className="text-xs text-green-500 font-medium">44 x 44 px</p>
        </div>

        {/* Undersized button */}
        <div className="space-y-2 text-center">
          <div className="relative inline-flex">
            <button
              className="flex items-center justify-center rounded bg-destructive text-destructive-foreground text-xs px-2"
              style={{ width: 24, height: 24 }}
              type="button"
            >
              X
            </button>
            {showTargets && (
              <span className="absolute inset-0 rounded ring-2 ring-red-500 ring-offset-2 pointer-events-none" />
            )}
          </div>
          <p className="text-xs text-red-500 font-medium">24 x 24 px</p>
        </div>

        <div className="ml-auto self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTargets(v => !v)}
          >
            {showTargets ? "Hide" : "Show"} target overlay
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
          <span className="text-green-500 font-mono font-bold text-sm">
            44px
          </span>
          <span className="text-sm text-muted-foreground">
            Minimum for WCAG 2.5.5 compliance
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
          <span className="text-red-500 font-mono font-bold text-sm">24px</span>
          <span className="text-sm text-muted-foreground">
            Too small -- fails minimum touch target
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Semantic HTML Guide
// ---------------------------------------------------------------------------

const headingTree = [
  {
    tag: "h1",
    label: "Page Title",
    depth: 0,
    children: [
      {
        tag: "h2",
        label: "Section Heading",
        depth: 1,
        children: [
          { tag: "h3", label: "Subsection", depth: 2, children: [] },
          { tag: "h3", label: "Another Subsection", depth: 2, children: [] },
        ],
      },
      {
        tag: "h2",
        label: "Another Section",
        depth: 1,
        children: [
          { tag: "h3", label: "Nested Subsection", depth: 2, children: [] },
        ],
      },
    ],
  },
];

type HeadingNode = {
  tag: string;
  label: string;
  depth: number;
  children: HeadingNode[];
};

function HeadingTree({ nodes }: { nodes: HeadingNode[]; }) {
  const sizeMap: Record<string, string> = {
    h1: "text-lg font-bold",
    h2: "text-base font-semibold",
    h3: "text-sm font-medium",
  };
  return (
    <ul className="space-y-1">
      {nodes.map((node, i) => (
        <li key={i}>
          <div
            className="flex items-center gap-2 py-1"
            style={{ paddingLeft: `${node.depth * 20}px` }}
          >
            <span className="font-mono text-xs text-primary/70 min-w-[24px]">
              {node.tag}
            </span>
            <span className={sizeMap[node.tag] ?? "text-sm"}>
              {node.label}
            </span>
          </div>
          {node.children.length > 0 && <HeadingTree nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

const landmarks = [
  { tag: "header", description: "Site branding, logo, global navigation" },
  { tag: "nav", description: "Primary and secondary navigation menus" },
  { tag: "main", description: "The unique primary content of the page" },
  { tag: "aside", description: "Supplementary content, sidebars" },
  { tag: "footer", description: "Copyright, links, contact info" },
];

function SemanticHTMLGuide() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Heading Hierarchy
          </h4>
          <div className="p-4 rounded-xl border border-border bg-muted/30">
            <HeadingTree nodes={headingTree} />
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Landmark Roles
          </h4>
          <div className="space-y-2">
            {landmarks.map(lm => (
              <div
                key={lm.tag}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
              >
                <code className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                  &lt;{lm.tag}&gt;
                </code>
                <span className="text-sm text-muted-foreground">
                  {lm.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color Blindness Preview
// ---------------------------------------------------------------------------

const brandColors = [
  { name: "Primary", hex: "#6366f1" },
  { name: "Accent", hex: "#22d3ee" },
  { name: "Success", hex: "#22c55e" },
  { name: "Destructive", hex: "#ef4444" },
  { name: "Warning", hex: "#f59e0b" },
];

const visionModes = [
  { label: "Normal", filter: "none" },
  { label: "Protanopia", filter: "url(#protanopia)" },
  { label: "Deuteranopia", filter: "url(#deuteranopia)" },
  { label: "Tritanopia", filter: "url(#tritanopia)" },
];

function ColorBlindnessPreview() {
  const [activeMode, setActiveMode] = useState(0);

  return (
    <div className="space-y-6">
      {/* SVG color blindness simulation filters */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Protanopia (red deficiency) */}
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
            />
          </filter>
          {/* Deuteranopia (green deficiency) */}
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"
            />
          </filter>
          {/* Tritanopia (blue deficiency) - approximate */}
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {visionModes.map((mode, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveMode(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeMode === i
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Color swatches */}
      <div
        className="grid grid-cols-5 gap-3"
        style={{ filter: visionModes[activeMode]?.filter ?? "none" }}
      >
        {brandColors.map(color => (
          <div key={color.name} className="space-y-2 text-center">
            <div
              className="h-16 rounded-xl border border-white/10 shadow"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-xs text-muted-foreground">{color.name}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Simulation uses SVG <code className="font-mono">feColorMatrix</code>{" "}
        filters for approximate color deficiency representation. Actual perception varies by
        individual.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyboard Navigation Simulator
// ---------------------------------------------------------------------------

const navItems = [
  { id: "home", label: "Home", role: "link" },
  { id: "profile", label: "Profile", role: "link" },
  { id: "settings", label: "Settings", role: "link" },
  { id: "search", label: "Search", role: "button" },
  { id: "notifications", label: "Notifications", role: "button" },
];

function KeyboardNavSimulator() {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [activatedItems, setActivatedItems] = useState<string[]>([]);
  const [keyLog, setKeyLog] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const logKey = useCallback((key: string) => {
    setKeyLog(prev => [...prev.slice(-7), key]);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        logKey(e.shiftKey ? "Shift+Tab" : "Tab");
        if (e.shiftKey) {
          setFocusedIndex(prev => (prev <= 0 ? navItems.length - 1 : prev - 1));
        } else {
          setFocusedIndex(prev => (prev >= navItems.length - 1 ? 0 : prev + 1));
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        logKey(e.key === " " ? "Space" : "Enter");
        if (focusedIndex >= 0 && navItems[focusedIndex]) {
          const item = navItems[focusedIndex];
          setActivatedItems(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        logKey(e.key === "ArrowRight" ? "\u2192" : "\u2193");
        setFocusedIndex(prev => (prev >= navItems.length - 1 ? 0 : prev + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        logKey(e.key === "ArrowLeft" ? "\u2190" : "\u2191");
        setFocusedIndex(prev => (prev <= 0 ? navItems.length - 1 : prev - 1));
      }
    },
    [focusedIndex, logKey],
  );

  return (
    <div className="space-y-6 w-full">
      <p className="text-sm text-muted-foreground">
        Click into the navigation bar below, then use <KeyCap>Tab</KeyCap>, arrow keys, and{" "}
        <KeyCap>Enter</KeyCap>/<KeyCap>Space</KeyCap>{" "}
        to navigate. The simulator intercepts key events so you can see focus movement and
        activation without leaving this area.
      </p>

      <div
        ref={containerRef}
        tabIndex={0}
        role="toolbar"
        aria-label="Keyboard navigation simulator"
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (focusedIndex === -1) setFocusedIndex(0);
        }}
        className="flex items-center gap-1 p-2 rounded-xl border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {navItems.map((item, i) => (
          <div
            key={item.id}
            className={`
              px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-default select-none
              ${
              i === focusedIndex
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                : activatedItems.includes(item.id)
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }
            `}
            role={item.role}
            aria-current={i === focusedIndex ? "true" : undefined}
          >
            {item.label}
            {activatedItems.includes(item.id) && (
              <span className="ml-1.5 text-xs opacity-70">*</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Key Log
          </p>
          <div className="flex gap-1.5 flex-wrap min-h-[28px]">
            {keyLog.length === 0
              ? (
                <span className="text-xs text-muted-foreground/50">
                  No keys pressed yet
                </span>
              )
              : (
                keyLog.map((key, i) => (
                  <span
                    key={`${key}-${i}`}
                    className="text-xs font-mono px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20"
                  >
                    {key}
                  </span>
                ))
              )}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Activated Items
          </p>
          <div className="flex gap-1.5 flex-wrap min-h-[28px]">
            {activatedItems.length === 0
              ? (
                <span className="text-xs text-muted-foreground/50">
                  Press Enter/Space to activate
                </span>
              )
              : (
                activatedItems.map(id => (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {navItems.find(n => n.id === id)?.label}
                  </Badge>
                ))
              )}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setFocusedIndex(-1);
          setActivatedItems([]);
          setKeyLog([]);
        }}
      >
        Reset Simulator
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen Reader Output Demo
// ---------------------------------------------------------------------------

interface SrOutputItem {
  element: string;
  visualLabel: string;
  srAnnouncement: string;
  notes: string;
}

const srOutputExamples: SrOutputItem[] = [
  {
    element: "Button",
    visualLabel: "Submit",
    srAnnouncement: "Submit, button",
    notes: "Announces role and accessible name",
  },
  {
    element: "Link",
    visualLabel: "Learn more",
    srAnnouncement: "Learn more, link",
    notes: "Screen reader identifies as a link for navigation",
  },
  {
    element: "Icon Button",
    visualLabel: "(trash icon)",
    srAnnouncement: "Delete item, button",
    notes: "aria-label provides the accessible name when no visible text",
  },
  {
    element: "Checkbox",
    visualLabel: "Accept terms",
    srAnnouncement: "Accept terms, checkbox, not checked",
    notes: "Announces role and current state (checked/unchecked)",
  },
  {
    element: "Alert",
    visualLabel: "Error: invalid email",
    srAnnouncement: "Alert: Error: invalid email",
    notes: "role='alert' causes immediate announcement via aria-live",
  },
  {
    element: "Loading Button",
    visualLabel: "Saving...",
    srAnnouncement: "Save, button, busy",
    notes: "aria-busy='true' informs screen reader of pending state",
  },
  {
    element: "Accordion",
    visualLabel: "FAQ Section",
    srAnnouncement: "FAQ Section, collapsed, button",
    notes: "aria-expanded='false' communicates collapsed state",
  },
  {
    element: "Tab",
    visualLabel: "Settings",
    srAnnouncement: "Settings, tab, 3 of 5, selected",
    notes: "Announces position in tab list and selection state",
  },
];

function ScreenReaderOutputDemo() {
  const [selectedExample, setSelectedExample] = useState(0);
  const current = srOutputExamples[selectedExample];

  return (
    <div className="space-y-6 w-full">
      <p className="text-sm text-muted-foreground">
        See how screen readers interpret common UI elements. Select an element to view its visual
        appearance versus what assistive technology announces.
      </p>

      <div className="flex flex-wrap gap-2">
        {srOutputExamples.map((example, i) => (
          <button
            key={example.element}
            type="button"
            onClick={() => setSelectedExample(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === selectedExample
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {example.element}
          </button>
        ))}
      </div>

      {current && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-border bg-muted/30 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Visual Appearance
            </p>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border min-h-[60px]">
              <span className="text-sm font-medium">{current.visualLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {current.element} element
            </p>
          </div>

          <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Screen Reader Output
            </p>
            <div
              className="flex items-center gap-3 p-4 rounded-lg bg-[#0a0a1a] border border-white/10 min-h-[60px]"
              role="status"
              aria-live="polite"
            >
              <span className="font-mono text-sm text-[#e2e8f0]">
                &quot;{current.srAnnouncement}&quot;
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{current.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Announcements Demo
// ---------------------------------------------------------------------------

function LiveAnnouncementsDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const [politeness, setPoliteness] = useState<"polite" | "assertive">(
    "polite",
  );
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback(
    (message: string) => {
      setMessages(prev => [...prev.slice(-4), `[${politeness}] ${message}`]);
    },
    [politeness],
  );

  return (
    <div className="space-y-6 w-full">
      <p className="text-sm text-muted-foreground">
        ARIA live regions announce dynamic content changes to screen readers without moving focus.
        Toggle between{" "}
        <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
          polite
        </code>{" "}
        (waits for current speech to finish) and{" "}
        <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
          assertive
        </code>{" "}
        (interrupts immediately).
      </p>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPoliteness("polite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              politeness === "polite"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            aria-live=&quot;polite&quot;
          </button>
          <button
            type="button"
            onClick={() => setPoliteness("assertive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              politeness === "assertive"
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            aria-live=&quot;assertive&quot;
          </button>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <Button
          size="sm"
          variant="outline"
          onClick={() => announce("3 new notifications")}
        >
          Simulate notification
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => announce("Form saved successfully")}
        >
          Simulate success
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => announce("Error: required field missing")}
        >
          Simulate error
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Announcement Log
          </p>
          <div className="space-y-1.5 min-h-[80px]">
            {messages.length === 0
              ? (
                <span className="text-xs text-muted-foreground/50">
                  No announcements yet
                </span>
              )
              : (
                messages.map((msg, i) => (
                  <div
                    key={`${msg}-${i}`}
                    className="text-xs font-mono px-2 py-1.5 rounded bg-background border border-border text-foreground"
                  >
                    {msg}
                  </div>
                ))
              )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Live Region (inspectable)
          </p>
          <div
            ref={liveRegionRef}
            role="status"
            aria-live={politeness}
            aria-atomic="true"
            className="text-sm font-mono p-3 rounded-lg bg-[#0a0a1a] border border-white/10 text-[#e2e8f0] min-h-[60px] flex items-center"
          >
            {messages.length > 0
              ? messages[messages.length - 1]
              : "(empty -- waiting for announcement)"}
          </div>
          <p className="text-xs text-muted-foreground">
            This div has{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded">
              aria-live=&quot;{politeness}&quot;
            </code>{" "}
            and{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded">
              aria-atomic=&quot;true&quot;
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccessibilityPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Accessibility"
        description="Tools, guidelines, and interactive demos to ensure our components are usable by everyone."
        usage="Use these tools to verify WCAG compliance before shipping UI changes. All interactive elements should pass AA contrast, have visible focus rings, and meet minimum touch target sizes."
      />

      {/* Color Contrast */}
      <Section
        title="Color Contrast"
        description="Test color combinations against WCAG 2.1 guidelines"
      >
        <ComponentSample
          title="Color Contrast Checker"
          description="Enter hex values to see the live contrast ratio and WCAG pass/fail status for AA and AAA levels."
        >
          <div className="w-full">
            <ContrastCheckerDemo />
          </div>
        </ComponentSample>

        <UsageGuide
          dos={[
            "Use 4.5:1 contrast minimum for normal body text (WCAG AA)",
            "Use 3:1 for large text (18pt+) and UI components",
            "Aim for 7:1 for AAA compliance in critical content",
            "Test both light and dark mode color pairings",
          ]}
          donts={[
            "Rely solely on color to convey meaning",
            "Use light gray text on white backgrounds",
            "Ignore contrast for placeholder text or disabled states",
          ]}
        />
      </Section>

      {/* Focus Indicators */}
      <Section
        title="Focus Indicators"
        description="Visible focus rings are essential for keyboard and switch access users"
      >
        <ComponentSample
          title="Focus Ring Showcase"
          description="Tab through the interactive elements below to see the cyan focus ring style applied consistently across Button, Input, Checkbox, Radio, and Link."
        >
          <div className="w-full">
            <FocusIndicatorShowcase />
          </div>
        </ComponentSample>
      </Section>

      {/* Keyboard Navigation */}
      <Section
        title="Keyboard Navigation"
        description="Expected keyboard behavior for interactive components"
      >
        <ComponentSample
          title="Keyboard Cheat Sheet"
          description="Standard keyboard shortcuts that all interactive components must support."
        >
          <div className="w-full space-y-6">
            <KeyboardCheatSheet />
            <Separator />
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Live Test Area
              </Label>
              <p className="text-sm text-muted-foreground">
                Navigate through these elements using only your keyboard:
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <Button>Button 1</Button>
                <Button variant="outline">Button 2</Button>
                <Button variant="secondary">Button 3</Button>
                <Input placeholder="Type here..." className="w-36" />
                <div className="flex items-center gap-2">
                  <Checkbox id="kb-test-checkbox" />
                  <Label htmlFor="kb-test-checkbox">Checkbox</Label>
                </div>
              </div>
            </div>
          </div>
        </ComponentSample>

        <ComponentSample
          title="Keyboard Navigation Simulator"
          description="An interactive toolbar that intercepts Tab, arrow keys, and Enter/Space. Watch the focus indicator move and see activated items logged in real-time."
        >
          <KeyboardNavSimulator />
        </ComponentSample>
      </Section>

      {/* Screen Reader Output */}
      <Section
        title="Screen Reader Output"
        description="How assistive technology interprets UI components"
      >
        <ComponentSample
          title="Screen Reader Announcement Viewer"
          description="Select a UI element to see what a screen reader announces compared to its visual appearance. Demonstrates how ARIA roles, labels, and states translate to speech output."
        >
          <ScreenReaderOutputDemo />
        </ComponentSample>

        <ComponentSample
          title="Live Region Announcements"
          description="Demonstrates aria-live regions that announce dynamic content changes (notifications, form feedback, errors) without moving focus. Toggle between polite and assertive modes."
        >
          <LiveAnnouncementsDemo />
        </ComponentSample>
      </Section>

      {/* Touch Targets */}
      <Section
        title="Touch Targets"
        description="Minimum interactive area sizes for touch and pointer accessibility"
      >
        <ComponentSample
          title="Touch Target Size Checker"
          description="WCAG 2.5.5 requires interactive elements to be at least 44 x 44 CSS pixels. Toggle the overlay to visualise actual tap areas."
        >
          <div className="w-full">
            <TouchTargetChecker />
          </div>
        </ComponentSample>
      </Section>

      {/* Semantic HTML */}
      <Section
        title="Semantic HTML"
        description="Proper document structure for assistive technologies"
      >
        <ComponentSample
          title="Heading Hierarchy & Landmarks"
          description="Screen readers navigate by headings and landmark regions. Use them to create a logical document outline."
        >
          <div className="w-full">
            <SemanticHTMLGuide />
          </div>
        </ComponentSample>

        <UsageGuide
          dos={[
            "Use one h1 per page that describes the page content",
            "Never skip heading levels (e.g., h1 then h3)",
            "Wrap navigation in <nav> with aria-label for multiple navs",
            "Use <main> exactly once to identify the primary content",
          ]}
          donts={[
            "Use headings only for visual styling -- use CSS instead",
            "Nest <main> inside <article> or <section>",
            "Leave landmark regions without accessible names when there are multiples",
          ]}
        />
      </Section>

      {/* Color Blindness */}
      <Section
        title="Color Blindness"
        description="Preview how brand colors appear under common color vision deficiencies"
      >
        <ComponentSample
          title="Color Blindness Simulation"
          description="Approximately 8% of males and 0.5% of females have some form of color vision deficiency. Toggle between vision modes to preview."
        >
          <div className="w-full">
            <ColorBlindnessPreview />
          </div>
        </ComponentSample>

        <UsageGuide
          dos={[
            "Always pair color with another visual indicator (icon, pattern, label)",
            "Test UI under protanopia and deuteranopia -- the most common deficiencies",
            "Use distinct shapes and labels alongside color-coded status indicators",
          ]}
          donts={[
            "Use red/green alone to indicate success vs error",
            "Assume all users perceive your brand palette the same way",
          ]}
        />
      </Section>

      {/* ARIA Attributes */}
      <Section
        title="ARIA Attributes"
        description="Key ARIA attributes used in our components"
      >
        <ComponentSample
          title="Common ARIA Attributes"
          description="Reference guide for the most frequently used ARIA attributes and their purpose in component development."
        >
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                attr: "aria-label",
                desc: "Provides accessible name for elements without visible text",
              },
              {
                attr: "aria-busy",
                desc: "Indicates an element is being modified (e.g., loading button)",
              },
              {
                attr: "aria-expanded",
                desc: "Indicates whether an accordion or dropdown is open",
              },
              {
                attr: "aria-hidden",
                desc: "Hides decorative content from screen readers",
              },
              {
                attr: "aria-live",
                desc: "Marks a region that receives dynamic content updates",
              },
              {
                attr: "aria-describedby",
                desc: "Associates an element with its description text",
              },
            ].map(({ attr, desc }) => (
              <div
                key={attr}
                className="p-4 rounded-lg border border-border space-y-2"
              >
                <Badge variant="outline" className="font-mono text-xs">
                  {attr}
                </Badge>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </ComponentSample>
      </Section>

      {/* Animation Tokens */}
      <Section
        title="Animation Tokens"
        description="CSS custom properties for consistent, accessible animation durations"
      >
        <ComponentSample
          title="Duration Tokens"
          description="All animations respect prefers-reduced-motion to ensure accessibility for users who are sensitive to motion."
        >
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  token: "--animation-fast",
                  value: "150ms",
                  usage: "Tooltips, hovers",
                },
                {
                  token: "--animation-normal",
                  value: "200ms",
                  usage: "Buttons, cards",
                },
                {
                  token: "--animation-slow",
                  value: "300ms",
                  usage: "Modals, accordions",
                },
              ].map(({ token, value, usage }) => (
                <div
                  key={token}
                  className="p-4 rounded-lg border border-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">
                      {token}
                    </Badge>
                    <span className="font-mono text-sm">{value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{usage}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm">
                <span className="font-medium">Note:</span> All animations respect{" "}
                <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">
                  prefers-reduced-motion
                </code>{" "}
                to ensure accessibility for users who are sensitive to motion.
              </p>
            </div>
          </div>
        </ComponentSample>
      </Section>

      {/* Code Preview */}
      <CodePreview
        title="Accessibility Patterns"
        tabs={[
          {
            label: "Focus Ring",
            code: `// Consistent focus ring style for all interactive elements
<Button className="focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2">
  Accessible Button
</Button>

// The focus-visible pseudo-class only shows the ring
// during keyboard navigation, not mouse clicks.`,
          },
          {
            label: "aria-live",
            code: `// Polite announcement (waits for current speech)
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive announcement (interrupts immediately)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>`,
          },
          {
            label: "Screen Reader",
            code: `// Icon-only button with accessible label
<Button variant="ghost" size="icon" aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</Button>

// Loading state with aria-busy
<Button disabled aria-busy={isLoading}>
  {isLoading ? <Spinner /> : "Save"}
</Button>

// Expandable section with aria-expanded
<button aria-expanded={isOpen} aria-controls="panel-1">
  FAQ Section
</button>
<div id="panel-1" hidden={!isOpen}>
  Panel content...
</div>`,
          },
          {
            label: "Landmarks",
            code: `// Proper page structure for screen reader navigation
<header>
  <nav aria-label="Primary navigation">
    {/* Main nav links */}
  </nav>
</header>

<main>
  <h1>Page Title</h1>
  <section aria-labelledby="section-heading">
    <h2 id="section-heading">Section</h2>
    {/* Section content */}
  </section>
</main>

<aside aria-label="Related links">
  {/* Sidebar content */}
</aside>

<footer>
  {/* Footer content */}
</footer>`,
          },
        ]}
        code=""
      />

      <AccessibilityPanel
        notes={[
          "All interactive elements meet WCAG AA contrast ratio of 4.5:1 for normal text.",
          "Focus indicators use a visible cyan ring that appears only on keyboard navigation.",
          "Touch targets meet the minimum 44x44 CSS pixel requirement (WCAG 2.5.5).",
          "Heading hierarchy follows a strict logical order without skipping levels.",
          "Landmark regions (header, nav, main, aside, footer) provide structural navigation.",
          "ARIA live regions announce dynamic content changes without stealing focus.",
          "Color is never the sole means of conveying information -- always paired with text or icons.",
          "All animations respect the prefers-reduced-motion media query.",
        ]}
      />

      <RelatedComponents currentId="accessibility" />
    </div>
  );
}
