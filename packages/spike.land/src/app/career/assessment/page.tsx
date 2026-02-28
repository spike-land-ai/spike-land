import { AssessmentForm } from "@/components/career/AssessmentForm";

export default function AssessmentPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-2">Skills Assessment</h1>
      <p className="text-zinc-400 mb-8">
        Add your skills, rate your proficiency, and discover which careers match your profile.
      </p>
      <AssessmentForm />
    </div>
  );
}
