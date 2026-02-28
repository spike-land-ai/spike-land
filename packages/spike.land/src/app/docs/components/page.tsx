import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import {
  ExternalLink,
  Layers,
  MousePointer2,
  Palette,
  PanelTop,
  Shapes,
  Sparkles,
  Type,
} from "lucide-react";

export const metadata = {
  title: "UI Components - spike.land",
  description:
    "Explore the spike.land design system. Browse all UI components, patterns, and visual styles.",
};

const STORYBOOK_SECTIONS = [
  {
    id: "colors",
    label: "Colors",
    description: "Color palette, gradients, and theme tokens.",
    icon: Palette,
  },
  {
    id: "typography",
    label: "Typography",
    description: "Font families, sizes, weights, and text styles.",
    icon: Type,
  },
  {
    id: "buttons",
    label: "Buttons",
    description: "Button variants, sizes, states, and icon buttons.",
    icon: MousePointer2,
  },
  {
    id: "surfaces",
    label: "Surfaces",
    description: "Cards, panels, glass-morphism, and containers.",
    icon: PanelTop,
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Toasts, alerts, progress indicators, and status badges.",
    icon: Sparkles,
  },
  {
    id: "layout",
    label: "Layout",
    description: "Grid systems, spacing, responsive patterns.",
    icon: Layers,
  },
  {
    id: "components",
    label: "All Components",
    description: "Full component library with interactive examples.",
    icon: Shapes,
  },
];

export default function ComponentsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="relative py-8 px-6 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-pink-500/5 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Shapes className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground">
                UI Components
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                spike.land design system
              </p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Explore the spike.land design system built with shadcn/ui and Tailwind CSS. Browse
            interactive component examples, glass-morphism surfaces, and all visual primitives.
          </p>
        </div>
      </div>

      {/* Main Storybook Link */}
      <Link href="/storybook" className="group block no-underline">
        <Card className="bg-white/5 border border-white/10 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(var(--primary-rgb,59,130,246),0.15)] transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold font-heading">
                Open Storybook
              </CardTitle>
              <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <CardDescription className="text-base">
              Full interactive component playground with all design tokens, variants, and live
              examples.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      {/* Section Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STORYBOOK_SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={`/storybook/${section.id}`}
              className="group block no-underline"
            >
              <Card className="h-full bg-white/5 border border-white/10 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(var(--primary-rgb,59,130,246),0.15)] transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 border border-white/10 text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:shadow-glow-cyan transition-all duration-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      {section.label}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
