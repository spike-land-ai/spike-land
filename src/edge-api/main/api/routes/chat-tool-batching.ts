export interface ToolExecutionDescriptor {
  toolCallId: string;
  name: string;
}

function isSerializedTool(descriptor: ToolExecutionDescriptor) {
  return descriptor.name.startsWith("browser_");
}

export function groupToolExecutionBatches<T extends ToolExecutionDescriptor>(descriptors: T[]) {
  const batches: T[][] = [];
  let currentParallelBatch: T[] = [];

  for (const descriptor of descriptors) {
    if (isSerializedTool(descriptor)) {
      if (currentParallelBatch.length > 0) {
        batches.push(currentParallelBatch);
        currentParallelBatch = [];
      }

      batches.push([descriptor]);
      continue;
    }

    currentParallelBatch.push(descriptor);
  }

  if (currentParallelBatch.length > 0) {
    batches.push(currentParallelBatch);
  }

  return batches;
}
