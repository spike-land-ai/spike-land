"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  ChevronLeft,
  ClipboardList,
  Compass,
  DollarSign,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

import { type SkillEntry, SkillsRadar } from "./components/SkillsRadar";
import { OccupationBrowser } from "./components/OccupationBrowser";
import { SalaryChart } from "./components/SalaryChart";
import { JobListings } from "./components/JobListings";
import { AssessmentWizard } from "./components/AssessmentWizard";
import { useCareerNavigatorMcp } from "./hooks/useCareerNavigatorMcp";

// Static demo skill data — replace with MCP-driven data once API is integrated
const INITIAL_SKILLS: SkillEntry[] = [
  { name: "TypeScript", level: 92, category: "Languages", trend: "up" },
  { name: "React", level: 88, category: "Frameworks", trend: "stable" },
  { name: "Node.js", level: 75, category: "Frameworks", trend: "up" },
  { name: "System Design", level: 70, category: "Architecture", trend: "up" },
  { name: "PostgreSQL", level: 65, category: "Tools", trend: "stable" },
  { name: "Docker", level: 60, category: "Tools", trend: "stable" },
  { name: "ML/AI", level: 40, category: "Emerging", trend: "up" },
  { name: "Rust", level: 25, category: "Languages", trend: "down" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function CareerNavigatorClient() {
  const [activeTab, setActiveTab] = useState("skills");
  const [skills] = useState<SkillEntry[]>(INITIAL_SKILLS);
  const [selectedOccupationUri, setSelectedOccupationUri] = useState<
    string | undefined
  >();

  const {
    searchOccupationsAsync,
    fetchSalaryAsync,
    searchJobsAsync,
    assessSkillsAsync,
  } = useCareerNavigatorMcp();

  const handleOccupationSelect = useCallback((uri: string, _title: string) => {
    setSelectedOccupationUri(uri);
    // Switch to salary tab to show occupation details
    setActiveTab("salary");
  }, []);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-xl flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <Link
            href="/store"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Back to store"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span className="font-semibold tracking-tight">
              Career Navigator
            </span>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-amber-600 hover:bg-amber-500 text-white border-0"
          onClick={() => setActiveTab("assessment")}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Run Assessment</span>
          <span className="sm:hidden">Assess</span>
        </Button>
      </header>

      {/* Hero strip */}
      <div className="relative border-b border-zinc-800/50 bg-gradient-to-br from-amber-900/15 via-zinc-900 to-zinc-950 px-5 py-6 md:py-8">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Chart Your <span className="text-amber-400">Career Path</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
            AI-powered skill analysis and career planning. Discover where you stand, where you can
            go, and the steps to get there.
          </p>
        </div>
      </div>

      {/* Tab dashboard */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto mb-6">
              <TabsTrigger value="skills" className="gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Skills</span>
              </TabsTrigger>
              <TabsTrigger value="occupations" className="gap-1.5">
                <Search className="w-4 h-4" />
                <span>Occupations</span>
              </TabsTrigger>
              <TabsTrigger value="salary" className="gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Salary</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="assessment" className="gap-1.5">
                <ClipboardList className="w-4 h-4" />
                <span>Assessment</span>
              </TabsTrigger>
            </TabsList>

            {/* Skills Radar Tab */}
            <TabsContent value="skills">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-zinc-100">
                      Skill Profile
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      Visual overview of your current skill levels across categories
                    </p>
                  </div>
                  <SkillsRadar skills={skills} />
                </div>

                {/* Quick actions panel */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-300">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
                        onClick={() => setActiveTab("assessment")}
                      >
                        <ClipboardList className="w-4 h-4 text-amber-400" />
                        Run Skills Assessment
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
                        onClick={() => setActiveTab("occupations")}
                      >
                        <Search className="w-4 h-4 text-blue-400" />
                        Browse Occupations
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
                        onClick={() => setActiveTab("salary")}
                      >
                        <DollarSign className="w-4 h-4 text-green-400" />
                        Check Salary Ranges
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
                        onClick={() => setActiveTab("jobs")}
                      >
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        Find Job Listings
                      </Button>
                    </div>
                  </div>

                  {/* Stats card */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-300">
                      Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-xl bg-zinc-800/40">
                        <p className="text-2xl font-bold text-amber-400">
                          {skills.length}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Skills
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-zinc-800/40">
                        <p className="text-2xl font-bold text-green-400">
                          {skills.filter(s => s.level >= 70).length}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Advanced+
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-zinc-800/40">
                        <p className="text-2xl font-bold text-blue-400">
                          {new Set(skills.map(s => s.category)).size}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Categories
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-zinc-800/40">
                        <p className="text-2xl font-bold text-purple-400">
                          {Math.round(
                            skills.reduce((a, s) => a + s.level, 0)
                              / skills.length,
                          )}%
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Avg Level
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Occupation Browser Tab */}
            <TabsContent value="occupations">
              <div className="max-w-3xl">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-100">
                    Occupation Browser
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Search the ESCO occupation database with thousands of standardized job roles
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
                  <OccupationBrowser
                    onSearch={searchOccupationsAsync}
                    onSelect={handleOccupationSelect}
                    selectedUri={selectedOccupationUri}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Salary Chart Tab */}
            <TabsContent value="salary">
              <div className="max-w-2xl">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-100">
                    Salary Comparison
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Look up salary ranges by role and location using real market data
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
                  <SalaryChart onFetchSalary={fetchSalaryAsync} />
                </div>
              </div>
            </TabsContent>

            {/* Job Listings Tab */}
            <TabsContent value="jobs">
              <div className="max-w-3xl">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-100">
                    Job Listings
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Live job listings powered by Adzuna across multiple countries
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
                  <JobListings onSearch={searchJobsAsync} />
                </div>
              </div>
            </TabsContent>

            {/* Assessment Wizard Tab */}
            <TabsContent value="assessment">
              <div className="max-w-2xl">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-100">
                    Skills Assessment
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Step-by-step wizard to assess your skills against thousands of ESCO occupations
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
                  <AssessmentWizard
                    onAssess={assessSkillsAsync}
                    onSelectOccupation={handleOccupationSelect}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
