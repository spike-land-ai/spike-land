# Jules Fleet Ideas & Experiments

> Track improvement ideas, experiments, and learnings for the Jules workforce
> system.

---

## High Priority Ideas (Next Sprint)

- [ ] Auto-approve plans for low-risk issues (labels: `good-first-issue`,
      `documentation`)
- [ ] Batch similar issues for single Jules session (e.g., all platform
      integrations)
- [ ] Pre-generate task templates for common work patterns
- [ ] Create "test-first" workflow: generate tests before feature implementation
- [ ] Implement smart retry with different prompt approaches

## Medium Priority Ideas

- [ ] Create Jules performance metrics dashboard
- [ ] Auto-assign issues based on complexity scoring
- [ ] Implement competing approaches (same issue, 2 Jules, best wins)
- [ ] Add "warmup" tasks for new work streams
- [ ] Create issue dependency graph for optimal ordering

## Low Priority / Future Ideas

- [ ] Train custom prompts per work stream
- [ ] Implement "pair programming" mode (2 Jules on complex issues)
- [ ] Build automatic code quality scoring
- [ ] Create Jules "personality" profiles for different task types
- [ ] Integrate with external code review tools

---

## Experiments Log

Track experiments tried each iteration with results.

| Iteration | Experiment                 | Hypothesis                         | Result | Keep/Discard |
| --------- | -------------------------- | ---------------------------------- | ------ | ------------ |
| 108       | Increase WIP to 30         | More parallelism = more throughput | TBD    | -            |
| 108       | Auto-publish workflow      | Remove manual bottleneck           | TBD    | -            |
| 108       | Aggressive experimentation | 5+ experiments/iteration           | TBD    | -            |

---

## First Experiments to Try (Iteration 108+)

### Experiment 1: Push to 20 Parallel Sessions

**Hypothesis**: Can we safely 3x the previous WIP limit? **How to test**: Create
20 sessions, monitor for bottlenecks **Success criteria**: No degradation in
quality or completion rate

### Experiment 2: Batch Platform Integrations

**Hypothesis**: Similar issues (TikTok, Pinterest, YouTube) can be done together
**How to test**: Give Jules all 3 in single session **Success criteria**: Faster
completion, code reuse across integrations

### Experiment 3: Competing Approaches

**Hypothesis**: Different prompts produce different quality **How to test**:
Same issue, 2 different prompts, compare results **Success criteria**: Identify
which prompt styles work best

### Experiment 4: Test-First Workflow

**Hypothesis**: Writing tests first improves feature quality **How to test**:
Create test session before feature session **Success criteria**: Higher test
coverage, fewer bugs

### Experiment 5: Prompt Engineering

**Hypothesis**: Specific instructions improve code quality **How to test**: Add
"Write clean, minimal code" to all tasks **Success criteria**: Less
over-engineering, smaller PRs

### Experiment 6: Empty Commit Review Trigger

**Hypothesis**: Empty commit reliably triggers claude-code-review **How to
test**: Try on next ready PR **Success criteria**: Review workflow triggers
consistently

---

## Learnings & Insights

### What Works Well

- (Add learnings here as experiments succeed)

### What Doesn't Work

- (Add failed experiments here to avoid repeating)

### Surprising Discoveries

- (Add unexpected findings here)

---

## Ideas Capture (Raw)

Use this section to quickly jot down ideas during iterations:

```
[2026-01-13] Initial setup of ideas file
- Need to track experiment results systematically
- Consider A/B testing approach for prompts
- Watch for bottlenecks as we scale up parallelism
```

---

## Related Files

- `.claude/ralph-loop.local.md` - Main Ralph workflow
- `.claude/ralph-fleet.md` - Fleet status tracking
- `scripts/ralph/` - Helper scripts
