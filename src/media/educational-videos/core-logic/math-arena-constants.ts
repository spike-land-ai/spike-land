/**
 * Math Arena — "42 Rounds to The Book"
 *
 * 7 domains x 6 levels = 42 rounds. Each round is a mathematical challenge
 * evaluated by three judges: Radix (synthesis), Erdos (rigor), Zoltan (code).
 *
 * The number 42: 2 x 3 x 7. The Answer. Also the 5th Catalan number.
 * Also Euler's totient of 42 is 12, and 42 is a pronic number (6 x 7).
 *
 * Docker parallel: each round maps to an independent BuildKit stage.
 * Change one challenge, only that layer reruns. All 42 run concurrently.
 */

// ── Domains ──────────────────────────────────────────────────────────────
export const MATH_ARENA_DOMAINS = [
  {
    id: "number-theory",
    name: "Number Theory",
    icon: "p",
    color: "#DAA520",
    erdosQuote: "God may not play dice, but the primes certainly do.",
  },
  {
    id: "graph-theory",
    name: "Graph Theory",
    icon: "G",
    color: "#4A9EFF",
    erdosQuote: "How many edges force a triangle? That is the question.",
  },
  {
    id: "combinatorics",
    name: "Combinatorics",
    icon: "C",
    color: "#00E5FF",
    erdosQuote: "The probabilistic method: prove it exists without finding it.",
  },
  {
    id: "algebra",
    name: "Algebra",
    icon: "A",
    color: "#9945FF",
    erdosQuote: "Symmetry is the language God forgot to hide.",
  },
  {
    id: "analysis",
    name: "Analysis",
    icon: "R",
    color: "#22c55e",
    erdosQuote: "Every convergent sequence tells a story of patience.",
  },
  {
    id: "geometry",
    name: "Geometry",
    icon: "T",
    color: "#ec4899",
    erdosQuote: "A Mobius strip has one side. Like a good proof.",
  },
  {
    id: "logic",
    name: "Logic & Computability",
    icon: "L",
    color: "#f59e0b",
    erdosQuote: "Godel showed us the limits. We work within them, beautifully.",
  },
] as const;

export type MathDomainId = (typeof MATH_ARENA_DOMAINS)[number]["id"];

// ── Difficulty levels ────────────────────────────────────────────────────
export const ARENA_LEVELS = [
  { level: 1, name: "Epsilon", label: "Warm-up", timeLimitSec: 60, eloFloor: 800 },
  { level: 2, name: "Lemma", label: "Foundation", timeLimitSec: 120, eloFloor: 1000 },
  { level: 3, name: "Theorem", label: "Core", timeLimitSec: 180, eloFloor: 1200 },
  { level: 4, name: "Conjecture", label: "Advanced", timeLimitSec: 300, eloFloor: 1400 },
  { level: 5, name: "Open Problem", label: "Research", timeLimitSec: 600, eloFloor: 1600 },
  { level: 6, name: "Book Proof", label: "Elegant", timeLimitSec: 900, eloFloor: 1800 },
] as const;

// ── The 42 Rounds ────────────────────────────────────────────────────────
export interface ArenaRound {
  id: string;
  round: number;
  domain: MathDomainId;
  level: number;
  title: string;
  challenge: string;
  hint: string;
  /** Judge who leads commentary for this round */
  leadJudge: "radix" | "erdos" | "zoltan";
  /** Function signature for code evaluation */
  signature: string;
  /** Reference solution (The Book proof) */
  bookSolution: string;
}

