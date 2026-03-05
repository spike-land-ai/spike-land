/**
 * HackerNews MCP Server — Types & Helpers
 */

// ─── HN Item Types ───

export type HNItemType = "story" | "comment" | "job" | "poll" | "pollopt";

export interface HNItem {
  id: number;
  type: HNItemType;
  by?: string;
  time?: number;
  text?: string;
  url?: string;
  title?: string;
  score?: number;
  descendants?: number;
  kids?: number[];
  parent?: number;
  parts?: number[];
  poll?: number;
  dead?: boolean;
  deleted?: boolean;
}

export interface HNItemWithComments extends HNItem {
  comments: HNCommentNode[];
}

export interface HNCommentNode {
  id: number;
  by?: string | undefined;
  time?: number | undefined;
  text?: string | undefined;
  dead?: boolean | undefined;
  deleted?: boolean | undefined;
  children: HNCommentNode[];
}

// ─── HN User ───

export interface HNUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

// ─── Story Categories ───

export type StoryCategory = "top" | "new" | "best" | "ask" | "show" | "job";

export const STORY_CATEGORY_ENDPOINTS: Record<StoryCategory, string> = {
  top: "topstories",
  new: "newstories",
  best: "beststories",
  ask: "askstories",
  show: "showstories",
  job: "jobstories",
};

// ─── Algolia Search ───

export interface AlgoliaSearchParams {
  query: string;
  sortBy?: "relevance" | "date" | undefined;
  tags?: string | undefined;
  page?: number | undefined;
  hitsPerPage?: number | undefined;
  numericFilters?: string | undefined;
}

export interface AlgoliaHit {
  objectID: string;
  title?: string;
  url?: string;
  author: string;
  points?: number;
  num_comments?: number;
  created_at: string;
  story_text?: string;
  comment_text?: string;
  _tags: string[];
}

export interface AlgoliaSearchResult {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

// ─── HN Updates ───

export interface HNUpdates {
  items: number[];
  profiles: string[];
}

// ─── Session / Auth ───

export interface SessionState {
  username: string | null;
  cookie: string | null;
  loggedInAt: number | null;
}

// ─── Error Codes ───

export type HNErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_FAILED"
  | "CSRF_EXPIRED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "INVALID_INPUT"
  | "SUBMIT_FAILED"
  | "VOTE_FAILED"
  | "COMMENT_FAILED";

// ─── Result Helpers (re-exported from mcp-server-base) ───

export {
  type CallToolResult,
  errorResult,
  jsonResult,
  tryCatch,
} from "@spike-land-ai/mcp-server-base";

// ─── Fetch Type (for DI) ───

export type FetchFn = typeof globalThis.fetch;

// ─── API Base URLs ───

export const HN_FIREBASE_BASE = "https://hacker-news.firebaseio.com/v0";
export const HN_WEB_BASE = "https://news.ycombinator.com";
export const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";
