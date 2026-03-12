/**
 * Derivation Engine: JSON Schema → SurfaceSpec
 *
 * Pure, deterministic function that converts a JSON Schema (from the MCP tool
 * registry) into a SurfaceSpec for rendering interactive tool surfaces.
 * No React deps, no side effects, <50ms.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type InputType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "enum"
  | "date"
  | "email"
  | "url"
  | "array"
  | "object"
  | "hidden";

export type OutputType = "text" | "badge" | "link" | "image" | "date" | "list" | "card" | "table";

export interface FieldSpec {
  name: string;
  inputType: InputType;
  outputType: OutputType;
  description: string;
  required: boolean;
  enumValues?: string[];
  defaultValue?: unknown;
  nested?: FieldSpec[];
  constraints?: {
    min?: number;
    max?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface FieldGroup {
  label: string;
  fields: FieldSpec[];
}

export interface ToolExample {
  label: string;
  data: Record<string, unknown>;
}

export interface SurfaceSpec {
  toolName: string;
  description: string;
  fieldGroups: FieldGroup[];
  advancedGroup?: FieldGroup;
  examples: ToolExample[];
}

// ─── JSON Schema types (matching what public-tools.ts produces) ──────

interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface JsonSchema {
  type: "object";
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  examples?: Array<{ label?: string; args?: Record<string, unknown> }>;
}

// ─── Hint parsing ────────────────────────────────────────────────────

interface ParsedHint {
  hint: InputType | null;
  sliderMin?: number;
  sliderMax?: number;
  cleanDescription: string;
}

function parseHint(description: string): ParsedHint {
  const match = description.match(/^\[(\w+(?::\d+:\d+)?)\]\s*/);
  if (!match) return { hint: null, cleanDescription: description };

  const raw = match[1];
  const cleanDescription = description.slice(match[0].length);

  // [slider:0:100]
  if (raw.startsWith("slider:")) {
    const parts = raw.split(":");
    return {
      hint: "number",
      sliderMin: Number(parts[1]),
      sliderMax: Number(parts[2]),
      cleanDescription,
    };
  }

  const hintMap: Record<string, InputType> = {
    textarea: "textarea",
    hidden: "hidden",
    email: "email",
    url: "url",
    date: "date",
    text: "text",
    number: "number",
    boolean: "boolean",
  };

  return {
    hint: hintMap[raw] ?? null,
    cleanDescription: hintMap[raw] ? cleanDescription : description,
  };
}

// ─── Semantic type detection ─────────────────────────────────────────

function detectInputType(name: string, prop: JsonSchemaProperty): InputType {
  if (prop.type === "boolean") return "boolean";
  if (prop.type === "number" || prop.type === "integer") return "number";
  if (prop.type === "array") return "array";
  if (prop.type === "object" && prop.properties) return "object";
  if (prop.enum && prop.enum.length > 0) return "enum";

  // Semantic detection from field name
  const lower = name.toLowerCase();
  if (lower.endsWith("_email") || lower === "email") return "email";
  if (lower.endsWith("_url") || lower.endsWith("_link") || lower === "url" || lower === "link")
    return "url";
  if (
    lower.endsWith("_date") ||
    lower === "date" ||
    lower === "created_at" ||
    lower === "updated_at"
  )
    return "date";
  if (
    prop.type === "string" &&
    /(^|_)(body|content|description|details?|instructions|message|notes?|prompt|steps|summary)$/.test(
      lower,
    )
  ) {
    return "textarea";
  }

  // Long description → textarea
  if (prop.type === "string" && prop.description && prop.description.length > 80) return "textarea";

  return "text";
}

function detectOutputType(name: string, prop: JsonSchemaProperty): OutputType {
  if (prop.enum && prop.enum.length > 0) return "badge";
  const lower = name.toLowerCase();
  if (lower.endsWith("_email") || lower === "email") return "link";
  if (lower.endsWith("_url") || lower.endsWith("_link") || lower === "url" || lower === "link")
    return "link";
  if (
    lower.endsWith("_image") ||
    lower.endsWith("_avatar") ||
    lower === "image" ||
    lower === "avatar"
  )
    return "image";
  if (lower.endsWith("_date") || lower === "date") return "date";
  if (prop.type === "array" && prop.items?.properties) return "table";
  if (prop.type === "object" && prop.properties) return "card";
  if (prop.type === "array") return "list";
  return "text";
}

// ─── Field derivation ────────────────────────────────────────────────

function deriveField(name: string, prop: JsonSchemaProperty, required: boolean): FieldSpec {
  const { hint, sliderMin, sliderMax, cleanDescription } = parseHint(prop.description ?? "");

  const inputType = hint ?? detectInputType(name, prop);
  const outputType = detectOutputType(name, prop);

  const field: FieldSpec = {
    name,
    inputType,
    outputType,
    description: cleanDescription,
    required,
  };

  if (prop.enum) field.enumValues = prop.enum;
  if (prop.default !== undefined) field.defaultValue = prop.default;

  // Constraints
  if (sliderMin !== undefined || sliderMax !== undefined) {
    field.constraints = { min: sliderMin, max: sliderMax };
  }

  // Nested object fields
  if (prop.type === "object" && prop.properties) {
    field.nested = Object.entries(prop.properties).map(([k, v]) =>
      deriveField(k, v, prop.required?.includes(k) ?? false),
    );
  }

  // Array with object items
  if (prop.type === "array" && prop.items) {
    if (prop.items.properties) {
      field.nested = Object.entries(prop.items.properties).map(([k, v]) =>
        deriveField(k, v, prop.items?.required?.includes(k) ?? false),
      );
    }
  }

  return field;
}

// ─── Main derivation ─────────────────────────────────────────────────

const ADVANCED_THRESHOLD = 5;

export function deriveSurface(tool: ToolDefinition): SurfaceSpec {
  const schema = tool.inputSchema;
  const requiredSet = new Set(schema.required ?? []);

  const requiredFields: FieldSpec[] = [];
  const optionalFields: FieldSpec[] = [];

  if (schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      const isRequired = requiredSet.has(name);
      const field = deriveField(name, prop, isRequired);
      if (isRequired) {
        requiredFields.push(field);
      } else {
        optionalFields.push(field);
      }
    }
  }

  const fieldGroups: FieldGroup[] = [];

  if (requiredFields.length > 0) {
    fieldGroups.push({ label: "Required", fields: requiredFields });
  }

  let advancedGroup: FieldGroup | undefined;

  if (optionalFields.length > ADVANCED_THRESHOLD) {
    // First 5 optional → "Options", rest → "Advanced"
    fieldGroups.push({
      label: "Options",
      fields: optionalFields.slice(0, ADVANCED_THRESHOLD),
    });
    advancedGroup = {
      label: "Advanced",
      fields: optionalFields.slice(ADVANCED_THRESHOLD),
    };
  } else if (optionalFields.length > 0) {
    fieldGroups.push({ label: "Options", fields: optionalFields });
  }

  const examples: ToolExample[] = (tool.examples ?? [])
    .filter((ex) => ex.args)
    .map((ex, i) => ({
      label: ex.label ?? `Example ${i + 1}`,
      data: ex.args,
    }));

  return {
    toolName: tool.name,
    description: tool.description,
    fieldGroups,
    advancedGroup,
    examples,
  };
}
