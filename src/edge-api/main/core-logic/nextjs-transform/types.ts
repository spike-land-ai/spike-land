/**
 * Shared types for the Next.js → edge-native transform engine.
 */

/** Result of transforming a single file. */
export interface TransformResult {
  filename: string;
  original: string;
  transformed: string;
  warnings: string[];
}

/** A file in the source repository. */
export interface RepoFile {
  path: string;
  content: string;
}

/** Full migration report for a Next.js project. */
export interface MigrationReport {
  files: TransformResult[];
  routeTree: string;
  config: string;
  warnings: string[];
}

/** Detected Next.js routing convention. */
export type RoutingConvention = "pages" | "app";

/** A parsed route entry from the file system. */
export interface RouteEntry {
  /** Original file path relative to pages/ or app/ */
  originalPath: string;
  /** Converted TanStack Router path */
  tanstackPath: string;
  /** Whether this is a layout route */
  isLayout: boolean;
  /** Whether this route has dynamic segments */
  isDynamic: boolean;
  /** Child routes (for nested layouts) */
  children: RouteEntry[];
}

/** Options for controlling transform behaviour. */
export interface TransformOptions {
  /** Whether to preserve original code as comments. Default: false */
  preserveOriginal: boolean;
  /** Prefix for environment variables. Default: "VITE_" */
  envPrefix: string;
}

/** Default transform options. */
export const DEFAULT_TRANSFORM_OPTIONS: TransformOptions = {
  preserveOriginal: false,
  envPrefix: "VITE_",
};
