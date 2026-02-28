"use client";

import { useState } from "react";
import { FolderOpen, Music, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectSelectorProps {
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  isCreating: boolean;
  isDeleting: boolean;
  projectsData: string | undefined;
  isLoading: boolean;
}

interface ParsedProject {
  id: string;
  name: string;
  trackCount: string;
}

function parseProjects(raw: string | undefined): ParsedProject[] {
  if (!raw || raw.includes("No projects found")) return [];
  const lines = raw.split("\n").filter(l => l.startsWith("- **"));
  return lines.map(line => {
    const nameMatch = line.match(/\*\*(.+?)\*\* \((.+?)\)/);
    const trackMatch = line.match(/(\d+) track/);
    return {
      id: nameMatch?.[2] ?? "",
      name: nameMatch?.[1] ?? "Untitled",
      trackCount: trackMatch?.[1] ?? "0",
    };
  }).filter(p => p.id);
}

export function ProjectSelector({
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  isCreating,
  isDeleting,
  projectsData,
  isLoading,
}: ProjectSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newName, setNewName] = useState("");

  const projects = parseProjects(projectsData);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateProject(newName.trim());
    setNewName("");
    setShowCreate(false);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Project
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={activeProjectId ?? ""}
            onValueChange={onSelectProject}
          >
            <SelectTrigger
              className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
              id="project-selector"
            >
              <SelectValue
                placeholder={isLoading ? "Loading…" : "Select Project"}
              />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900 text-white">
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <Music className="h-3 w-3 text-emerald-400" />
                    <span>{p.name}</span>
                    <span className="text-xs text-zinc-500">
                      ({p.trackCount} tracks)
                    </span>
                  </div>
                </SelectItem>
              ))}
              {projects.length === 0 && !isLoading && (
                <div className="px-3 py-2 text-sm text-zinc-500">
                  No projects yet
                </div>
              )}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="border-white/10 bg-white/5 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 shrink-0"
                onClick={() => setShowCreate(true)}
                id="create-project-btn"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Project</TooltipContent>
          </Tooltip>

          {activeProjectId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="border-white/10 bg-white/5 text-red-400 hover:bg-red-500/20 hover:text-red-300 shrink-0"
                  onClick={() => setShowDelete(true)}
                  disabled={isDeleting}
                  id="delete-project-btn"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Project</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="border-white/10 bg-zinc-900 text-white">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Give your audio project a name to get started.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="My Awesome Mix"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              className="border-white/10 bg-white/5 text-white"
              id="project-name-input"
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                id="confirm-create-project"
              >
                {isCreating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDelete} onOpenChange={setShowDelete}>
          <DialogContent className="border-white/10 bg-zinc-900 text-white">
            <DialogHeader>
              <DialogTitle>Delete Project?</DialogTitle>
              <DialogDescription className="text-zinc-400">
                This will permanently delete the project and all its tracks. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (activeProjectId) {
                    await onDeleteProject(activeProjectId);
                    setShowDelete(false);
                  }
                }}
                disabled={isDeleting}
                id="confirm-delete-project"
              >
                {isDeleting ? "Deleting…" : "Delete Forever"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
