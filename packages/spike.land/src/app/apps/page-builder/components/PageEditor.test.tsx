import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageEditor } from "./PageEditor";
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
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    ...props
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    [key: string]: unknown;
  }) => <input value={value} onChange={onChange} placeholder={placeholder} {...props} />,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
    ...props
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    [key: string]: unknown;
  }) => <textarea value={value} onChange={onChange} placeholder={placeholder} {...props} />,
}));

const DEFAULT_PROPS = {
  blocks: [] as PageBlock[],
  pageTitle: "My Page",
  isGenerating: false,
  onUpdatePageTitle: vi.fn(),
  onMoveBlock: vi.fn(),
  onDeleteBlock: vi.fn(),
  onUpdateBlockContent: vi.fn(),
  onAiGenerate: vi.fn(),
};

describe("PageEditor", () => {
  describe("page title input", () => {
    it("renders page title input with current value", () => {
      render(<PageEditor {...DEFAULT_PROPS} />);
      expect(screen.getByPlaceholderText("Untitled Page")).toHaveValue("My Page");
    });

    it("calls onUpdatePageTitle when title changes", async () => {
      const onUpdatePageTitle = vi.fn();
      render(<PageEditor {...DEFAULT_PROPS} onUpdatePageTitle={onUpdatePageTitle} />);
      const titleInput = screen.getByPlaceholderText("Untitled Page");
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "New Title");
      expect(onUpdatePageTitle).toHaveBeenCalled();
    });
  });

  describe("empty canvas state", () => {
    it("renders Empty Canvas heading when no blocks", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={[]} />);
      expect(screen.getByText("Empty Canvas")).toBeInTheDocument();
    });

    it("renders AI generate button in empty state", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={[]} />);
      expect(screen.getByText("Generate with AI")).toBeInTheDocument();
    });

    it("calls onAiGenerate when Generate with AI is clicked", async () => {
      const onAiGenerate = vi.fn();
      render(<PageEditor {...DEFAULT_PROPS} blocks={[]} onAiGenerate={onAiGenerate} />);
      await userEvent.click(screen.getByText("Generate with AI"));
      expect(onAiGenerate).toHaveBeenCalledOnce();
    });

    it("shows Generating... when isGenerating is true in empty state", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={[]} isGenerating={true} />);
      expect(screen.getByText("Generating...")).toBeInTheDocument();
    });

    it("disables generate button when isGenerating is true", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={[]} isGenerating={true} />);
      expect(screen.getByText("Generating...").closest("button")).toBeDisabled();
    });
  });

  describe("with blocks", () => {
    const blocks: PageBlock[] = [
      { id: "b1", type: "heading", content: { text: "Hello World" }, order: 0 },
      {
        id: "b2",
        type: "paragraph",
        content: { text: "Some paragraph" },
        order: 1,
      },
    ];

    it("renders heading block content", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} />);
      expect(screen.getByPlaceholderText("Enter heading...")).toHaveValue("Hello World");
    });

    it("renders paragraph block content", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} />);
      expect(screen.getByPlaceholderText("Enter paragraph text...")).toHaveValue(
        "Some paragraph",
      );
    });

    it("calls onUpdateBlockContent when heading text changes", async () => {
      const onUpdateBlockContent = vi.fn();
      render(
        <PageEditor
          {...DEFAULT_PROPS}
          blocks={blocks}
          onUpdateBlockContent={onUpdateBlockContent}
        />,
      );
      const headingInput = screen.getByPlaceholderText("Enter heading...");
      await userEvent.clear(headingInput);
      await userEvent.type(headingInput, "Updated Heading");
      expect(onUpdateBlockContent).toHaveBeenCalledWith("b1", "text", expect.any(String));
    });

    it("renders Add more with AI button when blocks exist", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} />);
      expect(screen.getByText("Add more with AI")).toBeInTheDocument();
    });

    it("calls onAiGenerate when Add more with AI is clicked", async () => {
      const onAiGenerate = vi.fn();
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} onAiGenerate={onAiGenerate} />);
      await userEvent.click(screen.getByText("Add more with AI"));
      expect(onAiGenerate).toHaveBeenCalledOnce();
    });

    it("shows Generating blocks... when isGenerating with blocks", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} isGenerating={true} />);
      expect(screen.getByText("Generating blocks...")).toBeInTheDocument();
    });
  });

  describe("block controls", () => {
    const blocks: PageBlock[] = [
      { id: "b1", type: "heading", content: { text: "Block 1" }, order: 0 },
      { id: "b2", type: "paragraph", content: { text: "Block 2" }, order: 1 },
    ];

    it("renders move up buttons for each block", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} />);
      const moveUpButtons = screen.getAllByTitle("Move up");
      expect(moveUpButtons).toHaveLength(2);
    });

    it("disables move up for first block", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} />);
      const moveUpButtons = screen.getAllByTitle("Move up");
      expect(moveUpButtons[0]).toBeDisabled();
    });

    it("disables move down for last block", () => {
      render(<PageEditor {...DEFAULT_PROPS} blocks={blocks} />);
      const moveDownButtons = screen.getAllByTitle("Move down");
      expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
    });

    it("calls onMoveBlock with up direction", async () => {
      const onMoveBlock = vi.fn();
      render(
        <PageEditor {...DEFAULT_PROPS} blocks={blocks} onMoveBlock={onMoveBlock} />,
      );
      const moveUpButtons = screen.getAllByTitle("Move up");
      // Second block's move up is enabled
      await userEvent.click(moveUpButtons[1]!);
      expect(onMoveBlock).toHaveBeenCalledWith("b2", "up");
    });

    it("calls onMoveBlock with down direction", async () => {
      const onMoveBlock = vi.fn();
      render(
        <PageEditor {...DEFAULT_PROPS} blocks={blocks} onMoveBlock={onMoveBlock} />,
      );
      const moveDownButtons = screen.getAllByTitle("Move down");
      // First block's move down is enabled
      await userEvent.click(moveDownButtons[0]!);
      expect(onMoveBlock).toHaveBeenCalledWith("b1", "down");
    });

    it("calls onDeleteBlock when delete button is clicked", async () => {
      const onDeleteBlock = vi.fn();
      render(
        <PageEditor {...DEFAULT_PROPS} blocks={blocks} onDeleteBlock={onDeleteBlock} />,
      );
      const deleteButtons = screen.getAllByTitle("Delete block");
      await userEvent.click(deleteButtons[0]!);
      expect(onDeleteBlock).toHaveBeenCalledWith("b1");
    });
  });

  describe("block types", () => {
    it("renders divider block as hr", () => {
      const dividerBlock: PageBlock = {
        id: "bd",
        type: "divider",
        content: {},
        order: 0,
      };
      const { container } = render(
        <PageEditor {...DEFAULT_PROPS} blocks={[dividerBlock]} />,
      );
      expect(container.querySelector("hr")).toBeInTheDocument();
    });

    it("renders quote block with text and attribution inputs", () => {
      const quoteBlock: PageBlock = {
        id: "bq",
        type: "quote",
        content: { text: "A great quote", attribution: "Someone" },
        order: 0,
      };
      render(<PageEditor {...DEFAULT_PROPS} blocks={[quoteBlock]} />);
      expect(screen.getByPlaceholderText("Quote text...")).toHaveValue("A great quote");
      expect(screen.getByPlaceholderText("— Attribution")).toHaveValue("Someone");
    });

    it("calls onUpdateBlockContent for quote attribution change", async () => {
      const onUpdateBlockContent = vi.fn();
      const quoteBlock: PageBlock = {
        id: "bq",
        type: "quote",
        content: { text: "Quote", attribution: "Someone" },
        order: 0,
      };
      render(
        <PageEditor
          {...DEFAULT_PROPS}
          blocks={[quoteBlock]}
          onUpdateBlockContent={onUpdateBlockContent}
        />,
      );
      const attrInput = screen.getByPlaceholderText("— Attribution");
      await userEvent.clear(attrInput);
      await userEvent.type(attrInput, "New Author");
      expect(onUpdateBlockContent).toHaveBeenCalledWith(
        "bq",
        "attribution",
        expect.any(String),
      );
    });

    it("renders image block with src input", () => {
      const imageBlock: PageBlock = {
        id: "bi",
        type: "image",
        content: {},
        order: 0,
      };
      render(<PageEditor {...DEFAULT_PROPS} blocks={[imageBlock]} />);
      expect(screen.getByPlaceholderText("Image URL...")).toBeInTheDocument();
    });

    it("renders fallback for section-type blocks", () => {
      const heroBlock: PageBlock = {
        id: "bh",
        type: "hero",
        content: {},
        order: 0,
      };
      render(<PageEditor {...DEFAULT_PROPS} blocks={[heroBlock]} />);
      expect(screen.getByText("hero Block")).toBeInTheDocument();
    });

    it("renders blocks sorted by order", () => {
      const reversedBlocks: PageBlock[] = [
        { id: "b2", type: "paragraph", content: { text: "Second" }, order: 1 },
        { id: "b1", type: "heading", content: { text: "First" }, order: 0 },
      ];
      render(<PageEditor {...DEFAULT_PROPS} blocks={reversedBlocks} />);
      const headingInput = screen.getByPlaceholderText("Enter heading...");
      const paraInput = screen.getByPlaceholderText("Enter paragraph text...");
      // Heading (order 0) should appear before paragraph (order 1)
      expect(
        headingInput.compareDocumentPosition(paraInput) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });
});
