import { describe, it, expect } from "vitest";
import { embedRouter } from "../../src/edge-api/spike-chat/api/routes/embed";

describe("embedRouter", () => {
  it("renders embed HTML", async () => {
    const res = await embedRouter.fetch(new Request("http://localhost/workspace-1/channel-1"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Spike Chat - channel-1");
  });
});
