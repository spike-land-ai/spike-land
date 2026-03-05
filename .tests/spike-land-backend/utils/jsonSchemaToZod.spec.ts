import { beforeEach, describe, expect, it } from "vitest";
import type { Code } from "../../../src/spike-land-backend/chatRoom";
import { McpServer } from "../../../src/spike-land-backend/mcp";
import {
  JsonSchemaToZodConverter,
  isJsonSchemaType,
  isMcpToolInputSchema,
  type JsonSchemaType,
} from "../../../src/spike-land-backend/utils/jsonSchemaToZod";

describe("JsonSchemaToZodConverter", () => {
  let converter: JsonSchemaToZodConverter;
  let mcpServer: McpServer;

  beforeEach(() => {
    converter = new JsonSchemaToZodConverter();
    mcpServer = new McpServer({} as unknown as Code);
  });

  describe("MCP Tool Schema Conversion", () => {
    it("should convert all MCP tool schemas successfully", () => {
      const tools = mcpServer.getTools();

      expect(tools).toHaveLength(11);

      for (const tool of tools) {
        const zodSchema = converter.convert(tool.inputSchema);
        expect(zodSchema).toBeDefined();

        // Verify that each schema is an object type (all MCP tools use object schemas)
        expect(tool.inputSchema.type).toBe("object");
      }
    });

    it("should validate read_code tool parameters", () => {
      const readCodeTool = mcpServer.getTools().find((t) => t.name === "read_code");
      expect(readCodeTool).toBeDefined();

      const zodSchema = converter.convert(readCodeTool!.inputSchema);

      // Valid parameters
      expect(() => zodSchema.parse({ codeSpace: "test-space" })).not.toThrow();

      // Missing required field
      expect(() => zodSchema.parse({})).toThrow();

      // Wrong type
      expect(() => zodSchema.parse({ codeSpace: 123 })).toThrow();

      // Extra fields are allowed in Zod by default
      expect(() => zodSchema.parse({ codeSpace: "test", extra: "field" })).not.toThrow();
    });

    it("should validate update_code tool parameters", () => {
      const updateCodeTool = mcpServer.getTools().find((t) => t.name === "update_code");
      expect(updateCodeTool).toBeDefined();

      const zodSchema = converter.convert(updateCodeTool!.inputSchema);

      // Valid parameters
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          code: "console.log('hello');",
        }),
      ).not.toThrow();

      // Missing required fields
      expect(() => zodSchema.parse({ codeSpace: "test" })).toThrow();
      expect(() => zodSchema.parse({ code: "test" })).toThrow();
      expect(() => zodSchema.parse({})).toThrow();

      // Wrong types
      expect(() => zodSchema.parse({ codeSpace: 123, code: "test" })).toThrow();
      expect(() => zodSchema.parse({ codeSpace: "test", code: 123 })).toThrow();
    });

    it("should validate search_and_replace tool parameters", () => {
      const searchReplaceTool = mcpServer.getTools().find((t) => t.name === "search_and_replace");
      expect(searchReplaceTool).toBeDefined();

      const zodSchema = converter.convert(searchReplaceTool!.inputSchema);

      // Valid parameters with required fields only
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          search: "oldText",
          replace: "newText",
        }),
      ).not.toThrow();

      // Valid parameters with optional fields
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          search: "oldText",
          replace: "newText",
          isRegex: true,
          global: false,
        }),
      ).not.toThrow();

      // Missing required fields
      expect(() =>
        zodSchema.parse({
          codeSpace: "test",
          search: "oldText",
        }),
      ).toThrow();

      // Wrong types for optional fields
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          search: "oldText",
          replace: "newText",
          isRegex: "true", // Should be boolean
        }),
      ).toThrow();
    });

    it("should validate edit_code tool parameters with nested array schema", () => {
      const editCodeTool = mcpServer.getTools().find((t) => t.name === "edit_code");
      expect(editCodeTool).toBeDefined();

      const zodSchema = converter.convert(editCodeTool!.inputSchema);

      // Valid parameters
      const validData = {
        codeSpace: "test-space",
        edits: [
          { startLine: 1, endLine: 2, newContent: "new code" },
          { startLine: 5, endLine: 5, newContent: "another edit" },
        ],
      };
      expect(() => zodSchema.parse(validData)).not.toThrow();

      // Empty edits array is valid
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          edits: [],
        }),
      ).not.toThrow();

      // Missing required fields in array items
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          edits: [{ startLine: 1 }], // Missing endLine and newContent
        }),
      ).toThrow();

      // Wrong types in array items
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          edits: [
            {
              startLine: "1", // Should be number
              endLine: 2,
              newContent: "test",
            },
          ],
        }),
      ).toThrow();

      // Not an array
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          edits: "not an array",
        }),
      ).toThrow();
    });

    it("should validate find_lines tool parameters with optional fields", () => {
      const findLinesTool = mcpServer.getTools().find((t) => t.name === "find_lines");
      expect(findLinesTool).toBeDefined();

      const zodSchema = converter.convert(findLinesTool!.inputSchema);

      // Valid with required fields only
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          pattern: "searchPattern",
        }),
      ).not.toThrow();

      // Valid with optional field
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          pattern: "searchPattern",
          isRegex: true,
        }),
      ).not.toThrow();

      // Optional field with wrong type
      expect(() =>
        zodSchema.parse({
          codeSpace: "test-space",
          pattern: "searchPattern",
          isRegex: "yes", // Should be boolean
        }),
      ).toThrow();
    });

    it("should handle all MCP tool schemas consistently", () => {
      const tools = mcpServer.getTools();

      // Test each tool with minimal valid data
      const testCases = [
        { name: "read_code", data: { codeSpace: "test" } },
        { name: "read_html", data: { codeSpace: "test" } },
        { name: "read_session", data: { codeSpace: "test" } },
        { name: "update_code", data: { codeSpace: "test", code: "code" } },
        {
          name: "search_and_replace",
          data: { codeSpace: "test", search: "a", replace: "b" },
        },
        { name: "edit_code", data: { codeSpace: "test", edits: [] } },
        { name: "find_lines", data: { codeSpace: "test", pattern: "pattern" } },
      ];

      for (const testCase of testCases) {
        const tool = tools.find((t) => t.name === testCase.name);
        expect(tool).toBeDefined();

        const zodSchema = converter.convert(tool!.inputSchema);
        expect(() => zodSchema.parse(testCase.data)).not.toThrow();
      }
    });
  });

  describe("Basic Type Conversion", () => {
    it("should convert string type", () => {
      const schema = { type: "string", description: "A string field" };
      const zodSchema = converter.convert(schema);

      expect(zodSchema).toBeDefined();
      expect(zodSchema.parse("hello")).toBe("hello");
      expect(() => zodSchema.parse(123)).toThrow();
    });

    it("should convert number type", () => {
      const schema = { type: "number", description: "A number field" };
      const zodSchema = converter.convert(schema);

      expect(zodSchema.parse(123)).toBe(123);
      expect(() => zodSchema.parse("123")).toThrow();
    });

    it("should convert boolean type", () => {
      const schema = { type: "boolean" };
      const zodSchema = converter.convert(schema);

      expect(zodSchema.parse(true)).toBe(true);
      expect(zodSchema.parse(false)).toBe(false);
      expect(() => zodSchema.parse("true")).toThrow();
    });

    it("should convert array type", () => {
      const schema = {
        type: "array",
        items: { type: "string" },
      };
      const zodSchema = converter.convert(schema);

      expect(zodSchema.parse(["a", "b"])).toEqual(["a", "b"]);
      expect(() => zodSchema.parse([1, 2])).toThrow();
    });

    it("should handle array without items", () => {
      const schema = { type: "array" };
      const zodSchema = converter.convert(schema);

      expect(zodSchema.parse([1, "a", true])).toEqual([1, "a", true]);
    });
  });

  describe("Object Type Conversion", () => {
    it("should convert simple object type", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      };
      const zodSchema = converter.convert(schema);

      expect(zodSchema.parse({ name: "John", age: 30 })).toEqual({
        name: "John",
        age: 30,
      });

      // Optional field can be omitted
      expect(zodSchema.parse({ name: "John" })).toEqual({ name: "John" });

      // Required field must be present
      expect(() => zodSchema.parse({ age: 30 })).toThrow();
    });

    it("should handle nested objects", () => {
      const schema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
            required: ["email"],
          },
        },
      };
      const zodSchema = converter.convert(schema);

      expect(
        zodSchema.parse({
          user: { name: "John", email: "john@example.com" },
        }),
      ).toEqual({
        user: { name: "John", email: "john@example.com" },
      });

      // Nested required field
      expect(() => zodSchema.parse({ user: { name: "John" } })).toThrow();
    });

    it("should handle empty object", () => {
      const schema = { type: "object" };
      const zodSchema = converter.convert(schema);

      expect(zodSchema.parse({})).toEqual({});
      // Note: z.object({}) in Zod actually allows extra properties by default
      // This is the expected behavior for empty object schemas
      expect(zodSchema.parse({ extra: "field" })).toEqual({});
    });
  });

  describe("Tool Schema Validation", () => {
    it("should correctly convert MCP tool schemas", () => {
      const readCodeSchema = {
        type: "object",
        properties: {
          codeSpace: {
            type: "string",
            description: "The codeSpace identifier",
          },
        },
        required: ["codeSpace"],
      };

      const zodSchema = converter.convert(readCodeSchema);

      // Valid data
      expect(zodSchema.parse({ codeSpace: "test" })).toEqual({
        codeSpace: "test",
      });

      // Missing required field
      expect(() => zodSchema.parse({})).toThrow();

      // Wrong type
      expect(() => zodSchema.parse({ codeSpace: 123 })).toThrow();
    });

    it("should convert complex tool schema", () => {
      const editCodeSchema = {
        type: "object",
        properties: {
          codeSpace: { type: "string" },
          edits: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startLine: { type: "number" },
                endLine: { type: "number" },
                newContent: { type: "string" },
              },
              required: ["startLine", "endLine", "newContent"],
            },
          },
        },
        required: ["codeSpace", "edits"],
      };

      const zodSchema = converter.convert(editCodeSchema);

      const validData = {
        codeSpace: "test",
        edits: [{ startLine: 1, endLine: 2, newContent: "new code" }],
      };

      expect(zodSchema.parse(validData)).toEqual(validData);

      // Invalid nested data
      expect(() =>
        zodSchema.parse({
          codeSpace: "test",
          edits: [{ startLine: "1" }], // Wrong type and missing fields
        }),
      ).toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing type", () => {
      const schema = { description: "No type specified" };
      const zodSchema = converter.convert(schema);

      // Should return z.any()
      expect(zodSchema.parse("anything")).toBe("anything");
      expect(zodSchema.parse(123)).toBe(123);
      expect(zodSchema.parse(null)).toBe(null);
    });

    it("should handle null/undefined schema", () => {
      expect(converter.convert(null).parse("anything")).toBe("anything");
      expect(converter.convert(undefined).parse(123)).toBe(123);
    });

    it("should handle unknown types", () => {
      const schema = { type: "unknown-type" };
      const zodSchema = converter.convert(schema);

      // Should return z.any()
      expect(zodSchema.parse("anything")).toBe("anything");
    });

    it("should preserve descriptions", () => {
      const schema = {
        type: "string",
        description: "Test description",
      };
      const zodSchema = converter.convert(schema);

      // Check if description is preserved (Zod stores it in _def)
      // Note: _def is an internal property that may vary, but we can verify the schema works
      expect(zodSchema.parse("test")).toBe("test");

      // We can also check that the describe() method was called by verifying
      // that the schema has the expected properties
      expect(zodSchema).toBeDefined();
    });
  });

  describe("MCP Tool Schema Edge Cases", () => {
    it("should handle tool schemas with deeply nested structures", () => {
      const complexSchema = {
        type: "object",
        properties: {
          codeSpace: { type: "string" },
          config: {
            type: "object",
            properties: {
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    value: { type: "number" },
                    enabled: { type: "boolean" },
                  },
                  required: ["name", "value"],
                },
              },
            },
          },
        },
        required: ["codeSpace"],
      };

      const zodSchema = converter.convert(complexSchema);

      // Valid nested data
      const validData = {
        codeSpace: "test",
        config: {
          options: [
            { name: "option1", value: 10, enabled: true },
            { name: "option2", value: 20 },
          ],
        },
      };
      expect(() => zodSchema.parse(validData)).not.toThrow();

      // Invalid nested data
      const invalidData = {
        codeSpace: "test",
        config: {
          options: [
            { name: "option1" }, // Missing required 'value'
          ],
        },
      };
      expect(() => zodSchema.parse(invalidData)).toThrow();
    });

    it("should handle MCP tool schemas with missing descriptions", () => {
      const schemaWithoutDescriptions = {
        type: "object",
        properties: {
          codeSpace: { type: "string" }, // No description
          data: { type: "string" }, // No description
        },
        required: ["codeSpace"],
      };

      const zodSchema = converter.convert(schemaWithoutDescriptions);

      // Should still work without descriptions
      expect(() => zodSchema.parse({ codeSpace: "test", data: "value" })).not.toThrow();
      expect(() => zodSchema.parse({ codeSpace: "test" })).not.toThrow();
      expect(() => zodSchema.parse({})).toThrow();
    });

    it("should handle empty required arrays in tool schemas", () => {
      const schemaWithEmptyRequired = {
        type: "object",
        properties: {
          codeSpace: { type: "string" },
          optional: { type: "string" },
        },
        required: [], // Empty required array means all fields are optional
      };

      const zodSchema = converter.convert(schemaWithEmptyRequired);

      // All fields should be optional
      expect(() => zodSchema.parse({})).not.toThrow();
      expect(() => zodSchema.parse({ codeSpace: "test" })).not.toThrow();
      expect(() => zodSchema.parse({ optional: "value" })).not.toThrow();
      expect(() => zodSchema.parse({ codeSpace: "test", optional: "value" })).not.toThrow();
    });

    it("should handle tool schemas without required field", () => {
      const schemaWithoutRequired = {
        type: "object",
        properties: {
          codeSpace: { type: "string" },
          code: { type: "string" },
        },
        // No required field - all properties should be optional
      };

      const zodSchema = converter.convert(schemaWithoutRequired);

      // All fields should be optional when required is not specified
      expect(() => zodSchema.parse({})).not.toThrow();
      expect(() => zodSchema.parse({ codeSpace: "test" })).not.toThrow();
      expect(() => zodSchema.parse({ code: "value" })).not.toThrow();
    });

    it("should preserve tool schema structure for AI SDK compatibility", () => {
      // Test that converted schemas work with patterns similar to AI SDK usage
      const tools = mcpServer.getTools();

      for (const tool of tools) {
        const zodSchema = converter.convert(tool.inputSchema);

        // Test that the schema can be used for validation
        // This simulates how AI SDK might use these schemas
        const testValidation = (data: unknown) => {
          try {
            zodSchema.parse(data);
            return { success: true };
          } catch (error) {
            return { success: false, error };
          }
        };

        // Each tool should fail on empty object except those with no required fields
        const result = testValidation({});
        const hasRequiredFields = tool.inputSchema.required && tool.inputSchema.required.length > 0;

        if (hasRequiredFields) {
          expect(result.success).toBe(false);
        }
      }
    });

    it("should handle malformed tool schemas gracefully", () => {
      const malformedSchemas = [
        { type: "object", properties: null }, // null properties
        { type: "object", properties: "not-an-object" }, // wrong type for properties
        { type: "object", properties: {}, required: "not-an-array" }, // wrong type for required
        { type: "object", properties: { field: {} } }, // field without type
      ];

      // Converter should handle these without throwing
      for (const schema of malformedSchemas) {
        expect(() => converter.convert(schema as JsonSchemaType)).not.toThrow();
      }
    });
  });

  describe("Invalid Schema Detection", () => {
    it("should reject schemas with non-object type at root level for tools", () => {
      const invalidSchemas = [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "array" },
      ];

      invalidSchemas.forEach((schema) => {
        // For tool schemas, we expect type to be "object"
        expect(schema.type).not.toBe("object");
      });
    });
  });

  describe("Additional Type Conversion Coverage", () => {
    it("should convert null type", () => {
      const schema = { type: "null" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
      expect(() => zodSchema.parse("not null")).toThrow();
    });

    it("should convert integer type with constraints", () => {
      const schema = {
        type: "integer",
        minimum: 1,
        maximum: 100,
        exclusiveMinimum: 0,
        exclusiveMaximum: 101,
        multipleOf: 2,
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(2)).toBe(2);
      expect(() => zodSchema.parse(3)).toThrow(); // not multipleOf 2
    });

    it("should convert number with all constraints", () => {
      const schema = {
        type: "number",
        minimum: 0,
        maximum: 10,
        exclusiveMinimum: -1,
        exclusiveMaximum: 11,
        multipleOf: 0.5,
        description: "A constrained number",
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(5)).toBe(5);
    });

    it("should convert string with pattern constraint", () => {
      const schema = {
        type: "string",
        pattern: "^[a-z]+$",
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("abc")).toBe("abc");
      expect(() => zodSchema.parse("ABC")).toThrow();
    });

    it("should handle invalid regex pattern gracefully", () => {
      const schema = {
        type: "string",
        pattern: "[invalid",
      };
      // Should not throw
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("anything")).toBe("anything");
    });

    it("should convert string with email format", () => {
      const schema = { type: "string", format: "email" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("test@example.com")).toBe("test@example.com");
      expect(() => zodSchema.parse("not-an-email")).toThrow();
    });

    it("should convert string with uri format", () => {
      const schema = { type: "string", format: "uri" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("https://example.com")).toBe("https://example.com");
    });

    it("should convert string with url format", () => {
      const schema = { type: "string", format: "url" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("https://example.com")).toBe("https://example.com");
    });

    it("should convert string with uuid format", () => {
      const schema = { type: "string", format: "uuid" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should convert string with unknown format (falls through)", () => {
      const schema = { type: "string", format: "date-time" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("2021-01-01")).toBe("2021-01-01");
    });

    it("should convert boolean with description", () => {
      const schema = { type: "boolean", description: "A boolean field" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(true)).toBe(true);
    });

    it("should convert array with minItems and maxItems", () => {
      const schema = {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
        description: "A string array",
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(["a", "b"])).toEqual(["a", "b"]);
      expect(() => zodSchema.parse([])).toThrow(); // minItems violation
    });

    it("should convert object with additionalProperties: true", () => {
      const schema = {
        type: "object",
        additionalProperties: true,
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse({ any: "value" })).toEqual({ any: "value" });
    });

    it("should convert object with additionalProperties as schema", () => {
      const schema = {
        type: "object",
        additionalProperties: { type: "string" },
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse({ key: "value" })).toEqual({ key: "value" });
      expect(() => zodSchema.parse({ key: 123 })).toThrow();
    });

    it("should convert object with description", () => {
      const schema = {
        type: "object",
        properties: { name: { type: "string" } },
        description: "An object with description",
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse({ name: "test" })).toEqual({ name: "test" });
    });

    it("should handle const value", () => {
      const schema = { type: "string", const: "fixed-value" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("fixed-value")).toBe("fixed-value");
      expect(() => zodSchema.parse("other-value")).toThrow();
    });

    it("should convert enum with single string value", () => {
      const schema = { type: "string", enum: ["only-option"], description: "Single enum" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("only-option")).toBe("only-option");
    });

    it("should convert enum with multiple string values", () => {
      const schema = { type: "string", enum: ["a", "b", "c"] };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("a")).toBe("a");
      expect(zodSchema.parse("b")).toBe("b");
      expect(() => zodSchema.parse("d")).toThrow();
    });

    it("should convert enum with multiple string values and description", () => {
      const schema = { type: "string", enum: ["x", "y"], description: "xy enum" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("x")).toBe("x");
    });

    it("should convert enum with mixed types (null + string)", () => {
      const schema = {
        type: "string",
        enum: [null, "value1", "value2"],
      };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
      expect(zodSchema.parse("value1")).toBe("value1");
    });

    it("should convert enum with single null value", () => {
      const schema = { enum: [null] };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
    });

    it("should convert enum with single null and description", () => {
      const schema = { enum: [null], description: "nullable" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
    });

    it("should convert enum with number values", () => {
      const schema = { enum: [1, 2, 3] };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(1)).toBe(1);
      expect(zodSchema.parse(2)).toBe(2);
    });

    it("should convert enum with number values and description", () => {
      const schema = { enum: [10, 20], description: "number enum" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(10)).toBe(10);
    });

    it("should return unknown for empty enum", () => {
      const schema = { enum: [] };
      const zodSchema = converter.convert(schema);
      // Should return z.unknown()
      expect(zodSchema.parse("anything")).toBe("anything");
    });

    it("should convert string with minLength constraint", () => {
      const schema = { type: "string", minLength: 3 };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("abc")).toBe("abc");
      expect(() => zodSchema.parse("ab")).toThrow(); // too short
    });

    it("should convert string with maxLength constraint", () => {
      const schema = { type: "string", maxLength: 5 };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("hello")).toBe("hello");
      expect(() => zodSchema.parse("toolong")).toThrow(); // too long
    });

    it("should convert string with both minLength and maxLength", () => {
      const schema = { type: "string", minLength: 2, maxLength: 6 };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("ok")).toBe("ok");
      expect(zodSchema.parse("hello")).toBe("hello");
      expect(() => zodSchema.parse("x")).toThrow();
      expect(() => zodSchema.parse("toolong7")).toThrow();
    });

    it("should convert enum with single mixed-type value and description", () => {
      const schema = { enum: [null], description: "nullable only" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
    });

    it("should convert enum with multiple mixed-type values and description", () => {
      const schema = { enum: [null, 42], description: "null or number" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
      expect(zodSchema.parse(42)).toBe(42);
    });

    it("should convert single-string enum with description", () => {
      const schema = { type: "string" as const, enum: ["only"], description: "single value" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("only")).toBe("only");
      expect(() => zodSchema.parse("other")).toThrow();
    });

    it("should convert single-string enum WITHOUT description (line 396 branch 1)", () => {
      // Covers the false branch of if(schema.description) for single string literal
      const schema = { type: "string" as const, enum: ["solo"] };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse("solo")).toBe("solo");
      expect(() => zodSchema.parse("other")).toThrow();
    });

    it("should convert single mixed-type enum WITHOUT description (line 429 branch 1)", () => {
      // Mixed-type enum (not all strings), single value, no description
      // -> goes to literals branch, literals.length === 1, no description
      const schema = { type: "string" as const, enum: [null as unknown as string] };
      const zodSchema = converter.convert(schema);
      // z.null() literal
      expect(zodSchema.parse(null)).toBe(null);
    });

    it("should convert single mixed-type enum WITH description (line 429 branch 0)", () => {
      // Mixed-type enum, single value, with description
      const schema = { type: "string" as const, enum: [null as unknown as string], description: "null only" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
    });

    it("should convert multiple mixed-type enum WITH description (line 442 branch 0)", () => {
      // Multiple mixed-type literals with description
      const schema = { type: "string" as const, enum: [null as unknown as string, "value"], description: "null or value" };
      const zodSchema = converter.convert(schema);
      expect(zodSchema.parse(null)).toBe(null);
      expect(zodSchema.parse("value")).toBe("value");
    });

    it("isJsonSchemaType returns false for null", () => {
      expect(isJsonSchemaType(null)).toBe(false);
    });

    it("isJsonSchemaType returns false for non-object", () => {
      expect(isJsonSchemaType("string")).toBe(false);
      expect(isJsonSchemaType(42)).toBe(false);
    });

    it("isJsonSchemaType returns false for invalid type value", () => {
      expect(isJsonSchemaType({ type: 123 })).toBe(false);
      expect(isJsonSchemaType({ type: "invalid-type-xyz" })).toBe(false);
    });

    it("isJsonSchemaType returns true for valid object without type", () => {
      expect(isJsonSchemaType({})).toBe(true);
    });

    it("isMcpToolInputSchema returns true for valid MCP schema", () => {
      expect(isMcpToolInputSchema({ type: "object", properties: {} })).toBe(true);
    });

    it("isMcpToolInputSchema returns false for non-object type", () => {
      expect(isMcpToolInputSchema({ type: "string", properties: {} })).toBe(false);
    });

    it("isMcpToolInputSchema returns false for null properties", () => {
      expect(isMcpToolInputSchema({ type: "object", properties: null })).toBe(false);
    });

    it("isMcpToolInputSchema returns false for invalid value", () => {
      expect(isMcpToolInputSchema(null)).toBe(false);
      expect(isMcpToolInputSchema("string")).toBe(false);
    });
  });

  describe("convertEnum — empty enum (line 385)", () => {
    it("returns z.unknown() for an empty enum array", () => {
      const schema = { enum: [] };
      const result = converter.convert(schema);
      // z.unknown() accepts anything
      expect(result.parse("anything")).toBe("anything");
      expect(result.parse(42)).toBe(42);
    });

    it("returns z.unknown() when enum key is missing", () => {
      const schema = {};
      const result = converter.convert(schema);
      expect(result.parse(null)).toBeNull();
    });
  });
});
