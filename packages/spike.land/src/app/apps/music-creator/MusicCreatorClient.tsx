"use client";

import { useCallback, useState } from "react";
import { useMusicCreatorMcp } from "./hooks/useMusicCreatorMcp";
import { TransportBar } from "./components/TransportBar";
import { InstrumentSidebar } from "./components/InstrumentSidebar";
import { TrackMixer } from "./components/TrackMixer";
import { PianoRoll } from "./components/PianoRoll";
import { TrackTimeline } from "./components/TrackTimeline";
import { AiGeneratePanel } from "./components/AiGeneratePanel";
import type { InstrumentId, MusicProject, Note, PlaybackState, Track } from "./types";
import { INSTRUMENTS } from "./components/InstrumentSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Music2, SlidersHorizontal, Sparkles } from "lucide-react";

const TRACK_COLORS = [
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-indigo-500",
];

function makeTrack(instrument: InstrumentId, index: number): Track {
  const inst = INSTRUMENTS.find(i => i.id === instrument);
  return {
    id: `track-${Date.now()}-${index}`,
    name: `${inst?.label ?? instrument} ${index + 1}`,
    instrument,
    volume: 80,
    pan: 0,
    muted: false,
    notes: [],
    color: TRACK_COLORS[index % TRACK_COLORS.length]!,
  };
}

