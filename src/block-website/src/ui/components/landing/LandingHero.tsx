"use client";

import { Link } from "../ui/link";

export const TOTAL_TOOL_COUNT = 80;

export function LandingHero() {
    return (
        <section
            aria-labelledby="hero-heading"
            className="py-24 sm:py-32 px-4 sm:px-6 max-w-3xl mx-auto text-center font-sans"
        >
            <div
                className="mb-8 inline-block px-4 py-1.5 border border-border rounded-full text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/50"
                role="text"
                aria-label="Features: MCP Multiplexer, Cloudflare Edge, Open Source"
            >
                MCP Multiplexer · Cloudflare Edge · Open Source
            </div>

            <h1
                id="hero-heading"
                className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-balance"
            >
                <span className="text-muted-foreground font-medium">80+ MCP tools.</span> <br />
                <span className="text-foreground">One CLI.</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed text-balance">
                spike-cli lazy-loads MCP tool groups into your AI client. One config file. Your agent gets exactly the tools it needs.
            </p>

            <div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
                role="group"
                aria-label="Primary actions"
            >
                <Link
                    href="/tools"
                    className="w-full sm:w-auto px-8 py-4 bg-foreground text-background text-lg font-medium rounded-xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground active:opacity-80"
                    aria-label="Browse the MCP tool registry"
                >
                    Browse the Registry
                </Link>
                <Link
                    href="/apps/new"
                    className="w-full sm:w-auto px-8 py-4 bg-background border border-border text-foreground text-lg font-medium rounded-xl hover:bg-muted/50 hover:border-muted-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground active:bg-muted"
                    aria-label="Add a new MCP tool"
                >
                    Add a Tool
                </Link>
            </div>

            <dl
                className="mt-20 pt-10 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground"
                aria-label="Platform Statistics"
            >
                <div className="flex gap-2.5 items-center">
                    <dt className="sr-only">Available Tools</dt>
                    <dd className="font-semibold text-foreground text-base">{TOTAL_TOOL_COUNT}+</dd>
                    <span>MCP Tools</span>
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border" aria-hidden="true" />
                <div className="flex gap-2.5 items-center">
                    <dt className="sr-only">Infrastructure</dt>
                    <dd className="font-semibold text-foreground text-base">8</dd>
                    <span>CF Workers</span>
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border" aria-hidden="true" />
                <div className="flex gap-2.5 items-center">
                    <dt className="sr-only">Configuration</dt>
                    <dd className="font-semibold text-foreground text-base">One config</dd>
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border" aria-hidden="true" />
                <div className="flex gap-2.5 items-center">
                    <dt className="sr-only">Pricing</dt>
                    <dd className="font-semibold text-foreground text-base">Free</dd>
                    <span>to start</span>
                </div>
            </dl>
        </section>
    );
}
