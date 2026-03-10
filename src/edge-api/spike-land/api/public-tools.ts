/**
 * Public Tools Listing Endpoint
 *
 * GET /tools — Returns tool metadata (name, description, category, inputSchema)
 * without requiring authentication. Read-only endpoint for the tools explorer UI.
 */
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../core-logic/env";
import type { AuthVariables } from "./middleware";
import { ToolRegistry } from "../lazy-imports/registry";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "../core-logic/mcp/manifest";
import { createDb } from "../db/db/db-index.ts";

interface JsonSchemaProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/** Map a Zod type to a JSON Schema property, unwrapping Optional/Default wrappers. */
function resolveZodProperty(zodField: unknown): { prop: JsonSchemaProperty; optional: boolean } {
  let field = zodField as any;
  let optional = false;

  while (field) {
    const t =
      field.type ||
      field.def?.type ||
      field._def?.type ||
      field.typeName ||
      field.def?.typeName ||
      field._def?.typeName;
    if (t === "optional" || t === "ZodOptional") {
      optional = true;
      field = field.innerType || field.def?.innerType || field._def?.innerType || field.unwrap?.();
    } else if (t === "default" || t === "ZodDefault") {
      optional = true;
      field =
        field.innerType || field.def?.innerType || field._def?.innerType || field.removeDefault?.();
    } else if (t === "nullable" || t === "ZodNullable") {
      field = field.innerType || field.def?.innerType || field._def?.innerType || field.unwrap?.();
    } else if (t === "effects" || t === "ZodEffects") {
      field = field.schema || field.def?.schema || field._def?.schema || field.innerType?.();
    } else if (t === "pipe" || t === "ZodPipeline") {
      field = field.in || field.def?.in || field._def?.in;
    } else {
      break;
    }
  }

  const originalField = zodField as any;
  const description =
    originalField.description ??
    originalField.def?.description ??
    originalField._def?.description ??
    field.description ??
    field.def?.description ??
    field._def?.description ??
    "";
  const t =
    field.type ||
    field.def?.type ||
    field._def?.type ||
    field.typeName ||
    field.def?.typeName ||
    field._def?.typeName;

  if (t === "enum" || t === "ZodEnum") {
    const options = field.options || field.def?.values || field._def?.values || [];
    return {
      prop: {
        type: "string",
        description,
        ...(options.length > 0 ? { enum: options.map((value: any) => String(value)) } : {}),
      },
      optional,
    };
  }

  if (t === "object" || t === "ZodObject") {
    const nestedProps: Record<string, JsonSchemaProperty> = {};
    const nestedRequired: string[] = [];
    let shape = field.shape || field.def?.shape || field._def?.shape;
    if (typeof shape === "function") shape = shape();

    if (shape) {
      for (const [key, nestedField] of Object.entries(shape)) {
        const { prop: nestedProp, optional: nestedOptional } = resolveZodProperty(nestedField);
        nestedProps[key] = nestedProp;
        if (!nestedOptional) {
          nestedRequired.push(key);
        }
      }
    }

    return {
      prop: {
        type: "object",
        description,
        properties: nestedProps,
        ...(nestedRequired.length > 0 ? { required: nestedRequired } : {}),
      },
      optional,
    };
  }

  if (t === "array" || t === "ZodArray") {
    const element = field.element || field.def?.type || field._def?.type;
    const { prop: itemProp } = element
      ? resolveZodProperty(element)
      : { prop: { type: "string", description: "" } };
    return {
      prop: {
        type: "array",
        description,
        items: itemProp,
      },
      optional,
    };
  }

  let jsonType = "string";
  if (t === "number" || t === "ZodNumber") {
    jsonType = "number";
  } else if (t === "boolean" || t === "ZodBoolean") {
    jsonType = "boolean";
  }
  const prop: JsonSchemaProperty = { type: jsonType, description };

  return { prop, optional };
}

export const publicToolsRoute = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

publicToolsRoute.get("/", async (c) => {
  const stabilityFilter = c.req.query("stability");
  const categoryFilter = c.req.query("category");

  const db = createDb(c.env.DB);
  const mcpServer = new McpServer(
    { name: "spike-land-mcp", version: "1.0.0" },
    { capabilities: { tools: { listChanged: true } } },
  );

  const registry = new ToolRegistry(mcpServer, "anonymous");
  await registerAllTools(registry, "anonymous", db, {
    kv: c.env.KV,
    vaultSecret: c.env.VAULT_SECRET,
  });

  let definitions = registry.getToolDefinitions();

  if (stabilityFilter) {
    definitions = definitions.filter((t) => t.stability === stabilityFilter);
  }
  if (categoryFilter) {
    definitions = definitions.filter((t) => t.category === categoryFilter);
  }

  const tools = definitions.map((t) => {
    if (!t.inputSchema) {
      return {
        name: t.name,
        description: t.description,
        category: t.category,
        inputSchema: { type: "object" as const },
        version: t.version,
        stability: t.stability,
        examples: t.examples,
      };
    }

    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const [key, field] of Object.entries(t.inputSchema)) {
      const { prop, optional } = resolveZodProperty(field);
      properties[key] = prop;
      if (!optional) {
        required.push(key);
      }
    }

    return {
      name: t.name,
      description: t.description,
      category: t.category,
      inputSchema: {
        type: "object" as const,
        properties,
        ...(required.length > 0 ? { required } : {}),
      },
      version: t.version,
      stability: t.stability,
      examples: t.examples,
    };
  });

  const response = c.json({ tools });
  c.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return response;
});
