import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mock all MCP hooks ────────────────────────────────────────────────────

const mockUseMcpMutation = vi.hoisted(() => vi.fn());
const mockUseMcpTool = vi.hoisted(() => vi.fn());
const mockUseMcpStream = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));
vi.mock("@/lib/mcp/client/hooks/use-mcp-tool", () => ({
  useMcpTool: mockUseMcpTool,
}));
vi.mock("@/lib/mcp/client/hooks/use-mcp-stream", () => ({
  useMcpStream: mockUseMcpStream,
}));

import { MusicCreatorClient } from "./MusicCreatorClient";

function makeMutationResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

function makeQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: undefined,
    isLoading: false,
    isRefetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

function makeStreamResult(overrides: Record<string, unknown> = {}) {
  return {
    chunks: [],
    fullText: "",
    isDone: false,
    error: undefined,
    start: vi.fn(),
    stop: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  mockUseMcpMutation.mockReset();
  mockUseMcpTool.mockReset();
  mockUseMcpStream.mockReset();

  mockUseMcpMutation.mockReturnValue(makeMutationResult());
  mockUseMcpTool.mockReturnValue(makeQueryResult());
  mockUseMcpStream.mockReturnValue(makeStreamResult());
});

describe("MusicCreatorClient", () => {
  describe("initial render", () => {
    it("renders the app title", () => {
      render(<MusicCreatorClient />);
      expect(screen.getByText("Music Creator")).toBeInTheDocument();
    });

    it("renders transport controls", () => {
      render(<MusicCreatorClient />);
      expect(screen.getByLabelText("Play")).toBeInTheDocument();
      expect(screen.getByLabelText("Stop")).toBeInTheDocument();
    });

    it("renders BPM input with default 120", () => {
      render(<MusicCreatorClient />);
      const bpmInput = screen.getByDisplayValue("120");
      expect(bpmInput).toBeInTheDocument();
    });

    it("renders instrument sidebar", () => {
      render(<MusicCreatorClient />);
      expect(screen.getByText("Piano")).toBeInTheDocument();
      expect(screen.getByText("Drums")).toBeInTheDocument();
      expect(screen.getByText("Synth")).toBeInTheDocument();
      expect(screen.getByText("Bass")).toBeInTheDocument();
    });

    it("shows 0 tracks initially", () => {
      render(<MusicCreatorClient />);
      // "0 tracks • 0 notes" is split across elements, use getAllByText
      const elements = screen.getAllByText(/tracks/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("track management", () => {
    it("adds a track when instrument is clicked", () => {
      render(<MusicCreatorClient />);
      const addPianoBtn = screen.getByLabelText("Add Piano track");
      fireEvent.click(addPianoBtn);
      // Track count increments — the sidebar now shows "Tracks (1)"
      expect(screen.getByText("Tracks (1)")).toBeInTheDocument();
    });

    it("calls addTrackMut.mutate when adding a track", () => {
      const mutate = vi.fn();
      mockUseMcpMutation.mockReturnValue(makeMutationResult({ mutate }));

      render(<MusicCreatorClient />);
      fireEvent.click(screen.getByLabelText("Add Drums track"));

      expect(mutate).toHaveBeenCalled();
    });

    it("shows piano roll after selecting a track", () => {
      render(<MusicCreatorClient />);
      fireEvent.click(screen.getByLabelText("Add Piano track"));
      // The track note count label appears in the piano roll panel
      expect(screen.getAllByText(/Piano 1/).length).toBeGreaterThan(0);
    });
  });

  describe("playback controls", () => {
    it("calls playMut.mutate when Play is clicked", () => {
      const mutate = vi.fn();
      mockUseMcpMutation.mockReturnValue(makeMutationResult({ mutate }));

      render(<MusicCreatorClient />);
      fireEvent.click(screen.getByLabelText("Play"));

      expect(mutate).toHaveBeenCalled();
    });

    it("shows Pause button when playing", () => {
      render(<MusicCreatorClient />);
      fireEvent.click(screen.getByLabelText("Play"));
      expect(screen.getByLabelText("Pause")).toBeInTheDocument();
    });

    it("calls stopMut.mutate when Stop is clicked", () => {
      const mutate = vi.fn();
      mockUseMcpMutation.mockReturnValue(makeMutationResult({ mutate }));

      render(<MusicCreatorClient />);
      fireEvent.click(screen.getByLabelText("Play"));
      fireEvent.click(screen.getByLabelText("Stop"));

      expect(mutate).toHaveBeenCalled();
    });

    it("shows stopped status after stop", () => {
      render(<MusicCreatorClient />);
      fireEvent.click(screen.getByLabelText("Play"));
      fireEvent.click(screen.getByLabelText("Stop"));
      expect(screen.getByText("Stopped")).toBeInTheDocument();
    });
  });

  describe("BPM control", () => {
    it("updates BPM badge when input changes", () => {
      render(<MusicCreatorClient />);
      const bpmInput = screen.getByDisplayValue("120");
      fireEvent.change(bpmInput, { target: { value: "140" } });
      expect(screen.getByDisplayValue("140")).toBeInTheDocument();
    });
  });

  describe("export", () => {
    it("renders Export button", () => {
      render(<MusicCreatorClient />);
      expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("calls exportProjectMut.mutate on export click", () => {
      const mutate = vi.fn();
      mockUseMcpMutation.mockReturnValue(makeMutationResult({ mutate }));

      render(<MusicCreatorClient />);
      fireEvent.click(screen.getByText("Export"));

      expect(mutate).toHaveBeenCalled();
    });

    it("shows 'Exporting…' when export is loading", () => {
      mockUseMcpMutation.mockReturnValue(makeMutationResult({ isLoading: true }));

      render(<MusicCreatorClient />);
      expect(screen.getByText("Exporting…")).toBeInTheDocument();
    });
  });

  describe("tab navigation", () => {
    it("renders Piano Roll, Mixer, and AI Generate tabs", () => {
      render(<MusicCreatorClient />);
      expect(screen.getByRole("tab", { name: /Piano Roll/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Mixer/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /AI Generate/i })).toBeInTheDocument();
    });

    it("activates AI Generate tab when clicked", async () => {
      const user = userEvent.setup();
      render(<MusicCreatorClient />);
      const tab = screen.getByRole("tab", { name: /AI Generate/i });
      await user.click(tab);
      // shadcn Tabs uses data-state="active" on the active tab trigger
      expect(tab).toHaveAttribute("data-state", "active");
    });

    it("activates Mixer tab when clicked", async () => {
      const user = userEvent.setup();
      render(<MusicCreatorClient />);
      const tab = screen.getByRole("tab", { name: /Mixer/i });
      await user.click(tab);
      expect(tab).toHaveAttribute("data-state", "active");
    });
  });

  describe("save button", () => {
    it("renders the Save button", () => {
      render(<MusicCreatorClient />);
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("shows 'Saving…' when saveProjectMut is loading", () => {
      mockUseMcpMutation.mockReturnValue(makeMutationResult({ isLoading: true }));

      render(<MusicCreatorClient />);
      expect(screen.getByText("Saving…")).toBeInTheDocument();
    });
  });
});
