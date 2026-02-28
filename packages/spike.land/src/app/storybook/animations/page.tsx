"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  PropsTable,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, Heart } from "lucide-react";
import { useState } from "react";

// Transition Showcase Card
function TransitionCard({
  label,
  className,
  hoverClass,
}: {
  label: string;
  className: string;
  hoverClass: string;
}) {
  return (
    <div className="space-y-3">
      <div
        className={`flex items-center justify-center h-24 rounded-xl border border-border/50 bg-primary/10 cursor-pointer select-none transition-all duration-300 ${hoverClass}`}
        aria-label={`Demo of ${label}`}
      >
        <span className="text-sm font-bold text-primary">Hover me</span>
      </div>
      <p className="text-xs font-mono text-center text-muted-foreground bg-muted/30 px-2 py-1 rounded">
        {className}
      </p>
      <p className="text-xs text-center text-foreground/70">{label}</p>
    </div>
  );
}

// Heart toggle micro-interaction
function HeartButton() {
  const [liked, setLiked] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setLiked(v => !v)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors duration-200 group"
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-300 ${
          liked
            ? "fill-red-500 text-red-500 scale-125"
            : "text-muted-foreground scale-100"
        }`}
      />
      <span className="text-sm font-medium">{liked ? "Liked!" : "Like"}</span>
    </button>
  );
}

// Toggle switch
function AnimatedSwitch() {
  const [on, setOn] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(v => !v)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        on ? "bg-primary border-primary" : "bg-muted border-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          on ? "translate-x-7" : "translate-x-1"
        }`}
      />
      <span className="sr-only">Toggle switch</span>
    </button>
  );
}

