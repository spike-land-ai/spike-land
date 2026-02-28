import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageList } from "./PageList";
import type { Page } from "./PageList";

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode; }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode; }) => <div>{children}</div>,
  DropdownMenuTrigger: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <button role="menuitem" onClick={onClick}>
      {children}
    </button>
  ),
}));

const MOCK_PAGES: Page[] = [
  {
    id: "page-1",
    title: "Home",
    slug: "home",
    status: "published",
    updatedAt: "2 hours ago",
  },
  {
    id: "page-2",
    title: "About Us",
    slug: "about",
    status: "draft",
    updatedAt: "Yesterday",
  },
  {
    id: "page-3",
    title: "Blog",
    slug: "blog",
    status: "scheduled",
    updatedAt: "3 days ago",
  },
];

describe("PageList", () => {
  describe("empty state", () => {
    it("renders empty state when pages is empty", () => {
      render(
        <PageList
          pages={[]}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      expect(screen.getByText("No pages yet")).toBeInTheDocument();
      expect(screen.getByText("Create your first page")).toBeInTheDocument();
    });

    it("renders a New Page button in empty state", () => {
      render(
        <PageList
          pages={[]}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      expect(screen.getByText("New Page")).toBeInTheDocument();
    });

    it("calls onCreatePage when New Page button is clicked in empty state", async () => {
      const onCreatePage = vi.fn();
      render(
        <PageList
          pages={[]}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={onCreatePage}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByText("New Page"));
      expect(onCreatePage).toHaveBeenCalledOnce();
    });
  });

  describe("page list", () => {
    it("renders all page titles", () => {
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("About Us")).toBeInTheDocument();
      expect(screen.getByText("Blog")).toBeInTheDocument();
    });

    it("renders page slugs", () => {
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      expect(screen.getByText("/home")).toBeInTheDocument();
      expect(screen.getByText("/about")).toBeInTheDocument();
    });

    it("renders status badges", () => {
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      expect(screen.getByText("Live")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Scheduled")).toBeInTheDocument();
    });

    it("calls onSelectPage with page id when page row is clicked", async () => {
      const onSelectPage = vi.fn();
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={onSelectPage}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByText("About Us"));
      expect(onSelectPage).toHaveBeenCalledWith("page-2");
    });

    it("calls onCreatePage when plus icon button is clicked in header", async () => {
      const onCreatePage = vi.fn();
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={onCreatePage}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      // The header plus button has title "Create new page"
      await userEvent.click(screen.getByTitle("Create new page"));
      expect(onCreatePage).toHaveBeenCalledOnce();
    });

    it("renders Pages section heading", () => {
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      expect(screen.getByText("Pages")).toBeInTheDocument();
    });
  });

  describe("selected state", () => {
    it("applies selected styles to the active page", () => {
      const { container } = render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId="page-1"
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={vi.fn()}
        />,
      );
      // Selected page button should have purple bg class
      const buttons = container.querySelectorAll("button[class*='bg-purple']");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("page actions via dropdown", () => {
    it("calls onDuplicatePage when Duplicate menu item is clicked", async () => {
      const onDuplicatePage = vi.fn();
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onDuplicatePage={onDuplicatePage}
        />,
      );
      const duplicateItems = screen.getAllByText("Duplicate");
      await userEvent.click(duplicateItems[0]!);
      expect(onDuplicatePage).toHaveBeenCalledWith("page-1");
    });

    it("calls onDeletePage when Delete menu item is clicked", async () => {
      const onDeletePage = vi.fn();
      render(
        <PageList
          pages={MOCK_PAGES}
          selectedPageId={null}
          onSelectPage={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={onDeletePage}
          onDuplicatePage={vi.fn()}
        />,
      );
      const deleteItems = screen.getAllByText("Delete");
      await userEvent.click(deleteItems[0]!);
      expect(onDeletePage).toHaveBeenCalledWith("page-1");
    });
  });
});