export const ARENA_ROUNDS: ArenaRound[] = [
  // ── NUMBER THEORY (Rounds 1–6) ──────────────────────────────────────
  {
    id: "nt-1",
    round: 1,
    domain: "number-theory",
    level: 1,
    title: "Sieve of Eratosthenes",
    challenge: "Return all primes up to n.",
    hint: "Cross out multiples. What survives is prime.",
    leadJudge: "erdos",
    signature: "function primes(n: number): number[]",
    bookSolution: `function primes(n) {
  const sieve = Array(n + 1).fill(true); sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= n; i++) if (sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = false;
  return sieve.reduce((acc, v, i) => v ? [...acc, i] : acc, []);
}`,
  },
  {
    id: "nt-2",
    round: 2,
    domain: "number-theory",
    level: 2,
    title: "Euler's Totient",
    challenge: "Compute phi(n): count integers 1..n coprime to n.",
    hint: "phi(p^k) = p^k - p^(k-1). Multiplicative over coprime factors.",
    leadJudge: "erdos",
    signature: "function totient(n: number): number",
    bookSolution: `function totient(n) {
  let result = n;
  for (let p = 2; p * p <= n; p++) {
    if (n % p === 0) { while (n % p === 0) n /= p; result -= result / p; }
  }
  if (n > 1) result -= result / n;
  return result;
}`,
  },
  {
    id: "nt-3",
    round: 3,
    domain: "number-theory",
    level: 3,
    title: "Extended Euclidean Algorithm",
    challenge: "Find x, y such that ax + by = gcd(a, b).",
    hint: "Back-substitute through the Euclidean algorithm steps.",
    leadJudge: "zoltan",
    signature: "function extGcd(a: number, b: number): [number, number, number]",
    bookSolution: `function extGcd(a, b) {
  if (b === 0) return [a, 1, 0];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - Math.floor(a / b) * y1];
}`,
  },
  {
    id: "nt-4",
    round: 4,
    domain: "number-theory",
    level: 4,
    title: "Miller-Rabin Primality",
    challenge: "Implement deterministic Miller-Rabin for n < 3.2 x 10^24.",
    hint: "Write n-1 = 2^s * d. Test witnesses {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}.",
    leadJudge: "erdos",
    signature: "function isPrimeMR(n: number): boolean",
    bookSolution: `function isPrimeMR(n) {
  if (n < 2) return false; if (n < 4) return true; if (n % 2 === 0) return false;
  let d = n - 1, s = 0; while (d % 2 === 0) { d /= 2; s++; }
  for (const a of [2, 3, 5, 7, 11, 13]) {
    if (a >= n) continue; let x = modPow(a, d, n);
    if (x === 1 || x === n - 1) continue; let found = false;
    for (let r = 1; r < s; r++) { x = modPow(x, 2, n); if (x === n - 1) { found = true; break; } }
    if (!found) return false;
  } return true;
}
function modPow(b, e, m) { let r = 1; b %= m; while (e > 0) { if (e % 2 === 1) r = r * b % m; e = Math.floor(e / 2); b = b * b % m; } return r; }`,
  },
  {
    id: "nt-5",
    round: 5,
    domain: "number-theory",
    level: 5,
    title: "Goldbach Partition Counter",
    challenge:
      "Count the number of Goldbach partitions: ways to write 2n as p + q (p <= q, both prime).",
    hint: "Sieve first, then iterate primes p <= n checking if 2n - p is also prime.",
    leadJudge: "radix",
    signature: "function goldbachCount(n: number): number",
    bookSolution: `function goldbachCount(n) {
  const target = 2 * n; const sieve = Array(target + 1).fill(true); sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= target; i++) if (sieve[i]) for (let j = i * i; j <= target; j += i) sieve[j] = false;
  let count = 0;
  for (let p = 2; p <= n; p++) if (sieve[p] && sieve[target - p]) count++;
  return count;
}`,
  },
  {
    id: "nt-6",
    round: 6,
    domain: "number-theory",
    level: 6,
    title: "Erdos-Kac Simulation",
    challenge:
      "Simulate the Erdos-Kac theorem: omega(n) ~ Normal(ln ln n, sqrt(ln ln n)). Return mean and stddev of omega(n) for n in [2..N].",
    hint: "omega(n) = number of distinct prime factors. The theorem says it's normally distributed.",
    leadJudge: "erdos",
    signature: "function erdosKac(N: number): { mean: number; stddev: number }",
    bookSolution: `function erdosKac(N) {
  const omega = Array(N + 1).fill(0);
  for (let p = 2; p <= N; p++) { if (omega[p] === 0) for (let j = p; j <= N; j += p) omega[j]++; }
  const vals = omega.slice(2);
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return { mean, stddev: Math.sqrt(variance) };
}`,
  },

  // ── GRAPH THEORY (Rounds 7–12) ──────────────────────────────────────
  {
    id: "gt-1",
    round: 7,
    domain: "graph-theory",
    level: 1,
    title: "BFS Shortest Path",
    challenge: "Find shortest path length in unweighted graph from source to target.",
    hint: "Breadth-first search. The first time you reach a node is the shortest.",
    leadJudge: "zoltan",
    signature: "function bfs(adj: number[][], src: number, dst: number): number",
    bookSolution: `function bfs(adj, src, dst) {
  const visited = new Set([src]); const queue = [[src, 0]];
  while (queue.length) { const [node, dist] = queue.shift();
    if (node === dst) return dist;
    for (const nb of adj[node]) if (!visited.has(nb)) { visited.add(nb); queue.push([nb, dist + 1]); }
  } return -1;
}`,
  },
  {
    id: "gt-2",
    round: 8,
    domain: "graph-theory",
    level: 2,
    title: "Cycle Detection",
    challenge: "Detect if a directed graph contains a cycle.",
    hint: "Three colors: white (unvisited), gray (in stack), black (done). Gray-to-gray = cycle.",
    leadJudge: "erdos",
    signature: "function hasCycle(adj: number[][]): boolean",
    bookSolution: `function hasCycle(adj) {
  const n = adj.length; const color = Array(n).fill(0);
  function dfs(u) { color[u] = 1; for (const v of adj[u]) { if (color[v] === 1) return true; if (color[v] === 0 && dfs(v)) return true; } color[u] = 2; return false; }
  for (let i = 0; i < n; i++) if (color[i] === 0 && dfs(i)) return true;
  return false;
}`,
  },
  {
    id: "gt-3",
    round: 9,
    domain: "graph-theory",
    level: 3,
    title: "Erdos-Renyi Giant Component",
    challenge: "Simulate G(n, p) random graph. Return size of largest connected component.",
    hint: "Add each edge with probability p. Union-Find gives component sizes.",
    leadJudge: "erdos",
    signature: "function giantComponent(n: number, p: number, seed: number): number",
    bookSolution: `function giantComponent(n, p, seed) {
  const parent = Array.from({length: n}, (_, i) => i); const size = Array(n).fill(1);
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  function union(a, b) { a = find(a); b = find(b); if (a === b) return; if (size[a] < size[b]) [a, b] = [b, a]; parent[b] = a; size[a] += size[b]; }
  let rng = seed;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { rng = (rng * 1103515245 + 12345) & 0x7fffffff; if ((rng / 0x7fffffff) < p) union(i, j); }
  return Math.max(...size);
}`,
  },
  {
    id: "gt-4",
    round: 10,
    domain: "graph-theory",
    level: 4,
    title: "Ramsey R(3,3) Witness",
    challenge:
      "Given a 2-coloring of K_6 edges, find a monochromatic triangle. R(3,3) = 6 guarantees one exists.",
    hint: "Pigeonhole: one vertex has >= 3 same-color edges. Among those 3 neighbors, any same-color edge completes the triangle.",
    leadJudge: "erdos",
    signature: "function ramseyWitness(coloring: number[][]): [number, number, number]",
    bookSolution: `function ramseyWitness(coloring) {
  for (let v = 0; v < 6; v++) {
    const red = [], blue = [];
    for (let u = 0; u < 6; u++) if (u !== v) (coloring[v][u] === 0 ? red : blue).push(u);
    for (const group of [red, blue]) {
      if (group.length >= 3) {
        const c = group === red ? 0 : 1;
        for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++)
          if (coloring[group[i]][group[j]] === c) return [v, group[i], group[j]];
      }
    }
  }
  return [-1, -1, -1];
}`,
  },
  {
    id: "gt-5",
    round: 11,
    domain: "graph-theory",
    level: 5,
    title: "Chromatic Polynomial",
    challenge: "Compute P(G, k): number of proper k-colorings of graph G via deletion-contraction.",
    hint: "P(G, k) = P(G-e, k) - P(G/e, k). Base: empty graph P(E_n, k) = k^n.",
    leadJudge: "radix",
    signature: "function chromaticPoly(adj: boolean[][], k: number): number",
    bookSolution: `function chromaticPoly(adj, k) {
  const n = adj.length; let edge = null;
  for (let i = 0; i < n && !edge; i++) for (let j = i + 1; j < n && !edge; j++) if (adj[i][j]) edge = [i, j];
  if (!edge) return k ** n;
  const [u, v] = edge;
  const del = adj.map(r => [...r]); del[u][v] = del[v][u] = false;
  const cont = Array.from({length: n - 1}, (_, i) => Array(n - 1).fill(false));
  const map = i => i < v ? i : i === v ? u : i - 1;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (adj[i][j] || (i === u && adj[v][j]) || (j === u && adj[v][i])) { const mi = map(i), mj = map(j); if (mi !== mj) cont[mi][mj] = cont[mj][mi] = true; }
  return chromaticPoly(del, k) - chromaticPoly(cont, k);
}`,
  },
  {
    id: "gt-6",
    round: 12,
    domain: "graph-theory",
    level: 6,
    title: "Turan's Theorem Verifier",
    challenge:
      "Verify Turan's theorem: max edges in K_{r+1}-free graph on n vertices = (1 - 1/r) * n^2 / 2. Return true if the given graph is extremal.",
    hint: "The Turan graph T(n,r) is the unique extremal graph. Check if edge count equals the Turan number.",
    leadJudge: "erdos",
    signature: "function isTuranExtremal(adj: boolean[][], r: number): boolean",
    bookSolution: `function isTuranExtremal(adj, r) {
  const n = adj.length; let edges = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (adj[i][j]) edges++;
  const turanEdges = Math.floor((1 - 1 / r) * n * n / 2);
  return edges === turanEdges;
}`,
  },

  // ── COMBINATORICS (Rounds 13–18) ────────────────────────────────────
  {
    id: "cb-1",
    round: 13,
    domain: "combinatorics",
    level: 1,
    title: "Pascal's Triangle Row",
    challenge: "Return the nth row of Pascal's triangle.",
    hint: "C(n,k) = C(n,k-1) * (n-k+1) / k. Build left to right.",
    leadJudge: "radix",
    signature: "function pascalRow(n: number): number[]",
    bookSolution: `function pascalRow(n) {
  const row = [1];
  for (let k = 1; k <= n; k++) row.push(row[k - 1] * (n - k + 1) / k);
  return row;
}`,
  },
  {
    id: "cb-2",
    round: 14,
    domain: "combinatorics",
    level: 2,
    title: "Catalan Number",
    challenge: "Return the nth Catalan number. C_0 = 1, C_{n+1} = sum(C_i * C_{n-i}).",
    hint: "C_n = C(2n, n) / (n + 1). Or use the recurrence with DP.",
    leadJudge: "radix",
    signature: "function catalan(n: number): number",
    bookSolution: `function catalan(n) {
  const dp = Array(n + 1).fill(0); dp[0] = 1;
  for (let i = 1; i <= n; i++) for (let j = 0; j < i; j++) dp[i] += dp[j] * dp[i - 1 - j];
  return dp[n];
}`,
  },
  {
    id: "cb-3",
    round: 15,
    domain: "combinatorics",
    level: 3,
    title: "Derangements",
    challenge: "Count derangements (permutations with no fixed points) of n elements.",
    hint: "D(n) = (n-1)(D(n-1) + D(n-2)). Or D(n) = n! * sum(-1)^k/k!.",
    leadJudge: "erdos",
    signature: "function derangements(n: number): number",
    bookSolution: `function derangements(n) {
  if (n === 0) return 1; if (n === 1) return 0;
  let a = 1, b = 0;
  for (let i = 2; i <= n; i++) { const c = (i - 1) * (a + b); a = b; b = c; }
  return b;
}`,
  },
  {
    id: "cb-4",
    round: 16,
    domain: "combinatorics",
    level: 4,
    title: "Erdos-Ko-Rado Bound",
    challenge:
      "Compute the EKR bound: max number of pairwise intersecting k-subsets of [n]. Return C(n-1, k-1) when n >= 2k.",
    hint: "The theorem: if n >= 2k, max family = C(n-1, k-1). All sets contain a fixed element.",
    leadJudge: "erdos",
    signature: "function ekrBound(n: number, k: number): number",
    bookSolution: `function ekrBound(n, k) {
  if (n < 2 * k) return -1;
  let result = 1;
  for (let i = 0; i < k - 1; i++) result = result * (n - 1 - i) / (i + 1);
  return Math.round(result);
}`,
  },
  {
    id: "cb-5",
    round: 17,
    domain: "combinatorics",
    level: 5,
    title: "Stirling Numbers (2nd kind)",
    challenge: "Compute S(n, k): ways to partition n elements into k non-empty subsets.",
    hint: "S(n,k) = k*S(n-1,k) + S(n-1,k-1). The nth element joins an existing subset or starts a new one.",
    leadJudge: "radix",
    signature: "function stirling2(n: number, k: number): number",
    bookSolution: `function stirling2(n, k) {
  const dp = Array.from({length: n + 1}, () => Array(k + 1).fill(0)); dp[0][0] = 1;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= Math.min(i, k); j++) dp[i][j] = j * dp[i - 1][j] + dp[i - 1][j - 1];
  return dp[n][k];
}`,
  },
  {
    id: "cb-6",
    round: 18,
    domain: "combinatorics",
    level: 6,
    title: "Probabilistic Method: Ramsey Lower Bound",
    challenge:
      "Estimate R(k,k) lower bound via probabilistic method. Return floor(2^((k-1)/2)) for k >= 3.",
    hint: "Erdos 1947: color edges randomly. Expected monochromatic K_k < 1 when n < 2^((k-1)/2).",
    leadJudge: "erdos",
    signature: "function ramseyLowerBound(k: number): number",
    bookSolution: `function ramseyLowerBound(k) {
  if (k < 3) return k;
  return Math.floor(2 ** ((k - 1) / 2));
}`,
  },

  // ── ALGEBRA (Rounds 19–24) ──────────────────────────────────────────
  {
    id: "al-1",
    round: 19,
    domain: "algebra",
    level: 1,
    title: "Matrix Multiply",
    challenge: "Multiply two n x n matrices.",
    hint: "C[i][j] = sum(A[i][k] * B[k][j]). O(n^3) is fine.",
    leadJudge: "zoltan",
    signature: "function matmul(A: number[][], B: number[][]): number[][]",
    bookSolution: `function matmul(A, B) {
  const n = A.length; const C = Array.from({length: n}, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) C[i][j] += A[i][k] * B[k][j];
  return C;
}`,
  },
  {
    id: "al-2",
    round: 20,
    domain: "algebra",
    level: 2,
    title: "Polynomial Evaluation (Horner's Method)",
    challenge: "Evaluate polynomial a_0 + a_1*x + ... + a_n*x^n at point x using Horner's scheme.",
    hint: "Process coefficients from highest degree: result = result * x + a_k.",
    leadJudge: "radix",
    signature: "function horner(coeffs: number[], x: number): number",
    bookSolution: `function horner(coeffs, x) {
  let result = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) result = result * x + coeffs[i];
  return result;
}`,
  },
  {
    id: "al-3",
    round: 21,
    domain: "algebra",
    level: 3,
    title: "Matrix Exponentiation",
    challenge: "Compute M^n mod p using fast exponentiation.",
    hint: "Same as scalar fast power but with matrix multiplication.",
    leadJudge: "zoltan",
    signature: "function matpow(M: number[][], n: number, p: number): number[][]",
    bookSolution: `function matpow(M, n, p) {
  const sz = M.length; let R = Array.from({length: sz}, (_, i) => Array.from({length: sz}, (_, j) => i === j ? 1 : 0));
  let B = M.map(r => r.map(v => ((v % p) + p) % p));
  while (n > 0) {
    if (n % 2 === 1) R = mmul(R, B, p);
    B = mmul(B, B, p); n = Math.floor(n / 2);
  } return R;
}
function mmul(A, B, p) {
  const n = A.length; const C = Array.from({length: n}, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % p;
  return C;
}`,
  },
  {
    id: "al-4",
    round: 22,
    domain: "algebra",
    level: 4,
    title: "Discrete Logarithm (Baby-Giant)",
    challenge: "Find x such that g^x = h (mod p) using baby-step giant-step.",
    hint: "x = i*m + j where m = ceil(sqrt(p)). Build table of g^j, search g^(-im) * h.",
    leadJudge: "erdos",
    signature: "function discreteLog(g: number, h: number, p: number): number",
    bookSolution: `function discreteLog(g, h, p) {
  const m = Math.ceil(Math.sqrt(p)); const table = new Map();
  let pw = 1; for (let j = 0; j < m; j++) { table.set(pw, j); pw = pw * g % p; }
  const gm_inv = modPow(modPow(g, m, p), p - 2, p); let gamma = h;
  for (let i = 0; i < m; i++) { if (table.has(gamma)) return i * m + table.get(gamma); gamma = gamma * gm_inv % p; }
  return -1;
}
function modPow(b, e, m) { let r = 1; b %= m; while (e > 0) { if (e % 2 === 1) r = r * b % m; e = Math.floor(e / 2); b = b * b % m; } return r; }`,
  },
  {
    id: "al-5",
    round: 23,
    domain: "algebra",
    level: 5,
    title: "Group Order from Generators",
    challenge:
      "Given generators of a permutation group on [n], compute the group order via orbit-stabilizer.",
    hint: "|G| = |Orb(x)| * |Stab(x)|. BFS the orbit, then recurse on stabilizer.",
    leadJudge: "radix",
    signature: "function groupOrder(n: number, generators: number[][]): number",
    bookSolution: `function groupOrder(n, generators) {
  if (n === 0 || generators.length === 0) return 1;
  const orbit = new Set([0]); const queue = [0]; const cosetReps = new Map([[0, Array.from({length: n}, (_, i) => i)]]);
  while (queue.length) { const x = queue.shift();
    for (const g of generators) { const y = g[x]; if (!orbit.has(y)) { orbit.add(y); queue.push(y);
      const rep = cosetReps.get(x); cosetReps.set(y, rep.map((_, i) => g[rep[i]])); } } }
  const stabGens = [];
  for (const [pt, rep] of cosetReps) for (const g of generators) { const y = g[pt]; const inv = Array(n); const yRep = cosetReps.get(y);
    for (let i = 0; i < n; i++) inv[yRep[i]] = i; const stab = rep.map((_, i) => inv[g[rep[i]]]); if (stab.some((v, i) => v !== i)) stabGens.push(stab); }
  return orbit.size * (stabGens.length > 0 ? groupOrder(n, stabGens) : 1);
}`,
  },
  {
    id: "al-6",
    round: 24,
    domain: "algebra",
    level: 6,
    title: "Chinese Remainder Theorem (General)",
    challenge:
      "Solve system x = a_i (mod m_i) for pairwise coprime moduli. Return [x, M] where M = product(m_i).",
    hint: "CRT: x = sum(a_i * M_i * y_i) mod M where M_i = M/m_i, y_i = M_i^(-1) mod m_i.",
    leadJudge: "erdos",
    signature: "function crt(residues: number[], moduli: number[]): [number, number]",
    bookSolution: `function crt(residues, moduli) {
  const M = moduli.reduce((a, b) => a * b, 1); let x = 0;
  for (let i = 0; i < moduli.length; i++) {
    const Mi = M / moduli[i]; const [, yi] = extGcd(Mi, moduli[i]);
    x += residues[i] * Mi * ((yi % moduli[i] + moduli[i]) % moduli[i]);
  } return [((x % M) + M) % M, M];
}
function extGcd(a, b) { if (b === 0) return [a, 1, 0]; const [g, x, y] = extGcd(b, a % b); return [g, y, x - Math.floor(a / b) * y]; }`,
  },

  // ── ANALYSIS (Rounds 25–30) ─────────────────────────────────────────
  {
    id: "an-1",
    round: 25,
    domain: "analysis",
    level: 1,
    title: "Numerical Derivative",
    challenge: "Compute f'(x) using central difference: (f(x+h) - f(x-h)) / 2h.",
    hint: "h = 1e-7 is a good default. Central difference is O(h^2) accurate.",
    leadJudge: "zoltan",
    signature: "function derivative(f: (x: number) => number, x: number): number",
    bookSolution: `function derivative(f, x) {
  const h = 1e-7; return (f(x + h) - f(x - h)) / (2 * h);
}`,
  },
  {
    id: "an-2",
    round: 26,
    domain: "analysis",
    level: 2,
    title: "Newton's Method",
    challenge: "Find root of f(x) = 0 using Newton-Raphson iteration.",
    hint: "x_{n+1} = x_n - f(x_n) / f'(x_n). Converges quadratically near a simple root.",
    leadJudge: "zoltan",
    signature:
      "function newton(f: (x: number) => number, df: (x: number) => number, x0: number, tol: number): number",
    bookSolution: `function newton(f, df, x0, tol) {
  let x = x0;
  for (let i = 0; i < 100; i++) { const fx = f(x); if (Math.abs(fx) < tol) return x; x -= fx / df(x); }
  return x;
}`,
  },
  {
    id: "an-3",
    round: 27,
    domain: "analysis",
    level: 3,
    title: "Simpson's Rule Integration",
    challenge:
      "Numerically integrate f over [a, b] using composite Simpson's rule with n intervals.",
    hint: "S = (h/3)(f_0 + 4f_1 + 2f_2 + 4f_3 + ... + f_n). n must be even.",
    leadJudge: "radix",
    signature:
      "function simpson(f: (x: number) => number, a: number, b: number, n: number): number",
    bookSolution: `function simpson(f, a, b, n) {
  if (n % 2 !== 0) n++; const h = (b - a) / n; let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return sum * h / 3;
}`,
  },
  {
    id: "an-4",
    round: 28,
    domain: "analysis",
    level: 4,
    title: "Fast Fourier Transform",
    challenge: "Compute FFT of a complex array (power-of-2 length). Return transformed array.",
    hint: "Cooley-Tukey: split into even/odd, recurse, combine with twiddle factors.",
    leadJudge: "zoltan",
    signature: "function fft(re: number[], im: number[]): [number[], number[]]",
    bookSolution: `function fft(re, im) {
  const n = re.length; if (n === 1) return [re, im];
  const reE = [], imE = [], reO = [], imO = [];
  for (let i = 0; i < n; i += 2) { reE.push(re[i]); imE.push(im[i]); reO.push(re[i + 1]); imO.push(im[i + 1]); }
  const [reEF, imEF] = fft(reE, imE); const [reOF, imOF] = fft(reO, imO);
  const outRe = Array(n), outIm = Array(n);
  for (let k = 0; k < n / 2; k++) {
    const angle = -2 * Math.PI * k / n; const wr = Math.cos(angle), wi = Math.sin(angle);
    const tr = wr * reOF[k] - wi * imOF[k]; const ti = wr * imOF[k] + wi * reOF[k];
    outRe[k] = reEF[k] + tr; outIm[k] = imEF[k] + ti;
    outRe[k + n / 2] = reEF[k] - tr; outIm[k + n / 2] = imEF[k] - ti;
  } return [outRe, outIm];
}`,
  },
  {
    id: "an-5",
    round: 29,
    domain: "analysis",
    level: 5,
    title: "Riemann Zeta (Partial Sum)",
    challenge: "Compute zeta(s) = sum(1/n^s, n=1..N) for real s > 1.",
    hint: "Direct summation for pedagogical clarity. Euler-Maclaurin for speed.",
    leadJudge: "erdos",
    signature: "function zeta(s: number, N: number): number",
    bookSolution: `function zeta(s, N) {
  let sum = 0; for (let n = 1; n <= N; n++) sum += 1 / n ** s;
  return sum;
}`,
  },
  {
    id: "an-6",
    round: 30,
    domain: "analysis",
    level: 6,
    title: "Mandelbrot Escape Iteration",
    challenge:
      "For complex c = (re, im), iterate z_{n+1} = z_n^2 + c. Return iteration count until |z| > 2, or maxIter.",
    hint: "z = (a + bi)^2 + c = (a^2 - b^2 + re) + (2ab + im)i. Escape radius = 2.",
    leadJudge: "zoltan",
    signature: "function mandelbrot(re: number, im: number, maxIter: number): number",
    bookSolution: `function mandelbrot(re, im, maxIter) {
  let a = 0, b = 0;
  for (let i = 0; i < maxIter; i++) {
    const a2 = a * a, b2 = b * b; if (a2 + b2 > 4) return i;
    b = 2 * a * b + im; a = a2 - b2 + re;
  } return maxIter;
}`,
  },

  // ── GEOMETRY (Rounds 31–36) ─────────────────────────────────────────
  {
    id: "ge-1",
    round: 31,
    domain: "geometry",
    level: 1,
    title: "Convex Hull (Gift Wrapping)",
    challenge: "Compute the convex hull of 2D points. Return vertices in counter-clockwise order.",
    hint: "Start from leftmost point. Always turn left. Jarvis march is O(nh).",
    leadJudge: "radix",
    signature: "function convexHull(points: [number, number][]): [number, number][]",
    bookSolution: `function convexHull(points) {
  const n = points.length; if (n < 3) return [...points];
  let start = 0; for (let i = 1; i < n; i++) if (points[i][0] < points[start][0] || (points[i][0] === points[start][0] && points[i][1] < points[start][1])) start = i;
  const hull = []; let current = start;
  do { hull.push(points[current]); let next = 0;
    for (let i = 1; i < n; i++) { if (i === current) continue; const cross = (points[i][0] - points[current][0]) * (points[next][1] - points[current][1]) - (points[i][1] - points[current][1]) * (points[next][0] - points[current][0]);
      if (next === current || cross > 0) next = i; } current = next;
  } while (current !== start); return hull;
}`,
  },
  {
    id: "ge-2",
    round: 32,
    domain: "geometry",
    level: 2,
    title: "Point in Polygon",
    challenge: "Determine if point P is inside polygon using ray casting.",
    hint: "Cast a ray rightward. Count crossings. Odd = inside.",
    leadJudge: "zoltan",
    signature: "function pointInPolygon(p: [number, number], polygon: [number, number][]): boolean",
    bookSolution: `function pointInPolygon(p, polygon) {
  let inside = false; const [px, py] = p;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  } return inside;
}`,
  },
  {
    id: "ge-3",
    round: 33,
    domain: "geometry",
    level: 3,
    title: "Euler Characteristic",
    challenge: "Compute chi = V - E + F for a planar graph given vertices, edges, faces.",
    hint: "For a connected planar graph: V - E + F = 2. Verify Euler's formula.",
    leadJudge: "erdos",
    signature: "function eulerChar(V: number, E: number, F: number): number",
    bookSolution: `function eulerChar(V, E, F) { return V - E + F; }`,
  },
  {
    id: "ge-4",
    round: 34,
    domain: "geometry",
    level: 4,
    title: "Voronoi Nearest Neighbor",
    challenge:
      "Given n sites and a query point, find the nearest site (L2 distance). This is the Voronoi cell lookup.",
    hint: "Brute force O(n) is the honest answer. For many queries, build a kd-tree.",
    leadJudge: "zoltan",
    signature: "function nearestSite(sites: [number, number][], query: [number, number]): number",
    bookSolution: `function nearestSite(sites, query) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < sites.length; i++) { const d = (sites[i][0] - query[0]) ** 2 + (sites[i][1] - query[1]) ** 2; if (d < bestDist) { bestDist = d; best = i; } }
  return best;
}`,
  },
  {
    id: "ge-5",
    round: 35,
    domain: "geometry",
    level: 5,
    title: "Mobius Strip Parameterization",
    challenge:
      "Generate 3D points on a Mobius strip. Return [x, y, z] for parameter (u, v) where u in [0, 2pi], v in [-1, 1].",
    hint: "x = (1 + v/2 * cos(u/2)) * cos(u), y = (1 + v/2 * cos(u/2)) * sin(u), z = v/2 * sin(u/2).",
    leadJudge: "erdos",
    signature: "function mobius(u: number, v: number): [number, number, number]",
    bookSolution: `function mobius(u, v) {
  const x = (1 + v / 2 * Math.cos(u / 2)) * Math.cos(u);
  const y = (1 + v / 2 * Math.cos(u / 2)) * Math.sin(u);
  const z = v / 2 * Math.sin(u / 2);
  return [x, y, z];
}`,
  },
  {
    id: "ge-6",
    round: 36,
    domain: "geometry",
    level: 6,
    title: "Gauss-Bonnet Discrete",
    challenge:
      "Compute the discrete Gauss-Bonnet sum for a triangulated surface. Sum of angle defects should equal 2*pi*chi.",
    hint: "Angle defect at vertex v = 2*pi - sum(angles at v). Total defect = 2*pi*chi.",
    leadJudge: "erdos",
    signature:
      "function gaussBonnet(vertices: [number, number, number][], faces: [number, number, number][]): number",
    bookSolution: `function gaussBonnet(vertices, faces) {
  const angleSum = new Map();
  for (const [a, b, c] of faces) {
    for (const [v, u, w] of [[a, b, c], [b, c, a], [c, a, b]]) {
      const vu = vertices[u].map((x, i) => x - vertices[v][i]);
      const vw = vertices[w].map((x, i) => x - vertices[v][i]);
      const dot = vu.reduce((s, x, i) => s + x * vw[i], 0);
      const mag = Math.sqrt(vu.reduce((s, x) => s + x * x, 0)) * Math.sqrt(vw.reduce((s, x) => s + x * x, 0));
      const angle = Math.acos(Math.max(-1, Math.min(1, dot / mag)));
      angleSum.set(v, (angleSum.get(v) || 0) + angle);
    }
  }
  let totalDefect = 0;
  for (const sum of angleSum.values()) totalDefect += 2 * Math.PI - sum;
  return totalDefect;
}`,
  },

  // ── LOGIC & COMPUTABILITY (Rounds 37–42) ────────────────────────────
  {
    id: "lo-1",
    round: 37,
    domain: "logic",
    level: 1,
    title: "Truth Table Generator",
    challenge: "Generate all rows of a truth table for n boolean variables.",
    hint: "2^n rows. Row i: bit j of i gives variable j's value.",
    leadJudge: "radix",
    signature: "function truthTable(n: number): boolean[][]",
    bookSolution: `function truthTable(n) {
  const rows = []; for (let i = 0; i < (1 << n); i++) { const row = [];
    for (let j = n - 1; j >= 0; j--) row.push(Boolean((i >> j) & 1)); rows.push(row); }
  return rows;
}`,
  },
  {
    id: "lo-2",
    round: 38,
    domain: "logic",
    level: 2,
    title: "SAT Solver (Brute Force)",
    challenge: "Check if a CNF formula is satisfiable. Return satisfying assignment or null.",
    hint: "Try all 2^n assignments. Short-circuit on first SAT.",
    leadJudge: "zoltan",
    signature: "function sat(clauses: number[][], nVars: number): boolean[] | null",
    bookSolution: `function sat(clauses, nVars) {
  for (let mask = 0; mask < (1 << nVars); mask++) {
    const assignment = Array.from({length: nVars}, (_, i) => Boolean((mask >> i) & 1));
    const sat = clauses.every(clause => clause.some(lit => lit > 0 ? assignment[lit - 1] : !assignment[-lit - 1]));
    if (sat) return assignment;
  } return null;
}`,
  },
  {
    id: "lo-3",
    round: 39,
    domain: "logic",
    level: 3,
    title: "Turing Machine Simulator",
    challenge:
      "Simulate a single-tape Turing machine for up to maxSteps. Return final tape contents.",
    hint: "State + head position + tape. Apply transition function. Halt when no transition matches.",
    leadJudge: "radix",
    signature:
      "function turing(transitions: Record<string, Record<string, [string, string, number]>>, input: string, maxSteps: number): string",
    bookSolution: `function turing(transitions, input, maxSteps) {
  const tape = [...input]; let head = 0, state = 'q0';
  for (let step = 0; step < maxSteps; step++) {
    if (!transitions[state]) break; const sym = tape[head] || '_';
    const tr = transitions[state][sym]; if (!tr) break;
    const [newState, newSym, dir] = tr; tape[head] = newSym; state = newState; head += dir;
    if (head < 0) { tape.unshift('_'); head = 0; } if (head >= tape.length) tape.push('_');
  } return tape.join('').replace(/^_+|_+$/g, '') || '_';
}`,
  },
  {
    id: "lo-4",
    round: 40,
    domain: "logic",
    level: 4,
    title: "Lambda Calculus Beta Reducer",
    challenge: "Perform one step of beta reduction on a lambda term represented as nested arrays.",
    hint: "((lambda x. M) N) -> M[x := N]. Watch for variable capture.",
    leadJudge: "radix",
    signature: "function betaReduce(term: unknown): unknown",
    bookSolution: `function betaReduce(term) {
  if (!Array.isArray(term)) return term;
  if (term[0] === 'lam') return ['lam', term[1], betaReduce(term[2])];
  if (Array.isArray(term[0]) && term[0][0] === 'lam') { const [, param, body] = term[0]; return substitute(body, param, term[1]); }
  return [betaReduce(term[0]), term[1]];
}
function substitute(expr, name, value) {
  if (typeof expr === 'string') return expr === name ? value : expr;
  if (!Array.isArray(expr)) return expr;
  if (expr[0] === 'lam') { if (expr[1] === name) return expr; return ['lam', expr[1], substitute(expr[2], name, value)]; }
  return [substitute(expr[0], name, value), substitute(expr[1], name, value)];
}`,
  },
  {
    id: "lo-5",
    round: 41,
    domain: "logic",
    level: 5,
    title: "Godel Encoding",
    challenge:
      "Encode a sequence of natural numbers as a single Godel number: product(p_i ^ a_i) where p_i is the ith prime.",
    hint: "Generate primes, raise each to the corresponding power, multiply.",
    leadJudge: "erdos",
    signature: "function godelEncode(seq: number[]): bigint",
    bookSolution: `function godelEncode(seq) {
  const primes = []; let candidate = 2;
  while (primes.length < seq.length) { let isPrime = true;
    for (const p of primes) { if (p * p > candidate) break; if (candidate % p === 0) { isPrime = false; break; } }
    if (isPrime) primes.push(candidate); candidate++; }
  let result = 1n;
  for (let i = 0; i < seq.length; i++) result *= BigInt(primes[i]) ** BigInt(seq[i]);
  return result;
}`,
  },
  {
    id: "lo-6",
    round: 42,
    domain: "logic",
    level: 6,
    title: "The Halting Oracle (Round 42)",
    challenge:
      "Given a program as a state machine and an input, simulate for maxSteps. Return 'halts' if it terminates, 'unknown' if it exceeds the budget. The honest answer to the undecidable.",
    hint: "We cannot solve the halting problem. But we can be honest about our limits. Simulate and report. 42.",
    leadJudge: "erdos",
    signature:
      "function haltingOracle(transitions: Record<string, Record<string, [string, string, number]>>, input: string, maxSteps: number): 'halts' | 'unknown'",
    bookSolution: `function haltingOracle(transitions, input, maxSteps) {
  const tape = [...input]; let head = 0, state = 'q0';
  for (let step = 0; step < maxSteps; step++) {
    if (!transitions[state]) return 'halts'; const sym = tape[head] || '_';
    const tr = transitions[state]?.[sym]; if (!tr) return 'halts';
    const [newState, newSym, dir] = tr; tape[head] = newSym; state = newState; head += dir;
    if (head < 0) { tape.unshift('_'); head = 0; } if (head >= tape.length) tape.push('_');
  } return 'unknown';
}`,
  },
];

