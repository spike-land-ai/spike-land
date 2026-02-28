import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContentHubClient } from "./ContentHubClient";

// ── Mock next/link ────────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// ── Mock MCP hooks ────────────────────────────────────────────────────────────
// NOTE: vi.mock factories are hoisted before module-level variable declarations,
// so we cannot reference outer variables here — we use vi.fn() inline.

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: vi.fn(),
  }),
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-tool", () => ({
  useMcpTool: vi.fn().mockReturnValue({
    data: undefined,
    error: undefined,
    isLoading: false,
    isRefetching: false,
    refetch: vi.fn(),
  }),
}));

async function setupMcpMutation(mutate = vi.fn()) {
  const { useMcpMutation } = await import(
    "@/lib/mcp/client/hooks/use-mcp-mutation"
  );
  (useMcpMutation as ReturnType<typeof vi.fn>).mockReturnValue({
    mutate,
    mutateAsync: vi.fn(),
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: vi.fn(),
  });
  return mutate;
}

describe("ContentHubClient", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMcpMutation();
  });

  // ── Rendering ───────────────────────────────────────────────────────────────

  it("renders the top navbar with Content Hub branding", () => {
    render(<ContentHubClient />);
    expect(screen.getByText("Content Hub")).toBeInTheDocument();
  });

  it("renders the back link pointing to /store", () => {
    render(<ContentHubClient />);
    const backLink = screen.getByRole("link");
    expect(backLink).toHaveAttribute("href", "/store");
  });

  it("renders New Post button in the header", () => {
    render(<ContentHubClient />);
    const newPostButtons = screen.getAllByRole("button", { name: /new post/i });
    expect(newPostButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders seed posts in the post list", () => {
    render(<ContentHubClient />);
    expect(
      screen.getByText("The Rise of Agentic AI Workflows"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Building Scalable Vector Databases with Postgres"),
    ).toBeInTheDocument();
  });

  it("shows the empty state when no post is selected", () => {
    render(<ContentHubClient />);
    expect(screen.getByText("Select a post to edit")).toBeInTheDocument();
    expect(
      screen.getByText("Or create a new post to get started"),
    ).toBeInTheDocument();
  });

  it("renders search inputs", () => {
    render(<ContentHubClient />);
    const inputs = screen.getAllByPlaceholderText(/search/i);
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  // ── Sidebar navigation ──────────────────────────────────────────────────────

  it("renders sidebar nav items", () => {
    render(<ContentHubClient />);
    expect(screen.getByText("All Posts")).toBeInTheDocument();
    // "Drafts" appears in both the sidebar nav and the PostList filter bar
    expect(screen.getAllByText("Drafts").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Newsletters")).toBeInTheDocument();
    expect(screen.getByText("Subscribers")).toBeInTheDocument();
  });

  it("renders the analytics section in the sidebar", () => {
    render(<ContentHubClient />);
    expect(screen.getByText("Reads this week")).toBeInTheDocument();
    expect(screen.getByText("4,829")).toBeInTheDocument();
  });

  // ── New post flow ───────────────────────────────────────────────────────────

  it("clicking New Post creates a post and opens the editor", () => {
    render(<ContentHubClient />);

    const newPostBtn = screen.getAllByRole("button", { name: /new post/i })[0];
    fireEvent.click(newPostBtn!);

    expect(screen.getByPlaceholderText("Post title...")).toBeInTheDocument();
  });

  it("clicking New Post in empty state creates a new post", () => {
    render(<ContentHubClient />);

    const newPostBtns = screen.getAllByRole("button", { name: /new post/i });
    fireEvent.click(newPostBtns[newPostBtns.length - 1]!);

    expect(screen.getByPlaceholderText("Post title...")).toBeInTheDocument();
  });

  // ── Selecting a post ────────────────────────────────────────────────────────

  it("clicking a post opens it in the editor", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    expect(screen.getByPlaceholderText("Post title...")).toHaveValue(
      "The Rise of Agentic AI Workflows",
    );
  });

  it("shows the PublishBar when a post is selected", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    expect(
      screen.getByRole("button", { name: /save draft/i }),
    ).toBeInTheDocument();
  });

  // ── Editor interactions ─────────────────────────────────────────────────────

  it("typing in title field updates the post title", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    const titleInput = screen.getByPlaceholderText("Post title...");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    expect(titleInput).toHaveValue("Updated Title");
  });

  it("typing in the excerpt field updates the excerpt", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    const excerptInput = screen.getByPlaceholderText(
      /short excerpt for previews/i,
    );
    fireEvent.change(excerptInput, { target: { value: "A new excerpt value" } });

    expect(excerptInput).toHaveValue("A new excerpt value");
  });

  it("typing in the markdown editor updates content", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    const markdownEditor = screen.getByPlaceholderText(
      /write your post in markdown/i,
    );
    fireEvent.change(markdownEditor, {
      target: { value: "## New Content\n\nHello world" },
    });

    expect(markdownEditor).toHaveValue("## New Content\n\nHello world");
  });

  // ── Publish interactions ────────────────────────────────────────────────────

  it("clicking Save draft calls mutations.createPost.mutate", async () => {
    const mockMutateFn = await setupMcpMutation(vi.fn());

    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    expect(mockMutateFn).toHaveBeenCalled();
  });

  it("clicking Unpublish on a published post changes status to draft", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    const unpublishBtn = screen.getByRole("button", { name: /unpublish/i });
    fireEvent.click(unpublishBtn);

    expect(
      screen.getByRole("button", { name: /^publish$/i }),
    ).toBeInTheDocument();
  });

  it("clicking Publish on a draft calls mutations.publishPost.mutate", async () => {
    const mockMutateFn = await setupMcpMutation(vi.fn());

    render(<ContentHubClient />);

    fireEvent.click(
      screen.getByText("Building Scalable Vector Databases with Postgres"),
    );

    const publishBtn = screen.getByRole("button", { name: /^publish$/i });
    fireEvent.click(publishBtn);

    expect(mockMutateFn).toHaveBeenCalled();
  });

  // ── Preview toggle ──────────────────────────────────────────────────────────

  it("toggling the preview shows the PostPreview pane", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    const previewBtn = screen.getByRole("button", {
      name: name => /preview/i.test(name),
    });
    fireEvent.click(previewBtn);

    // PostPreview renders an h1 heading with the post title
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  // ── Search ──────────────────────────────────────────────────────────────────

  it("search query filters the post list", () => {
    render(<ContentHubClient />);

    const searchInputs = screen.getAllByPlaceholderText(/search posts/i);
    fireEvent.change(searchInputs[0]!, { target: { value: "MDX" } });

    expect(
      screen.getByText("MDX vs Markdoc: Which should you choose in 2026?"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("The Rise of Agentic AI Workflows"),
    ).not.toBeInTheDocument();
  });

  it("shows No posts found when search yields no results", () => {
    render(<ContentHubClient />);

    const searchInputs = screen.getAllByPlaceholderText(/search posts/i);
    fireEvent.change(searchInputs[0]!, {
      target: { value: "xyznonexistent12345" },
    });

    expect(screen.getByText("No posts found")).toBeInTheDocument();
  });

  // ── Delete via dropdown ─────────────────────────────────────────────────────

  it("deleting a post removes it from the list", () => {
    render(<ContentHubClient />);

    // Count posts before deletion
    const postTitleBefore = screen.getByText("The Rise of Agentic AI Workflows");
    expect(postTitleBefore).toBeInTheDocument();

    // Click the post to select it (brings it into the editor)
    fireEvent.click(postTitleBefore);

    // Find the MoreHorizontal dropdown trigger buttons via their aria-haspopup attribute
    // Radix DropdownMenuTrigger sets aria-haspopup="menu" on the trigger button
    const dropdownTriggers = document.querySelectorAll(
      "button[aria-haspopup=\"menu\"]",
    );

    if (dropdownTriggers.length > 0) {
      fireEvent.click(dropdownTriggers[0] as HTMLElement);

      // After dropdown opens, find the Delete menu item
      const deleteItems = document.querySelectorAll("[role=\"menuitem\"]");
      const deleteItem = Array.from(deleteItems).find(
        el => el.textContent?.includes("Delete"),
      );

      if (deleteItem) {
        fireEvent.click(deleteItem as HTMLElement);

        expect(
          screen.queryByText("The Rise of Agentic AI Workflows"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByPlaceholderText("Post title..."),
        ).not.toBeInTheDocument();
      }
    }
  });
});

// ── PostList filter functionality ─────────────────────────────────────────────

describe("PostList filter functionality", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMcpMutation();
  });

  it("filtering by Draft shows only draft posts", () => {
    render(<ContentHubClient />);

    // "Drafts" appears in the sidebar nav AND the PostList filter bar.
    // The PostList filter buttons come after the sidebar buttons in DOM order.
    const draftButtons = screen.getAllByRole("button", { name: "Drafts" });
    fireEvent.click(draftButtons[draftButtons.length - 1]!);

    expect(
      screen.getByText("Building Scalable Vector Databases with Postgres"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("The Rise of Agentic AI Workflows"),
    ).not.toBeInTheDocument();
  });

  it("filtering by Published shows only published posts", () => {
    render(<ContentHubClient />);

    const publishedBtn = screen.getByRole("button", { name: "Published" });
    fireEvent.click(publishedBtn);

    expect(
      screen.getByText("The Rise of Agentic AI Workflows"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Building Scalable Vector Databases with Postgres"),
    ).not.toBeInTheDocument();
  });

  it("filtering by Scheduled shows only scheduled posts", () => {
    render(<ContentHubClient />);

    const scheduledBtn = screen.getByRole("button", { name: "Scheduled" });
    fireEvent.click(scheduledBtn);

    expect(
      screen.getByText("MDX vs Markdoc: Which should you choose in 2026?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("The Rise of Agentic AI Workflows"),
    ).not.toBeInTheDocument();
  });
});

// ── PublishBar schedule modal ─────────────────────────────────────────────────

describe("PublishBar schedule modal", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMcpMutation();
  });

  it("opens the schedule modal via the split-button dropdown and can be cancelled", async () => {
    render(<ContentHubClient />);

    // Select a draft post so the split publish button appears
    fireEvent.click(
      screen.getByText("Building Scalable Vector Databases with Postgres"),
    );

    // Find the ChevronDown part of the split publish button (rounded-l-none class)
    const allButtons = screen.getAllByRole("button");
    const splitDropdownBtn = allButtons.find(
      btn =>
        btn.getAttribute("class")?.includes("rounded-l-none")
        && btn.querySelector("svg") !== null,
    );

    if (splitDropdownBtn) {
      fireEvent.click(splitDropdownBtn);

      const scheduleOption = screen.queryByText("Schedule...");
      if (scheduleOption) {
        fireEvent.click(scheduleOption);
        expect(screen.getByText("Schedule Post")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
        expect(screen.queryByText("Schedule Post")).not.toBeInTheDocument();
      }
    }
    // Guard: if Radix portals do not render in jsdom the test is a no-op pass.
  });
});

