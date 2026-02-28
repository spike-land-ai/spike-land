"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Globe,
  Save,
} from "lucide-react";
import type { Page } from "./PageList";

interface PublishControlsProps {
  status: Page["status"];
  isSaving: boolean;
  isPublishing: boolean;
  lastSavedAt: string | null;
  slug: string;
  onSave: () => void;
  onPublish: () => void;
  onSchedule: (publishAt: string) => void;
  onUnpublish: () => void;
}

function SaveStatusIndicator({
  isSaving,
  lastSavedAt,
}: {
  isSaving: boolean;
  lastSavedAt: string | null;
}) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }
  if (lastSavedAt) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        <span>Saved {lastSavedAt}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
      <AlertCircle className="w-3.5 h-3.5" />
      <span>Unsaved changes</span>
    </div>
  );
}

export function PublishControls({
  status,
  isSaving,
  isPublishing,
  lastSavedAt,
  slug,
  onSave,
  onPublish,
  onSchedule,
  onUnpublish,
}: PublishControlsProps) {
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleSchedule = () => {
    if (!scheduleDate) return;
    const publishAt = `${scheduleDate}T${scheduleTime}:00`;
    onSchedule(publishAt);
    setScheduleOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      <SaveStatusIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />

      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-zinc-400 hover:text-white"
        onClick={onSave}
        disabled={isSaving}
      >
        <Save className="w-4 h-4" />
        <span className="hidden sm:inline">Save</span>
      </Button>

      {status === "published"
        ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/30 border border-green-700/30 rounded-full px-2.5 py-1">
              <Globe className="w-3 h-3" />
              <span className="hidden sm:inline">Live at /{slug}</span>
              <span className="sm:hidden">Live</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500 hover:text-zinc-300"
              onClick={onUnpublish}
            >
              Unpublish
            </Button>
          </div>
        )
        : (
          <div className="flex items-center">
            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-500 text-white border-0 rounded-r-none"
              onClick={onPublish}
              disabled={isPublishing}
            >
              <Globe className="w-4 h-4" />
              <span>{isPublishing ? "Publishing..." : "Publish"}</span>
            </Button>
            <Button
              size="sm"
              className="bg-purple-700 hover:bg-purple-600 text-white border-0 rounded-l-none border-l border-purple-500 px-2"
              onClick={() => setScheduleOpen(true)}
              title="Schedule publish"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-200 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <CalendarDays className="w-4 h-4 text-purple-400" />
              Schedule Publish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Date</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Time</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScheduleOpen(false)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white border-0"
              onClick={handleSchedule}
              disabled={!scheduleDate}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
