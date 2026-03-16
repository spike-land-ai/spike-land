import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppCard } from "../AppCard";
import type { McpAppSummary } from "../../../hooks/useApps";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    className,
    "aria-label": ariaLabel,
    tabIndex,
  }: {
    children: ReactNode;
    to: string;
    params?: { appSlug?: string };
    className?: string;
    "aria-label"?: string;
    tabIndex?: number;
  }) => (
    <a
      href={`${to}/${params?.appSlug ?? ""}`}
      className={className}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
    >
      {children}
    </a>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => {
      if (key === "tool_other") return `${opts?.count ?? 0} tools`;
      if (key === "tool_one") return `${opts?.count ?? 1} tool`;
      return key;
    },
  }),
}));

// Mock InstallButton to avoid firing real API calls in unit tests
vi.mock("../InstallButton", () => ({
  InstallButton: ({ slug, appName }: { slug: string; appName: string }) => (
    <button type="button" aria-label={`Install ${appName}`} data-slug={slug}>
      GET
    </button>
  ),
}));

// Mock useInstall for installCount
vi.mock("../../../hooks/useInstall", () => ({
  useInstall: () => ({
    isInstalled: false,
    installCount: 42,
    isStatusLoading: false,
    isInstalling: false,
    isUninstalling: false,
    install: vi.fn(),
    uninstall: vi.fn(),
    mutationError: null,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockApp: McpAppSummary = {
  slug: "qa-studio",
  name: "QA Studio",
  description: "Browser automation and screenshot tools.",
  emoji: "🎭",
  category: "Browser Automation",
  tags: ["playwright", "browser"],
  tagline: "Automate the web",
  pricing: "free",
  is_featured: true,
  is_new: false,
  tool_count: 7,
  sort_order: 1,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AppCard (store)", () => {
  it("renders app name, emoji, and description in grid layout", () => {
    render(<AppCard app={mockApp} layout="grid" />, { wrapper: createWrapper() });

    expect(screen.getByText("QA Studio")).toBeInTheDocument();
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText(/Browser automation/i)).toBeInTheDocument();
  });

  it("displays the category badge in grid layout", () => {
    render(<AppCard app={mockApp} layout="grid" />, { wrapper: createWrapper() });
    expect(screen.getByText("Browser Automation")).toBeInTheDocument();
  });

  it("uses categoryName override when provided", () => {
    render(<AppCard app={mockApp} layout="grid" categoryName="Dev Tools" />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
    expect(screen.queryByText("Browser Automation")).not.toBeInTheDocument();
  });

  it("renders star rating when rating prop is provided", () => {
    render(<AppCard app={mockApp} layout="grid" rating={4.5} ratingCount={12} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByLabelText(/rating: 4\.5 out of 5/i)).toBeInTheDocument();
    expect(screen.getByText("(12)")).toBeInTheDocument();
  });

  it("omits star rating when rating prop is undefined", () => {
    render(<AppCard app={mockApp} layout="grid" />, { wrapper: createWrapper() });
    expect(screen.queryByLabelText(/rating:/i)).not.toBeInTheDocument();
  });

  it("shows install count badge when count > 0", () => {
    render(<AppCard app={mockApp} layout="grid" />, { wrapper: createWrapper() });
    // The mock useInstall returns installCount = 42
    expect(screen.getByLabelText("42 installs")).toBeInTheDocument();
  });

  it("renders in list layout with rank", () => {
    render(<AppCard app={mockApp} layout="list" rank={3} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("QA Studio")).toBeInTheDocument();
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders install button for the app", () => {
    render(<AppCard app={mockApp} layout="grid" />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /install qa studio/i })).toBeInTheDocument();
  });
});
