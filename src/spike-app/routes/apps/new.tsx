import { type ChangeEvent, type FormEvent, useState, useEffect } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { type AppStatus, StatusBadge } from "@/components/StatusBadge";

const steps = ["Details", "Prompt", "Review"] as const;

const categories = ["utility", "game", "tool", "social", "other"] as const;

interface FormData {
  name: string;
  slug: string;
  description: string;
  category: (typeof categories)[number];
  prompt: string;
}

interface FormErrors {
  name?: string;
  slug?: string;
  prompt?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validate(data: FormData, step: number): FormErrors {
  const errors: FormErrors = {};
  if (step >= 0) {
    if (!data.name.trim()) errors.name = "Name is required";
    if (!data.slug.trim()) errors.slug = "Slug is required";
    else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(data.slug)) {
      errors.slug = "Slug must be lowercase letters, numbers, and hyphens";
    }
  }
  if (step >= 1) {
    if (!data.prompt.trim()) errors.prompt = "Describe what your app should do";
  }
  return errors;
}

export function AppsNewPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [buildStatus, setBuildStatus] = useState<AppStatus | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const search = useSearch({ from: "/apps/new" }) as { prompt?: string };
  const navigate = useNavigate();

  const [data, setData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    category: "utility",
    prompt: search.prompt || "",
  });

  useEffect(() => {
    if (search.prompt) {
      setData((prev) => ({ ...prev, prompt: search.prompt || "" }));
    }
  }, [search.prompt]);

  function update(field: keyof FormData, value: string) {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && prev.slug === slugify(prev.name)) {
        next.slug = slugify(value);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function goNext() {
    const errs = validate(data, currentStep);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
  }

  function goPrev() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(data, 2);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setBuildStatus("prompting");

    try {
      // Simulate build pipeline status updates
      setBuildStatus("drafting");
      await new Promise((r) => setTimeout(r, 800));
      setBuildStatus("building");

      await new Promise((r) => setTimeout(r, 1000));
      setBuildStatus("live");

      await new Promise((r) => setTimeout(r, 500));
      navigate({
        to: "/apps/$appId",
        params: { appId: data.slug },
        search: { tab: "App" },
      });
    } catch {
      setSubmitting(false);
      setBuildStatus(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/apps" className="text-primary hover:underline">
          Apps
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold text-foreground">Create App</h1>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((step, i) => (
          <button
            key={step}
            onClick={() => i < currentStep && setCurrentStep(i)}
            disabled={i > currentStep || submitting}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              i === currentStep
                ? "bg-primary text-primary-foreground"
                : i < currentStep
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                i < currentStep ? "bg-primary text-primary-foreground" : "bg-background/20"
              }`}
            >
              {i < currentStep ? "\u2713" : i + 1}
            </span>
            {step}
          </button>
        ))}
      </div>

      {/* Build status */}
      {buildStatus && (
        <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info/10 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium text-info-foreground">Building your app...</span>
          <StatusBadge status={buildStatus} />
        </div>
      )}

      {/* Step content */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-8">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
                  App Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => update("name", e.target.value)}
                  className={`w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.name ? "border-destructive" : ""
                  }`}
                  placeholder="My Awesome App"
                />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="slug" className="mb-1 block text-sm font-medium text-foreground">Slug</label>
                <input
                  id="slug"
                  type="text"
                  value={data.slug}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => update("slug", e.target.value)}
                  className={`w-full rounded-lg border border-border bg-background px-4 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.slug ? "border-destructive" : ""
                  }`}
                  placeholder="my-awesome-app"
                />
                {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug}</p>}
              </div>
              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  id="description"
                  value={data.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    update("description", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="What does your app do?"
                />
              </div>
              <div>
                <label htmlFor="category" className="mb-1 block text-sm font-medium text-foreground">Category</label>
                <select
                  id="category"
                  value={data.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    update("category", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-card">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="mb-1 block text-sm font-medium text-foreground">
                  Prompt <span className="text-destructive">*</span>
                </label>
                <p className="mb-2 text-sm text-muted-foreground">
                  Describe what you want your app to do. Be as specific as possible.
                </p>
                <textarea
                  id="prompt"
                  value={data.prompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    update("prompt", e.target.value)
                  }
                  className={`w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.prompt ? "border-destructive" : ""
                  }`}
                  rows={8}
                  placeholder="I want an app that..."
                />
                {errors.prompt && <p className="mt-1 text-xs text-destructive">{errors.prompt}</p>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Review your app</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Name</dt>
                  <dd className="text-sm text-foreground">{data.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Slug</dt>
                  <dd className="font-mono text-sm text-foreground">{data.slug}</dd>
                </div>
                {data.description && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                    <dd className="text-sm text-foreground">{data.description}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm capitalize text-foreground">{data.category}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Prompt</dt>
                  <dd className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm text-foreground border border-border">
                    {data.prompt}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentStep === 0 || submitting}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            Previous
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-success px-6 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create App"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
