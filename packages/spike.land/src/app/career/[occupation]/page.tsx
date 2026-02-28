"use client";

import { useParams } from "next/navigation";
import { useOccupationDetail } from "@/hooks/useOccupationDetail";
import { useJobListings } from "@/hooks/useJobListings";
import { useCareerStore } from "@/lib/store/career";
import { JobListingsPanel } from "@/components/career/JobListingsPanel";
import { CareerPathSuggestion } from "@/components/career/CareerPathSuggestion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";

// SalaryChart uses a charting library that must not run on the server.
// Dynamic import keeps it out of the server bundle entirely.
const SalaryChart = dynamic(
  () => import("@/components/career/SalaryChart").then(mod => mod.SalaryChart),
  { ssr: false, loading: () => <Skeleton className="h-60 bg-zinc-800" /> },
);

export default function OccupationDetailPage() {
  const params = useParams();
  const uri = decodeURIComponent(String(params.occupation));
  const { occupation, salary, isLoading } = useOccupationDetail(uri);
  const { jobs, isLoading: jobsLoading } = useJobListings(
    occupation?.title ?? "",
  );
  const { userSkills } = useCareerStore();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-800" />
        <Skeleton className="h-60 bg-zinc-800" />
      </div>
    );
  }

  if (!occupation) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-zinc-500">
        Occupation not found.
      </div>
    );
  }

  const essentialSkills = occupation.skills.filter(s => s.skillType === "essential");
  const optionalSkills = occupation.skills.filter(s => s.skillType === "optional");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {occupation.title}
          </h1>
          <p className="text-sm text-zinc-500">
            ISCO Group: {occupation.iscoGroup}
          </p>
          {occupation.alternativeLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {occupation.alternativeLabels.slice(0, 5).map(label => (
                <Badge
                  key={label}
                  variant="outline"
                  className="text-xs text-zinc-400 border-white/[0.06]"
                >
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {userSkills.length > 0 && (
          <Link href={`/career/compare?occupation=${encodeURIComponent(uri)}`}>
            <Button variant="outline" size="sm">Compare Skills</Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="path">Career Path</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-zinc-900 border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {occupation.description}
              </p>
            </CardContent>
          </Card>

          {salary && <SalaryChart salary={salary} />}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card className="bg-zinc-900 border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                Essential Skills ({essentialSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {essentialSkills.map(skill => (
                  <Badge
                    key={skill.uri}
                    className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                  >
                    {skill.title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {optionalSkills.length > 0 && (
            <Card className="bg-zinc-900 border-white/[0.06]">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Optional Skills ({optionalSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {optionalSkills.map(skill => (
                    <Badge
                      key={skill.uri}
                      variant="outline"
                      className="text-zinc-400 border-white/[0.06]"
                    >
                      {skill.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs">
          <JobListingsPanel jobs={jobs} isLoading={jobsLoading} />
        </TabsContent>

        <TabsContent value="path">
          <CareerPathSuggestion
            occupation={occupation}
            userSkills={userSkills}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
