import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  detectShell,
  installCompletions,
  uninstallCompletions,
} from "../../../../src/spike-cli/completions/installer.js";
import { generateBashCompletions } from "../../../../src/spike-cli/completions/bash.js";
import { generateZshCompletions } from "../../../../src/spike-cli/completions/zsh.js";
import { generateFishCompletions } from "../../../../src/spike-cli/completions/fish.js";

// Must use vi.hoisted for variables used inside vi.mock
const mockFs = vi.hoisted(() => ({
  appendFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(false),
  unlinkSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue(""),
}));

vi.mock("node:fs", () => ({
  ...mockFs,
  default: mockFs,
}));

const mockOs = vi.hoisted(() => ({
  homedir: vi.fn().mockReturnValue("/home/testuser"),
}));

vi.mock("node:os", () => ({
  ...mockOs,
  default: mockOs,
}));

describe("detectShell", () => {
  const originalShell = process.env.SHELL;

  afterEach(() => {
    if (originalShell !== undefined) {
      process.env.SHELL = originalShell;
    } else {
      delete process.env.SHELL;
    }
  });

  it("detects zsh", () => {
    process.env.SHELL = "/bin/zsh";
    expect(detectShell()).toBe("zsh");
  });

  it("detects bash", () => {
    process.env.SHELL = "/bin/bash";
    expect(detectShell()).toBe("bash");
  });

  it("detects fish", () => {
    process.env.SHELL = "/usr/bin/fish";
    expect(detectShell()).toBe("fish");
  });

  it("returns unknown for unrecognized shell", () => {
    process.env.SHELL = "/bin/csh";
    expect(detectShell()).toBe("unknown");
  });

  it("returns unknown when SHELL is not set", () => {
    delete process.env.SHELL;
    expect(detectShell()).toBe("unknown");
  });
});

describe("installCompletions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue("");
  });

  it("installs bash completions", () => {
    const result = installCompletions("bash");
    expect(result.path).toBe("/home/testuser/.spike/completions/spike.bash");
    expect(mockFs.mkdirSync).toHaveBeenCalledWith("/home/testuser/.spike/completions", {
      recursive: true,
    });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      "/home/testuser/.spike/completions/spike.bash",
      expect.stringContaining("_spike_completions"),
      "utf-8",
    );
  });

  it("installs zsh completions", () => {
    const result = installCompletions("zsh");
    expect(result.path).toBe("/home/testuser/.spike/completions/_spike");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      "/home/testuser/.spike/completions/_spike",
      expect.stringContaining("#compdef spike"),
      "utf-8",
    );
  });

  it("installs fish completions", () => {
    const result = installCompletions("fish");
    expect(result.path).toBe("/home/testuser/.config/fish/completions/spike.fish");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      "/home/testuser/.config/fish/completions/spike.fish",
      expect.stringContaining("complete -c spike"),
      "utf-8",
    );
  });

  it("throws for unsupported shell", () => {
    expect(() => installCompletions("csh")).toThrow("Unsupported shell");
  });

  it("does not duplicate source line in rc file", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      '[ -f "/home/testuser/.spike/completions/spike.bash" ] && source "/home/testuser/.spike/completions/spike.bash"\n',
    );

    installCompletions("bash");

    // writeFileSync is called for the completion file itself,
    // but the rc file should NOT be rewritten with a duplicate line
    const rcWrites = mockFs.writeFileSync.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).endsWith(".bashrc"),
    );
    expect(rcWrites).toHaveLength(0);
  });

  it("adds newline separator when rc file content does not end with newline (line 139 false branch)", () => {
    mockFs.existsSync.mockReturnValue(true);
    // Content that does NOT end with "\n" and is not "" → separator = "\n"
    mockFs.readFileSync.mockReturnValue("# existing config without trailing newline");

    installCompletions("bash");

    const rcWrites = mockFs.writeFileSync.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).endsWith(".bashrc"),
    );
    expect(rcWrites).toHaveLength(1);
    // Content should have a "\n" inserted before the source line
    const writtenContent = rcWrites[0][1] as string;
    expect(writtenContent).toContain("\n");
    expect(writtenContent).toContain("# existing config without trailing newline");
  });
});

