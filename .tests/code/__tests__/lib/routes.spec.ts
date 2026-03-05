import { describe, expect, it } from "vitest";
import { routes, ROUTES, RouteUtils } from "@/lib/routes";

describe("routes", () => {
  it("has expected top-level route entries", () => {
    expect(routes["/"]).toBe("landing");
    expect(routes["/start"]).toBe("temp");
  });
});

describe("ROUTES", () => {
  it("LIVE builds the correct path", () => {
    expect(ROUTES.LIVE("my-space")).toBe("/live/my-space");
  });

  it("LIVE_CMS builds the correct path", () => {
    expect(ROUTES.LIVE_CMS("my-space")).toBe("/live-cms/my-space");
  });

  it("DEHYDRATED builds the correct path", () => {
    expect(ROUTES.DEHYDRATED("my-space")).toBe("/live/my-space/dehydrated");
  });
});

describe("RouteUtils.isLiveRoute", () => {
  it("returns true for /live/ paths", () => {
    expect(RouteUtils.isLiveRoute("/live/my-space")).toBe(true);
    expect(RouteUtils.isLiveRoute("/live/abc/extra")).toBe(true);
  });

  it("returns false for other paths", () => {
    expect(RouteUtils.isLiveRoute("/live-cms/space")).toBe(false);
    expect(RouteUtils.isLiveRoute("/")).toBe(false);
    expect(RouteUtils.isLiveRoute("/dashboard")).toBe(false);
  });
});

describe("RouteUtils.isLiveCMSRoute", () => {
  it("returns true for /live-cms/ paths", () => {
    expect(RouteUtils.isLiveCMSRoute("/live-cms/my-space")).toBe(true);
  });

  it("returns false for other paths", () => {
    expect(RouteUtils.isLiveCMSRoute("/live/my-space")).toBe(false);
    expect(RouteUtils.isLiveCMSRoute("/")).toBe(false);
  });
});

describe("RouteUtils.isDehydratedRoute", () => {
  it("returns true for paths ending with dehydrated", () => {
    expect(RouteUtils.isDehydratedRoute("/live/my-space/dehydrated")).toBe(true);
  });

  it("returns false for non-dehydrated paths", () => {
    expect(RouteUtils.isDehydratedRoute("/live/my-space")).toBe(false);
    expect(RouteUtils.isDehydratedRoute("/")).toBe(false);
  });
});

describe("RouteUtils.shouldRenderApp", () => {
  it("returns true for live route without dehydrated suffix", () => {
    expect(RouteUtils.shouldRenderApp("/live/my-space")).toBe(true);
  });

  it("returns true for live-cms route without dehydrated suffix", () => {
    expect(RouteUtils.shouldRenderApp("/live-cms/my-space")).toBe(true);
  });

  it("returns false for dehydrated live route", () => {
    expect(RouteUtils.shouldRenderApp("/live/my-space/dehydrated")).toBe(false);
  });

  it("returns false for non-live paths", () => {
    expect(RouteUtils.shouldRenderApp("/dashboard")).toBe(false);
    expect(RouteUtils.shouldRenderApp("/")).toBe(false);
  });
});
