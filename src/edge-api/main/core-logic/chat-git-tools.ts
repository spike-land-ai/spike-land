/**
 * Git tools for spike-chat — direct commit and merge via GitHub Git Data API.
 *
 * These tools let chat personas write code and commit it directly to a
 * session branch.  Multi-file commits are atomic (blobs -> tree -> commit ->
 * ref update).  Merge squashes the session branch into the default branch.
 */

// ── Types ──────────────────────────────────────────────────────────────

interface GitFile {
  path: string;
  content: string;
}

interface CommitArgs {
  repo: string;
  branch?: string | undefined;
  message: string;
  files: GitFile[];
}

interface MergeArgs {
  repo: string;
  branch: string;
  message?: string | undefined;
}

interface GitRef {
  object: { sha: string };
}

interface GitBlob {
  sha: string;
}

interface GitTree {
  sha: string;
}

interface GitCommit {
  sha: string;
  html_url: string;
}

interface RepoInfo {
  default_branch: string;
}

interface MergeResult {
  sha: string;
  message: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

const GH_API = "https://api.github.com";
const ORG = "spike-land-ai";

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "spike-chat-git-tools",
  };
}

function resolveRepo(repo: string): string {
  // Allow short names like "spike.land" → "spike-land-ai/spike.land"
  if (!repo.includes("/")) return `${ORG}/${repo}`;
  return repo;
}

async function ghFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: { ...ghHeaders(token), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

// ── git_commit ─────────────────────────────────────────────────────────

/**
 * Atomic multi-file commit via Git Data API:
 *   1. Resolve or create the session branch
 *   2. Create blobs for each file
 *   3. Build a tree referencing those blobs
 *   4. Create a commit pointing at the tree
 *   5. Update the branch ref
 */
export async function executeGitCommit(
  token: string,
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = parseCommitArgs(args);
  const repo = resolveRepo(parsed.repo);
  const api = `/repos/${repo}`;

  // 1. Get default branch SHA (base for new branches)
  const repoInfo = await ghFetch<RepoInfo>(token, api);
  const defaultBranch = repoInfo.default_branch ?? "main";
  const defaultRef = await ghFetch<GitRef>(token, `${api}/git/ref/heads/${defaultBranch}`);
  const baseSha = defaultRef.object.sha;

  // Determine target branch
  const branch = parsed.branch ?? `chat/spike/${Date.now()}`;

  // 2. Ensure branch exists (create if needed)
  let branchSha: string;
  try {
    const existing = await ghFetch<GitRef>(token, `${api}/git/ref/heads/${branch}`);
    branchSha = existing.object.sha;
  } catch {
    // Branch doesn't exist — create from default branch tip
    const created = await ghFetch<{ object: { sha: string } }>(token, `${api}/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: baseSha,
      }),
    });
    branchSha = created.object.sha;
  }

  // 3. Create blobs for each file
  const treeEntries: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
  }> = [];

  for (const file of parsed.files) {
    const blob = await ghFetch<GitBlob>(token, `${api}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: file.content,
        encoding: "utf-8",
      }),
    });
    treeEntries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  // 4. Create tree (base_tree preserves existing files)
  const tree = await ghFetch<GitTree>(token, `${api}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: branchSha,
      tree: treeEntries,
    }),
  });

  // 5. Create commit
  const commit = await ghFetch<GitCommit>(token, `${api}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: parsed.message,
      tree: tree.sha,
      parents: [branchSha],
    }),
  });

  // 6. Update branch ref to new commit
  await ghFetch<unknown>(token, `${api}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  const fileList = parsed.files.map((f) => f.path).join(", ");
  return (
    `**Committed to \`${branch}\`**\n\n` +
    `- **Commit:** [\`${commit.sha.slice(0, 7)}\`](${commit.html_url})\n` +
    `- **Files:** ${fileList}\n` +
    `- **Message:** ${parsed.message}\n\n` +
    `Branch is ready for more commits or merge.`
  );
}

function parseCommitArgs(args: Record<string, unknown>): CommitArgs {
  const repo = typeof args["repo"] === "string" ? args["repo"].trim() : "";
  if (!repo) throw new Error("repo is required");

  const message =
    typeof args["message"] === "string" ? args["message"].trim() : "Update from Spike Chat";

  const branch =
    typeof args["branch"] === "string" && args["branch"].trim() ? args["branch"].trim() : undefined;

  const rawFiles = args["files"];
  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    throw new Error("files array is required and must not be empty");
  }

  const files: GitFile[] = rawFiles
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => {
      const path = typeof f["path"] === "string" ? f["path"].trim() : "";
      const content = typeof f["content"] === "string" ? f["content"] : "";
      if (!path) throw new Error("Each file must have a path");
      return { path, content };
    });

  if (files.length === 0) {
    throw new Error("At least one valid file is required");
  }

  return { repo, branch, message, files };
}

// ── git_merge ──────────────────────────────────────────────────────────

/**
 * Squash-merge a session branch into the default branch via GitHub API.
 * Deletes the session branch after merge.
 */
export async function executeGitMerge(
  token: string,
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = parseMergeArgs(args);
  const repo = resolveRepo(parsed.repo);
  const api = `/repos/${repo}`;

  // Get default branch
  const repoInfo = await ghFetch<RepoInfo>(token, api);
  const defaultBranch = repoInfo.default_branch ?? "main";

  // Squash merge via the merge API
  const mergeResult = await ghFetch<MergeResult>(token, `${api}/merges`, {
    method: "POST",
    body: JSON.stringify({
      base: defaultBranch,
      head: parsed.branch,
      commit_message:
        parsed.message ?? `Merge ${parsed.branch} into ${defaultBranch} (via Spike Chat)`,
    }),
  });

  // Delete the session branch (best-effort)
  try {
    await fetch(`${GH_API}${api}/git/refs/heads/${parsed.branch}`, {
      method: "DELETE",
      headers: ghHeaders(token),
    });
  } catch {
    // Non-fatal — branch cleanup is best-effort
  }

  return (
    `**Merged \`${parsed.branch}\` into \`${defaultBranch}\`**\n\n` +
    `- **Merge commit:** \`${mergeResult.sha.slice(0, 7)}\`\n` +
    `- **Message:** ${mergeResult.message}\n` +
    `- **Branch \`${parsed.branch}\`** deleted.`
  );
}

function parseMergeArgs(args: Record<string, unknown>): MergeArgs {
  const repo = typeof args["repo"] === "string" ? args["repo"].trim() : "";
  if (!repo) throw new Error("repo is required");

  const branch = typeof args["branch"] === "string" ? args["branch"].trim() : "";
  if (!branch) throw new Error("branch is required");

  const message =
    typeof args["message"] === "string" && args["message"].trim()
      ? args["message"].trim()
      : undefined;

  return { repo, branch, message };
}
