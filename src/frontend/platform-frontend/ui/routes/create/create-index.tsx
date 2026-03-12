import { Link } from "@tanstack/react-router";
import { useState } from "react";

const TEMPLATES = [
  { id: "blank", name: "Blank Canvas", desc: "Start from scratch" },
  { id: "dashboard", name: "Dashboard", desc: "Data visualization app" },
  { id: "landing", name: "Landing Page", desc: "Marketing page with CTA" },
  { id: "chat", name: "Chat App", desc: "Real-time messaging" },
  { id: "ecommerce", name: "E-Commerce", desc: "Product catalog & cart" },
  { id: "portfolio", name: "Portfolio", desc: "Showcase your work" },
  { id: "game", name: "Game", desc: "Interactive browser game" },
  { id: "tool", name: "Utility Tool", desc: "Productivity micro-app" },
] as const;

const POPULAR_APPS = [
  { slug: "physics-demo", name: "Physics Demo" },
  { slug: "pomodoro-timer", name: "Pomodoro Timer" },
  { slug: "markdown-editor", name: "Markdown Editor" },
  { slug: "color-palette", name: "Color Palette Generator" },
  { slug: "todo-app", name: "Todo App" },
  { slug: "weather-widget", name: "Weather Widget" },
  { slug: "countdown-timer", name: "Countdown Timer" },
  { slug: "calculator", name: "Calculator" },
  { slug: "quiz-maker", name: "Quiz Maker" },
  { slug: "kanban-board", name: "Kanban Board" },
  { slug: "habit-tracker", name: "Habit Tracker" },
  { slug: "recipe-book", name: "Recipe Book" },
] as const;

export function CreateIndexPage() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Create an AI App</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Describe what you want to build and let AI generate a fully functional React application in
          seconds.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your app... e.g. 'A pomodoro timer with dark mode'"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Link
            to="/vibe-code"
            search={{ prompt: prompt || undefined }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create
          </Link>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Start from a Template</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {TEMPLATES.map((t) => (
            <Link
              key={t.id}
              to="/vibe-code"
              search={{ template: t.id }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Popular Creations</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {POPULAR_APPS.map((app) => (
            <Link
              key={app.slug}
              to="/create/$appPath"
              params={{ appPath: app.slug }}
              className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {app.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
