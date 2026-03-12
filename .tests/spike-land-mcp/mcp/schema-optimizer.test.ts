import { describe, expect, it } from "vitest";
import {
  optimizeSchema,
  shortenDescription,
  measureTokenSavings,
  getSchemaTokenReport,
  injectExamplesIntoSchema,
} from "../../../src/edge-api/spike-land/core-logic/mcp/schema-optimizer";

describe("optimizeSchema", () => {
  it("returns a copy without mutating the original", () => {
    const schema = { description: "A schema" };
    const result = optimizeSchema(schema);
    expect(result).toEqual({ description: "Schema" });
    expect(result).not.toBe(schema);
  });

  it("strips descriptions that exactly match the property name", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "name" },
        age: { type: "number", description: "User age in years" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.name).not.toHaveProperty("description");
    expect(props.age?.description).toBe("User age in years");
  });

  it("strips 'the <name>' descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        query: { type: "string", description: "The query" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.query).not.toHaveProperty("description");
  });

  it("strips 'a <name>' descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        file: { type: "string", description: "A file" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.file).not.toHaveProperty("description");
  });

  it("handles underscore/hyphen property names", () => {
    const schema = {
      type: "object",
      properties: {
        file_path: { type: "string", description: "file path" },
        "max-count": { type: "number", description: "The max count" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.file_path).not.toHaveProperty("description");
    expect(props["max-count"]).not.toHaveProperty("description");
  });

  it("strips 'the <words> of the <name>' descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        image_id: { type: "string", description: "The ID of the image_id" },
        user_id: { type: "string", description: "ID for user_id" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.image_id).not.toHaveProperty("description");
    expect(props.user_id).not.toHaveProperty("description");
  });

  it("strips boolean pattern descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        force: { type: "boolean", description: "Whether to force" },
        dry_run: { type: "boolean", description: "True if dry run" },
        recursive: { type: "boolean", description: "If true, recursive" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.force).not.toHaveProperty("description");
    expect(props.dry_run).not.toHaveProperty("description");
    expect(props.recursive).not.toHaveProperty("description");
  });

  it("strips enum self-describing descriptions", () => {
    const schema = {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "closed"], description: "open, closed" },
        role: { type: "string", enum: ["admin", "user"], description: "admin or user" },
        type: { type: "string", enum: ["a", "b"], description: "One of: a, b" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.status).not.toHaveProperty("description");
    expect(props.role).not.toHaveProperty("description");
    expect(props.type).not.toHaveProperty("description");
  });

  it("removes undefined default values and type-zero defaults", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", default: undefined },
        age: { type: "number", default: 0 },
        count: { type: "number", default: 42 },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.name).not.toHaveProperty("default");
    expect(props.age).not.toHaveProperty("default");
    expect(props.count?.default).toBe(42);
  });

  it("preserves meaningful descriptions and shortens them", () => {
    const schema = {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to execute against the index.",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
        },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.query?.description).toBe("Search query to execute against the index");
    expect(props.limit?.description).toBe("Maximum number of results to return");
  });

  it("handles nested schemas (items)", () => {
    const schema = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          description: "List of tags",
          items: { type: "string", description: "tags" },
        },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    const items = props.tags?.items as Record<string, unknown>;
    // "tags" description inside items doesn't have a propertyName context for items
    // (items doesn't pass down a property name), so it's kept
    expect(items.type).toBe("string");
  });

  it("handles allOf/anyOf/oneOf arrays", () => {
    const schema = {
      anyOf: [{ type: "string" }, { type: "number" }],
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result.anyOf).toEqual([{ type: "string" }, { type: "number" }]);
  });

  it("handles empty schema", () => {
    expect(optimizeSchema({})).toEqual({});
  });

  it("handles schema with no properties — preserves non-empty required", () => {
    const schema = { type: "object", required: ["name"] };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    // root type: "object" is stripped; required array with items is preserved
    expect(result).not.toHaveProperty("type");
    expect(result).toHaveProperty("required");
    expect(result.required).toEqual(["name"]);
  });

  it("case-insensitive description matching", () => {
    const schema = {
      type: "object",
      properties: {
        Name: { type: "string", description: "name" },
        URL: { type: "string", description: "A URL" },
      },
    };

    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.Name).not.toHaveProperty("description");
    expect(props.URL).not.toHaveProperty("description");
  });

  // ── Type-obvious descriptions ────────────────────────────────────

  it("strips type-obvious descriptions for string fields", () => {
    const schema = {
      type: "object",
      properties: {
        a: { type: "string", description: "A string" },
        b: { type: "string", description: "A string value" },
        c: { type: "string", description: "String" },
        d: { type: "string", description: "string value" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.a).not.toHaveProperty("description");
    expect(props.b).not.toHaveProperty("description");
    expect(props.c).not.toHaveProperty("description");
    expect(props.d).not.toHaveProperty("description");
  });

  it("strips type-obvious descriptions for number fields", () => {
    const schema = {
      type: "object",
      properties: {
        a: { type: "number", description: "A number" },
        b: { type: "number", description: "A number value" },
        c: { type: "number", description: "Number" },
        d: { type: "number", description: "Integer" },
        e: { type: "integer", description: "An integer" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.a).not.toHaveProperty("description");
    expect(props.b).not.toHaveProperty("description");
    expect(props.c).not.toHaveProperty("description");
    expect(props.d).not.toHaveProperty("description");
    expect(props.e).not.toHaveProperty("description");
  });

  it("strips type-obvious descriptions for boolean fields", () => {
    const schema = {
      type: "object",
      properties: {
        a: { type: "boolean", description: "A boolean" },
        b: { type: "boolean", description: "A boolean value" },
        c: { type: "boolean", description: "Boolean" },
        d: { type: "boolean", description: "True or false" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.a).not.toHaveProperty("description");
    expect(props.b).not.toHaveProperty("description");
    expect(props.c).not.toHaveProperty("description");
    expect(props.d).not.toHaveProperty("description");
  });

  it("strips type-obvious descriptions for array fields", () => {
    const schema = {
      type: "object",
      properties: {
        a: { type: "array", description: "An array" },
        b: { type: "array", description: "A list" },
        c: { type: "array", description: "An array of items" },
        d: { type: "array", description: "Array" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.a).not.toHaveProperty("description");
    expect(props.b).not.toHaveProperty("description");
    expect(props.c).not.toHaveProperty("description");
    expect(props.d).not.toHaveProperty("description");
  });

  it("strips type-obvious descriptions for object fields", () => {
    const schema = {
      type: "object",
      properties: {
        a: { type: "object", description: "An object" },
        b: { type: "object", description: "A JSON object" },
        c: { type: "object", description: "Object" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.a).not.toHaveProperty("description");
    expect(props.b).not.toHaveProperty("description");
    expect(props.c).not.toHaveProperty("description");
  });

  it("does not strip meaningful descriptions even if type matches common words", () => {
    const schema = {
      type: "object",
      properties: {
        message: { type: "string", description: "The error message to display to the user" },
        count: { type: "number", description: "Maximum number of retries allowed" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.message).toHaveProperty("description");
    expect(props.count).toHaveProperty("description");
  });

  // ── "Optional X" / "Required X" prefix stripping ────────────────

  it("strips 'Optional ' prefix from descriptions matching property name", () => {
    const schema = {
      type: "object",
      properties: {
        timeout: { type: "number", description: "Optional timeout" },
        label: { type: "string", description: "Optional label" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.timeout).not.toHaveProperty("description");
    expect(props.label).not.toHaveProperty("description");
  });

  it("strips 'Required ' prefix from descriptions matching property name", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "Required name" },
        id: { type: "string", description: "Required id" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.name).not.toHaveProperty("description");
    expect(props.id).not.toHaveProperty("description");
  });

  it("preserves meaningful descriptions that start with Optional or Required", () => {
    const schema = {
      type: "object",
      properties: {
        config: {
          type: "object",
          description: "Optional configuration overrides for the build pipeline",
        },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    // After stripping "Optional ", the remainder is "configuration overrides..." which !== "config"
    expect(props.config).toHaveProperty("description");
  });

  // ── title field stripping ────────────────────────────────────────

  it("strips title fields that match the property name exactly", () => {
    const schema = {
      type: "object",
      properties: {
        username: { type: "string", title: "username", description: "The login username" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.username).not.toHaveProperty("title");
    expect(props.username).toHaveProperty("description");
  });

  it("strips title fields with underscore/hyphen normalization", () => {
    const schema = {
      type: "object",
      properties: {
        file_path: { type: "string", title: "File Path" },
        "max-retries": { type: "number", title: "Max Retries" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.file_path).not.toHaveProperty("title");
    expect(props["max-retries"]).not.toHaveProperty("title");
  });

  it("preserves title fields that differ from the property name", () => {
    const schema = {
      type: "object",
      properties: {
        ts: { type: "string", title: "Timestamp" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.ts?.title).toBe("Timestamp");
  });

  it("does not strip title when no property name context exists (root level)", () => {
    const schema = { title: "MyTool" };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result.title).toBe("MyTool");
  });

  // ── Empty required arrays ────────────────────────────────────────

  it("strips empty required arrays", () => {
    const schema = {
      type: "object",
      required: [] as string[],
      properties: { name: { type: "string" } },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result).not.toHaveProperty("required");
  });

  it("preserves non-empty required arrays", () => {
    const schema = {
      type: "object",
      required: ["name"],
      properties: { name: { type: "string" } },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result.required).toEqual(["name"]);
  });

  // ── additionalProperties: true stripping ────────────────────────

  it("strips additionalProperties: true", () => {
    const schema = {
      type: "object",
      additionalProperties: true,
      properties: { name: { type: "string" } },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result).not.toHaveProperty("additionalProperties");
  });

  it("preserves additionalProperties: false", () => {
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: { name: { type: "string" } },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result.additionalProperties).toBe(false);
  });

  it("preserves additionalProperties schema objects", () => {
    const schema = {
      type: "object",
      additionalProperties: { type: "string" },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result.additionalProperties).toEqual({ type: "string" });
  });

  // ── Root type: "object" stripping ───────────────────────────────

  it("strips type: 'object' at root level", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result).not.toHaveProperty("type");
  });

  it("preserves type: 'object' on nested property schemas", () => {
    const schema = {
      type: "object",
      properties: {
        config: {
          type: "object",
          properties: { key: { type: "string" } },
        },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.config?.type).toBe("object");
  });

  it("preserves non-object root type", () => {
    const schema = { type: "string" };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result.type).toBe("string");
  });

  // ── Word-bag matching ────────────────────────────────────────────

  it("word-bag: image_id with 'The ID of the image' is redundant", () => {
    const schema = {
      type: "object",
      properties: {
        image_id: { type: "string", description: "The ID of the image" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.image_id).not.toHaveProperty("description");
  });

  it("word-bag: user_name with 'The display name shown to other users' is NOT redundant", () => {
    const schema = {
      type: "object",
      properties: {
        user_name: { type: "string", description: "The display name shown to other users" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.user_name).toHaveProperty("description");
  });

  it("word-bag: created_at with 'When it was created at' is redundant", () => {
    const schema = {
      type: "object",
      properties: {
        created_at: { type: "string", description: "When it was created at" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.created_at).not.toHaveProperty("description");
  });

  // ── Type-default stripping ───────────────────────────────────────

  it("strips default: '' for type string", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", default: "" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.name).not.toHaveProperty("default");
  });

  it("keeps default: 'hello' for type string", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", default: "hello" },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.name?.default).toBe("hello");
  });

  it("strips default: 0 for type number", () => {
    const schema = {
      type: "object",
      properties: {
        count: { type: "number", default: 0 },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.count).not.toHaveProperty("default");
  });

  it("strips default: false for type boolean", () => {
    const schema = {
      type: "object",
      properties: {
        enabled: { type: "boolean", default: false },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.enabled).not.toHaveProperty("default");
  });

  it("strips default: [] for type array", () => {
    const schema = {
      type: "object",
      properties: {
        tags: { type: "array", default: [] },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.tags).not.toHaveProperty("default");
  });

  it("strips default: {} for type object", () => {
    const schema = {
      type: "object",
      properties: {
        meta: { type: "object", default: {} },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.meta).not.toHaveProperty("default");
  });

  // ── Single-element composition collapse ──────────────────────────

  it("collapses single-element allOf into parent", () => {
    const schema = {
      allOf: [{ type: "string", minLength: 1 }],
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result).not.toHaveProperty("allOf");
    expect(result.type).toBe("string");
    expect(result.minLength).toBe(1);
  });

  it("collapses single-element anyOf into parent", () => {
    const schema = {
      anyOf: [{ type: "number" }],
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result).not.toHaveProperty("anyOf");
    expect(result.type).toBe("number");
  });

  it("collapses single-element oneOf into parent", () => {
    const schema = {
      oneOf: [{ type: "boolean" }],
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result).not.toHaveProperty("oneOf");
    expect(result.type).toBe("boolean");
  });

  it("preserves multi-element anyOf without collapsing", () => {
    const schema = {
      anyOf: [{ type: "string" }, { type: "number" }],
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    expect(result.anyOf).toEqual([{ type: "string" }, { type: "number" }]);
  });

  // ── Redundant schema constraint stripping ────────────────────────

  it("strips minLength: 0", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 0 },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.name).not.toHaveProperty("minLength");
  });

  it("preserves minLength: 1", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.name?.minLength).toBe(1);
  });

  it("strips minItems: 0", () => {
    const schema = {
      type: "object",
      properties: {
        tags: { type: "array", minItems: 0 },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.tags).not.toHaveProperty("minItems");
  });

  it("strips uniqueItems: false", () => {
    const schema = {
      type: "object",
      properties: {
        tags: { type: "array", uniqueItems: false },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.tags).not.toHaveProperty("uniqueItems");
  });

  it("preserves uniqueItems: true", () => {
    const schema = {
      type: "object",
      properties: {
        tags: { type: "array", uniqueItems: true },
      },
    };
    const result = optimizeSchema(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.tags?.uniqueItems).toBe(true);
  });
});

describe("shortenDescription", () => {
  it("strips leading articles and capitalizes", () => {
    expect(shortenDescription("The quick brown fox")).toBe("Quick brown fox");
    expect(shortenDescription("A quick brown fox")).toBe("Quick brown fox");
    expect(shortenDescription("An apple")).toBe("Apple");
  });

  it("removes trailing periods", () => {
    expect(shortenDescription("This is a test.")).toBe("This is a test");
  });

  it("truncates at the first sentence if over 80 chars", () => {
    const longDesc =
      "This is a very long description that goes on for quite a while to exceed eighty characters. This is the second sentence.";
    expect(shortenDescription(longDesc)).toBe(
      "This is a very long description that goes on for quite a while to exceed eighty characters",
    );
  });

  it("hard truncates if over 80 chars and no sentence break", () => {
    const longDesc =
      "This is a very long description that just keeps going and going without any period whatsoever to break it up";
    expect(shortenDescription(longDesc).length).toBeLessThan(85);
    expect(shortenDescription(longDesc).endsWith("...")).toBe(true);
  });
});

describe("measureTokenSavings", () => {
  it("calculates savings correctly", () => {
    const original = { a: 1, b: 2, description: "A very long description that will be removed" };
    const optimized = { a: 1, b: 2 };

    const result = measureTokenSavings(original, optimized);
    expect(result.originalLength).toBeGreaterThan(result.optimizedLength);
    expect(result.savedLength).toBe(result.originalLength - result.optimizedLength);
    expect(result.approximateTokensSaved).toBe(Math.round(result.savedLength / 4));
  });
});

describe("injectExamplesIntoSchema", () => {
  it("injects examples array into schema", () => {
    const schema = { properties: { name: { type: "string" } } };
    const examples = [{ name: "ex1", input: { name: "Alice" }, description: "A name example" }];
    const result = injectExamplesIntoSchema(schema, examples) as Record<string, unknown>;
    expect(result.examples).toEqual([{ name: "Alice" }]);
  });

  it("returns schema unchanged if no examples argument provided", () => {
    const schema = { properties: { name: { type: "string" } } };
    const result = injectExamplesIntoSchema(schema, []);
    expect(result).toEqual(schema);
  });

  it("returns schema unchanged if examples array is empty", () => {
    const schema = { properties: { x: { type: "number" } } };
    const result = injectExamplesIntoSchema(schema, []) as Record<string, unknown>;
    expect(result).not.toHaveProperty("examples");
    expect(result).toEqual(schema);
  });

  it("extracts only input objects from examples, not name or description", () => {
    const schema = { properties: {} };
    const examples = [
      {
        name: "ex1",
        input: { query: "hello", limit: 5 },
        description: "First example",
        expected_output: "some output",
      },
      { name: "ex2", input: { query: "world" }, description: "Second example" },
    ];
    const result = injectExamplesIntoSchema(schema, examples) as Record<string, unknown>;
    expect(result.examples).toEqual([{ query: "hello", limit: 5 }, { query: "world" }]);
  });

  it("does not mutate the original schema", () => {
    const schema = { properties: { name: { type: "string" } } };
    const original = { ...schema };
    const examples = [{ name: "ex1", input: { name: "Bob" }, description: "test" }];
    injectExamplesIntoSchema(schema, examples);
    expect(schema).toEqual(original);
    expect(schema).not.toHaveProperty("examples");
  });

  it("handles multiple examples correctly", () => {
    const schema = { properties: { a: { type: "string" } } };
    const examples = [
      { name: "a", input: { a: "1" }, description: "first" },
      { name: "b", input: { a: "2" }, description: "second" },
      { name: "c", input: { a: "3" }, description: "third" },
    ];
    const result = injectExamplesIntoSchema(schema, examples) as Record<string, unknown>;
    expect((result.examples as unknown[]).length).toBe(3);
    expect(result.examples).toEqual([{ a: "1" }, { a: "2" }, { a: "3" }]);
  });
});

describe("getSchemaTokenReport", () => {
  it("returns zeroes for an empty array", () => {
    const report = getSchemaTokenReport([]);
    expect(report.totalOriginalTokens).toBe(0);
    expect(report.totalOptimizedTokens).toBe(0);
    expect(report.totalSaved).toBe(0);
    expect(report.perTool).toEqual([]);
  });

  it("sums token counts across multiple tools", () => {
    const toolA = {
      name: "tool_a",
      original: {
        description:
          "A very long and wordy description that should be shortened for the token report test",
      },
      optimized: { description: "Long and wordy description that should be shortened for the..." },
    };
    const toolB = {
      name: "tool_b",
      original: { description: "Another tool" },
      optimized: {},
    };
    const report = getSchemaTokenReport([toolA, toolB]);
    expect(report.totalOriginalTokens).toBeGreaterThan(0);
    expect(report.totalOptimizedTokens).toBeGreaterThanOrEqual(0);
    expect(report.totalSaved).toBe(report.totalOriginalTokens - report.totalOptimizedTokens);
    expect(report.perTool).toHaveLength(2);
    expect(report.perTool[0]?.name).toBe("tool_a");
    expect(report.perTool[1]?.name).toBe("tool_b");
  });

  it("perTool saved matches individual measureTokenSavings", () => {
    const original = {
      type: "object",
      description: "A string",
      properties: { x: { type: "string", description: "A string" } },
    };
    const optimized = optimizeSchema(original);
    const schemas = [{ name: "my_tool", original, optimized }];
    const report = getSchemaTokenReport(schemas);
    const individual = measureTokenSavings(original, optimized);
    expect(report.perTool[0]?.saved).toBe(individual.approximateTokensSaved);
  });

  it("totalSaved equals totalOriginalTokens minus totalOptimizedTokens", () => {
    const schemas = [
      {
        name: "alpha",
        original: {
          type: "object",
          description: "An object",
          required: [] as string[],
          additionalProperties: true,
        },
        optimized: optimizeSchema({
          type: "object",
          description: "An object",
          required: [],
          additionalProperties: true,
        }),
      },
      {
        name: "beta",
        original: {
          type: "object",
          properties: { val: { type: "boolean", description: "A boolean" } },
        },
        optimized: optimizeSchema({
          type: "object",
          properties: { val: { type: "boolean", description: "A boolean" } },
        }),
      },
    ];
    const report = getSchemaTokenReport(schemas);
    expect(report.totalSaved).toBe(report.totalOriginalTokens - report.totalOptimizedTokens);
    expect(report.totalSaved).toBeGreaterThanOrEqual(0);
  });
});
