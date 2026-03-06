export { editor, languages, Range, typescript, Uri } from "monaco-editor";
export const version = "0.55.1";
const baseUrl = "https://esm.spike.land/monaco-editor@0.55.1/min/vs";

const MonacoEnvironment = {
  baseUrl,

  getWorkerUrl: (_moduleId: string, label: string) => {
    if (label === "typescript" || label === "javascript") {
      return `${baseUrl}/language/typescript/ts.worker.js`;
    }
    if (label === "json") {
      return `${baseUrl}/language/json/json.worker.js`;
    }
    if (label === "css" || label === "scss" || label === "less") {
      return `${baseUrl}/language/css/css.worker.js`;
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return `${baseUrl}/language/html/html.worker.js`;
    }
    return `${baseUrl}/editor/editor.worker.js`;
  },
};

Object.assign(globalThis, { MonacoEnvironment });
