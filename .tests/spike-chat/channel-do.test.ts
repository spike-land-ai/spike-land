import { describe, it, expect } from "vitest";
import { ChannelDurableObject } from "../edge/channel-do";
import { Env } from "../core-logic/env";

describe("ChannelDurableObject", () => {
  it("returns 501 on fetch", async () => {
    const state = {} as DurableObjectState;
    const env = {} as Env;
    const doInstance = new ChannelDurableObject(state, env);
    const res = await doInstance.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(501);
    expect(await res.text()).toBe("Not implemented");
  });
});
