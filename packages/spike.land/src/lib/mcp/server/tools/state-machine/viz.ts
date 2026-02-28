/**
 * State Machine Visualization MCP Tools
 *
 * Tools that render state machine diagrams, export images, and generate
 * Mermaid/graphviz representations.
 *
 * Tools:
 * - sm_visualize: Deploy an interactive React+D3 diagram to a codespace
 */

import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistry } from "../../tool-registry";
import { safeToolCall, textResult } from "../tool-helpers";
import { exportMachine } from "@/lib/state-machine/engine";
import { generateVisualizerCode } from "@/lib/state-machine/visualizer-template";
import type { MachineExport } from "@/lib/state-machine/types";

/**
 * Generate a Mermaid stateDiagram-v2 string from a MachineExport.
 * Used as a fallback when the codespace visualization service is unavailable.
 */
export function generateMermaidDiagram(machineExport: MachineExport): string {
  const { definition } = machineExport;
  const lines: string[] = ["stateDiagram-v2"];

  if (definition.initial) {
    lines.push(`    [*] --> ${definition.initial}`);
  }

  for (const [id, state] of Object.entries(definition.states)) {
    if (state.type === "final") {
      lines.push(`    ${id} --> [*]`);
    }
  }

  for (const t of definition.transitions) {
    const label = t.guard
      ? `${t.event} [${t.guard.expression}]`
      : t.event;
    lines.push(`    ${t.source} --> ${t.target} : ${label}`);
  }

  // Mark active states with a note
  if (machineExport.currentStates.length > 0) {
    for (const active of machineExport.currentStates) {
      lines.push(`    note right of ${active} : ACTIVE`);
    }
  }

  return lines.join("\n");
}

export function registerStateMachineVizTools(
  registry: ToolRegistry,
  _userId: string,
): void {
  // sm_visualize
  registry.register({
    name: "sm_visualize",
    description:
      "Visualize a state machine as an interactive React+D3 diagram deployed to a codespace. "
      + "Requires the testing.spike.land codespace service. "
      + "Falls back to a Mermaid stateDiagram if the service is unavailable.",
    category: "state-machine",
    tier: "free",
    alwaysEnabled: true,
    inputSchema: {
      machine_id: z.string().min(1).describe("Machine ID"),
      codespace_id: z
        .string()
        .min(1)
        .describe("Codespace ID to deploy the visualization to"),
      interactive: z
        .boolean()
        .optional()
        .describe(
          "Enable interactive event buttons in the visualization (default: false)",
        ),
      autoplay: z
        .boolean()
        .optional()
        .describe(
          "Enable autoplay that automatically steps through available transitions (default: false). Requires interactive: true.",
        ),
      autoplay_speed_ms: z
        .number()
        .int()
        .min(100)
        .max(10000)
        .optional()
        .describe(
          "Milliseconds between autoplay steps (default: 1000). Only used when autoplay is true.",
        ),
    },
    handler: async ({
      machine_id,
      codespace_id,
      interactive,
      autoplay,
      autoplay_speed_ms,
    }: {
      machine_id: string;
      codespace_id: string;
      interactive?: boolean;
      autoplay?: boolean;
      autoplay_speed_ms?: number;
    }): Promise<CallToolResult> => {
      return safeToolCall("sm_visualize", async () => {
        const machineExport = exportMachine(machine_id);
        const isInteractive = interactive ?? false;
        const isAutoplay = autoplay ?? false;
        const speedMs = autoplay_speed_ms ?? 1000;
        const code = generateVisualizerCode(
          machineExport,
          isInteractive,
          isAutoplay,
          speedMs,
        );

        let response: Response | undefined;
        let deployFailed = false;
        try {
          response = await fetch(
            `https://testing.spike.land/live/${codespace_id}/api/code`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            },
          );
          if (!response.ok) {
            deployFailed = true;
          }
        } catch {
          deployFailed = true;
        }

        if (deployFailed) {
          // Fallback: return Mermaid stateDiagram text
          const mermaid = generateMermaidDiagram(machineExport);
          let text = `**Visualization Fallback (Mermaid)**\n\n`;
          text += `The codespace service at \`testing.spike.land\` is unavailable. `;
          text +=
            `Here is a Mermaid stateDiagram you can render in any Mermaid-compatible viewer:\n\n`;
          text += `\`\`\`mermaid\n${mermaid}\n\`\`\``;
          return textResult(text);
        }

        const vizUrl = `https://testing.spike.land/live/${codespace_id}`;
        let text = `**Visualization Deployed**\n\n`;
        text += `- **URL:** ${vizUrl}\n`;
        text += `- **Interactive:** ${isInteractive}\n`;
        text += `- **Autoplay:** ${isAutoplay}${isAutoplay ? ` (${speedMs}ms)` : ""}\n`;
        text +=
          `- **States:** ${Object.keys(machineExport.definition.states).length}\n`;
        text +=
          `- **Transitions:** ${machineExport.definition.transitions.length}\n`;

        return textResult(text);
      });
    },
  });
}
