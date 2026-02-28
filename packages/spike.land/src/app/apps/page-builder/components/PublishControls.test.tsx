import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublishControls } from "./PublishControls";

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    asChild: _asChild,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    asChild?: boolean;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode; }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode; }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode; }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode; }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    type,
    placeholder,
    min,
    ...props
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    min?: string;
    [key: string]: unknown;
  }) => (
    <input
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      min={min}
      {...props}
    />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children }: { children: React.ReactNode; }) => <label>{children}</label>,
}));

describe("PublishControls", () => {
  describe("save status indicator", () => {
    it("shows Saving... when isSaving is true", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={true}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("shows Saved text when lastSavedAt is provided and not saving", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt="just now"
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Saved just now")).toBeInTheDocument();
    });

    it("shows Unsaved changes when lastSavedAt is null and not saving", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    });
  });

  describe("save button", () => {
    it("renders Save button", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("calls onSave when Save is clicked", async () => {
      const onSave = vi.fn();
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={onSave}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByText("Save"));
      expect(onSave).toHaveBeenCalledOnce();
    });

    it("disables Save button when isSaving is true", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={true}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Save").closest("button")).toBeDisabled();
    });
  });

  describe("draft status", () => {
    it("renders Publish button for draft pages", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Publish")).toBeInTheDocument();
    });

    it("calls onPublish when Publish button is clicked", async () => {
      const onPublish = vi.fn();
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={onPublish}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByText("Publish"));
      expect(onPublish).toHaveBeenCalledOnce();
    });

    it("shows Publishing... text when isPublishing is true", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={true}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Publishing...")).toBeInTheDocument();
    });

    it("disables Publish button when isPublishing is true", () => {
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={true}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Publishing...").closest("button")).toBeDisabled();
    });
  });

  describe("published status", () => {
    it("shows live indicator with slug", () => {
      render(
        <PublishControls
          status="published"
          isSaving={false}
          isPublishing={false}
          lastSavedAt="2 min ago"
          slug="my-page"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Live at /my-page")).toBeInTheDocument();
    });

    it("renders Unpublish button for published pages", () => {
      render(
        <PublishControls
          status="published"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.getByText("Unpublish")).toBeInTheDocument();
    });

    it("calls onUnpublish when Unpublish is clicked", async () => {
      const onUnpublish = vi.fn();
      render(
        <PublishControls
          status="published"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={onUnpublish}
        />,
      );
      await userEvent.click(screen.getByText("Unpublish"));
      expect(onUnpublish).toHaveBeenCalledOnce();
    });

    it("does not render Publish button when published", () => {
      render(
        <PublishControls
          status="published"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    });
  });

  describe("schedule dialog", () => {
    it("opens schedule dialog when chevron button is clicked", async () => {
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={vi.fn()}
          onUnpublish={vi.fn()}
        />,
      );
      const chevronButton = screen.getByTitle("Schedule publish");
      await userEvent.click(chevronButton);
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
      expect(screen.getByText("Schedule Publish")).toBeInTheDocument();
    });

    it("calls onSchedule with ISO string when scheduled", async () => {
      const onSchedule = vi.fn();
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={onSchedule}
          onUnpublish={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByTitle("Schedule publish"));

      // Fill in date
      const dateInput = screen.getByDisplayValue("");
      await userEvent.type(dateInput, "2026-03-01");

      await userEvent.click(screen.getByText("Schedule"));
      expect(onSchedule).toHaveBeenCalledWith("2026-03-01T09:00:00");
    });

    it("does not call onSchedule when date is empty", async () => {
      const onSchedule = vi.fn();
      render(
        <PublishControls
          status="draft"
          isSaving={false}
          isPublishing={false}
          lastSavedAt={null}
          slug="test"
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onSchedule={onSchedule}
          onUnpublish={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByTitle("Schedule publish"));
      // Schedule button should be disabled when no date
      const scheduleBtn = screen.getByText("Schedule").closest("button");
      expect(scheduleBtn).toBeDisabled();
      expect(onSchedule).not.toHaveBeenCalled();
    });
  });
});
