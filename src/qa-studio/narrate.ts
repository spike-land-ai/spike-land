/**
 * Narration Engine
 *
 * Converts Playwright's accessibility tree into screen-reader-style text.
 * Interactive elements and headings get ref numbers for agent interaction.
 */

import type { AccessibilityNode, NarratedElement, NarrationResult } from "./types.js";

/** Roles that get a ref number (interactive + headings) */
const INTERACTIVE_ROLES = new Set([
  "link",
  "button",
  "textbox",
  "checkbox",
  "radio",
  "combobox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "treeitem",
  "heading",
  "searchbox",
]);

/** Roles that are structural landmarks (no ref) */
const LANDMARK_ROLES = new Set([
  "banner",
  "navigation",
  "main",
  "complementary",
  "contentinfo",
  "form",
  "region",
  "search",
]);

/** Roles to skip entirely (decorative / structural noise) */
const SKIP_ROLES = new Set([
  "none",
  "presentation",
  "generic",
]);

interface NarrationState {
  nextRef: number;
  elements: NarratedElement[];
  refMap: Map<number, AccessibilityNode>;
}

function getStates(node: AccessibilityNode): string[] {
  const states: string[] = [];
  if (node.checked === true) states.push("checked");
  if (node.checked === "mixed") states.push("mixed");
  if (node.disabled) states.push("disabled");
  if (node.expanded === true) states.push("expanded");
  if (node.expanded === false) states.push("collapsed");
  if (node.selected) states.push("selected");
  if (node.pressed === true) states.push("pressed");
  if (node.pressed === "mixed") states.push("mixed pressed");
  return states;
}

function formatElement(
  node: AccessibilityNode,
  ref: number | undefined,
  depth: number,
): string {
  const indent = "  ".repeat(depth);
  const parts: string[] = [];

  // Role with optional level (for headings)
  let roleStr = node.role;
  if (node.level !== undefined) {
    roleStr += ` level ${node.level}`;
  }

  // Ref
  if (ref !== undefined) {
    roleStr += ` ref=${ref}`;
  }

  parts.push(`${indent}[${roleStr}]`);

  // Name
  if (node.name) {
    parts.push(`"${node.name}"`);
  }

  // States
  const states = getStates(node);
  if (states.length > 0) {
    parts.push(`(${states.join(", ")})`);
  }

  // Value
  if (node.value !== undefined && node.value !== "") {
    parts.push(`- value: "${node.value}"`);
  }

  return parts.join(" ");
}

function shouldAssignRef(role: string): boolean {
  return INTERACTIVE_ROLES.has(role);
}

function isLandmark(role: string): boolean {
  return LANDMARK_ROLES.has(role);
}

function shouldSkip(node: AccessibilityNode): boolean {
  return SKIP_ROLES.has(node.role);
}

function narrateNode(
  node: AccessibilityNode,
  state: NarrationState,
  depth: number,
  lines: string[],
): void {
  if (shouldSkip(node)) {
    // Still process children — skip the wrapper
    for (const child of node.children ?? []) {
      narrateNode(child, state, depth, lines);
    }
    return;
  }

  if (isLandmark(node.role)) {
    const label = node.name ? `${node.role} landmark "${node.name}"` : `${node.role} landmark`;
    lines.push(`${"  ".repeat(depth)}[${label}]`);
    for (const child of node.children ?? []) {
      narrateNode(child, state, depth + 1, lines);
    }
    return;
  }

  if (shouldAssignRef(node.role)) {
    const ref = state.nextRef++;
    state.refMap.set(ref, node);
    state.elements.push({
      ref,
      role: node.role,
      ...(node.name !== undefined ? { name: node.name } : {}),
      ...(node.value !== undefined ? { value: node.value } : {}),
      states: getStates(node),
      ...(node.level !== undefined ? { level: node.level } : {}),
      depth,
    });
    lines.push(formatElement(node, ref, depth));
    // Don't recurse into children for interactive elements — their text is in name
    return;
  }

  // Static text or group
  if (node.role === "text" || node.role === "StaticText") {
    if (node.name) {
      lines.push(`${"  ".repeat(depth)}[text] "${node.name}"`);
      state.elements.push({
        role: "text",
        name: node.name,
        states: [],
        depth,
      });
    }
    return;
  }

  // For other roles (list, listitem, group, etc.) — show if named, then recurse
  if (node.name && node.role !== "WebArea" && node.role !== "RootWebArea") {
    lines.push(`${"  ".repeat(depth)}[${node.role}] "${node.name}"`);
  }

  for (const child of node.children ?? []) {
    narrateNode(child, state, depth, lines);
  }
}

/**
 * Convert an accessibility tree into narrated text.
 */
export function narrate(
  tree: AccessibilityNode,
  title: string,
  url: string,
): NarrationResult {
  const state: NarrationState = {
    nextRef: 1,
    elements: [],
    refMap: new Map(),
  };

  const lines: string[] = [];
  lines.push(`[Page: "${title}" - ${url}]`);

  for (const child of tree.children ?? []) {
    narrateNode(child, state, 0, lines);
  }

  return {
    title,
    url,
    text: lines.join("\n"),
    elements: state.elements,
    refCount: state.nextRef - 1,
  };
}

/**
 * Narrate only elements within a specific landmark.
 */
export function narrateSection(
  tree: AccessibilityNode,
  landmarkName: string,
  title: string,
  url: string,
): NarrationResult {
  const landmark = findLandmark(tree, landmarkName);
  if (!landmark) {
    return {
      title,
      url,
      text: `[Page: "${title}" - ${url}]\n[No "${landmarkName}" landmark found]`,
      elements: [],
      refCount: 0,
    };
  }

  const state: NarrationState = {
    nextRef: 1,
    elements: [],
    refMap: new Map(),
  };

  const lines: string[] = [];
  lines.push(`[Page: "${title}" - ${url}]`);

  const label = landmark.name
    ? `${landmark.role} landmark "${landmark.name}"`
    : `${landmark.role} landmark`;
  lines.push(`[${label}]`);

  for (const child of landmark.children ?? []) {
    narrateNode(child, state, 1, lines);
  }

  return {
    title,
    url,
    text: lines.join("\n"),
    elements: state.elements,
    refCount: state.nextRef - 1,
  };
}

function findLandmark(
  node: AccessibilityNode,
  name: string,
): AccessibilityNode | null {
  const normalizedName = name.toLowerCase();
  if (
    LANDMARK_ROLES.has(node.role) &&
    node.role.toLowerCase() === normalizedName
  ) {
    return node;
  }
  for (const child of node.children ?? []) {
    const found = findLandmark(child, name);
    if (found) return found;
  }
  return null;
}

/**
 * Find an accessibility node by its ref number.
 * Rebuilds the ref map by re-walking the tree.
 */
export function findElementByRef(
  tree: AccessibilityNode,
  ref: number,
): AccessibilityNode | null {
  const state: NarrationState = {
    nextRef: 1,
    elements: [],
    refMap: new Map(),
  };
  const lines: string[] = [];
  for (const child of tree.children ?? []) {
    narrateNode(child, state, 0, lines);
  }
  return state.refMap.get(ref) ?? null;
}
