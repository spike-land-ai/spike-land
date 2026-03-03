/**
 * Minimal reporter: one summary line per test run.
 * "chess-engine: 158 passed (6 files)"
 * "mcp-auth: 20 failed, 33 passed (3 files)"
 */
export default class MinimalReporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private name = "";
  private fileCount = 0;
  private failures: { name: string; error: string }[] = [];

  onTestCaseResult(test: Record<string, unknown>) {
    // vitest 4.x: test.result() returns { state, errors }
    let state: string | undefined;
    let errors: { message: string }[] | undefined;

    if (typeof test.result === "function") {
      const r = (test.result as () => Record<string, unknown>)();
      state = r.state as string;
      errors = r.errors as { message: string }[];
    } else if (test.result && typeof test.result === "object") {
      const r = test.result as Record<string, unknown>;
      state = r.state as string;
      errors = r.errors as { message: string }[];
    }

    const fullName =
      (typeof test.fullName === "string"
        ? test.fullName
        : ((test as Record<string, unknown>).name as string)) ?? "unknown";

    if (state === "pass" || state === "passed") {
      this.passed++;
    } else if (state === "fail" || state === "failed") {
      this.failed++;
      this.failures.push({
        name: fullName,
        error: errors?.[0]?.message?.split("\n")[0] ?? "",
      });
    } else if (state === "skip" || state === "skipped" || state === "todo") {
      this.skipped++;
    }
  }

  onTestModuleEnd(module: Record<string, unknown>) {
    this.fileCount++;
    // Try multiple paths to find the project name
    const task = module.task as Record<string, unknown> | undefined;
    const file = task?.file as Record<string, unknown> | undefined;
    if (!this.name) {
      this.name =
        (file?.projectName as string) ??
        (task?.projectName as string) ??
        ((module as Record<string, unknown>).projectName as string) ??
        "";
    }
  }

  onInit(ctx: Record<string, unknown>) {
    // Try to get the project name from context
    const projects = ctx.projects as { name?: string }[] | undefined;
    if (projects?.length && projects[0].name && !this.name) {
      this.name = projects[0].name;
    }
    // Fallback: derive name from cwd (packages/foo -> foo)
    if (!this.name) {
      const cwd = process.cwd();
      const match = cwd.match(/packages\/([^/]+)$/);
      if (match) this.name = match[1];
    }
  }

  onTestRunEnd() {
    const parts: string[] = [];
    if (this.failed > 0) parts.push(`\x1b[31m${this.failed} failed\x1b[0m`);
    if (this.passed > 0) parts.push(`\x1b[32m${this.passed} passed\x1b[0m`);
    if (this.skipped > 0) parts.push(`\x1b[33m${this.skipped} skipped\x1b[0m`);

    const prefix = this.name ? `${this.name}: ` : "";
    const suffix = this.fileCount ? ` (${this.fileCount} files)` : "";
    process.stdout.write(`${prefix}${parts.join(", ")}${suffix}\n`);

    for (const f of this.failures) {
      process.stderr.write(`  \x1b[31mFAIL\x1b[0m ${f.name}\n`);
      if (f.error) process.stderr.write(`    ${f.error}\n`);
    }
  }
}
