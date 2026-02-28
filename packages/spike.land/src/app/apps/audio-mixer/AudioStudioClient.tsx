"use client";

import { useAudioStudio } from "./hooks/useAudioStudio";
import { ProjectSelector } from "./components/ProjectSelector";
import { TrackList } from "./components/TrackList";
import { TrackUploader } from "./components/TrackUploader";
import { WaveformVisualizer } from "./components/WaveformVisualizer";
import { TransportControls } from "./components/TransportControls";
import { MixerControls } from "./components/MixerControls";
import { TTSPanel } from "./components/TTSPanel";
import { Headphones, Music } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

// Helper to parse tracks for duration calculation
function parseTracks(raw: string | undefined) {
  if (!raw || raw.includes("No tracks") || raw.includes("NOT_FOUND")) return [];
  const lines = raw.split("\n").filter(l => l.startsWith("- **"));
  return lines.map(line => {
    const durationMatch = line.match(/— (\d+(?:\.\d+)?)s/);
    return {
      duration: parseFloat(durationMatch?.[1] ?? "0"),
    };
  });
}

export function AudioStudioClient() {
  const studio = useAudioStudio();

  // Estimate total duration from tracks data
  const totalDuration = useMemo(() => {
    const tracks = parseTracks(studio.tracks.data as string | undefined);
    if (tracks.length === 0) return 0;
    return Math.max(...tracks.map(t => t.duration), 0);
  }, [studio.tracks.data]);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
      {/* Main Layout */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_200px] gap-6">
          {/* ─── Left Panel: Project & Tracks ──────────────────────── */}
          <aside className="flex flex-col gap-5">
            <ProjectSelector
              activeProjectId={studio.activeProjectId}
              onSelectProject={studio.setActiveProjectId}
              onCreateProject={studio.createProject}
              onDeleteProject={studio.deleteProject}
              isCreating={studio.isCreatingProject}
              isDeleting={studio.isDeletingProject}
              projectsData={studio.projects.data as string | undefined}
              isLoading={studio.projects.isLoading}
            />

            <Separator className="bg-white/5" />

            <TrackList
              tracksData={studio.tracks.data as string | undefined}
              isLoading={studio.tracks.isLoading}
              onUpdateTrack={studio.updateTrack}
              onDeleteTrack={studio.deleteTrack}
              isUpdating={studio.isUpdatingTrack}
              isDeleting={studio.isDeletingTrack}
            />
          </aside>

          {/* ─── Center Panel: Waveform, Transport, Upload & TTS ──── */}
          <section className="flex flex-col gap-5" id="center-panel">
            {/* Waveform */}
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <WaveformVisualizer
                currentTime={studio.currentTime}
                totalDuration={totalDuration}
                isPlaying={studio.playbackState === "playing"}
                onSeek={studio.seek}
              />
            </div>

            {/* Transport */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <TransportControls
                playbackState={studio.playbackState}
                currentTime={studio.currentTime}
                totalDuration={totalDuration}
                onPlay={studio.play}
                onPause={studio.pause}
                onStop={studio.stop}
                onSeek={studio.seek}
              />
            </div>

            {/* Tabs: Upload / TTS */}
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="w-full bg-white/5 border border-white/5">
                <TabsTrigger
                  value="upload"
                  className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400"
                  id="tab-upload"
                >
                  <Music className="h-3.5 w-3.5 mr-1.5" />
                  Upload Track
                </TabsTrigger>
                <TabsTrigger
                  value="tts"
                  className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-violet-400"
                  id="tab-tts"
                >
                  <Headphones className="h-3.5 w-3.5 mr-1.5" />
                  Text-to-Speech
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-3">
                <TrackUploader
                  onUpload={studio.uploadTrack}
                  progress={studio.uploadProgress}
                  isUploading={studio.isUploading}
                  hasActiveProject={!!studio.activeProjectId}
                />
              </TabsContent>

              <TabsContent value="tts" className="mt-3">
                <TTSPanel
                  onGenerate={studio.generateSpeech}
                  streamChunks={studio.ttsStream.chunks}
                  streamText={studio.ttsStream.fullText}
                  isDone={studio.ttsStream.isDone}
                  error={studio.ttsStream.error}
                  hasActiveProject={!!studio.activeProjectId}
                />
              </TabsContent>
            </Tabs>
          </section>

          {/* ─── Right Panel: Mixer ────────────────────────────────── */}
          <aside>
            <MixerControls
              masterVolume={studio.masterVolume}
              onMasterVolumeChange={studio.setMasterVolume}
              hasProject={!!studio.activeProjectId}
            />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/5 py-4">
        <p className="text-center text-xs text-zinc-600">
          Audio Studio by Spike Land • Multi-track mixing & AI voice synthesis
        </p>
      </footer>
    </div>
  );
}
