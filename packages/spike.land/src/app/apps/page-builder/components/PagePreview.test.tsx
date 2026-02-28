import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PagePreview } from "./PagePreview";
import type { PageBlock } from "./PageEditor";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    [key: string]: unknown;
  }) => React.createElement("img", { src, alt, ...props }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    asChild?: boolean;
    [key: string]: unknown;
  }) => {
    if (asChild) return <>{children}</>;
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

const HEADING_BLOCK: PageBlock = {
  id: "b1",
  type: "heading",
  content: { text: "My Heading" },
  order: 0,
};

const PARAGRAPH_BLOCK: PageBlock = {
  id: "b2",
  type: "paragraph",
  content: { text: "Some paragraph text" },
  order: 1,
};

const HERO_BLOCK: PageBlock = {
  id: "b3",
  type: "hero",
  content: {},
  order: 2,
};

const DIVIDER_BLOCK: PageBlock = {
  id: "b4",
  type: "divider",
  content: {},
  order: 3,
};

const QUOTE_BLOCK: PageBlock = {
  id: "b5",
  type: "quote",
  content: { text: "Great quote", attribution: "John Doe" },
  order: 4,
};

describe("PagePreview", () => {
  describe("toolbar", () => {
    it("renders viewport toggle buttons", () => {
      render(
        <PagePreview
          pageTitle="Test Page"
          blocks={[]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByTitle("Desktop")).toBeInTheDocument();
      expect(screen.getByTitle("Tablet")).toBeInTheDocument();
      expect(screen.getByTitle("Mobile")).toBeInTheDocument();
    });

    it("renders refresh button", () => {
      render(
        <PagePreview
          pageTitle="Test Page"
          blocks={[]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByTitle("Refresh preview")).toBeInTheDocument();
    });

    it("shows live URL badge when published", () => {
      render(
        <PagePreview
          pageTitle="Test Page"
          blocks={[]}
          slug="my-page"
          isPublished={true}
        />,
      );
      expect(screen.getByText("/my-page")).toBeInTheDocument();
    });

    it("does not show live URL badge when not published", () => {
      render(
        <PagePreview
          pageTitle="Test Page"
          blocks={[]}
          slug="my-page"
          isPublished={false}
        />,
      );
      expect(screen.queryByText("/my-page")).not.toBeInTheDocument();
    });

    it("shows Open live page link when published", () => {
      const { container } = render(
        <PagePreview
          pageTitle="Test Page"
          blocks={[]}
          slug="test"
          isPublished={true}
        />,
      );
      // The Button with asChild renders its <a> child directly
      const liveLink = container.querySelector("a[href=\"/test\"]");
      expect(liveLink).not.toBeNull();
    });

    it("changes viewport when tablet button is clicked", async () => {
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[]}
          slug="test"
          isPublished={false}
        />,
      );
      await userEvent.click(screen.getByTitle("Tablet"));
      // Just confirm the click doesn't throw
    });
  });

  describe("page title rendering", () => {
    it("renders the page title", () => {
      render(
        <PagePreview
          pageTitle="My Awesome Page"
          blocks={[]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByRole("heading", { name: "My Awesome Page" })).toBeInTheDocument();
    });

    it("shows Untitled Page when title is empty", () => {
      render(
        <PagePreview
          pageTitle=""
          blocks={[]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Untitled Page")).toBeInTheDocument();
    });
  });

  describe("empty blocks state", () => {
    it("shows no content message when blocks are empty", () => {
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(
        screen.getByText("No content yet. Add blocks in the editor."),
      ).toBeInTheDocument();
    });
  });

  describe("block rendering", () => {
    it("renders heading block with text", () => {
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[HEADING_BLOCK]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByRole("heading", { name: "My Heading" })).toBeInTheDocument();
    });

    it("renders heading block with placeholder when content empty", () => {
      const emptyHeading: PageBlock = {
        id: "bx",
        type: "heading",
        content: {},
        order: 0,
      };
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[emptyHeading]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Untitled Heading")).toBeInTheDocument();
    });

    it("renders paragraph block with text", () => {
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[PARAGRAPH_BLOCK]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Some paragraph text")).toBeInTheDocument();
    });

    it("renders hero block", () => {
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[HERO_BLOCK]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Hero Section")).toBeInTheDocument();
    });

    it("renders divider block as hr", () => {
      const { container } = render(
        <PagePreview
          pageTitle="Test"
          blocks={[DIVIDER_BLOCK]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(container.querySelector("hr")).toBeInTheDocument();
    });

    it("renders quote block with text and attribution", () => {
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[QUOTE_BLOCK]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Great quote")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders features block", () => {
      const featuresBlock: PageBlock = {
        id: "bf",
        type: "features",
        content: {},
        order: 0,
      };
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[featuresBlock]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Feature One")).toBeInTheDocument();
      expect(screen.getByText("Feature Two")).toBeInTheDocument();
      expect(screen.getByText("Feature Three")).toBeInTheDocument();
    });

    it("renders testimonials block", () => {
      const testimonialsBlock: PageBlock = {
        id: "bt",
        type: "testimonials",
        content: {},
        order: 0,
      };
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[testimonialsBlock]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(
        screen.getByText("\"This product changed everything for our team.\""),
      ).toBeInTheDocument();
    });

    it("renders pricing block", () => {
      const pricingBlock: PageBlock = {
        id: "bp",
        type: "pricing",
        content: {},
        order: 0,
      };
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[pricingBlock]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Starter")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
    });

    it("renders contact block", () => {
      const contactBlock: PageBlock = {
        id: "bc",
        type: "contact",
        content: {},
        order: 0,
      };
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[contactBlock]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Contact Us")).toBeInTheDocument();
    });

    it("renders blocks in order by order field", () => {
      const unorderedBlocks: PageBlock[] = [
        { id: "b3", type: "hero", content: {}, order: 2 },
        { id: "b1", type: "heading", content: { text: "First" }, order: 0 },
        { id: "b2", type: "paragraph", content: { text: "Second" }, order: 1 },
      ];
      const { container } = render(
        <PagePreview
          pageTitle="Test"
          blocks={unorderedBlocks}
          slug="test"
          isPublished={false}
        />,
      );
      const headings = container.querySelectorAll("h1, h2");
      // Page title h1 comes first, then heading block h1
      const texts = Array.from(headings).map(h => h.textContent);
      expect(texts[0]).toBe("Test");
      expect(texts[1]).toBe("First");
    });

    it("renders fallback for unknown block type", () => {
      const unknownBlock = {
        id: "bu",
        type: "video" as const,
        content: {},
        order: 0,
      };
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[unknownBlock]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("video block")).toBeInTheDocument();
    });
  });

  describe("image block", () => {
    it("renders image placeholder when no src", () => {
      const imageBlock: PageBlock = {
        id: "bi",
        type: "image",
        content: {},
        order: 0,
      };
      render(
        <PagePreview
          pageTitle="Test"
          blocks={[imageBlock]}
          slug="test"
          isPublished={false}
        />,
      );
      expect(screen.getByText("Image placeholder")).toBeInTheDocument();
    });

    it("renders img tag when src is provided", () => {
      const imageBlock: PageBlock = {
        id: "bi",
        type: "image",
        content: { src: "https://example.com/img.png", alt: "Example" },
        order: 0,
      };
      const { container } = render(
        <PagePreview
          pageTitle="Test"
          blocks={[imageBlock]}
          slug="test"
          isPublished={false}
        />,
      );
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("https://example.com/img.png");
    });
  });
});
