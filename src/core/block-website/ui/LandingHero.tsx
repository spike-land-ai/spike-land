import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "../lazy-imports/link";
import { apiUrl } from "../core-logic/api";
import { useDevMode } from "../core-logic/dev-mode";
import { triggerViewTransition } from "../core-logic/view-transition";

export const TOTAL_TOOL_COUNT = 80;

function setThemeDirectly(theme: "light" | "dark") {
    localStorage.setItem("theme-preference", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
}

export function LandingHero() {
    const [stars, setStars] = useState<number | null>(null);
    const { isDeveloper, setDevMode } = useDevMode();
    const devButtonRef = useRef<HTMLButtonElement>(null);
    const [fontWeight, setFontWeight] = useState(isDeveloper ? 700 : 400);
    const [showVibeButton, setShowVibeButton] = useState(isDeveloper);

    useEffect(() => {
        fetch(apiUrl("/github/stars"))
            .then(res => res.json() as Promise<{ stars: number | null }>)
            .then((data) => {
                if (data.stars != null) setStars(data.stars);
            })
            .catch(() => { /* graceful fallback */ });
    }, []);

    // Sync font weight and vibe button with dev mode state
    useEffect(() => {
        setFontWeight(isDeveloper ? 700 : 400);
        if (isDeveloper) {
            const timer = setTimeout(() => setShowVibeButton(true), 300);
            return () => clearTimeout(timer);
        }
        setShowVibeButton(false);
    }, [isDeveloper]);

    const handleDevToggle = useCallback(() => {
        const newDevMode = !isDeveloper;
        const newTheme = newDevMode ? "dark" as const : "light" as const;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const doToggle = () => {
            setThemeDirectly(newTheme);
            setDevMode(newDevMode);
        };

        if (prefersReduced) {
            doToggle();
            return;
        }

        triggerViewTransition(devButtonRef, doToggle);
    }, [isDeveloper, setDevMode]);

    return (
        <section
            aria-labelledby="hero-heading"
            className="py-24 sm:py-32 px-4 sm:px-6 max-w-3xl mx-auto text-center font-sans"
        >
            {/* Teal glow badge */}
            <div
                className="mb-8 inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest backdrop-blur-sm transition-colors shadow-sm
                           border border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50
                           dark:border-primary/30 dark:bg-primary/10 dark:text-primary-light dark:hover:bg-primary/20 glow-primary"
                aria-label="Features: Open-Source AI App Ecosystem, Instant Deploys"
            >
                OPEN-SOURCE AI APP ECOSYSTEM · INSTANT DEPLOYS
            </div>

            <h1
                id="hero-heading"
                className="text-fluid-h1 mb-8 text-balance"
                style={{
                    fontVariationSettings: `"wght" ${fontWeight}`,
                    letterSpacing: isDeveloper ? "-0.03em" : "-0.02em",
                    transition: "font-variation-settings 600ms ease-out, letter-spacing 400ms ease-out",
                }}
            >
                <span className={`transition-colors duration-500 ${isDeveloper ? "text-foreground" : "text-muted-foreground"}`}>
                    Give your AI agents
                </span>
                <br />
                <span className="text-foreground">the power to act.</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-[1.6] text-balance">
                spike.land connects your AI assistant to real-world tools using the Model Context Protocol (MCP).
                <br /><br />
                <span className="text-lg leading-[1.6]">MCP lets AI assistants use databases, APIs, and code editors through a single standard interface.</span>
            </p>

            <div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
                role="group"
                aria-label="Primary actions"
            >
                {/* Dev mode toggle */}
                <button
                    ref={devButtonRef}
                    onClick={handleDevToggle}
                    className={`w-full sm:w-auto px-8 py-4 text-lg font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${isDeveloper
                            ? "bg-primary text-primary-foreground hover:bg-primary-light glow-primary focus:ring-primary ring-2 ring-primary/30"
                            : "bg-foreground text-background hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-light glow-primary dark:focus:ring-primary"
                        }`}
                    aria-pressed={isDeveloper}
                >
                    I'm a developer
                </button>

                {/* Secondary CTA: crossfade between "I'm exploring" and "Vibe Code Online Now" */}
                <div className="w-full sm:w-auto relative" style={{ minHeight: "3.5rem" }}>
                    <Link
                        href="/store"
                        onClick={() => setThemeDirectly("light")}
                        className={`w-full sm:w-auto px-8 py-4 text-lg font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                            bg-background border border-border/50 text-foreground hover:bg-muted/50 hover:border-border hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-foreground
                            dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/15 dark:backdrop-blur-md dark:hover:-translate-y-0.5 dark:focus:ring-white/30
                            ${showVibeButton ? "opacity-0 pointer-events-none absolute inset-0" : "opacity-100"}`}
                        tabIndex={showVibeButton ? -1 : 0}
                    >
                        I'm exploring
                    </Link>

                    <Link
                        href="/vibe-code"
                        className={`w-full sm:w-auto px-8 py-4 text-lg rounded-xl inline-flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                            bg-primary text-primary-foreground hover:bg-primary-light glow-primary focus:ring-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
                            ${showVibeButton ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"}`}
                        tabIndex={showVibeButton ? 0 : -1}
                        style={showVibeButton ? { fontVariationSettings: '"wght" 800' } : undefined}
                    >
                        Vibe Code Online Now
                    </Link>
                </div>
            </div>

            <dl
                className="mt-20 pt-10 border-t border-border flex flex-wrap items-center justify-center gap-x-3 gap-y-4 text-sm text-muted-foreground"
                aria-label="Platform Statistics"
            >
                {stars != null && (
                    <>
                        <div className="flex items-baseline gap-1.5">
                            <dt className="sr-only">GitHub Stars</dt>
                            <dd className="font-semibold text-foreground text-base flex items-center gap-1.5">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" /></svg>
                                {stars.toLocaleString()}
                            </dd>
                            <dd>on GitHub</dd>
                        </div>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-border" aria-hidden="true" />
                    </>
                )}
                <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">Available Apps</dt>
                    <dd className="font-semibold text-foreground text-base">{TOTAL_TOOL_COUNT}+</dd>
                    <dd>Ready-to-use Apps</dd>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" aria-hidden="true" />
                <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">Performance</dt>
                    <dd className="font-semibold text-foreground text-base">Global</dd>
                    <dd>edge network</dd>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" aria-hidden="true" />
                <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">Setup</dt>
                    <dd className="font-semibold text-foreground text-base">Zero</dd>
                    <dd>config required</dd>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" aria-hidden="true" />
                <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">Pricing</dt>
                    <dd className="font-semibold text-foreground text-base">Free</dd>
                    <dd><Link href="/pricing" className="hover:text-foreground hover:underline transition-colors">to start</Link></dd>
                </div>
            </dl>
        </section>
    );
}
