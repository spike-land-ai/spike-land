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
const SKIP_ROLES = new Set(["none", "presentation", "generic"]);

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

function formatElement(node: AccessibilityNode, ref: number | undefined, depth: number): string {
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
export function narrate(tree: AccessibilityNode, title: string, url: string): NarrationResult {
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

function findLandmark(node: AccessibilityNode, name: string): AccessibilityNode | null {
  const normalizedName = name.toLowerCase();
  if (LANDMARK_ROLES.has(node.role) && node.role.toLowerCase() === normalizedName) {
    return node;
  }
  for (const child of node.children ?? []) {
    const found = findLandmark(child, name);
    if (found) return found;
  }
  return null;
}

// ─── Compact Narration ───────────────────────────────────────────────────────

const LANDMARK_SHORT: Record<string, string> = {
  banner: "banner",
  navigation: "nav",
  main: "main",
  complementary: "aside",
  contentinfo: "footer",
  form: "form",
  region: "region",
  search: "search",
};

const HEADING_SHORT: Record<number, string> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

function compactStates(node: AccessibilityNode): string {
  const parts: string[] = [];
  if (node.checked === true) parts.push("checked");
  if (node.checked === "mixed") parts.push("mixed");
  if (node.disabled) parts.push("disabled");
  if (node.expanded === true) parts.push("expanded");
  if (node.expanded === false) parts.push("collapsed");
  if (node.selected) parts.push("selected");
  if (node.pressed === true) parts.push("pressed");
  if (node.pressed === "mixed") parts.push("mixed-pressed");
  return parts.length > 0 ? ` (${parts.join(",")})` : "";
}

function compactInteractive(node: AccessibilityNode, ref: number): string {
  const name = node.name ? ` ${truncate(node.name, 40)}` : "";
  const val = node.value !== undefined && node.value !== "" ? `="${truncate(node.value, 30)}"` : "";
  const states = compactStates(node);
  return `${name}${val}${states} ref=${ref}`;
}

function narrateCompactNode(
  node: AccessibilityNode,
  state: NarrationState,
  depth: number,
  lines: string[],
  siblings: AccessibilityNode[],
  siblingIndex: number,
): void {
  if (shouldSkip(node)) {
    for (const child of node.children ?? []) {
      narrateCompactNode(
        child,
        state,
        depth,
        lines,
        node.children ?? [],
        (node.children ?? []).indexOf(child),
      );
    }
    return;
  }

  const indent = "  ".repeat(depth);

  if (isLandmark(node.role)) {
    const short = LANDMARK_SHORT[node.role] ?? node.role;
    const label = node.name ? `${short} "${truncate(node.name, 30)}"` : short;
    lines.push(`${indent}[${label}]`);
    const children = node.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child) narrateCompactNode(child, state, depth + 1, lines, children, i);
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

    // Collapse consecutive interactive siblings on the same line
    const isGroupable =
      node.role !== "heading" &&
      node.role !== "textbox" &&
      node.role !== "searchbox" &&
      node.role !== "combobox" &&
      node.role !== "slider" &&
      node.role !== "spinbutton";

    if (isGroupable && siblingIndex > 0) {
      const prev = siblings[siblingIndex - 1];
      if (
        prev &&
        shouldAssignRef(prev.role) &&
        prev.role !== "heading" &&
        prev.role !== "textbox" &&
        prev.role !== "searchbox"
      ) {
        // Append to previous line with pipe separator
        const lastLine = lines[lines.length - 1];
        if (lastLine && !lastLine.endsWith("]")) {
          lines[lines.length - 1] = `${lastLine} | ${node.role}${compactInteractive(node, ref)}`;
          return;
        }
      }
    }

    const role =
      node.role === "heading"
        ? `[${HEADING_SHORT[node.level ?? 1] ?? `h${node.level}`}]`
        : `[${node.role}]`;
    lines.push(`${indent}${role}${compactInteractive(node, ref)}`);
    return;
  }

  // Static text
  if (node.role === "text" || node.role === "StaticText") {
    if (node.name) {
      lines.push(`${indent}[text] ${truncate(node.name, 80)}`);
    }
    return;
  }

  // Other roles — recurse
  if (node.name && node.role !== "WebArea" && node.role !== "RootWebArea") {
    lines.push(`${indent}[${node.role}] ${truncate(node.name, 60)}`);
  }

  const children = node.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child) narrateCompactNode(child, state, depth, lines, children, i);
  }
}

/**
 * Compact narration for token-efficient AI consumption.
 * ~40-60% smaller than full narration.
 */
export function narrateCompact(
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
  lines.push(`[Page "${title}" ${shortUrl(url)}]`);

  const children = tree.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child) narrateCompactNode(child, state, 0, lines, children, i);
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
 * Compact narration of a single landmark section.
 */
export function narrateCompactSection(
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
      text: `[Page "${title}" ${shortUrl(url)}]\n[No "${landmarkName}" found]`,
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
  lines.push(`[Page "${title}" ${shortUrl(url)}]`);

  const short = LANDMARK_SHORT[landmark.role] ?? landmark.role;
  const label = landmark.name ? `${short} "${truncate(landmark.name, 30)}"` : short;
  lines.push(`[${label}]`);

  const children = landmark.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child) narrateCompactNode(child, state, 1, lines, children, i);
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
 * Find an accessibility node by its ref number.
 * Rebuilds the ref map by re-walking the tree.
 */
export function findElementByRef(tree: AccessibilityNode, ref: number): AccessibilityNode | null {
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
