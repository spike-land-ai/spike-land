import { describe, expect, it } from "vitest";
import { app } from "../index.js";

describe("analytics vanity host", () => {
  it("redirects the analytics subdomain root to the analytics route", async () => {
    const res = await app.request(new Request("https://analytics.spike.land/"));

    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://analytics.spike.land/analytics");
  });
});
