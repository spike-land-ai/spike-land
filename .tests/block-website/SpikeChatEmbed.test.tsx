import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpikeChatEmbed } from "../SpikeChatEmbed";
import React from "react";

describe("SpikeChatEmbed", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hostname: 'localhost' }
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation
    });
  });

  it("renders loader initially and iframe pointing to local in dev", () => {
    render(<SpikeChatEmbed channelSlug="test-chan" workspaceSlug="test-work" />);
    
    expect(screen.getByText(/Loading Universal Interface/i)).toBeInTheDocument();
    
    const iframe = screen.getByTitle("Spike Chat - test-chan");
    expect(iframe).toHaveAttribute("src", "http://localhost:8787/embed/test-work/test-chan?guest=false");
  });

  it("renders production url when not localhost", () => {
    window.location.hostname = "spike.land";
    render(<SpikeChatEmbed channelSlug="test-chan" workspaceSlug="test-work" guestAccess={true} />);
    
    const iframe = screen.getByTitle("Spike Chat - test-chan");
    expect(iframe).toHaveAttribute("src", "https://chat.spike.land/embed/test-work/test-chan?guest=true");
  });

  it("hides loader when iframe loads", () => {
    render(<SpikeChatEmbed channelSlug="test-chan" workspaceSlug="test-work" />);
    
    expect(screen.getByText(/Loading Universal Interface/i)).toBeInTheDocument();
    
    const iframe = screen.getByTitle("Spike Chat - test-chan");
    fireEvent.load(iframe);
    
    expect(screen.queryByText(/Loading Universal Interface/i)).not.toBeInTheDocument();
  });
});
