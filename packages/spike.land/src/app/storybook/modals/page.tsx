"use client";

import { EnhancementSettings } from "@/components/enhance/EnhancementSettings";
import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  Section,
  UsageGuide,
} from "@/components/storybook";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  Cloud,
  CreditCard,
  Download,
  Image,
  Layers,
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  Share,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Enhancement Settings Demo
// ---------------------------------------------------------------------------

function EnhancementSettingsDemo() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEnhance = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    toast.success("Enhancement completed!");
  };

  return (
    <EnhancementSettings
      onEnhance={handleEnhance}
      currentBalance={15}
      isProcessing={isProcessing}
      completedVersions={[]}
      imageUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
      imageName="mountain_view.jpg"
      trigger={<Button>Open Enhancement Settings</Button>}
    />
  );
}

// ---------------------------------------------------------------------------
// Simple Dialog Demo
// ---------------------------------------------------------------------------

function SimpleDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to spike.land</DialogTitle>
          <DialogDescription>
            This is a standard dialog component. Use it to present focused content or confirm user
            intent without navigating away from the current context.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          Dialogs trap focus and prevent interaction with background content until dismissed. They
          support keyboard navigation and screen readers out of the box.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Form Dialog Demo
// ---------------------------------------------------------------------------

function FormDialogDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Zoltan Erdos");
  const [username, setUsername] = useState("@zerdos");

  const handleSubmit = () => {
    toast.success("Profile updated successfully!");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="form-name" className="text-right">
              Name
            </Label>
            <Input
              id="form-name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="form-username" className="text-right">
              Username
            </Label>
            <Input
              id="form-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Alert Dialog Demo
// ---------------------------------------------------------------------------

function AlertDialogDemo() {
  const handleDelete = () => {
    toast.error("Account deleted. (Demo only)");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove all
            your data from our servers including images, tokens, and subscription history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Sheet Demo
// ---------------------------------------------------------------------------

function SheetDemo(
  { side, label }: { side: "right" | "left" | "bottom"; label: string; },
) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">{label}</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your account settings and preferences.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Email and push alerts
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-enhance</Label>
              <p className="text-xs text-muted-foreground">Enhance on upload</p>
            </div>
            <Switch />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Dropdown Demo
// ---------------------------------------------------------------------------

function DropdownDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          My Account
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>&#x21E7;&#x2318;P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut>&#x2318;,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <DropdownMenuShortcut>&#x2318;B</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>&#x21E7;&#x2318;Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Nested Popover Demo
// ---------------------------------------------------------------------------

function NestedPopoverDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">mountain_view.jpg</CardTitle>
          <CardDescription className="text-xs">
            Enhanced &middot; 4x upscale &middot; 2.1 MB
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Image className="mr-2 h-4 w-4" />
              <span>View original</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Cloud className="mr-2 h-4 w-4" />
              <span>Save to cloud</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="h-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
          Image preview
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Nested Dialog Demo
// ---------------------------------------------------------------------------

function NestedDialogDemo() {
  const [outerOpen, setOuterOpen] = useState(false);
  const [innerOpen, setInnerOpen] = useState(false);

  return (
    <Dialog open={outerOpen} onOpenChange={setOuterOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Layers className="mr-2 h-4 w-4" />
          Open Nested Dialog
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Manage your project configuration. Some actions open a confirmation dialog on top.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Project Name</p>
              <p className="text-xs text-muted-foreground">spike.land</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-destructive">
                Danger Zone
              </p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this project
              </p>
            </div>
            <Dialog open={innerOpen} onOpenChange={setInnerOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    This nested dialog confirms a destructive action from within the parent dialog.
                    Type the project name to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input placeholder="Type project name to confirm..." />
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setInnerOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setInnerOpen(false);
                      setOuterOpen(false);
                      toast.error("Project deleted. (Demo only)");
                    }}
                  >
                    Confirm Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOuterOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Command Palette Demo
// ---------------------------------------------------------------------------

const commandItems = [
  {
    icon: <Search className="h-4 w-4" />,
    label: "Search files...",
    shortcut: "Ctrl+P",
  },
  {
    icon: <Settings className="h-4 w-4" />,
    label: "Open settings",
    shortcut: "Ctrl+,",
  },
  {
    icon: <User className="h-4 w-4" />,
    label: "Switch account",
    shortcut: "Ctrl+Shift+A",
  },
  {
    icon: <Download className="h-4 w-4" />,
    label: "Export project",
    shortcut: "Ctrl+Shift+E",
  },
  {
    icon: <Share className="h-4 w-4" />,
    label: "Share workspace",
    shortcut: "",
  },
  {
    icon: <Trash2 className="h-4 w-4" />,
    label: "Delete workspace",
    shortcut: "",
  },
];

function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = commandItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        toast.success(`Executed: ${filtered[selectedIndex].label}`);
        setOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    },
    [filtered, selectedIndex],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        setOpen(v);
        if (!v) {
          setQuery("");
          setSelectedIndex(0);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Command Palette
          <span className="ml-2 text-xs text-muted-foreground font-mono border border-border rounded px-1.5 py-0.5">
            Ctrl+K
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Type a command..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0
            ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No results found.
              </p>
            )
            : (
              <div role="listbox" aria-label="Commands">
                {filtered.map((item, i) => (
                  <button
                    key={item.label}
                    role="option"
                    aria-selected={i === selectedIndex}
                    type="button"
                    className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      i === selectedIndex
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      toast.success(`Executed: ${item.label}`);
                      setOpen(false);
                      setQuery("");
                      setSelectedIndex(0);
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-xs text-muted-foreground/60 font-mono">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Focus Trap Demo
// ---------------------------------------------------------------------------

function FocusTrapDemo() {
  const [trapped, setTrapped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusLog, setFocusLog] = useState<string[]>([]);

  useEffect(() => {
    if (!trapped || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      "button, input, [tabindex]:not([tabindex=\"-1\"])",
    );

    if (focusableElements.length === 0) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    firstEl?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTrapped(false);
        return;
      }
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }

    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement;
      const label = target.getAttribute("data-label")
        ?? target.tagName.toLowerCase();
      setFocusLog(prev => [...prev.slice(-4), label]);
    }

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("focusin", handleFocusIn);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("focusin", handleFocusIn);
    };
  }, [trapped]);

  return (
    <div className="space-y-4 w-full max-w-lg">
      {!trapped
        ? (
          <Button
            onClick={() => {
              setTrapped(true);
              setFocusLog([]);
            }}
          >
            Activate Focus Trap
          </Button>
        )
        : (
          <div
            ref={containerRef}
            className="p-6 rounded-xl border-2 border-primary bg-primary/5 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-label="Focus trap demo region"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-primary">
                Focus is trapped in this region
              </p>
              <span className="text-xs text-muted-foreground font-mono">
                Press Esc to exit
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" data-label="Button A">
                Button A
              </Button>
              <Input
                placeholder="Input field"
                className="w-32"
                data-label="Input"
              />
              <Button variant="outline" size="sm" data-label="Button B">
                Button B
              </Button>
              <Button
                variant="secondary"
                size="sm"
                data-label="Button C"
              >
                Button C
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Focus log:</span>
              <div className="flex gap-1 flex-wrap">
                {focusLog.map((entry, i) => (
                  <span
                    key={`${entry}-${i}`}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                  >
                    {entry}
                  </span>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTrapped(false)}
              data-label="Release"
            >
              Release Focus Trap
            </Button>
          </div>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ModalsPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Modals & Overlays"
        description="Dialog, alert dialog, sheet, and dropdown menu components for layered interactions. These overlays keep users in context while presenting focused tasks or additional options."
        usage="Use dialogs for focused tasks, alert dialogs for irreversible confirmations, sheets for panels, and dropdowns for contextual menus."
      />

      <UsageGuide
        dos={[
          "Use Dialog for forms, content previews, and focused tasks.",
          "Use AlertDialog exclusively for destructive or irreversible actions.",
          "Always provide a clear way to dismiss overlays (Escape key, close button).",
          "Keep modal content minimal -- offload complex flows to dedicated pages.",
        ]}
        donts={[
          "Don't stack multiple dialogs on top of each other.",
          "Avoid using modals for success/error states -- use toast notifications instead.",
          "Don't put too much content in a sheet; consider a dedicated page instead.",
          "Never disable the ability to close a dialog unless absolutely necessary.",
        ]}
      />

      {/* Interactive Dialog Demos */}
      <Section
        title="Dialog"
        description="Standard modal dialogs for forms and content"
      >
        <ComponentSample
          title="Simple Dialog"
          description="A basic dialog with title, description, and close action. Traps focus and closes on Escape."
        >
          <SimpleDialogDemo />
        </ComponentSample>

        <ComponentSample
          title="Form Dialog"
          description="Dialog containing an input form with controlled state, submit, and cancel actions."
        >
          <FormDialogDemo />
        </ComponentSample>

        <ComponentSample
          title="Share Dialog"
          description="Dialog with contextual action list for sharing content."
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Share className="mr-2 h-4 w-4" />
                Share Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share your enhanced image</DialogTitle>
                <DialogDescription>
                  Choose how you&apos;d like to share your enhanced photo.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-4">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => toast.success("Link copied!")}
                >
                  <Share className="h-4 w-4" />
                  Copy link
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => toast.success("Downloading...")}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => toast.success("Saved to cloud!")}
                >
                  <Cloud className="h-4 w-4" />
                  Save to cloud
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </ComponentSample>
      </Section>

      {/* Nested Dialog */}
      <Section
        title="Nested Dialog"
        description="Layered dialogs for multi-step confirmation flows"
      >
        <ComponentSample
          title="Dialog within Dialog"
          description="A parent settings dialog that spawns a destructive confirmation dialog on top. Demonstrates proper focus management across nested layers."
        >
          <NestedDialogDemo />
        </ComponentSample>
      </Section>

      {/* Command Palette */}
      <Section
        title="Command Palette"
        description="Searchable command menu pattern built on Dialog"
      >
        <ComponentSample
          title="Command Palette"
          description="A keyboard-driven command palette with live search filtering, arrow-key navigation, and Enter to execute. Follows the Ctrl+K pattern common in developer tools."
        >
          <CommandPaletteDemo />
        </ComponentSample>
      </Section>

      {/* Focus Trap Demo */}
      <Section
        title="Focus Trap"
        description="Interactive demonstration of modal focus containment"
      >
        <ComponentSample
          title="Focus Trap Playground"
          description="Activates a focus trap region. Tab and Shift+Tab cycle only within the trapped elements. Press Escape to release. A live log shows which element has focus."
        >
          <FocusTrapDemo />
        </ComponentSample>
      </Section>

      {/* Alert Dialog */}
      <Section
        title="Alert Dialog"
        description="Destructive confirmation dialogs that require explicit user intent"
      >
        <ComponentSample
          title="Destructive Confirmation"
          description="Blocks user action until they explicitly confirm or cancel. Always use for irreversible operations."
        >
          <AlertDialogDemo />
        </ComponentSample>

        <ComponentSample
          title="Image Delete Confirmation"
          description="Contextual variant for confirming deletion of a specific resource."
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Image
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>mountain_view.jpg</strong>{" "}
                  and all its enhanced versions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => toast.error("Image deleted. (Demo only)")}
                >
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentSample>
      </Section>

      {/* Sheet / Drawer Demos */}
      <Section
        title="Sheet"
        description="Slide-out panels from any edge of the screen for navigation or settings"
      >
        <ComponentSample
          title="Sheet Directions"
          description="Sheets can slide in from right (default), left, or bottom depending on context and device."
        >
          <div className="flex flex-wrap gap-4">
            <SheetDemo side="right" label="Sheet from Right" />
            <SheetDemo side="left" label="Sheet from Left" />
            <SheetDemo side="bottom" label="Sheet from Bottom" />
          </div>
        </ComponentSample>
      </Section>

      {/* Dropdown Menu */}
      <Section
        title="Dropdown Menu"
        description="Contextual menus with grouped items, shortcuts, and destructive actions"
      >
        <ComponentSample
          title="Account Menu"
          description="Full-featured dropdown with groups, keyboard shortcuts, and a destructive log-out option."
        >
          <DropdownDemo />
        </ComponentSample>

        <ComponentSample
          title="Nested Popover (Card with More Options)"
          description="A card component with an inline dropdown trigger for contextual actions."
        >
          <NestedPopoverDemo />
        </ComponentSample>
      </Section>

      {/* Enhancement Settings Dialog */}
      <Section
        title="Compound Dialog"
        description="Complex dialog with card-based tier selection"
      >
        <ComponentSample
          title="Enhancement Settings Dialog"
          description="Modal dialog with multi-step card selection UI for image enhancement tiers."
        >
          <EnhancementSettingsDemo />
        </ComponentSample>
      </Section>

      {/* Code Preview */}
      <CodePreview
        title="Dialog Usage"
        tabs={[
          {
            label: "Basic Dialog",
            code: `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            Brief description of the dialog purpose.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Dialog body content */}
        </div>
        <DialogFooter>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`,
          },
          {
            label: "Alert Dialog",
            code: `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteConfirmation() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}`,
          },
          {
            label: "Sheet",
            code: `import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function SettingsSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Settings</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your preferences.
          </SheetDescription>
        </SheetHeader>
        {/* Sheet body content */}
      </SheetContent>
    </Sheet>
  );
}`,
          },
        ]}
        code=""
      />

      <AccessibilityPanel
        notes={[
          "All dialogs trap focus within the modal boundary until dismissed.",
          "Pressing Escape always closes overlays unless explicitly prevented.",
          "AlertDialog requires explicit confirmation -- never closes on outside click.",
          "Sheet and Dialog use aria-modal and role='dialog' for screen readers.",
          "DropdownMenu items are navigable with arrow keys and selectable with Enter/Space.",
          "All trigger buttons have visible focus rings for keyboard users.",
          "Close buttons include aria-label for icon-only buttons.",
          "Focus returns to the triggering element when an overlay closes.",
          "Nested dialogs maintain a proper focus stack -- closing inner returns focus to outer.",
          "Command palette supports full keyboard navigation without a mouse.",
        ]}
      />

      <RelatedComponents currentId="modals" />
    </div>
  );
}