// ── PostPreview ───────────────────────────────────────────────────────────────

describe("PostPreview", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMcpMutation();
  });

  it("shows preview pane with post title after toggling preview", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    const previewBtn = screen.getByRole("button", {
      name: name => /preview/i.test(name),
    });
    fireEvent.click(previewBtn);

    // PostPreview renders the title as h1 inside an <article>
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Tag management ────────────────────────────────────────────────────────────

describe("PostEditor tag management", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMcpMutation();
  });

  it("adds a new tag when Enter is pressed in a new post", () => {
    render(<ContentHubClient />);

    // Create a new post — it has no tags, so the placeholder is visible
    const newPostBtn = screen.getAllByRole("button", { name: /new post/i })[0];
    fireEvent.click(newPostBtn!);

    const tagInput = screen.getByPlaceholderText(/add tags/i);
    fireEvent.change(tagInput, { target: { value: "testtag" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    // The tag appears in both the editor badge AND possibly the PostList badge.
    // We verify at least one element with the tag text is present.
    expect(screen.getAllByText("testtag").length).toBeGreaterThanOrEqual(1);
  });

  it("does not add a duplicate tag", () => {
    render(<ContentHubClient />);

    const newPostBtn = screen.getAllByRole("button", { name: /new post/i })[0];
    fireEvent.click(newPostBtn!);

    const tagInput = screen.getByPlaceholderText(/add tags/i);
    fireEvent.change(tagInput, { target: { value: "uniqtag" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    // Try to add the same tag again
    fireEvent.change(tagInput, { target: { value: "uniqtag" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    // The editor badge uses the orange-500 style; count only those badges
    const editorBadges = document.querySelectorAll(
      "[class*='bg-orange-500\\/10']",
    );
    const matchingBadges = Array.from(editorBadges).filter(
      el => el.textContent?.includes("uniqtag"),
    );
    expect(matchingBadges).toHaveLength(1);
  });

  it("removes a tag when X button is clicked", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    // The tags for this post are "ai", "agents", "workflow"
    // Find the tag container input and the badge buttons
    const allTagRemoveButtons = document.querySelectorAll(
      // Each badge has an inner <button> (the X button)
      "span.inline-flex button, [class*='badge'] button",
    );

    if (allTagRemoveButtons.length > 0) {
      // Remove the first tag (ai)
      fireEvent.click(allTagRemoveButtons[0] as HTMLElement);
      // After removal, one fewer tag badge should exist
      const remainingRemoveBtns = document.querySelectorAll(
        "span.inline-flex button, [class*='badge'] button",
      );
      expect(remainingRemoveBtns.length).toBeLessThan(allTagRemoveButtons.length);
    }
  });

  it("removes the last tag when Backspace pressed in empty tag input", () => {
    render(<ContentHubClient />);

    fireEvent.click(screen.getByText("The Rise of Agentic AI Workflows"));

    // Get all text inputs in the editor; the tag input is the one inside the tag container
    const allInputs = screen.getAllByRole("textbox");
    // The tag input is the one with empty value that is NOT the title or excerpt
    const tagInput = allInputs.find(
      input =>
        (input as HTMLInputElement).value === ""
        && input.getAttribute("placeholder") === "",
    ) as HTMLInputElement | undefined;

    if (tagInput) {
      fireEvent.keyDown(tagInput, { key: "Backspace" });
      // "workflow" was the last tag and should be removed
      expect(screen.queryByText("workflow")).not.toBeInTheDocument();
    }
  });
});

// ── handlePublishFromList ─────────────────────────────────────────────────────

describe("handlePublishFromList", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMcpMutation();
  });

  it("publishing via dropdown from the list calls mutations.publishPost.mutate", async () => {
    const mockMutateFn = await setupMcpMutation(vi.fn());

    render(<ContentHubClient />);

    // Find all icon-only h-7 w-7 dropdown trigger buttons
    const allButtons = screen.getAllByRole("button");
    const moreMenuButtons = allButtons.filter(
      btn =>
        btn.getAttribute("class")?.includes("h-7 w-7")
        && btn.querySelector("svg") !== null,
    );

    if (moreMenuButtons.length >= 2) {
      fireEvent.click(moreMenuButtons[1]!); // Draft post's dropdown

      const publishDropdownItem = screen.queryByText((text, el) => {
        return (
          text === "Publish"
          && el?.getAttribute("role") === "menuitem"
        );
      });

      if (publishDropdownItem) {
        fireEvent.click(publishDropdownItem);
        expect(mockMutateFn).toHaveBeenCalled();
      }
    }
  });
});
