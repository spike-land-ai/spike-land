import { describe, expect, it } from "vitest";
import { createMockRegistry } from "../shared/test-utils";
import { audioStudioTools } from "./tools";

describe("audio-studio standalone tools", () => {
  const registry = createMockRegistry(audioStudioTools);

  it("exports exactly 13 tools", () => {
    expect(registry.getToolNames()).toHaveLength(13);
  });

  it("has the expected tool names", () => {
    const names = registry.getToolNames();
    expect(names).toContain("audio_upload");
    expect(names).toContain("audio_get_track");
    expect(names).toContain("audio_list_projects");
    expect(names).toContain("audio_create_project");
    expect(names).toContain("audio_delete_project");
    expect(names).toContain("audio_list_tracks");
    expect(names).toContain("audio_delete_track");
    expect(names).toContain("audio_update_track");
    expect(names).toContain("audio_apply_effect");
    expect(names).toContain("audio_export_mix");
    expect(names).toContain("audio_get_waveform");
    expect(names).toContain("audio_duplicate_track");
    expect(names).toContain("audio_reorder_tracks");
  });

  it("categorises tools under 'audio' and 'audio-effects'", () => {
    const audioTools = registry.getToolsByCategory("audio");
    const effectsTools = registry.getToolsByCategory("audio-effects");
    expect(audioTools.length).toBe(8);
    expect(effectsTools.length).toBe(5);
  });

  it("all tools are free tier", () => {
    for (const tool of audioStudioTools) {
      expect(tool.tier).toBe("free");
    }
  });

  it("all tools have alwaysEnabled set", () => {
    for (const tool of audioStudioTools) {
      expect(tool.alwaysEnabled).toBe(true);
    }
  });

  it("each tool has a description", () => {
    for (const tool of audioStudioTools) {
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe("string");
    }
  });
});
