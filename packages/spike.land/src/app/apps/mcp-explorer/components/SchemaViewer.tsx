"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Code2, Info } from "lucide-react";
import type {
  McpToolDef,
  McpToolParam,
} from "@/components/mcp/mcp-tool-registry";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";

interface SchemaViewerProps {
  tool: McpToolDef;
}

interface ParamRowProps {
  param: McpToolParam;
}

function ParamRow({ param }: ParamRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/[0.05] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
      >
        <span className="shrink-0">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
        </span>

        <code className="text-sm font-mono text-cyan-400 flex-1 truncate">
          {param.name}
        </code>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 font-mono text-zinc-400 border-zinc-600"
          >
            {param.type}
          </Badge>
          {param.required && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-red-400 border-red-400/30"
            >
              required
            </Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-white/[0.05]">
          <p className="text-xs text-zinc-400 leading-relaxed">
            {param.description}
          </p>

          {param.default !== undefined && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-600">Default:</span>
              <code className="text-zinc-300 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">
                {JSON.stringify(param.default)}
              </code>
            </div>
          )}

          {param.enumValues && param.enumValues.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-zinc-600 mt-0.5">Values:</span>
              <div className="flex flex-wrap gap-1">
                {param.enumValues.map(val => (
                  <code
                    key={val}
                    className="text-green-400 font-mono bg-green-500/5 border border-green-500/20 px-1.5 py-0.5 rounded"
                  >
                    {val}
                  </code>
                ))}
              </div>
            </div>
          )}

          {param.placeholder && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-600">Example:</span>
              <code className="text-zinc-400 font-mono italic">
                {param.placeholder}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildJsonSchema(tool: McpToolDef): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of tool.params) {
    const schema: Record<string, unknown> = {
      description: param.description,
    };

    switch (param.type) {
      case "string":
        schema.type = "string";
        if (param.placeholder) schema.example = param.placeholder;
        break;
      case "number":
        schema.type = "number";
        break;
      case "boolean":
        schema.type = "boolean";
        break;
      case "enum":
        schema.type = "string";
        if (param.enumValues) schema.enum = param.enumValues;
        break;
    }

    if (param.default !== undefined) {
      schema.default = param.default;
    }

    properties[param.name] = schema;
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    title: tool.displayName,
    description: tool.description,
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

export function SchemaViewer({ tool }: SchemaViewerProps) {
  const jsonSchema = buildJsonSchema(tool);
  const schemaText = JSON.stringify(jsonSchema, null, 2);

  const examplePayload = tool.example
    ? JSON.stringify(tool.example, null, 2)
    : tool.params.length === 0
    ? "{}"
    : JSON.stringify(
      Object.fromEntries(
        tool.params
          .filter(p => p.required)
          .map(p => [p.name, p.placeholder ?? `<${p.name}>`]),
      ),
      null,
      2,
    );

  return (
    <Tabs defaultValue="params" className="flex flex-col h-full">
      <TabsList className="bg-white/[0.03] border-b border-white/[0.06] rounded-none justify-start px-4 shrink-0">
        <TabsTrigger
          value="params"
          className="text-xs data-[state=active]:bg-white/[0.06] rounded-lg"
        >
          <Info className="w-3 h-3 mr-1.5" />
          Parameters ({tool.params.length})
        </TabsTrigger>
        <TabsTrigger
          value="schema"
          className="text-xs data-[state=active]:bg-white/[0.06] rounded-lg"
        >
          <Code2 className="w-3 h-3 mr-1.5" />
          JSON Schema
        </TabsTrigger>
        <TabsTrigger
          value="example"
          className="text-xs data-[state=active]:bg-white/[0.06] rounded-lg"
        >
          Example
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="params" className="h-full mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {tool.params.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-2">
                    <Info className="w-8 h-8 opacity-50" />
                    <p className="text-sm">This tool takes no parameters.</p>
                  </div>
                )
                : (
                  tool.params.map(param => <ParamRow key={param.name} param={param} />)
                )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="schema" className="h-full mt-0">
          <div className="relative h-full">
            <div className="absolute top-2 right-4 z-10">
              <CopyButton text={schemaText} />
            </div>
            <ScrollArea className="h-full">
              <pre className="p-4 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {schemaText}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="example" className="h-full mt-0">
          <div className="relative h-full">
            <div className="absolute top-2 right-4 z-10">
              <CopyButton text={examplePayload} />
            </div>
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <p className="text-xs text-zinc-500">
                  Example request payload for{" "}
                  <code className="text-cyan-400 font-mono">{tool.name}</code>
                </p>
                <pre className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                  {examplePayload}
                </pre>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
