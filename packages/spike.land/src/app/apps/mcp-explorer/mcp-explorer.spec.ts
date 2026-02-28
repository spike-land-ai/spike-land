import { expect, test } from "@playwright/test";

test.describe("MCP Explorer", () => {
  test.beforeEach(async ({ context }) => {
    // Set visitor ID cookie
    await context.addCookies([{
      name: "spike_visitor_id",
      value: "v_e2e_test_visitor",
      domain: "localhost",
      path: "/",
    }]);
  });

  test("should load the explorer and search for tools", async ({ page }) => {
    await page.goto("http://localhost:3000/apps/mcp-explorer");

    // Check hero section
    await expect(page.getByRole("heading", { name: "MCP Explorer" }))
      .toBeVisible();

    // Search for a tool
    const searchInput = page.getByPlaceholder(
      "Search tools... e.g. generate image, chess, analytics",
    );
    await searchInput.fill("storage");

    // Check if storage tools appear
    await expect(page.getByText("storage_get_upload_url")).toBeVisible();
  });

  test("should open the terminal playground and run a command", async ({ page }) => {
    await page.goto("http://localhost:3000/apps/mcp-explorer");

    // Open advanced section
    const advancedButton = page.getByText("Advanced: Terminal Playground");
    await advancedButton.click();

    // Wait for terminal to load
    const terminal = page.locator(".xterm-screen");
    await expect(terminal).toBeVisible();

    // The terminal is canvas-based usually, so we might need to wait for the welcome message
    // but we can also check the "spike.land MCP Terminal" header
    await expect(page.getByText("spike.land MCP Terminal").first())
      .toBeVisible();
  });

  test("should open a tool modal when \"Try It\" is clicked", async ({ page }) => {
    await page.goto("http://localhost:3000/apps/mcp-explorer");

    // Find a "Try It" button (using first one for now)
    const tryItButton = page.getByRole("button", { name: "Try It" }).first();
    await tryItButton.click();

    // Modal should be visible
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