describe("uninstallCompletions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes existing bash completions", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("");
    const result = uninstallCompletions("bash");
    expect(result).toBe(true);
    expect(mockFs.unlinkSync).toHaveBeenCalledWith("/home/testuser/.spike/completions/spike.bash");
  });

  it("cleans up bashrc source line on uninstall", () => {
    mockFs.existsSync.mockReturnValue(true);
    const sourceLine =
      '[ -f "/home/testuser/.spike/completions/spike.bash" ] && source "/home/testuser/.spike/completions/spike.bash"';
    mockFs.readFileSync.mockReturnValue(`# my config\n${sourceLine}\nexport PATH=foo\n`);
    uninstallCompletions("bash");
    // Should rewrite .bashrc without the source line
    const rcWrites = mockFs.writeFileSync.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).endsWith(".bashrc"),
    );
    expect(rcWrites).toHaveLength(1);
    expect(rcWrites[0][1]).not.toContain(sourceLine);
    expect(rcWrites[0][1]).toContain("export PATH=foo");
  });

  it("cleans up zshrc fpath line on uninstall", () => {
    mockFs.existsSync.mockReturnValue(true);
    const fpathLine = "fpath=(/home/testuser/.spike/completions $fpath)";
    mockFs.readFileSync.mockReturnValue(`# zsh config\n${fpathLine}\n`);
    uninstallCompletions("zsh");
    const rcWrites = mockFs.writeFileSync.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).endsWith(".zshrc"),
    );
    expect(rcWrites).toHaveLength(1);
    expect(rcWrites[0][1]).not.toContain(fpathLine);
  });

  it("returns false when no completions exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    const result = uninstallCompletions("bash");
    expect(result).toBe(false);
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
  });

  it("returns false when zsh completions do not exist (line 104 false branch)", () => {
    mockFs.existsSync.mockReturnValue(false);
    const result = uninstallCompletions("zsh");
    expect(result).toBe(false);
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
  });

  it("removes existing fish completions", () => {
    mockFs.existsSync.mockReturnValue(true);
    const result = uninstallCompletions("fish");
    expect(result).toBe(true);
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      "/home/testuser/.config/fish/completions/spike.fish",
    );
  });

  it("returns false when fish completions do not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    const result = uninstallCompletions("fish");
    expect(result).toBe(false);
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
  });

  it("returns false for unknown shell", () => {
    const result = uninstallCompletions("csh");
    expect(result).toBe(false);
  });

  it("logs install and uninstall actions", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("");
    uninstallCompletions("bash");
    expect(mockFs.appendFileSync).toHaveBeenCalledWith(
      "/home/testuser/.spike/install.log",
      expect.stringContaining("Uninstalled bash completions"),
      "utf-8",
    );
  });

  it("handles bash uninstall when rc file does not exist", () => {
    // Completion file exists, but .bashrc does not
    mockFs.existsSync.mockImplementation((p: string) => {
      if (p.endsWith("spike.bash")) return true;
      if (p.endsWith(".bashrc")) return false;
      // For log dir
      return true;
    });
    mockFs.readFileSync.mockReturnValue("");
    // Should not throw
    const result = uninstallCompletions("bash");
    expect(result).toBe(true);
    expect(mockFs.unlinkSync).toHaveBeenCalledWith("/home/testuser/.spike/completions/spike.bash");
    // .bashrc should not be written since it doesn't exist
    const rcWrites = mockFs.writeFileSync.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).endsWith(".bashrc"),
    );
    expect(rcWrites).toHaveLength(0);
  });

  it("handles bash uninstall when source line was never in rc file", () => {
    mockFs.existsSync.mockReturnValue(true);
    // .bashrc exists but does not contain the source line
    mockFs.readFileSync.mockReturnValue("# my plain bashrc\nexport FOO=bar\n");
    const result = uninstallCompletions("bash");
    expect(result).toBe(true);
    // .bashrc should not be rewritten since line is not present
    const rcWrites = mockFs.writeFileSync.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).endsWith(".bashrc"),
    );
    expect(rcWrites).toHaveLength(0);
  });
});

describe("completion script static content", () => {
  it("bash completions include chat and status subcommands", () => {
    const script = generateBashCompletions();
    expect(script).toContain("chat");
    expect(script).toContain("status");
  });

  it("zsh completions include chat and status subcommands", () => {
    const script = generateZshCompletions();
    expect(script).toContain("'chat:Interactive Claude chat with MCP tools'");
    expect(script).toContain("'status:Health check for configured MCP servers'");
  });

  it("fish completions include chat and status subcommands", () => {
    const script = generateFishCompletions();
    expect(script).toContain('-a chat -d "Interactive Claude chat with MCP tools"');
    expect(script).toContain('-a status -d "Health check for configured MCP servers"');
  });
});