// ── Scoring ──────────────────────────────────────────────────────────────
export const ARENA_SCORING = {
  /** K-factor for ELO updates */
  kFactor: 32,
  /** Starting ELO for new contestants */
  startingElo: 1200,
  /** Bonus for Book-proof elegance (awarded by Erdos) */
  eleganceBonus: 50,
  /** Penalty per second over time limit */
  timePenaltyPerSec: 2,
  /** Perfect round bonus (all three judges approve) */
  unanimousBonus: 100,
} as const;

// ── Remotion Video Timing ────────────────────────────────────────────────
export const MATH_ARENA_FPS = 30;

export const MATH_ARENA_DURATIONS = {
  /** Grand opening — "42 Rounds to The Book" title card */
  opening: 150, // 5s
  /** Per-round timing */
  roundIntro: 90, // 3s — domain + title card
  roundChallenge: 180, // 6s — show challenge + hint
  roundSolution: 120, // 4s — reveal Book solution
  roundVerdict: 90, // 3s — judge verdicts
  /** Inter-round transition */
  transition: 30, // 1s
  /** Aggregate results */
  leaderboard: 300, // 10s
  /** Final verdict + Erdos closing */
  finale: 300, // 10s
} as const;

/** Total frames for full arena video */
export const MATH_ARENA_TOTAL_FRAMES =
  MATH_ARENA_DURATIONS.opening +
  42 *
    (MATH_ARENA_DURATIONS.roundIntro +
      MATH_ARENA_DURATIONS.roundChallenge +
      MATH_ARENA_DURATIONS.roundSolution +
      MATH_ARENA_DURATIONS.roundVerdict +
      MATH_ARENA_DURATIONS.transition) +
  MATH_ARENA_DURATIONS.leaderboard +
  MATH_ARENA_DURATIONS.finale;

// ── Helpers ──────────────────────────────────────────────────────────────

export function getRoundsByDomain(domain: MathDomainId): ArenaRound[] {
  return ARENA_ROUNDS.filter((r) => r.domain === domain);
}

export function getRoundByNumber(round: number): ArenaRound | undefined {
  return ARENA_ROUNDS.find((r) => r.round === round);
}

export function getDomainForRound(round: number): (typeof MATH_ARENA_DOMAINS)[number] | undefined {
  const r = getRoundByNumber(round);
  if (!r) return undefined;
  return MATH_ARENA_DOMAINS.find((d) => d.id === r.domain);
}

export function getLevelForRound(round: number): (typeof ARENA_LEVELS)[number] | undefined {
  const r = getRoundByNumber(round);
  if (!r) return undefined;
  return ARENA_LEVELS.find((l) => l.level === r.level);
}