export function MusicCreatorClient() {
  // null = no remote project ID; runs entirely local-only (tracksQuery stays disabled)
  const mcp = useMusicCreatorMcp(null);

  const [project, setProject] = useState<MusicProject>({
    id: "local-project",
    name: "Untitled Project",
    bpm: 120,
    timeSignature: [4, 4],
    tracks: [],
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const selectedTrack = project.tracks.find(t => t.id === selectedTrackId) ?? null;

  // ─── Playback ─────────────────────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    setPlaybackState("playing");
    mcp.playMut.mutate({ project_id: project.id });
  }, [mcp.playMut, project.id]);

  const handleStop = useCallback(() => {
    setPlaybackState("stopped");
    mcp.stopMut.mutate({ project_id: project.id });
  }, [mcp.stopMut, project.id]);

  const handlePause = useCallback(() => {
    setPlaybackState("paused");
    mcp.pauseMut.mutate({ project_id: project.id });
  }, [mcp.pauseMut, project.id]);

  // ─── Track management ─────────────────────────────────────────────────────

  const handleAddTrack = useCallback((instrument: InstrumentId) => {
    const newTrack = makeTrack(instrument, project.tracks.length);
    setProject(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
    setSelectedTrackId(newTrack.id);
    mcp.addTrackMut.mutate({
      project_id: project.id,
      instrument,
      name: newTrack.name,
    });
  }, [mcp.addTrackMut, project.id, project.tracks.length]);

  const handleRemoveTrack = useCallback((trackId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
    }));
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
    mcp.removeTrackMut.mutate({ project_id: project.id, track_id: trackId });
  }, [mcp.removeTrackMut, project.id, selectedTrackId]);

  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, volume } : t),
    }));
  }, []);

  const handlePanChange = useCallback((trackId: string, pan: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, pan } : t),
    }));
  }, []);

  const handleMuteToggle = useCallback((trackId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t),
    }));
  }, []);

  // ─── Piano roll notes ──────────────────────────────────────────────────────

  const handleToggleNote = useCallback((trackId: string, note: Note) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => {
        if (t.id !== trackId) return t;
        const key = `${note.pitch}-${note.octave}-${note.step}`;
        const existing = t.notes.find(
          n => `${n.pitch}-${n.octave}-${n.step}` === key,
        );
        if (existing) {
          return { ...t, notes: t.notes.filter(n => `${n.pitch}-${n.octave}-${n.step}` !== key) };
        }
        return { ...t, notes: [...t.notes, note] };
      }),
    }));
  }, []);

  // ─── BPM / time sig ───────────────────────────────────────────────────────

  const handleBpmChange = useCallback((bpm: number) => {
    setProject(prev => ({ ...prev, bpm }));
  }, []);

  const handleTimeSignatureChange = useCallback((sig: [number, number]) => {
    setProject(prev => ({ ...prev, timeSignature: sig }));
  }, []);

  // ─── Export / Save ────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    mcp.exportProjectMut.mutate({ project_id: project.id });
  }, [mcp.exportProjectMut, project.id]);

  // ─── AI generation ────────────────────────────────────────────────────────

  const handleAiGenerate = useCallback((prompt: string) => {
    mcp.aiGenerateStream.start({ prompt, bpm: project.bpm, tracks: project.tracks.length });
  }, [mcp.aiGenerateStream, project.bpm, project.tracks.length]);

  const totalNotes = project.tracks.reduce((sum, t) => sum + t.notes.length, 0);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-wrap bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 border border-violet-500/30">
            <Music2 className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">Music Creator</h1>
            <p className="text-[10px] text-zinc-500">
              {project.tracks.length} tracks &bull; {totalNotes} notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <Badge
            variant="outline"
            className="border-zinc-700 text-zinc-500 text-[10px] font-mono"
          >
            {project.bpm} BPM
          </Badge>
          <Badge
            variant="outline"
            className="border-zinc-700 text-zinc-500 text-[10px] font-mono"
          >
            {project.timeSignature[0]}/{project.timeSignature[1]}
          </Badge>
        </div>

        {/* Transport in header */}
        <div className="flex-1 flex items-center justify-center">
          <TransportBar
            playbackState={playbackState}
            bpm={project.bpm}
            timeSignature={project.timeSignature}
            isExporting={mcp.exportProjectMut.isLoading}
            onPlay={handlePlay}
            onStop={handleStop}
            onPause={handlePause}
            onBpmChange={handleBpmChange}
            onTimeSignatureChange={handleTimeSignatureChange}
            onExport={handleExport}
          />
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => mcp.saveProjectMut.mutate({ project_id: project.id })}
          disabled={mcp.saveProjectMut.isLoading}
          className="text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-xs"
        >
          {mcp.saveProjectMut.isLoading ? "Saving…" : "Save"}
        </Button>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left sidebar: instruments */}
        <aside className="w-52 flex-shrink-0 border-r border-white/5 p-3 overflow-y-auto bg-zinc-950/40">
          <InstrumentSidebar
            tracks={project.tracks}
            selectedTrackId={selectedTrackId}
            onAddTrack={handleAddTrack}
            onSelectTrack={setSelectedTrackId}
          />
        </aside>

        {/* Center: timeline + piano roll */}
        <section className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Timeline */}
          <div className="border-b border-white/5 p-3 overflow-x-auto bg-black/20">
            <TrackTimeline
              tracks={project.tracks}
              selectedTrackId={selectedTrackId}
              onSelectTrack={setSelectedTrackId}
            />
          </div>

          {/* Piano roll / tabs */}
          <div className="flex-1 overflow-auto">
            <Tabs defaultValue="piano-roll" className="h-full flex flex-col">
              <div className="border-b border-white/5 px-3 pt-2 bg-zinc-950/40">
                <TabsList className="h-7 bg-white/5 border border-white/5">
                  <TabsTrigger
                    value="piano-roll"
                    className="text-xs h-5 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-violet-300"
                  >
                    <Layers className="h-3 w-3 mr-1.5" />
                    Piano Roll
                  </TabsTrigger>
                  <TabsTrigger
                    value="mixer"
                    className="text-xs h-5 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-violet-300"
                  >
                    <SlidersHorizontal className="h-3 w-3 mr-1.5" />
                    Mixer
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai"
                    className="text-xs h-5 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-violet-300"
                  >
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    AI Generate
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="piano-roll" className="flex-1 p-3 mt-0 overflow-auto">
                {selectedTrack
                  ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-1.5 rounded-full ${selectedTrack.color}`} />
                        <span className="text-xs text-zinc-300 font-medium">
                          {selectedTrack.name}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {selectedTrack.notes.length} notes
                        </span>
                      </div>
                      <div className="rounded-lg border border-white/5 overflow-hidden">
                        <PianoRoll
                          track={selectedTrack}
                          onToggleNote={handleToggleNote}
                        />
                      </div>
                    </div>
                  )
                  : <PianoRoll track={null} onToggleNote={handleToggleNote} />}
              </TabsContent>

              <TabsContent value="mixer" className="flex-1 p-3 mt-0 overflow-auto">
                <TrackMixer
                  tracks={project.tracks}
                  onVolumeChange={handleVolumeChange}
                  onPanChange={handlePanChange}
                  onMuteToggle={handleMuteToggle}
                  onRemoveTrack={handleRemoveTrack}
                />
              </TabsContent>

              <TabsContent value="ai" className="flex-1 p-4 mt-0 overflow-auto">
                <AiGeneratePanel
                  isStreaming={!mcp.aiGenerateStream.isDone
                    && mcp.aiGenerateStream.chunks.length > 0}
                  streamText={mcp.aiGenerateStream.fullText}
                  isDone={mcp.aiGenerateStream.isDone}
                  error={mcp.aiGenerateStream.error}
                  onGenerate={handleAiGenerate}
                  onStop={mcp.aiGenerateStream.stop}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-2.5 px-4">
        <p className="text-center text-[10px] text-zinc-700">
          Music Creator by Spike Land &bull; AI-powered multi-track composition
        </p>
      </footer>
    </div>
  );
}
