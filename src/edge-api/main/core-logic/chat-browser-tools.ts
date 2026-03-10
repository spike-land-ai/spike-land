interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export const BROWSER_TOOLS: AnthropicTool[] = [
  {
    name: "browser_get_surface",
    description:
      "Capture a compact snapshot of the current browser surface. Use this before clicking or filling so you can target elements by targetId instead of raw selectors.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "browser_navigate",
    description:
      "Navigate the browser to a URL or spike.land app section and return a fresh compact browser surface.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL or path to navigate to" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_click",
    description:
      "Click an element in the browser. Prefer targetId from the latest browser_get_surface result. CSS selector is a fallback.",
    input_schema: {
      type: "object",
      properties: {
        surfaceId: {
          type: "string",
          description: "Surface identifier returned by browser_get_surface",
        },
        targetId: {
          type: "string",
          description: "Element targetId returned by browser_get_surface",
        },
        selector: { type: "string", description: "Fallback CSS selector of the element to click" },
      },
    },
  },
  {
    name: "browser_fill",
    description:
      "Fill an input field with a value. Prefer targetId from the latest browser_get_surface result. CSS selector is a fallback.",
    input_schema: {
      type: "object",
      properties: {
        surfaceId: {
          type: "string",
          description: "Surface identifier returned by browser_get_surface",
        },
        targetId: {
          type: "string",
          description: "Element targetId returned by browser_get_surface",
        },
        selector: { type: "string", description: "Fallback CSS selector of the input element" },
        value: { type: "string", description: "The value to fill in" },
      },
      required: ["value"],
    },
  },
  {
    name: "browser_screenshot",
    description:
      "Take a screenshot of the current browser viewport. Returns a description of what is visible.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "browser_read_text",
    description:
      "Read text content from an element in the browser. Prefer targetId from the latest browser_get_surface result. Defaults to reading the full page body.",
    input_schema: {
      type: "object",
      properties: {
        surfaceId: {
          type: "string",
          description: "Surface identifier returned by browser_get_surface",
        },
        targetId: {
          type: "string",
          description: "Element targetId returned by browser_get_surface",
        },
        selector: {
          type: "string",
          description: "Fallback CSS selector of the element to read (defaults to body)",
        },
      },
    },
  },
  {
    name: "browser_scroll",
    description:
      "Scroll the browser to an element or to a specific vertical position. Prefer targetId from the latest browser_get_surface result.",
    input_schema: {
      type: "object",
      properties: {
        surfaceId: {
          type: "string",
          description: "Surface identifier returned by browser_get_surface",
        },
        targetId: {
          type: "string",
          description: "Element targetId returned by browser_get_surface",
        },
        selector: {
          type: "string",
          description: "Fallback CSS selector of the element to scroll to",
        },
        y: { type: "number", description: "Vertical scroll position in pixels" },
      },
    },
  },
  {
    name: "browser_get_elements",
    description:
      "Legacy helper that returns a compact list of interactive elements. Prefer browser_get_surface for the full compact browser artifact.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector to match elements (defaults to all interactive elements)",
        },
      },
    },
  },
];
