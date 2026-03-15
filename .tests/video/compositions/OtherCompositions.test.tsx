import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VeritasiumPitch } from "../../../src/media/educational-videos/video/compositions/veritasium/VeritasiumPitch";
import { VibeCodingParadox } from "../../../src/media/educational-videos/video/compositions/vibe-coding-paradox/VibeCodingParadox";

describe("More Compositions Smoke Tests", () => {
  it("renders VeritasiumPitch without crashing", () => {
    const { container } = render(<VeritasiumPitch />);
    expect(container).toBeTruthy();
  });

  it("renders VibeCodingParadox without crashing", () => {
    const { container } = render(<VibeCodingParadox />);
    expect(container).toBeTruthy();
  });
});
