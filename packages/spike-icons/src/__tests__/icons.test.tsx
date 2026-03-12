import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ArrowRight, Loader2, Check, Zap, Sparkles } from "../index";

describe("Animated Icons", () => {
  it("should render ArrowRight without crashing", () => {
    const { container } = render(<ArrowRight size={24} color="red" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Loader2 without crashing", () => {
    const { container } = render(<Loader2 />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Check without crashing", () => {
    const { container } = render(<Check />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Zap without crashing", () => {
    const { container } = render(<Zap />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Sparkles without crashing", () => {
    const { container } = render(<Sparkles />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
