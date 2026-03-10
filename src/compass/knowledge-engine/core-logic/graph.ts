/**
 * COMPASS Knowledge Engine — In-Memory Graph Store
 *
 * Implements a five-layer directed graph:
 *   Jurisdiction → Program → Process (→ Steps) → Institution → Outcome
 *
 * All primary lookups are O(1) via Maps. Secondary indexes are maintained
 * incrementally on write to keep read paths fast.
 */

import type {
  Deadline,
  Document,
  Institution,
  Jurisdiction,
  Outcome,
  Process,
  Program,
  ProgramSearchResult,
  Step,
} from "../types.ts";

// ── Internal index types ────────────────────────────────────────────────────

interface ProgramProcessLink {
  readonly programId: string;
  readonly processId: string;
}

// ── KnowledgeGraph ──────────────────────────────────────────────────────────

/**
 * Thread-unsafe, single-process in-memory graph.  For production use, swap
 * the underlying Maps for a D1/KV-backed adapter that satisfies the same
 * interface.
 */
export class KnowledgeGraph {
  // ── Primary stores (id → entity) ──────────────────────────────────────────

  private readonly jurisdictions = new Map<string, Jurisdiction>();
  private readonly programs = new Map<string, Program>();
  private readonly processes = new Map<string, Process>();
  private readonly steps = new Map<string, Step>();
  private readonly institutions = new Map<string, Institution>();
  private readonly outcomes = new Map<string, Outcome>();
  private readonly documents = new Map<string, Document>();
  private readonly deadlines = new Map<string, Deadline>();

  // ── Secondary indexes ─────────────────────────────────────────────────────

  /** jurisdictionId → Set<programId> */
  private readonly programsByJurisdiction = new Map<string, Set<string>>();
  /** programId → Set<processId> */
  private readonly processesByProgram = new Map<string, Set<string>>();
  /** processId → Set<stepId> */
  private readonly stepsByProcess = new Map<string, Set<string>>();
  /** institutionId → Set<stepId> */
  private readonly stepsByInstitution = new Map<string, Set<string>>();
  /** processId → Set<outcomeId> */
  private readonly outcomesByProcess = new Map<string, Set<string>>();

  // ── Helpers ───────────────────────────────────────────────────────────────

  private addToSetIndex<K>(index: Map<K, Set<string>>, key: K, value: string): void {
    let set = index.get(key);
    if (set === undefined) {
      set = new Set<string>();
      index.set(key, set);
    }
    set.add(value);
  }

  // ── Layer 1: Jurisdiction ─────────────────────────────────────────────────

  addJurisdiction(jurisdiction: Jurisdiction): void {
    this.jurisdictions.set(jurisdiction.id, jurisdiction);
  }

  getJurisdiction(id: string): Jurisdiction | undefined {
    return this.jurisdictions.get(id);
  }

  getAllJurisdictions(): readonly Jurisdiction[] {
    return [...this.jurisdictions.values()];
  }

  // ── Layer 2: Program ──────────────────────────────────────────────────────

  addProgram(program: Program): void {
    this.programs.set(program.id, program);
    this.addToSetIndex(this.programsByJurisdiction, program.jurisdictionId, program.id);
  }

  getProgram(id: string): Program | undefined {
    return this.programs.get(id);
  }

  /**
   * Returns all Programs belonging to the given jurisdiction.
   * O(k) where k is the number of programs in that jurisdiction.
   */
  getProgramsByJurisdiction(jurisdictionId: string): readonly Program[] {
    const ids = this.programsByJurisdiction.get(jurisdictionId);
    if (ids === undefined) return [];

    const results: Program[] = [];
    for (const id of ids) {
      const program = this.programs.get(id);
      if (program !== undefined) results.push(program);
    }
    return results;
  }

