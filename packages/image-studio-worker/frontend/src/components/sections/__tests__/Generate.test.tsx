import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Generate } from "../Generate";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { callTool, parseToolResult } from "@/api/client";
import { storage } from "@/services/storage";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

// Mock dependencies
vi.mock("@/api/client", () => ({
  callTool: vi.fn(),
  parseToolResult: vi.fn(),
}));

vi.mock("@/components/ui/ImagePicker", () => ({
  ImagePicker: ({ label }: { label: string }) => <div>{label}</div>
}));

vi.mock("@/services/storage", () => ({
  storage: {
    saveImageToLocal: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// We need to partially mock JobPoller because it handles polling via intervals, which might be tricky to test without fake timers.
// Or we can just let it render or mock it to simulate completion. Let's mock it to immediately complete for tests that test the job completion.
vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui")>();
  return {
    ...actual,
    ImagePicker: ({ label }: { label: string }) => <div>{label}</div>,
    JobPoller: ({
      jobId,
      onComplete,
    }: {
      jobId: string;
      onComplete?: (data: Record<string, unknown>) => void;
    }) => {
      return (
        <div data-testid="job-poller">
          Mock Job Poller: {jobId}
          <button
            data-testid="simulate-complete"
            onClick={() => {
              if (onComplete) {
                onComplete({ outputUrl: "mock-url.png" });
              }
            }}
          >
            Complete
          </button>
        </div>
      );
    },
  };
});

describe("Generate Section", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock IntersectionObserver
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  it("renders correctly with default Generate tab", () => {
    renderWithProviders(<Generate />);

    expect(screen.getByText("Generate", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText("Create images with AI")).toBeInTheDocument();

    // Check tabs
    const buttons = screen.getAllByRole("button", { name: /Generate/i });
    const tabButton = buttons.find(b => b.className.includes("flex-1"));
    expect(tabButton).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modify" })).toBeInTheDocument();

    // Check inputs for default "generate" tab
    expect(screen.getByLabelText("Prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Negative Prompt (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Quality Tier")).toBeInTheDocument();
    expect(screen.getByLabelText("Aspect Ratio")).toBeInTheDocument();
  });

  it("switches to Advanced tab and maintains inputs", async () => {
    renderWithProviders(<Generate />);

    const advancedTab = screen.getByRole("button", { name: "Advanced" });
    await userEvent.click(advancedTab);

    expect(screen.getByLabelText("Prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Negative Prompt (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Aspect Ratio")).toBeInTheDocument();
  });

  it("switches to Modify tab and updates inputs", async () => {
    renderWithProviders(<Generate />);

    const modifyTab = screen.getByRole("button", { name: "Modify" });
    await userEvent.click(modifyTab);

    expect(screen.getByLabelText("Prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Quality Tier")).toBeInTheDocument();

    // ImagePicker input (has placeholder "Select image to modify" or label)
    expect(screen.getByText("Image to modify")).toBeInTheDocument();

    // Negative prompt and aspect ratio should be hidden
    expect(screen.queryByLabelText("Negative Prompt (optional)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Aspect Ratio")).not.toBeInTheDocument();
  });

  it("calls API and starts job when Generate button is clicked", async () => {
    (callTool as any).mockResolvedValue("mock-tool-result");
    (parseToolResult as any).mockReturnValue({ jobId: "job-123" });

    renderWithProviders(<Generate />);

    const promptInput = screen.getByLabelText("Prompt");
    await userEvent.type(promptInput, "A beautiful sunset");

    const buttons = screen.getAllByRole("button", { name: /Generate/i });
    const actionButton = buttons.find(b => b.textContent?.includes("Generate") && !b.className.includes("flex-1"));

    if (actionButton) {
      await userEvent.click(actionButton);
    }

    expect(callTool).toHaveBeenCalledWith("img_generate", {
      prompt: "A beautiful sunset",
      tier: "FREE",
      // aspect_ratio defaults to "1:1" but code doesn't send it if it's "1:1"
    });

    await waitFor(() => {
      expect(screen.getByTestId("job-poller")).toBeInTheDocument();
    });

    expect(screen.getByText("Mock Job Poller: job-123")).toBeInTheDocument();
  });

  it("handles Modify API call", async () => {
    (callTool as any).mockResolvedValue("mock-tool-result");
    (parseToolResult as any).mockReturnValue({ job_id: "job-modify-123" });

    renderWithProviders(<Generate />);

    const modifyTab = screen.getByRole("button", { name: "Modify" });
    await userEvent.click(modifyTab);

    const promptInput = screen.getByLabelText("Prompt");
    await userEvent.type(promptInput, "Make it brighter");

    // Set modifyImageId (assuming it relies on ImagePicker, we might need to mock ImagePicker, but let's see if we can trigger the API without setting ImagePicker if it's not strictly validated in the component)
    // Actually the component just passes modifyImageId, which starts as ""

    const buttons = screen.getAllByRole("button", { name: /Generate/i });
    const actionButton = buttons.find(b => b.textContent?.includes("Generate") && !b.className.includes("flex-1"));

    if (actionButton) {
      await userEvent.click(actionButton);
    }

    expect(callTool).toHaveBeenCalledWith("img_edit", {
      prompt: "Make it brighter",
      tier: "FREE",
      image_id: "",
    });

    await waitFor(() => {
      expect(screen.getByText("Mock Job Poller: job-modify-123")).toBeInTheDocument();
    });
  });

  it("handles API error correctly", async () => {
    (callTool as any).mockResolvedValue("mock-tool-result");
    (parseToolResult as any).mockReturnValue({ error: "Something went wrong" });

    renderWithProviders(<Generate />);

    const promptInput = screen.getByLabelText("Prompt");
    await userEvent.type(promptInput, "A beautiful sunset");

    const buttons = screen.getAllByRole("button", { name: /Generate/i });
    const actionButton = buttons.find(b => b.textContent?.includes("Generate") && !b.className.includes("flex-1"));

    if (actionButton) {
      await userEvent.click(actionButton);
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    expect(screen.queryByTestId("job-poller")).not.toBeInTheDocument();
  });

  it("handles fetch failure when API throws an error", async () => {
    (callTool as any).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<Generate />);

    const promptInput = screen.getByLabelText("Prompt");
    await userEvent.type(promptInput, "A beautiful sunset");

    const buttons = screen.getAllByRole("button", { name: "Generate" });
    const actionButton = buttons.find(b => b.textContent?.includes("Generate") && !b.className.includes("flex-1"));

    if (actionButton) {
      await userEvent.click(actionButton);
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });

  it("handles job completion and saves image to local storage", async () => {
    // Setup
    (callTool as any).mockResolvedValue("mock-tool-result");
    (parseToolResult as any).mockReturnValue({ jobId: "job-123" });

    // Mock global fetch
    const mockBlob = new Blob(["test"], { type: "image/png" });
    global.fetch = vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(mockBlob)
    });

    (storage.saveImageToLocal as any).mockResolvedValue({ url: "blob:mock-local-url" });

    renderWithProviders(<Generate />);

    // Start job
    const promptInput = screen.getByLabelText("Prompt");
    await userEvent.type(promptInput, "A beautiful sunset");

    const buttons = screen.getAllByRole("button", { name: "Generate" });
    const actionButton = buttons.find(b => b.textContent?.includes("Generate") && !b.className.includes("flex-1"));

    if (actionButton) {
      await userEvent.click(actionButton);
    }

    // Wait for poller to appear
    await waitFor(() => {
      expect(screen.getByTestId("job-poller")).toBeInTheDocument();
    });

    // Simulate completion
    const completeBtn = screen.getByTestId("simulate-complete");
    await userEvent.click(completeBtn);

    // Wait for fetch and saveImageToLocal
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("mock-url.png");
      expect(storage.saveImageToLocal).toHaveBeenCalledWith(mockBlob, {
        name: "A beautiful sunset",
        width: 1024,
        height: 1024,
      });
    });

    // The image should be rendered
    await waitFor(() => {
      const img = screen.getByAltText("Generated");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "blob:mock-local-url");
    });
  });
});
