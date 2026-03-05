import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
      <a href={to} className={className}>{children}</a>
    ),
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("@/hooks/useAuth");
const { LoginPage } = await import("@/routes/login");

describe("LoginPage", () => {
  it("renders sign in heading when not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    expect(screen.getByText("Sign in to Spike Platform")).toBeInTheDocument();
  });

  it("redirects to / when already authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/");
  });

  it("shows GitHub and Google login buttons", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("calls login('github') when GitHub button clicked", () => {
    const login = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login,
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with GitHub"));
    expect(login).toHaveBeenCalledWith("github");
  });

  it("calls login('google') when Google button clicked", () => {
    const login = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login,
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(login).toHaveBeenCalledWith("google");
  });

  it("disables buttons when loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    expect(screen.getByText("Continue with GitHub")).toBeDisabled();
    expect(screen.getByText("Continue with Google")).toBeDisabled();
  });

  it("shows error message when auth error exists", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: new Error("Authentication failed"),
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Authentication failed");
  });

  it("shows guest link", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    });
    render(<LoginPage />);
    expect(screen.getByText("Continue as guest")).toBeInTheDocument();
  });
});
