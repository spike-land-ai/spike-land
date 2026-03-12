import { describe, expect, it } from "vitest";
import { app } from "../index.js";
import type { Env } from "../../core-logic/env.js";

function makeEnv(): Env {
  return {
    ALLOWED_ORIGINS: "https://spike.land",
  } as unknown as Env;
}

describe("analytics vanity host", () => {
  it("serves the dashboard on the analytics subdomain root without redirecting", async () => {
    const res = await app.request(
      new Request("https://analytics.spike.land/"),
      undefined,
      makeEnv(),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    await expect(res.text()).resolves.toContain("spike.land analytics");
  });
});
