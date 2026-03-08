import { Hono } from "hono";
import { Env } from "../core-logic/env";
import { ChannelDurableObject } from "../edge/channel-do";
import { PresenceDurableObject } from "../edge/presence-do";
import { embedRouter } from "./routes/embed";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.text("spike-chat API is running"));
app.route("/embed", embedRouter);

export default {
  fetch: app.fetch,
};

export { ChannelDurableObject, PresenceDurableObject };
