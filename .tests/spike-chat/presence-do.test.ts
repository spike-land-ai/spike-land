import { describe, it, expect } from "vitest";
import { PresenceDurableObject } from "../../src/edge-api/spike-chat/edge/presence-do";
import { Env } from "../../src/edge-api/spike-chat/core-logic/env";

describe("PresenceDurableObject", () => {
  it("returns 501 on fetch", async () => {
    const state = {} as DurableObjectState;
    const env = {} as Env;
    const doInstance = new PresenceDurableObject(state, env);
    const res = await doInstance.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(501);
    expect(await res.text()).toBe("Not implemented");
  });
});
