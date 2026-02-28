/**
 * ShortcutsBar Component - Always visible keyboard shortcuts reference
 */

"use client";

import { Keyboard } from "lucide-react";

interface ShortcutItemProps {
  keys: string[];
  label: string;
}

function ShortcutItem({ keys, label }: ShortcutItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className="px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 font-mono min-w-[20px] text-center shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

export function ShortcutsBar() {
  return (
    <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-1.5 text-gray-500">
        <Keyboard className="w-4 h-4" />
      </div>

      <ShortcutItem keys={["Space"]} label="Play/Pause" />
      <ShortcutItem keys={["M"]} label="Mute" />
      <ShortcutItem keys={["O"]} label="Solo" />
      <ShortcutItem keys={["Del"]} label="Remove" />
      <ShortcutItem keys={["+", "-"]} label="Zoom" />
      <ShortcutItem keys={["G"]} label="Snap" />
      <ShortcutItem keys={["←", "→"]} label="Seek" />

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
        Press{" "}
        <kbd className="px-1 py-0.5 bg-gray-700 border border-gray-600 rounded text-gray-300">
          ?
        </kbd>{" "}
        for all shortcuts
      </div>
    </div>
  );
}