  /**
   * Full-text search across program names, descriptions, tags, and slugs.
   * Scoring is additive: each matching field contributes a weighted point.
   *
   * Field weights:
   *   name  = 3.0   (exact substring match gets bonus 2.0 → total 5.0)
   *   slug  = 2.0
   *   tags  = 1.5   (per matching tag)
   *   desc  = 1.0
   *
   * Results are sorted descending by score; ties preserve insertion order.
   */
  searchPrograms(query: string): readonly ProgramSearchResult[] {
    if (query.trim() === "") return [];

    const normalised = query.toLowerCase().trim();
    const tokens = normalised.split(/\s+/);
    const results: ProgramSearchResult[] = [];

    for (const program of this.programs.values()) {
      const score = this.scoreProgram(program, normalised, tokens);
      if (score > 0) results.push({ program, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  private scoreProgram(
    program: Program,
    normalisedQuery: string,
    tokens: readonly string[],
  ): number {
    let score = 0;
    const lname = program.name.toLowerCase();
    const ldesc = program.description.toLowerCase();
    const lslug = program.slug.toLowerCase();

    // Name: token matches
    for (const token of tokens) {
      if (lname.includes(token)) score += 3.0;
    }
    // Name: exact phrase bonus
    if (lname.includes(normalisedQuery)) score += 2.0;

    // Slug
    for (const token of tokens) {
      if (lslug.includes(token)) score += 2.0;
    }

    // Tags
    for (const tag of program.tags) {
      const ltag = tag.toLowerCase();
      for (const token of tokens) {
        if (ltag.includes(token)) score += 1.5;
      }
    }

    // Description
    for (const token of tokens) {
      if (ldesc.includes(token)) score += 1.0;
    }

    return score;
  }

  // ── Program ↔ Process links ───────────────────────────────────────────────

  /**
   * Registers a Process in the graph and links it to its owning Program.
   * The Process must already have its programId set.
   */
  addProcess(process: Process): void {
    this.processes.set(process.id, process);
    this.addToSetIndex(this.processesByProgram, process.programId, process.id);
  }

  /**
   * Explicitly links an existing Process to a Program.
   * Use this when a process is shared across multiple programs.
   */
  linkProgramToProcess(link: ProgramProcessLink): void {
    const { programId, processId } = link;

    if (!this.programs.has(programId)) {
      throw new Error(`linkProgramToProcess: program "${programId}" not found in graph`);
    }
    if (!this.processes.has(processId)) {
      throw new Error(`linkProgramToProcess: process "${processId}" not found in graph`);
    }

    this.addToSetIndex(this.processesByProgram, programId, processId);
  }

  /** Returns all Processes linked to a given Program. */
  getProcessesForProgram(programId: string): readonly Process[] {
    const ids = this.processesByProgram.get(programId);
    if (ids === undefined) return [];

    const results: Process[] = [];
    for (const id of ids) {
      const process = this.processes.get(id);
      if (process !== undefined) results.push(process);
    }
    return results;
  }

  getProcess(id: string): Process | undefined {
    return this.processes.get(id);
  }

  // ── Layer 3a: Steps ───────────────────────────────────────────────────────

  addStep(step: Step): void {
    this.steps.set(step.id, step);
    this.addToSetIndex(this.stepsByProcess, step.processId, step.id);
    this.addToSetIndex(this.stepsByInstitution, step.institutionId, step.id);
  }

  getStep(id: string): Step | undefined {
    return this.steps.get(id);
  }

  /**
   * Returns Steps for a given Process, sorted by ordinal ascending.
   */
  getStepsForProcess(processId: string): readonly Step[] {
    const ids = this.stepsByProcess.get(processId);
    if (ids === undefined) return [];

    const results: Step[] = [];
    for (const id of ids) {
      const step = this.steps.get(id);
      if (step !== undefined) results.push(step);
    }
    results.sort((a, b) => a.ordinal - b.ordinal);
    return results;
  }

  // ── Layer 4: Institution ──────────────────────────────────────────────────

  addInstitution(institution: Institution): void {
    this.institutions.set(institution.id, institution);
  }

  getInstitution(id: string): Institution | undefined {
    return this.institutions.get(id);
  }

  // ── Layer 5: Outcome ──────────────────────────────────────────────────────

  addOutcome(outcome: Outcome): void {
    this.outcomes.set(outcome.id, outcome);
    this.addToSetIndex(this.outcomesByProcess, outcome.processId, outcome.id);
  }

  getOutcome(id: string): Outcome | undefined {
    return this.outcomes.get(id);
  }

  getOutcomesForProcess(processId: string): readonly Outcome[] {
    const ids = this.outcomesByProcess.get(processId);
    if (ids === undefined) return [];

    const results: Outcome[] = [];
    for (const id of ids) {
      const outcome = this.outcomes.get(id);
      if (outcome !== undefined) results.push(outcome);
    }
    return results;
  }

  // ── Supporting entities ───────────────────────────────────────────────────

  addDocument(document: Document): void {
    this.documents.set(document.id, document);
  }

  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  addDeadline(deadline: Deadline): void {
    this.deadlines.set(deadline.id, deadline);
  }

  getDeadline(id: string): Deadline | undefined {
    return this.deadlines.get(id);
  }

  getDeadlinesForProgram(programId: string): readonly Deadline[] {
    const results: Deadline[] = [];
    for (const deadline of this.deadlines.values()) {
      if (deadline.programId === programId) results.push(deadline);
    }
    return results;
  }

  // ── Graph statistics ──────────────────────────────────────────────────────

  stats(): Readonly<{
    jurisdictions: number;
    programs: number;
    processes: number;
    steps: number;
    institutions: number;
    outcomes: number;
    documents: number;
    deadlines: number;
  }> {
    return {
      jurisdictions: this.jurisdictions.size,
      programs: this.programs.size,
      processes: this.processes.size,
      steps: this.steps.size,
      institutions: this.institutions.size,
      outcomes: this.outcomes.size,
      documents: this.documents.size,
      deadlines: this.deadlines.size,
    };
  }
}
