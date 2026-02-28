"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Instagram,
  Layers,
  MessageSquare,
  Music4,
  Twitter,
} from "lucide-react";

const codeSnippets = {
  card: `import { Card, CardContent } from "@/components/ui/card";

<Card variant="default">
  <CardContent className="pt-6">
    Standard glass-1 with hover effects.
  </CardContent>
</Card>

<Card variant="solid">...</Card>
<Card variant="dashed">...</Card>
<Card variant="highlighted">...</Card>
<Card variant="floating">...</Card>
<Card variant="magic">...</Card>`,
  vibrantCard: `<Card variant="blue" className="p-6 space-y-4 relative overflow-hidden group">
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
  <div className="relative z-10">
    <p className="text-base font-bold text-white">Twitter</p>
    <p className="text-xs text-white/80">@spike.land</p>
  </div>
  <Button variant="outline" size="sm"
    className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white relative z-10">
    Follow
  </Button>
</Card>`,
  input: `import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input id="email" placeholder="e.g. user@spike.land" />
</div>

{/* Validation states */}
<Input variant="error" defaultValue="invalid-email" />
<Input variant="success" defaultValue="crypton_spike" />`,
  progress: `import { Progress } from "@/components/ui/progress";

<Progress value={65} glow />
<Progress value={100} variant="success" />
<Progress value={42} variant="warning" />
<Progress value={98} variant="destructive" />`,
  alert: `import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>System Update</AlertTitle>
  <AlertDescription>A new version is available.</AlertDescription>
</Alert>

<Alert variant="success">...</Alert>
<Alert variant="warning">...</Alert>
<Alert variant="destructive">...</Alert>`,
  tabs: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="v1" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="v1">Overview</TabsTrigger>
    <TabsTrigger value="v2">Advanced</TabsTrigger>
  </TabsList>
  <TabsContent value="v1">Basic settings</TabsContent>
  <TabsContent value="v2">Advanced controls</TabsContent>
</Tabs>`,
  badge: `import { Badge } from "@/components/ui/badge";

<Badge>Active</Badge>
<Badge variant="secondary">In Progress</Badge>
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Low Tokens</Badge>
<Badge variant="outline">Verified</Badge>
<Badge variant="destructive">Critical Error</Badge>`,
};

export default function ComponentsPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="UI Components"
        description="A collection of atomic and molecular elements that form the building blocks of the spike.land interface. Every component is crafted with optical physics and accessibility in mind."
        usage="Use these components to build consistent, high-fidelity interfaces. Prefer these pre-built elements over custom CSS whenever possible to ensure system-wide consistency."
      />

      <UsageGuide
        dos={[
          "Use the XL border-radius (12px) for most containers to maintain brand identity.",
          "Apply the appropriate glass-tier (0, 1, or 2) based on content depth.",
          "Ensure all interactive elements have visible focus states.",
          "Use semantic colors (success, warning, destructive) sparingly for meaningful alerts.",
        ]}
        donts={[
          "Avoid nesting glass containers of the same tier to prevent visual muddiness.",
          "Don't use Primary Cyan for text unless it's a critical label with high contrast requirements.",
          "Avoid small touch targets (< 44px) for interactive elements on mobile.",
          "Don't drop opacity below 50% for disabled states; use grayscale and desaturation instead.",
        ]}
      />

      {/* Card Variants */}
      <ComponentSample
        title="Card Variants"
        description="Beyond glass-morphism, we use specialized card styles for specific contexts."
        code={codeSnippets.card}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          <Card variant="default">
            <CardContent className="pt-6 text-center">
              <Badge className="mb-2">Default</Badge>
              <p className="text-xs text-muted-foreground">
                Standard glass-1 with hover effects.
              </p>
            </CardContent>
          </Card>
          <Card variant="solid">
            <CardContent className="pt-6 text-center">
              <Badge variant="secondary" className="mb-2">Solid</Badge>
              <p className="text-xs text-muted-foreground">
                High-contrast opaque background.
              </p>
            </CardContent>
          </Card>
          <Card variant="dashed">
            <CardContent className="pt-6 text-center">
              <Badge variant="outline" className="mb-2">Dashed</Badge>
              <p className="text-xs text-muted-foreground">
                Placeholders or secondary actions.
              </p>
            </CardContent>
          </Card>
          <Card variant="highlighted">
            <CardContent className="pt-6 text-center">
              <Badge
                variant="outline"
                className="mb-2 border-primary/30 text-primary"
              >
                Highlighted
              </Badge>
              <p className="text-xs text-muted-foreground">
                Attention-grabbing with persistent glow.
              </p>
            </CardContent>
          </Card>
          <Card variant="negative">
            <CardContent className="pt-6 text-center">
              <Badge
                variant="outline"
                className="mb-2 border-slate-400 text-slate-600"
              >
                Negative
              </Badge>
              <p className="text-xs text-slate-500 font-medium font-mono uppercase tracking-tighter">
                Inset Shadows
              </p>
            </CardContent>
          </Card>
          <Card variant="floating" className="transition-all">
            <CardContent className="pt-6 text-center">
              <Badge
                variant="outline"
                className="mb-2 border-indigo-500/30 text-indigo-400"
              >
                Floating
              </Badge>
              <p className="text-xs text-muted-foreground">
                Extreme depth with multi-layered shadows.
              </p>
            </CardContent>
          </Card>
          <Card variant="magic" className="transition-all">
            <CardContent className="pt-6 py-10 text-center space-y-3">
              <Badge
                variant="outline"
                className="border-primary/40 text-primary shadow-glow-cyan"
              >
                Magic
              </Badge>
              <div className="space-y-1">
                <p className="text-2xl font-black font-heading">#14</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">
                  by Spike Land
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground max-w-[140px] mx-auto leading-relaxed">
                Ultra-elevated "Stripe-style" depth optimized for dark mode.
              </p>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* Vibrant Cards */}
      <ComponentSample
        title="Vibrant Cards"
        description="Integrated colors for high-energy layouts and semantic grouping."
        code={codeSnippets.vibrantCard}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          <Card
            variant="blue"
            className="p-6 space-y-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md transition-transform group-hover:scale-110">
                <Twitter className="w-5 h-5 text-white" />
              </div>
              <Badge
                variant="outline"
                className="text-white border-white/30 backdrop-blur-sm"
              >
                Connect
              </Badge>
            </div>
            <div className="relative z-10">
              <p className="text-base font-bold text-white drop-shadow-md">
                Twitter
              </p>
              <p className="text-xs text-white/80 font-medium">@spike.land</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white relative z-10"
            >
              Follow
            </Button>
          </Card>

          <Card
            variant="green"
            className="p-6 space-y-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md transition-transform group-hover:scale-110">
                <Music4 className="w-5 h-5 text-white" />
              </div>
              <Badge
                variant="outline"
                className="text-white border-white/30 backdrop-blur-sm"
              >
                Live Now
              </Badge>
            </div>
            <div className="relative z-10">
              <p className="text-base font-bold text-white drop-shadow-md">
                Listening to...
              </p>
              <p className="text-xs text-white/80 font-medium">
                Midnight City - M83
              </p>
            </div>
            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden relative z-10">
              <div className="h-full bg-white w-2/3" />
            </div>
          </Card>

          <Card
            variant="pink"
            className="p-6 space-y-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md transition-transform group-hover:scale-110">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <Badge
                variant="outline"
                className="text-white border-white/30 backdrop-blur-sm"
              >
                News
              </Badge>
            </div>
            <div className="relative z-10">
              <p className="text-base font-bold text-white drop-shadow-md">
                Dribbble.com
              </p>
              <p className="text-xs text-white/80 font-medium">
                Pixel-Perfect Design
              </p>
            </div>
            <div className="flex -space-x-1 relative z-10">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-pink-500/50 bg-white/10 backdrop-blur-sm"
                />
              ))}
            </div>
          </Card>

          <Card
            variant="layers"
            className="p-6 space-y-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md transition-transform group-hover:scale-110">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/60 hover:text-white relative z-10"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative z-10">
              <p className="text-base font-bold text-white drop-shadow-md">
                vqw07's layers.
              </p>
              <p className="text-xs text-white/60 font-medium">layers.to</p>
            </div>
            <div className="aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/5 relative z-10">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                Portfolio
              </p>
            </div>
          </Card>

          <Card
            variant="fuchsia"
            className="p-6 space-y-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md transition-transform group-hover:scale-110">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <Badge
                variant="outline"
                className="text-white border-white/30 backdrop-blur-sm"
              >
                Gallery
              </Badge>
            </div>
            <div className="relative z-10">
              <p className="text-base font-bold text-white drop-shadow-md">
                Instagram
              </p>
              <p className="text-xs text-white/80 font-medium">@spike_ai</p>
            </div>
            <div className="grid grid-cols-3 gap-2 relative z-10">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="aspect-square bg-white/10 rounded-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className="w-full h-full bg-gradient-to-tr from-white/5 to-transparent rounded opacity-50" />
                </div>
              ))}
            </div>
          </Card>

          <Card
            variant="orange"
            className="p-6 space-y-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md transition-transform group-hover:scale-110">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <Badge
                variant="outline"
                className="text-white border-white/30 backdrop-blur-sm"
              >
                Latest
              </Badge>
            </div>
            <div className="relative z-10 h-20 flex flex-col justify-end">
              <p className="text-base font-bold text-white drop-shadow-md">
                Substack.com
              </p>
              <p className="text-xs text-white/80 font-medium">
                The AI Spark Newsletter
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full bg-white text-orange-600 hover:bg-white/90 border-0 font-bold relative z-10 shadow-lg"
            >
              Read Now
            </Button>
          </Card>
        </div>
      </ComponentSample>

      {/* Inputs & Controls */}
      <ComponentSample
        title="Text Input"
        description="Integrated glass-input with focus glow and validation states."
        code={codeSnippets.input}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
          <div className="space-y-10">
            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-2">
                <Label htmlFor="demo-input">Email Address</Label>
                <Input id="demo-input" placeholder="e.g. user@spike.land" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-input-err" className="text-destructive">
                  Error State
                </Label>
                <Input
                  id="demo-input-err"
                  variant="error"
                  defaultValue="invalid-email"
                />
                <p className="text-[10px] text-destructive font-medium uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Please enter a valid email.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-input-success" className="text-success">
                  Success State
                </Label>
                <Input
                  id="demo-input-success"
                  variant="success"
                  defaultValue="crypton_spike"
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <Label>Prompt Instructions</Label>
            <Textarea placeholder="Describe your enhancement goals..." />
          </div>
        </div>
      </ComponentSample>

      <ComponentSample
        title="Selections"
        description="Checkbox, Radio, Switch, and Select dropdown controls."
      >
        <div className="w-full max-w-sm space-y-10">
          <div className="flex flex-wrap gap-10">
            <div className="flex items-center space-x-3">
              <Checkbox id="c1" defaultChecked />
              <Label htmlFor="c1">Active</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Switch id="s1" defaultChecked />
              <Label htmlFor="s1">Enable GPU</Label>
            </div>
          </div>

          <Separator className="opacity-10" />

          <RadioGroup
            defaultValue="option-1"
            className="flex flex-row gap-8"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="option-1" id="r1" />
              <Label htmlFor="r1">Standard Enhancement</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="option-2" id="r2" />
              <Label htmlFor="r2">Pro (2 Tokens)</Label>
            </div>
          </RadioGroup>

          <div className="space-y-4 pt-4">
            <Label>Platform Tier</Label>
            <Select defaultValue="hobby">
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hobby">Hobby (Free)</SelectItem>
                <SelectItem value="pro">Professional ($19/mo)</SelectItem>
                <SelectItem value="team">Team ($99/mo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ComponentSample>

      <ComponentSample
        title="Range Selection"
        description="Smooth sliders for precise control."
      >
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-between items-end">
            <Label className="uppercase text-[10px] tracking-widest font-black opacity-60">
              Quality Factor
            </Label>
            <span className="text-xl font-black font-heading text-primary">
              85%
            </span>
          </div>
          <Slider defaultValue={[85]} max={100} step={1} />
        </div>
      </ComponentSample>

      {/* Progress & Status */}
      <ComponentSample
        title="Basic Progress"
        description="Standard loading state with brand primary color and optional glow effect."
        code={codeSnippets.progress}
      >
        <div className="w-full max-w-lg space-y-4">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest opacity-60">
            <span>Task Progress</span>
            <span>65%</span>
          </div>
          <Progress value={65} glow />
        </div>
      </ComponentSample>

      <ComponentSample
        title="Semantic Progress States"
        description="Progress bars reflecting system health or task outcome with success, warning, and destructive variants."
      >
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase font-bold text-success tracking-widest">
              <span>Optimization Complete</span>
              <span>100%</span>
            </div>
            <Progress value={100} variant="success" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase font-bold text-warning tracking-widest">
              <span>Buffering Stream</span>
              <span>42%</span>
            </div>
            <Progress value={42} variant="warning" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase font-bold text-destructive tracking-widest">
              <span>Storage Critical</span>
              <span>98%</span>
            </div>
            <Progress value={98} variant="destructive" />
          </div>
        </div>
      </ComponentSample>

      {/* Semantic Messaging */}
      <ComponentSample
        title="Semantic Messaging"
        description="Alert banners for system updates, deployment success, low credit warnings, and critical failures."
        code={codeSnippets.alert}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>System Update</AlertTitle>
              <AlertDescription>
                A new version of the engine is available for download.
              </AlertDescription>
            </Alert>

            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Deployment Success</AlertTitle>
              <AlertDescription>
                Your creative workflow has been synchronized to the cloud.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-4">
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low Credit Warning</AlertTitle>
              <AlertDescription>
                You have less than 50 tokens remaining in your account.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Critical Failure</AlertTitle>
              <AlertDescription>
                The AI model failed to initialize. Please check your connection.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </ComponentSample>

      {/* Navigation & Layout */}
      <ComponentSample
        title="Tabs"
        description="Clean tabbed navigation with animated transitions."
        code={codeSnippets.tabs}
      >
        <Tabs defaultValue="v1" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2 glass-0 p-1">
            <TabsTrigger value="v1">Overview</TabsTrigger>
            <TabsTrigger value="v2">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent
            value="v1"
            className="p-6 bg-white/5 rounded-2xl mt-4 border border-white/5"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Basic platform features and quick settings.
            </p>
          </TabsContent>
          <TabsContent
            value="v2"
            className="p-6 bg-white/5 rounded-2xl mt-4 border border-white/5"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fine-grained control over AI parameters.
            </p>
          </TabsContent>
        </Tabs>
      </ComponentSample>

      <ComponentSample
        title="Accordion"
        description="Collapsible sections for dense information."
      >
        <Accordion
          type="single"
          collapsible
          defaultValue="item-1"
          className="w-full max-w-md"
        >
          <AccordionItem value="item-1" className="border-white/5">
            <AccordionTrigger className="hover:text-primary">
              System Requirements
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4">
              SPIKE LAND works on all modern browsers with WebGL support enabled.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-white/5">
            <AccordionTrigger className="hover:text-primary">
              API Availability
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4">
              Public API access is currently in closed beta for Enterprise partners.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ComponentSample>

      {/* Indicators */}
      <ComponentSample
        title="Badges"
        description="Small status or tag indicators."
        code={codeSnippets.badge}
      >
        <div className="flex flex-wrap gap-3">
          <Badge>Active</Badge>
          <Badge variant="secondary">In Progress</Badge>
          <Badge variant="success">Completed</Badge>
          <Badge variant="warning">Low Tokens</Badge>
          <Badge variant="outline">Verified</Badge>
          <Badge variant="destructive" className="animate-pulse">
            Critical Error
          </Badge>
        </div>
      </ComponentSample>

      <ComponentSample
        title="Tooltips"
        description="Contextual info on hover."
      >
        <TooltipProvider>
          <div className="flex gap-4">
            <Tooltip defaultOpen>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                >
                  ?
                </Button>
              </TooltipTrigger>
              <TooltipContent className="glass-2 border-primary/20">
                <p>Helpful information here</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs text-muted-foreground">
                Privacy Mode
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your data is encrypted</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </ComponentSample>

      {/* Code Preview */}
      <CodePreview
        code={codeSnippets.card}
        title="Usage Examples"
        tabs={[
          { label: "Card", code: codeSnippets.card },
          { label: "Vibrant Card", code: codeSnippets.vibrantCard },
          { label: "Input", code: codeSnippets.input },
          { label: "Progress", code: codeSnippets.progress },
          { label: "Alert", code: codeSnippets.alert },
          { label: "Tabs", code: codeSnippets.tabs },
          { label: "Badge", code: codeSnippets.badge },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "Form labels are properly associated using htmlFor and id.",
          "Inputs use aria-invalid for error states.",
          "Tooltips are accessible via keyboard tab focus.",
          "Accordion headers use appropriate heading levels and ARIA tags.",
          "Color contrast for all status badges exceeds 4.5:1 ratio.",
          "Focus management for tabs follows the standard WAI-ARIA pattern.",
          "Progress bars include aria-valuenow, aria-valuemin, and aria-valuemax.",
          "Card variants maintain sufficient contrast ratios in both light and dark modes.",
        ]}
      />

      <RelatedComponents currentId="components" />
    </div>
  );
}
