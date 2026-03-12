import { describe, it, expect } from "vitest";
import { deriveSurface } from "../derive-surface";

describe("deriveSurface", () => {
  it("handles flat schema with string, number, boolean, enum", () => {
    const result = deriveSurface({
      name: "test_tool",
      description: "A test tool",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "User name" },
          age: { type: "number", description: "User age" },
          active: { type: "boolean", description: "Is active" },
          role: { type: "string", description: "User role", enum: ["admin", "user", "guest"] },
        },
        required: ["name", "age"],
      },
    });

    expect(result.toolName).toBe("test_tool");
    expect(result.description).toBe("A test tool");
    expect(result.fieldGroups).toHaveLength(2); // Required + Options

    const requiredGroup = result.fieldGroups[0];
    expect(requiredGroup.label).toBe("Required");
    expect(requiredGroup.fields).toHaveLength(2);
    expect(requiredGroup.fields[0].name).toBe("name");
    expect(requiredGroup.fields[0].inputType).toBe("text");
    expect(requiredGroup.fields[0].required).toBe(true);
    expect(requiredGroup.fields[1].name).toBe("age");
    expect(requiredGroup.fields[1].inputType).toBe("number");

    const optionsGroup = result.fieldGroups[1];
    expect(optionsGroup.label).toBe("Options");
    expect(optionsGroup.fields).toHaveLength(2);
    expect(optionsGroup.fields[0].name).toBe("active");
    expect(optionsGroup.fields[0].inputType).toBe("boolean");
    expect(optionsGroup.fields[1].name).toBe("role");
    expect(optionsGroup.fields[1].inputType).toBe("enum");
    expect(optionsGroup.fields[1].enumValues).toEqual(["admin", "user", "guest"]);
  });

  it("handles nested object with recursive FieldSpec", () => {
    const result = deriveSurface({
      name: "nested_tool",
      description: "Tool with nested objects",
      inputSchema: {
        type: "object",
        properties: {
          config: {
            type: "object",
            description: "Configuration",
            properties: {
              host: { type: "string", description: "Hostname" },
              port: { type: "number", description: "Port number" },
            },
            required: ["host"],
          },
        },
        required: ["config"],
      },
    });

    const configField = result.fieldGroups[0].fields[0];
    expect(configField.name).toBe("config");
    expect(configField.inputType).toBe("object");
    expect(configField.nested).toHaveLength(2);
    expect(configField.nested?.[0].name).toBe("host");
    expect(configField.nested?.[0].required).toBe(true);
    expect(configField.nested?.[1].name).toBe("port");
    expect(configField.nested?.[1].required).toBe(false);
  });

  it("handles array of objects with nested items", () => {
    const result = deriveSurface({
      name: "array_tool",
      description: "Tool with array of objects",
      inputSchema: {
        type: "object",
        properties: {
          files: {
            type: "array",
            description: "Files to upload",
            items: {
              type: "object",
              properties: {
                path: { type: "string", description: "File path" },
                content: { type: "string", description: "File content" },
              },
              required: ["path"],
            },
          },
        },
        required: ["files"],
      },
    });

    const filesField = result.fieldGroups[0].fields[0];
    expect(filesField.name).toBe("files");
    expect(filesField.inputType).toBe("array");
    expect(filesField.nested).toHaveLength(2);
    expect(filesField.nested?.[0].name).toBe("path");
    expect(filesField.nested?.[0].required).toBe(true);
    expect(filesField.nested?.[1].name).toBe("content");
    expect(filesField.nested?.[1].required).toBe(false);
  });

  it("parses [hint] prefixes from description", () => {
    const result = deriveSurface({
      name: "hint_tool",
      description: "Tool with hints",
      inputSchema: {
        type: "object",
        properties: {
          body: { type: "string", description: "[textarea] Enter the body text" },
          secret: { type: "string", description: "[hidden] Internal value" },
        },
        required: ["body"],
      },
    });

    const bodyField = result.fieldGroups[0].fields[0];
    expect(bodyField.inputType).toBe("textarea");
    expect(bodyField.description).toBe("Enter the body text");

    const secretField = result.fieldGroups[1].fields[0];
    expect(secretField.inputType).toBe("hidden");
    expect(secretField.description).toBe("Internal value");
  });

  it("treats long-form text field names as textareas", () => {
    const result = deriveSurface({
      name: "bug_tool",
      description: "Tool with bug report fields",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short bug title" },
          description: { type: "string", description: "Detailed bug description" },
          reproduction_steps: { type: "string", description: "Steps to reproduce" },
        },
        required: ["title", "description"],
      },
    });

    const requiredFields = result.fieldGroups[0].fields;
    expect(requiredFields[0].name).toBe("title");
    expect(requiredFields[0].inputType).toBe("text");
    expect(requiredFields[1].name).toBe("description");
    expect(requiredFields[1].inputType).toBe("textarea");

    const optionalFields = result.fieldGroups[1].fields;
    expect(optionalFields[0].name).toBe("reproduction_steps");
    expect(optionalFields[0].inputType).toBe("textarea");
  });

  it("detects semantic types from field names", () => {
    const result = deriveSurface({
      name: "semantic_tool",
      description: "Tool with semantic names",
      inputSchema: {
        type: "object",
        properties: {
          user_email: { type: "string", description: "Email" },
          profile_url: { type: "string", description: "URL" },
          created_date: { type: "string", description: "Date" },
        },
      },
    });

    const fields = result.fieldGroups[0].fields;
    expect(fields[0].inputType).toBe("email");
    expect(fields[0].outputType).toBe("link");
    expect(fields[1].inputType).toBe("url");
    expect(fields[1].outputType).toBe("link");
    expect(fields[2].inputType).toBe("date");
    expect(fields[2].outputType).toBe("date");
  });

  it("groups >5 optional fields with advanced section", () => {
    const properties: Record<string, { type: string; description: string }> = {};
    for (let i = 0; i < 8; i++) {
      properties[`opt_${i}`] = { type: "string", description: `Option ${i}` };
    }

    const result = deriveSurface({
      name: "many_opts",
      description: "Tool with many optional fields",
      inputSchema: {
        type: "object",
        properties,
        required: [],
      },
    });

    expect(result.fieldGroups).toHaveLength(1); // "Options" with first 5
    expect(result.fieldGroups[0].fields).toHaveLength(5);
    expect(result.advancedGroup).toBeDefined();
    expect(result.advancedGroup?.label).toBe("Advanced");
    expect(result.advancedGroup?.fields).toHaveLength(3);
  });

  it("handles empty schema", () => {
    const result = deriveSurface({
      name: "empty_tool",
      description: "No params",
      inputSchema: { type: "object" },
    });

    expect(result.fieldGroups).toHaveLength(0);
    expect(result.advancedGroup).toBeUndefined();
    expect(result.examples).toHaveLength(0);
  });

  it("extracts examples from tool definition", () => {
    const result = deriveSurface({
      name: "example_tool",
      description: "Tool with examples",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
        required: ["query"],
      },
      examples: [
        { label: "Search for cats", args: { query: "cats" } },
        { label: "Search for dogs", args: { query: "dogs" } },
      ],
    });

    expect(result.examples).toHaveLength(2);
    expect(result.examples[0].label).toBe("Search for cats");
    expect(result.examples[0].data).toEqual({ query: "cats" });
  });

  it("handles output type detection for arrays and objects", () => {
    const result = deriveSurface({
      name: "output_types",
      description: "Various output types",
      inputSchema: {
        type: "object",
        properties: {
          avatar_image: { type: "string", description: "Avatar" },
          tags: { type: "array", description: "Tags" },
          metadata: {
            type: "object",
            description: "Metadata",
            properties: {
              key: { type: "string", description: "Key" },
            },
          },
        },
      },
    });

    const fields = result.fieldGroups[0].fields;
    expect(fields[0].outputType).toBe("image"); // avatar_image
    expect(fields[1].outputType).toBe("list"); // tags (simple array)
    expect(fields[2].outputType).toBe("card"); // metadata (object with properties)
  });
});
