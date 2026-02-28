import { CareerHero } from "@/components/career/CareerHero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Search, Target } from "lucide-react";
import Link from "next/link";

export default function CareerPage() {
  const features = [
    {
      title: "Skills Assessment",
      description:
        "Add your skills, rate your proficiency, and discover which careers match your profile best.",
      icon: Target,
      href: "/career/assessment",
      color: "text-emerald-400",
    },
    {
      title: "Explore Occupations",
      description:
        "Browse thousands of occupations from the ESCO database with salary data and required skills.",
      icon: Search,
      href: "/career/explore",
      color: "text-blue-400",
    },
    {
      title: "Compare & Plan",
      description:
        "See detailed skill gap analysis, salary charts, and local job listings for any occupation.",
      icon: BarChart3,
      href: "/career/compare",
      color: "text-purple-400",
    },
  ];

  return (
    <div>
      <CareerHero />
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map(feature => (
            <Card
              key={feature.title}
              className="bg-zinc-900 border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <CardHeader>
                <feature.icon className={`w-8 h-8 ${feature.color} mb-2`} />
                <CardTitle className="text-white">{feature.title}</CardTitle>
                <CardDescription className="text-zinc-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={feature.href}>
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
