import { z } from "zod";
import type { ToolRegistryAdapter } from "../../../lazy-imports/types";
import { freeTool } from "../../../lazy-imports/procedures-index.ts";
import { safeToolCall, jsonResult } from "../../lib/tool-helpers";
import type { DrizzleDB } from "../../../db/db/db-index.ts";
import { evaluateExperiment } from "../../../../main/lazy-imports/experiment-engine";

export function registerExperimentEvaluatorTools(
  registry: ToolRegistryAdapter,
  userId: string,
  db: DrizzleDB,
): void {
  const t = freeTool(userId, db);

  registry.registerBuilt(
    t
      .tool("evaluate_experiment", "Run the Bayesian evaluation engine for an A/B experiment.", {
        variants: z
          .array(
            z.object({
              id: z.string(),
              impressions: z.number(),
              donations: z.number(),
            }),
          )
          .describe("Metrics for each variant."),
      })
      .meta({ category: "store-ab", tier: "free" })
      .handler(async ({ input }) => {
        return safeToolCall("evaluate_experiment", async () => {
          const result = evaluateExperiment(input.variants);
          return jsonResult(JSON.stringify(result), result);
        });
      }),
  );
}
