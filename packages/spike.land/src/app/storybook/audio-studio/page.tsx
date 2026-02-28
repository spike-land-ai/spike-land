"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { AudioMixerPanel } from "@/components/audio-studio/AudioMixerPanel";
import { AudioProjectCard } from "@/components/audio-studio/AudioProjectCard";
import { AudioTransportBar } from "@/components/audio-studio/AudioTransportBar";
import { AudioTrackRow } from "@/components/audio-studio/AudioTrackRow";
import type { AudioTrack } from "@/components/audio-studio/AudioTrackRow";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockProjects = [
  {
    projectName: "Summer Vibes EP",
    trackCount: 12,
    duration: "3:42",
    lastModified: "2 hours ago",
    status: "active" as const,
  },
  {
    projectName: "Midnight Sessions",
    trackCount: 8,
    duration: "5:17",
    lastModified: "Yesterday",
    status: "draft" as const,
  },
  {
    projectName: "Ambient Collection Vol. 2",
    trackCount: 6,
    duration: "8:05",
    lastModified: "3 days ago",
    status: "archived" as const,
  },
  {
    projectName: "Club Mix - Final",
    trackCount: 16,
    duration: "6:30",
    lastModified: "1 week ago",
    status: "active" as const,
  },
];

const mockTracks: AudioTrack[] = [
  { id: "1", name: "Kick Drum", volume: 85, isMuted: false, isSolo: false, color: "#ff5555" },
  { id: "2", name: "Snare", volume: 72, isMuted: false, isSolo: false, color: "#ff9955" },
  { id: "3", name: "Hi-Hat", volume: 60, isMuted: true, isSolo: false, color: "#ffdd55" },
  { id: "4", name: "Bass Guitar", volume: 78, isMuted: false, isSolo: false, color: "#55ff99" },
  { id: "5", name: "Lead Synth", volume: 65, isMuted: false, isSolo: true, color: "#55aaff" },
];

const singleTrack: AudioTrack = {
  id: "demo",
  name: "Demo Track",
  volume: 75,
  isMuted: false,
  isSolo: false,
  color: "#aa55ff",
};

// ---------------------------------------------------------------------------
// Interactive transport demo
// ---------------------------------------------------------------------------

function TransportDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="space-y-4 w-full max-w-md">
      <p className="text-xs text-zinc-500 text-center">Interactive — try the buttons</p>
      <AudioTransportBar
        currentTime="1:24"
        totalTime="3:42"
        isPlaying={isPlaying}
        isRecording={isRecording}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onStop={() => {
          setIsPlaying(false);
          setIsRecording(false);
        }}
        onRecord={() => setIsRecording(prev => !prev)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AudioStudioPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Audio Studio"
        description="Audio Studio components power the spike.land music production experience. Producers can manage multi-track projects, control per-track volume and mute/solo states, and control playback with the transport bar."
        usage="Use AudioMixerPanel for full mixing sessions, AudioTransportBar for playback control, AudioProjectCard in grid layouts for project browsing, and AudioTrackRow when embedding a single track control."
      />

      <UsageGuide
        dos={[
          "Use AudioMixerPanel when showing a full session with multiple tracks.",
          "Use AudioProjectCard in a responsive grid (2-4 columns) for project browsing.",
          "Show the transport bar above or below the mixer for intuitive layout.",
          "Use track color accents consistently to distinguish tracks visually.",
          "Provide aria-labels on all interactive controls for accessibility.",
        ]}
        donts={[
          "Don't embed AudioMixerPanel inside a narrow sidebar -- it needs horizontal space.",
          "Avoid showing more than 16 tracks without virtualization for performance.",
          "Don't omit the mute state visually -- muted tracks should be clearly distinct.",
          "Avoid using the same color for multiple tracks -- differentiation is key.",
          "Don't disable the stop button when recording -- always allow stopping.",
        ]}
      />

      {/* Project Cards */}
      <ComponentSample
        title="Audio Project Cards"
        description="Project tiles for browsing audio sessions. Each card displays the project name, track count, duration, last modified timestamp, and a status badge (active, draft, or archived)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {mockProjects.map(project => (
            <AudioProjectCard
              key={project.projectName}
              projectName={project.projectName}
              trackCount={project.trackCount}
              duration={project.duration}
              lastModified={project.lastModified}
              status={project.status}
            />
          ))}
        </div>
      </ComponentSample>

      {/* Transport Bar variants */}
      <ComponentSample
        title="Audio Transport Bar"
        description="Playback control strip with play, pause, stop, and record buttons plus a time display. Record button pulses red when active. Supports controlled and uncontrolled usage via optional callbacks."
      >
        <div className="space-y-6 w-full max-w-lg">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Stopped</p>
            <AudioTransportBar
              currentTime="0:00"
              totalTime="3:42"
              isPlaying={false}
              isRecording={false}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Playing</p>
            <AudioTransportBar
              currentTime="1:24"
              totalTime="3:42"
              isPlaying={true}
              isRecording={false}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Recording</p>
            <AudioTransportBar
              currentTime="0:32"
              totalTime="3:42"
              isPlaying={true}
              isRecording={true}
            />
          </div>
          <TransportDemo />
        </div>
      </ComponentSample>

      {/* Single Track Row */}
      <ComponentSample
        title="Audio Track Row"
        description="A single track control row with name, color accent, volume bar, and mute/solo toggle buttons. Designed to be composed inside AudioMixerPanel or used standalone."
      >
        <div className="w-full max-w-lg space-y-2">
          <AudioTrackRow
            track={singleTrack}
            onMuteToggle={() => {}}
            onSoloToggle={() => {}}
          />
          <AudioTrackRow
            track={{
              ...singleTrack,
              id: "muted",
              name: "Muted Track",
              isMuted: true,
              color: "#ff5555",
            }}
            onMuteToggle={() => {}}
            onSoloToggle={() => {}}
          />
          <AudioTrackRow
            track={{
              ...singleTrack,
              id: "solo",
              name: "Solo Track",
              isSolo: true,
              color: "#55aaff",
            }}
            onMuteToggle={() => {}}
            onSoloToggle={() => {}}
          />
        </div>
      </ComponentSample>

      {/* Full Mixer Panel */}
      <ComponentSample
        title="Audio Mixer Panel"
        description="Full multi-track mixer with per-track mute and solo toggles, volume bars, color accents, and a master volume readout. State is managed internally -- mute/solo changes persist within the session."
      >
        <div className="w-full max-w-2xl">
          <AudioMixerPanel tracks={mockTracks} masterVolume={88} />
        </div>
      </ComponentSample>

      <AccessibilityPanel
        notes={[
          "AudioTrackRow mute and solo buttons use aria-pressed to convey toggle state.",
          "Volume bars use role=progressbar with aria-valuenow, aria-valuemin, and aria-valuemax.",
          "AudioTransportBar play/pause button label updates dynamically based on playback state.",
          "Record button uses aria-pressed to indicate active recording state.",
          "Muted tracks reduce volume bar width visually and use a grey fill for colorblind users.",
          "Solo badge uses both color (yellow) and text label 'S' for dual encoding.",
          "AudioProjectCard status badges include text labels alongside color indicators.",
          "Track color accents are decorative; names and labels carry the semantic meaning.",
          "All icon-only buttons have descriptive aria-label attributes.",
        ]}
      />

      <RelatedComponents currentId="audio-studio" />
    </div>
  );
}