// Staggered list item
function StaggeredItem({
  index,
  label,
}: {
  index: number;
  label: string;
}) {
  const delays = [
    "animation-delay-[0ms]",
    "animation-delay-[100ms]",
    "animation-delay-[200ms]",
    "animation-delay-[300ms]",
    "animation-delay-[400ms]",
  ];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-primary/5 animate-in fade-in slide-in-from-left-4 duration-500 ${
        delays[index]
      }`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
        {index + 1}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// Duration bar demo
function DurationBar({
  label,
  duration,
  easing,
  color,
}: {
  label: string;
  duration: string;
  easing: string;
  color: string;
}) {
  const [running, setRunning] = useState(false);

  const trigger = () => {
    setRunning(false);
    setTimeout(() => setRunning(true), 16);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono font-medium text-foreground">{label}</span>
        <span>{easing}</span>
      </div>
      <div
        className="h-8 rounded-lg bg-muted/30 overflow-hidden cursor-pointer border border-border/30"
        onClick={trigger}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && trigger()}
        role="button"
        tabIndex={0}
        aria-label={`Trigger ${label} animation`}
      >
        <div
          className={`h-full rounded-lg ${color} ${duration} ${easing} transition-[width] ${
            running ? "w-full" : "w-0"
          }`}
          style={running ? {} : { width: 0 }}
        />
      </div>
    </div>
  );
}

// Shake animation via inline keyframes
function ShakeBadge() {
  const [shaking, setShaking] = useState(false);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  return (
    <button
      type="button"
      onClick={shake}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      aria-label="Shake the badge"
    >
      <Badge
        className="px-4 py-2 text-sm cursor-pointer select-none"
        style={shaking
          ? {
            animation: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
          }
          : {}}
      >
        Click to Shake
      </Badge>
      <style>
        {`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
      `}
      </style>
    </button>
  );
}

// Glow pulsing badge
function GlowBadge() {
  return (
    <Badge className="px-4 py-2 text-sm bg-primary text-primary-foreground animate-pulse shadow-[0_0_12px_4px_hsl(var(--primary)/0.5)]">
      Live
    </Badge>
  );
}

// Bounce-in badge
function BounceInBadge() {
  const [visible, setVisible] = useState(false);

  const trigger = () => {
    setVisible(false);
    setTimeout(() => setVisible(true), 16);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 flex items-center justify-center">
        {visible && (
          <Badge
            className="px-4 py-2 text-sm"
            style={{
              animation: "bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
            }}
          >
            Bounce In!
          </Badge>
        )}
        <style>
          {`
          @keyframes bounceIn {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.15); opacity: 1; }
            80%  { transform: scale(0.95); }
            100% { transform: scale(1); }
          }
        `}
        </style>
      </div>
      <Button size="sm" variant="outline" onClick={trigger}>
        Trigger Bounce-in
      </Button>
    </div>
  );
}

// Reduced Motion demo
function ReducedMotionDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground">
          Default (motion enabled)
        </h4>
        <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="h-3 rounded bg-muted animate-pulse w-3/4" />
          <p className="text-xs text-muted-foreground font-mono">
            animate-spin, animate-pulse
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground">
          Reduced motion (motion-reduce:)
        </h4>
        <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3">
          <div
            className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary"
            style={{ animation: "none" }}
          />
          <div className="h-3 rounded bg-muted w-3/4 opacity-60" />
          <p className="text-xs text-muted-foreground font-mono">
            motion-reduce:animate-none
          </p>
        </div>
      </div>
    </div>
  );
}

// Composed animation demo
function ComposedAnimationDemo() {
  const [active, setActive] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="flex flex-col items-center gap-3">
          <h4 className="text-sm font-bold text-foreground">Fade + Scale</h4>
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 transition-all duration-500 ${
              active ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          />
          <p className="text-xs font-mono text-muted-foreground">
            opacity + scale
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <h4 className="text-sm font-bold text-foreground">Slide + Fade</h4>
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 transition-all duration-500 ${
              active ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          />
          <p className="text-xs font-mono text-muted-foreground">
            translate-y + opacity
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <h4 className="text-sm font-bold text-foreground">
            Rotate + Scale + Color
          </h4>
          <div
            className={`w-20 h-20 rounded-2xl transition-all duration-700 ${
              active
                ? "bg-gradient-to-br from-emerald-500 to-green-500 rotate-180 scale-110"
                : "bg-gradient-to-br from-orange-500 to-red-500 rotate-0 scale-100"
            }`}
          />
          <p className="text-xs font-mono text-muted-foreground">
            rotate + scale + bg
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setActive(v => !v)}
      >
        {active ? "Reset" : "Trigger Composed Animations"}
      </Button>
    </div>
  );
}

export default function AnimationsPage() {
  const [activeScaleBtn, setActiveScaleBtn] = useState(false);

  const transitionCards = [
    {
      label: "Scale up",
      className: "hover:scale-110",
      hoverClass: "hover:scale-110",
    },
    {
      label: "Fade (opacity)",
      className: "hover:opacity-50",
      hoverClass: "hover:opacity-50",
    },
    {
      label: "Translate Y",
      className: "hover:-translate-y-2",
      hoverClass: "hover:-translate-y-2",
    },
    {
      label: "Rotate",
      className: "hover:rotate-6",
      hoverClass: "hover:rotate-6",
    },
  ];

  const staggeredItems = [
    "Initialize workspace",
    "Load dependencies",
    "Connect services",
    "Run health checks",
    "Ready to launch",
  ];

  const durationBars = [
    {
      label: "duration-150",
      duration: "duration-150",
      easing: "ease-out",
      color: "bg-sky-500",
    },
    {
      label: "duration-200",
      duration: "duration-200",
      easing: "ease-out",
      color: "bg-blue-500",
    },
    {
      label: "duration-300",
      duration: "duration-300",
      easing: "ease-in-out",
      color: "bg-violet-500",
    },
    {
      label: "duration-500",
      duration: "duration-500",
      easing: "ease-in-out",
      color: "bg-fuchsia-500",
    },
  ];

  const easingBars = [
    {
      label: "ease-in",
      duration: "duration-500",
      easing: "ease-in",
      color: "bg-orange-400",
    },
    {
      label: "ease-out",
      duration: "duration-500",
      easing: "ease-out",
      color: "bg-emerald-400",
    },
    {
      label: "ease-in-out",
      duration: "duration-500",
      easing: "ease-in-out",
      color: "bg-cyan-400",
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Animations & Motion"
        description="Transitions, micro-interactions, loading states, and timing tokens. Motion provides feedback, guides attention, and creates a sense of responsiveness in the interface."
        usage="Use transitions for state changes, micro-interactions for direct manipulation feedback, and loading animations to communicate async work. Keep motion purposeful and respect prefers-reduced-motion."
        badge="Foundation"
      />

      <UsageGuide
        dos={[
          "Use short durations (150-300ms) for UI state changes like hover and focus.",
          "Prefer ease-out for elements entering the screen, ease-in for elements leaving.",
          "Use animate-pulse or animate-spin only for genuinely async / loading states.",
          "Add transition-all or specific transition properties to interactive elements.",
          "Respect prefers-reduced-motion via Tailwind's motion-safe: and motion-reduce: variants.",
          "Compose multiple transform properties (scale + translate) on a single transition for fluid combined effects.",
        ]}
        donts={[
          "Don't animate layout properties (width, height, top, left) -- use transform instead.",
          "Avoid durations longer than 500ms for routine UI transitions.",
          "Don't use animate-ping or animate-bounce as purely decorative effects.",
          "Never rely on animation alone to convey information -- add text or ARIA labels.",
          "Don't stack multiple simultaneous animations on a single element without coordinating timing.",
          "Never auto-play looping animations that cannot be paused by the user.",
        ]}
      />

      {/* Motion Tokens Reference */}
      <ComponentSample
        title="Motion Tokens"
        description="Standard duration, easing, and animation classes used across the design system. Use these tokens consistently instead of arbitrary values."
      >
        <div className="w-full">
          <PropsTable
            componentName="Motion Tokens"
            importPath="tailwindcss (built-in utilities)"
            props={[
              {
                name: "duration-150",
                type: "CSS class",
                default: "150ms",
                description: "Micro-interactions: hover, focus, active states",
              },
              {
                name: "duration-200",
                type: "CSS class",
                default: "200ms",
                description: "Small transitions: tooltips, dropdowns, toggles",
              },
              {
                name: "duration-300",
                type: "CSS class",
                default: "300ms",
                description: "Medium transitions: panels, modals, page elements",
              },
              {
                name: "duration-500",
                type: "CSS class",
                default: "500ms",
                description: "Large transitions: page-level or staggered entries",
              },
              {
                name: "ease-out",
                type: "CSS class",
                default: "cubic-bezier(0,0,0.2,1)",
                description: "Natural deceleration -- use for elements entering view",
              },
              {
                name: "ease-in",
                type: "CSS class",
                default: "cubic-bezier(0.4,0,1,1)",
                description: "Acceleration -- use for elements leaving view",
              },
              {
                name: "ease-in-out",
                type: "CSS class",
                default: "cubic-bezier(0.4,0,0.2,1)",
                description: "Symmetric curve -- use for toggles and state changes",
              },
              {
                name: "animate-spin",
                type: "CSS class",
                description: "Continuous 360deg rotation for spinners and loaders",
              },
              {
                name: "animate-pulse",
                type: "CSS class",
                description: "Fade in/out loop for skeleton placeholders",
              },
              {
                name: "animate-bounce",
                type: "CSS class",
                description: "Vertical bounce for scroll cues or attention",
              },
              {
                name: "animate-ping",
                type: "CSS class",
                description: "Expanding ring for live indicators or notifications",
              },
            ]}
          />
        </div>
      </ComponentSample>

      {/* Transition Showcase */}
      <ComponentSample
        title="Transition Showcase"
        description="Hover each card to see the CSS transform or property in action. The class shown is the only addition needed."
        code={`<div className="transition-all duration-300 hover:scale-110">
  Hover me
