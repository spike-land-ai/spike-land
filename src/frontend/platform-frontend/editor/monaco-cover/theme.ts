export interface MonacoThemeColors {
  background: string;
  foreground: string;
  lineNumber: string;
  activeLineNumber: string;
  lineHighlight: string;
  selection: string;
  tokenColors: Record<string, string>;
}

export interface MonacoLayoutConstants {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  paddingTop: number;
  paddingBottom: number;
  tabSize: number;
  lineNumberMinWidth: number;
  lineNumberRightPadding: number;
  contentLeftPadding: number;
}

export const VS_DARK_THEME: MonacoThemeColors = {
  background: "#1E1E1E",
  foreground: "#D4D4D4",
  lineNumber: "#858585",
  activeLineNumber: "#C6C6C6",
  lineHighlight: "#2A2D2E",
  selection: "#264F78",
  tokenColors: {
    keyword: "#569CD6",
    "keyword.flow": "#C586C0",
    string: "#CE9178",
    "string.escape": "#D7BA7D",
    number: "#B5CEA8",
    "number.float": "#B5CEA8",
    "number.hex": "#5BB498",
    comment: "#608B4E",
    "comment.doc": "#608B4E",
    type: "#4EC9B0",
    "type.identifier": "#4EC9B0",
    variable: "#74B0DF",
    "variable.parameter": "#9CDCFE",
    identifier: "#D4D4D4",
    function: "#DCDCAA",
    delimiter: "#DCDCDC",
    "delimiter.bracket": "#DCDCDC",
    bracket: "#D4D4D4",
    regexp: "#B46695",
    annotation: "#CC6666",
    tag: "#569CD6",
    "attribute.name": "#9CDCFE",
    "attribute.value": "#CE9178",
    invalid: "#F44747",
    "meta.tag": "#CE9178",
  },
};

export const VS_LIGHT_THEME: MonacoThemeColors = {
  background: "#FFFFFE",
  foreground: "#000000",
  lineNumber: "#237893",
  activeLineNumber: "#0B216F",
  lineHighlight: "#EDF3FC",
  selection: "#ADD6FF",
  tokenColors: {
    keyword: "#0000FF",
    "keyword.flow": "#AF00DB",
    string: "#A31515",
    "string.escape": "#A31515",
    number: "#098658",
    "number.float": "#098658",
    "number.hex": "#3030C0",
    comment: "#008000",
    "comment.doc": "#008000",
    type: "#008080",
    "type.identifier": "#008080",
    variable: "#001188",
    "variable.parameter": "#001188",
    identifier: "#000000",
    function: "#795E26",
    delimiter: "#000000",
    "delimiter.bracket": "#000000",
    bracket: "#000000",
    regexp: "#800000",
    annotation: "#CC6666",
    tag: "#800000",
    "attribute.name": "#FF0000",
    "attribute.value": "#0451A5",
    invalid: "#CD3131",
    "meta.tag": "#800000",
  },
};

export const LAYOUT: MonacoLayoutConstants = {
  fontSize: 14,
  lineHeight: 22,
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
  paddingTop: 12,
  paddingBottom: 12,
  tabSize: 2,
  lineNumberMinWidth: 36,
  lineNumberRightPadding: 16,
  contentLeftPadding: 16,
};

const CHAR_WIDTH = 8.4;
const GUTTER_PADDING = 20;

export function getTheme(isDark: boolean): MonacoThemeColors {
  return isDark ? VS_DARK_THEME : VS_LIGHT_THEME;
}

export function getGutterWidth(lineCount: number): number {
  const digits = Math.max(1, String(lineCount).length);
  return Math.ceil(digits * CHAR_WIDTH + GUTTER_PADDING);
}
