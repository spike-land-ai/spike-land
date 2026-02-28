import { OccupationGrid } from "@/components/career/OccupationGrid";

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">
        Explore Occupations
      </h1>
      <p className="text-zinc-400 mb-8">
        Browse and search thousands of occupations from the European ESCO database.
      </p>
      <OccupationGrid />
    </div>
  );
}
