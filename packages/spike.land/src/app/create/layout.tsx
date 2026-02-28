import { SelectionErrorGuard } from "@/components/create/selection-error-guard";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <SelectionErrorGuard />
      <main className="flex-1">{children}</main>
    </div>
  );
}
