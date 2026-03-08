import { DurableObject } from "cloudflare:workers";
import { Env } from "../core-logic/env";

export class PresenceDurableObject extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  override async fetch(request: Request) {
    return new Response("Not implemented", { status: 501 });
  }
}
