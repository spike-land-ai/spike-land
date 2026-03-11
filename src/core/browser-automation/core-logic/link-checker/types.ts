// All types for the link checker module

export type LinkCategory =
  | "relative_file"
  | "anchor"
  | "file_with_anchor"
  | "github_repo"
  | "github_file"
  | "github_tree"
  | "github_raw"
  | "github_badge"
  | "external_url"
  | "skipped";

export type LinkStatus = "ok" | "broken" | "warning" | "skipped" | "error";

export interface ExtractedLink {
  target: string;
  text: string;
  line: number;
  column: number;
  category: LinkCategory;
  inCodeBlock: boolean;
  inComment: boolean;
}

export interface LinkValidationResult {
  link: ExtractedLink;
  status: LinkStatus;
  httpStatus?: number | undefined;
  reason: string;
  suggestion?: string | undefined;
  durationMs: number;
}

export interface FileReport {
  filePath: string;
  totalLinks: number;
  broken: LinkValidationResult[];
  warnings: LinkValidationResult[];
  ok: LinkValidationResult[];
  skipped: LinkValidationResult[];
  errors: LinkValidationResult[];
}

export interface ScanReport {
  rootDir: string;
  filePattern: string;
  filesScanned: number;
  summary: {
    totalLinks: number;
    broken: number;
    warnings: number;
    ok: number;
    skipped: number;
    errors: number;
  };
  files: FileReport[];
  durationMs: number;
}

export interface CheckerOptions {
  rootDir: string;
  filePattern?: string | undefined;
  files?: string[] | undefined;
  checkExternal?: boolean | undefined;
  checkGithub?: boolean | undefined;
  skipCodeBlocks?: boolean | undefined;
  skipComments?: boolean | undefined;
  githubToken?: string | undefined;
  concurrency?: number | undefined;
  timeout?: number | undefined;
  verbose?: boolean | undefined;
  excludePatterns?: string[] | undefined;
}

export interface ParsedGitHubUrl {
  org: string;
  repo: string;
  type: "repo" | "file" | "tree" | "raw" | "actions" | "badge";
  branch?: string | undefined;
  path?: string | undefined;
  workflow?: string | undefined;
  url: string;
}
