import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let isDarkMode = false;

const editorInstance = {
  getValue: vi.fn(() => 'const x = 1;'),
  setValue: vi.fn(),
  dispose: vi.fn(),
  focus: vi.fn(),
  getModel: vi.fn(() => ({ uri: { path: "/App.tsx" } })),
  onDidChangeModelContent: vi.fn(),
  updateOptions: vi.fn(),
};

const monacoMock = {
  editor: {
    create: vi.fn(() => editorInstance),
    createModel: vi.fn(() => ({ setValue: vi.fn() })),
    getModel: vi.fn(() => null),
    setModelLanguage: vi.fn(),
    setTheme: vi.fn(),
    defineTheme: vi.fn(),
  },
  Uri: {
    parse: vi.fn((uri: string) => uri),
  },
};

vi.mock("monaco-editor", () => monacoMock);

vi.mock("lucide-react", () => ({
  Copy: () => null,
  Check: () => null,
  FileCode: () => null,
}));

vi.mock("../../../src/frontend/platform-frontend/ui/hooks/useDarkMode", () => ({
  useDarkMode: () => ({
    isDarkMode,
    theme: isDarkMode ? "dark" : "light",
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("../../../src/frontend/platform-frontend/ui/hooks/useMonacoTypeAcquisition", () => ({
  useMonacoTypeAcquisition: () => ({
    typesReady: true,
  }),
}));

import { CodeEditor } from "../../../src/frontend/platform-frontend/editor/CodeEditor";

describe("CodeEditor theme toggles", () => {
  beforeEach(() => {
    isDarkMode = false;
    vi.clearAllMocks();
  });

  it("reapplies the Monaco theme when dark mode changes while editing", async () => {
    const { rerender } = render(
      <CodeEditor value={"const x = 1;"} onChange={vi.fn()} fileName="App.tsx" />,
    );

    fireEvent.click(screen.getByText("Click to edit"));

    await waitFor(() => {
      expect(monacoMock.editor.create).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(monacoMock.editor.setTheme).toHaveBeenCalledWith("spike-platform");
    });

    const initialSetThemeCalls = monacoMock.editor.setTheme.mock.calls.length;
    const initialDefineThemeCalls = monacoMock.editor.defineTheme.mock.calls.length;

    isDarkMode = true;
    rerender(<CodeEditor value={"const x = 1;"} onChange={vi.fn()} fileName="App.tsx" />);

    await waitFor(() => {
      expect(monacoMock.editor.setTheme.mock.calls.length).toBeGreaterThan(initialSetThemeCalls);
    });

    await waitFor(() => {
      expect(monacoMock.editor.defineTheme.mock.calls.length).toBeGreaterThan(
        initialDefineThemeCalls,
      );
    });

    expect(monacoMock.editor.setTheme).toHaveBeenLastCalledWith("spike-platform");
  });
});