</div>`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
          {transitionCards.map(card => <TransitionCard key={card.className} {...card} />)}
        </div>
      </ComponentSample>

      {/* Micro-interactions */}
      <ComponentSample
        title="Micro-interactions"
        description="Small animations that confirm user intent and create a sense of direct manipulation."
        code={`// Press scale feedback
<Button className="transition-transform duration-150 active:scale-95">
  Press Me
</Button>

// Heart toggle with scale + color
<Heart className={\`transition-all duration-300 \${
  liked ? "fill-red-500 scale-125" : "scale-100"
}\`} />`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="flex flex-col items-center gap-4">
            <h4 className="text-sm font-bold">Press Scale</h4>
            <Button
              className={`transition-transform duration-150 active:scale-95 select-none ${
                activeScaleBtn ? "scale-95" : "scale-100"
              }`}
              onMouseDown={() => setActiveScaleBtn(true)}
              onMouseUp={() => setActiveScaleBtn(false)}
              onMouseLeave={() => setActiveScaleBtn(false)}
            >
              Press Me
            </Button>
            <p className="text-xs font-mono text-muted-foreground">
              active:scale-95
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <h4 className="text-sm font-bold">Heart Toggle</h4>
            <HeartButton />
            <p className="text-xs font-mono text-muted-foreground">
              fill / scale / color transition
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <h4 className="text-sm font-bold">Switch Toggle</h4>
            <AnimatedSwitch />
            <p className="text-xs font-mono text-muted-foreground">
              translate-x + bg transition
            </p>
          </div>
        </div>
      </ComponentSample>

      {/* Loading Animations */}
      <ComponentSample
        title="Loading Animations"
        description="Tailwind's four built-in animation utilities cover the most common async feedback patterns."
        code={`// Spinner
<div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />

// Skeleton pulse
<div className="h-3 rounded bg-muted animate-pulse" />

// Scroll hint bounce
<ArrowDown className="animate-bounce" />

// Live indicator ping
<div className="relative">
  <div className="w-4 h-4 rounded-full bg-primary" />
  <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
</div>`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
          <div className="flex flex-col items-center gap-4">
            <h4 className="text-sm font-bold">animate-spin</h4>
            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-xs font-mono text-muted-foreground">
              animate-spin
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <h4 className="text-sm font-bold">animate-pulse</h4>
            <div className="w-full space-y-2">
              <div className="h-3 rounded bg-muted animate-pulse" />
              <div className="h-3 rounded bg-muted animate-pulse w-4/5" />
              <div className="h-3 rounded bg-muted animate-pulse w-2/3" />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              animate-pulse
            </span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <h4 className="text-sm font-bold">animate-bounce</h4>
            <div className="p-2 rounded-full bg-primary/10">
              <ArrowDown className="w-6 h-6 text-primary animate-bounce" />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              animate-bounce
            </span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <h4 className="text-sm font-bold">animate-ping</h4>
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary animate-ping opacity-75" />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              animate-ping
            </span>
          </div>
        </div>
      </ComponentSample>

      {/* Staggered Animations */}
      <ComponentSample
        title="Staggered Animations"
        description="List items appear sequentially using animation-delay inline styles (incrementing by 100ms) combined with Tailwind's animate-in utilities."
        code={`// Each item gets an incremental delay
{items.map((item, i) => (
  <div
    key={item}
    className="animate-in fade-in slide-in-from-left-4 duration-500"
    style={{
      animationDelay: \`\${i * 100}ms\`,
      animationFillMode: "both",
    }}
  >
    {item}
  </div>
))}`}
      >
        <div className="w-full max-w-md space-y-2">
          {staggeredItems.map((item, i) => <StaggeredItem key={item} index={i} label={item} />)}
        </div>
      </ComponentSample>

      {/* Attention Seekers */}
      <ComponentSample
        title="Attention Seekers"
        description="Use these sparingly to draw the eye to critical status or new content."
        code={`// Shake via @keyframes
<Badge style={{
  animation: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both"
}}>
  Error
</Badge>

// Glow pulse
<Badge className="animate-pulse shadow-[0_0_12px_4px_hsl(var(--primary)/0.5)]">
  Live
</Badge>

// Bounce-in
<Badge style={{
  animation: "bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both"
}}>
  New!
</Badge>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="flex flex-col items-center gap-3">
            <h4 className="text-sm font-bold">Shake</h4>
            <ShakeBadge />
            <p className="text-xs text-muted-foreground">
              Error / invalid input feedback
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <h4 className="text-sm font-bold">Glow Pulse</h4>
            <GlowBadge />
            <p className="text-xs text-muted-foreground">Live status badges</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <h4 className="text-sm font-bold">Bounce-in</h4>
            <BounceInBadge />
            <p className="text-xs text-muted-foreground">Celebratory moments</p>
          </div>
        </div>
      </ComponentSample>

      {/* Composed Animations */}
      <ComponentSample
        title="Composed Animations"
        description="Combine multiple CSS transform properties in a single transition for fluid, multi-dimensional effects. Use transition-all or list specific properties to coordinate timing."
        code={`// Fade + Scale (entrance)
<div className={\`transition-all duration-500 \${
  visible ? "opacity-100 scale-100" : "opacity-0 scale-75"
}\`} />

// Slide + Fade (dropdown)
<div className={\`transition-all duration-500 \${
  open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
}\`} />

// Rotate + Scale + Color (toggle state)
<div className={\`transition-all duration-700 \${
  active ? "rotate-180 scale-110 bg-emerald-500" : "rotate-0 scale-100 bg-orange-500"
}\`} />`}
      >
        <ComposedAnimationDemo />
      </ComponentSample>

      {/* Duration & Easing Reference */}
      <ComponentSample
        title="Duration & Easing Reference"
        description="Click any bar to watch it animate across at that duration and easing. Use these to calibrate timing for your components."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-heading">Duration Scale</h3>
            <div className="space-y-4">
              {durationBars.map(bar => <DurationBar key={bar.label} {...bar} />)}
            </div>
            <p className="text-xs text-muted-foreground">
              Click a bar to replay. Use{" "}
              <code className="bg-muted px-1 rounded font-mono">
                duration-150
              </code>{" "}
              for hover,{" "}
              <code className="bg-muted px-1 rounded font-mono">
                duration-300
              </code>{" "}
              for panels.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold font-heading">Easing Functions</h3>
            <div className="space-y-4">
              {easingBars.map(bar => (
                <DurationBar
                  key={bar.label}
                  {...bar}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 rounded font-mono">ease-out</code>{" "}
              feels natural for entrances;{" "}
              <code className="bg-muted px-1 rounded font-mono">ease-in</code> for exits;{" "}
              <code className="bg-muted px-1 rounded font-mono">
                ease-in-out
              </code>{" "}
              for toggles.
            </p>
          </div>
        </div>
      </ComponentSample>

      {/* Reduced Motion */}
      <ComponentSample
        title="Reduced Motion"
        description="Always respect the prefers-reduced-motion media query. Use Tailwind's motion-safe: and motion-reduce: variants to conditionally apply or disable animations."
        code={`// Only animate when user has no reduced-motion preference
<div className="motion-safe:animate-spin motion-reduce:animate-none" />

// Fade without movement for reduced-motion users
<div className="motion-safe:animate-in motion-safe:slide-in-from-left-4
  motion-reduce:animate-in motion-reduce:fade-in" />

// Disable all transitions for reduced-motion
<div className="transition-all duration-300
  motion-reduce:transition-none motion-reduce:duration-0" />

// CSS media query approach
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none !important;
    transition: none !important;
  }
}`}
      >
        <ReducedMotionDemo />
      </ComponentSample>

      {/* Code Preview with tabs */}
      <CodePreview
        title="Animation Patterns"
        code={`// Basic transition
<Button className="transition-transform duration-150 active:scale-95">
  Press Me
</Button>`}
        tabs={[
          {
            label: "Transitions",
            code: `// Hover transition
<div className="transition-all duration-300 hover:scale-110 hover:-translate-y-1">
  Hover card
</div>

// Active press feedback
<Button className="transition-transform duration-150 active:scale-95">
  Press Me
</Button>

// Focus ring with transition
<input className="transition-shadow duration-200 focus:ring-2 focus:ring-primary" />`,
          },
          {
            label: "Loading States",
            code: `// Spinner
<div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />

// Skeleton loader
<div className="space-y-2">
  <div className="h-4 rounded bg-muted animate-pulse" />
  <div className="h-4 rounded bg-muted animate-pulse w-3/4" />
</div>

// Dot loader
<div className="flex gap-1">
  {[0, 1, 2].map(i => (
    <div
      key={i}
      className="w-2 h-2 rounded-full bg-primary animate-bounce"
      style={{ animationDelay: \`\${i * 150}ms\` }}
    />
  ))}
</div>`,
          },
          {
            label: "Staggered Entry",
            code: `// Staggered list
{items.map((item, i) => (
  <div
    key={item}
    className="animate-in fade-in slide-in-from-left-4 duration-500"
    style={{
      animationDelay: \`\${i * 100}ms\`,
      animationFillMode: "both",
    }}
  >
    {item}
  </div>
))}`,
          },
          {
            label: "Reduced Motion",
            code: `// Conditionally disable animations
<div className="motion-safe:animate-spin motion-reduce:animate-none" />

// Use opacity-only transitions for reduced-motion
<div className="
  motion-safe:transition-all motion-safe:duration-300
  motion-reduce:transition-opacity motion-reduce:duration-0
">
  Content
</div>

// CSS approach
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}`,
          },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "All interactive elements are keyboard-accessible with focus-visible ring styles.",
          "Use motion-safe: and motion-reduce: Tailwind variants to disable animations for users who have prefers-reduced-motion enabled.",
          "Animations that convey state changes (e.g., heart toggle) also update the aria-pressed or aria-checked attribute.",
          "Loading spinners include a visually hidden label via sr-only text or aria-label so screen readers announce the loading state.",
          "Avoid flashing animations faster than 3Hz to comply with WCAG 2.3.1 (Three Flashes or Below Threshold).",
          "Duration and easing demos use role=button and keyboard handlers (Enter / Space) for non-mouse access.",
          "Composed animations should degrade to opacity-only or no animation when prefers-reduced-motion is active.",
          "Auto-playing animations must provide a pause mechanism per WCAG 2.2.2 (Pause, Stop, Hide).",
        ]}
      />

      <RelatedComponents currentId="animations" />
    </div>
  );
}
