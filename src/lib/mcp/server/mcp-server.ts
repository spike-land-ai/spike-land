import { pipelineTools } from "./tools/pipeline.js";

export function registerPipelineCategory(server: any) {
  for (const tool of pipelineTools) {
    server.addTool(tool);
  }
}
