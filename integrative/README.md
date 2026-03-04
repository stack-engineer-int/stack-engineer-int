# PR Scorer

LLM-powered PR impact scoring with evaluation framework. Calibrate a Fibonacci scale (1, 2, 3, 5, 8) to your team's judgment of PR impact. Use it to measure changes in engineering velocity and quality over time, especially as you introduce new tools and processes.

## Setup

```bash
pnpm install
```

Required environment variables:

- `ANTHROPIC_API_KEY` - for Claude Haiku scoring
- `GOOGLE_GENERATIVE_AI_API_KEY` - for Gemini Flash scoring
- `GITHUB_TOKEN` - for fetching PR data

## Commands

### Score a PR

```bash
pnpm dev score owner/repo#123
pnpm dev score owner/repo#123 --model gemini-flash
```

Outputs a Fibonacci impact score (1, 2, 3, 5, 8) with rationale and confidence.

### Backfill recent PRs

```bash
pnpm dev backfill owner/repo --count 20 --model gemini-flash --concurrency 5
```

Scores the last N merged PRs from a repository. Defaults to Gemini Flash for cost efficiency.

### Run eval suite

```bash
pnpm dev eval
pnpm dev eval --category security,auth --score 5,8
pnpm dev eval --report
```

Runs 31 fixtures across 12 categories (trivial, bugfix, feature, auth, api, database, security, performance, tests, ci, deps, infra). Use `--report` to save results and a Sonnet-generated SWOT analysis to `.pr-scorer/runs/`.

### Record a score override

```bash
pnpm dev override owner/repo#123 --score 5 --reason "This PR fixes a critical auth bypass" --original-score 2
```

Records disagreements between human judgment and AI scoring. Feeds the gap analysis loop.

### Analyze scoring gaps

```bash
pnpm dev gaps
```

Analyzes recorded overrides using LLM gap analysis. Groups similar suggestions into patterns to identify systematic scoring weaknesses.

## Scoring Scale

| Score | Impact   | Example                                            |
| ----- | -------- | -------------------------------------------------- |
| 1     | Trivial  | Typo fix, comment update, dep bump                 |
| 2     | Low      | Small refactor, test addition, config tweak        |
| 3     | Moderate | Bug fix, minor feature, API change                 |
| 5     | High     | Security fix, major feature, breaking change       |
| 8     | Critical | Architecture overhaul, data migration, auth system |

## Eval Results

Eval pass rate across prompt iterations, tested against 31 synthetic fixtures:

| Run          | Model          | Pass Rate   | Changes                                              |
| ------------ | -------------- | ----------- | ---------------------------------------------------- |
| Baseline     | Haiku 4.5      | 77% (24/31) | Initial prompt                                       |
| Model switch | Gemini 3 Flash | 87% (27/31) | Switched to gemini-3-flash-preview                   |
| Prompt v1    | Gemini 3 Flash | 90% (28/31) | Added CI, security patch, deps guidance              |
| Prompt v2    | Gemini 3 Flash | 97% (30/31) | Added data migration, infra scope, UI state guidance |

Full run data (summary, per-fixture JSONL, SWOT analysis) is in `.pr-scorer/runs/`.

```
  100% ┬─────────────────────────────────────── ── ── ── ── ── ── ── ──
       │                                    ●
       │                              ●
   90% ┤                        ●                    - - - - - - - - -
       │                  ●
       │
   80% ┤            ●
       │
       │      ●
   70% ┤
       │
       │
   60% ┤
       ╰──────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────
            Initial  v0   v1    v2    v3    v4    v5    v6    v7   ...
              prompt

       ● Model pass rate          ── Human reviewer (theoretical ceiling)
                                  -- Real-world accuracy (varies per codebase)
```

The model approaches but never lands on the human reviewer line. Each prompt iteration closes the gap on calibration fixtures, but real-world accuracy will be lower due to codebase-specific patterns the fixtures don't cover. The override-gaps loop narrows that second gap over time.

### Why impact scoring, not LOC

PR count, lines of code, additions, deletions: these are activity metrics, not impact metrics. A 3-line SQL injection fix has more impact than a 500-line formatting pass. Impact scoring captures the complexity and significance of a change as a human reviewer would judge it.

Different people will rate the same PR differently. That's expected. The score isn't an objective truth, it's a calibrated approximation of how complex and consequential a change is. What matters is consistency within a team's calibration, not universal agreement.

This makes impact scoring useful as a baseline for measuring changes to the engineering system itself. When you add AI tooling to a team, change the stack, adjust sprint cadence, or modify headcount, you need a stable measure to compare before and after. PR count and LOC are too noisy. A Fibonacci impact score, calibrated to your team's judgment, gives you a signal you can track across those changes.

### On overfitting

These numbers are intentionally overfit on the eval fixtures. The goal of prompt engineering is to maximize alignment against a known set of calibration examples, similar to RLHF (reinforcement learning from human feedback) but without adjusting model weights. You push the prompt until the model's scoring roughly matches what a human reviewer would assign.

Real results will vary. Every codebase has different conventions, PR patterns, and impact thresholds. The scoring prompt (`src/scoring/prompt.ts`) should be tailored to the specifics of the team and application implementing it. The eval-override-gaps loop exists for exactly this: run evals, record disagreements, analyze patterns, refine the prompt, repeat.

## Models

- **Claude Haiku 4.5** (`haiku`) - Default for single PR scoring. Fast, high quality.
- **Gemini 3 Flash** (`gemini-flash`) - Default for batch operations and evals. Cost-effective.
- **Claude Sonnet 4.6** (`sonnet`) - Used for SWOT analysis of eval results. High-quality reasoning.

## Architecture

```
src/
  cli.ts              # Commander CLI entry point
  types.ts            # PRContext interface
  commands/           # CLI command handlers
    score.ts          # Single PR scoring
    backfill.ts       # Batch scoring
    eval.ts           # Eval suite runner
    override.ts       # Human override recording
    gaps.ts           # Gap analysis display
  scoring/
    schema.ts         # Zod schema for impact scores
    prompt.ts         # Scoring prompt with calibration
    models.ts         # Model registry (Haiku, Gemini Flash, Sonnet)
    scorer.ts         # Core scoring function
  diff/
    filter.ts         # Remove lockfiles, build output
    truncate.ts       # Token-aware truncation
  github/
    client.ts         # Octokit wrapper for PR fetching
  evals/
    types.ts          # Fixture and result types
    runner.ts         # Concurrent fixture runner
    report.ts         # JSONL report generation and gap detection
    analysis.ts       # Sonnet-powered SWOT analysis
    fixtures/         # 31 test fixtures across 12 categories
  feedback/
    overrides.ts      # Override persistence (JSON files)
    gap-analysis.ts   # LLM-powered gap analysis
```

## Testing

```bash
pnpm test
```

Tests cover diff filtering, report generation, and gap detection.
