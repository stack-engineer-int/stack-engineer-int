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

### Calibrate from review table

```bash
# 1. Score PRs and write a review table
pnpm dev backfill owner/repo --count 20 --review

# 2. Edit .pr-scorer/reviews/YYYY-MM-DD-owner-repo.md
#    Fill in "Your Score" and "Reason" where you disagree

# 3. Create overrides from your edits
pnpm dev calibrate .pr-scorer/reviews/2026-03-04-owner-repo.md

# 4. Analyze patterns
pnpm dev gaps
```

The review table captures all scores in a single markdown file. Edit it to record disagreements, then `calibrate` reads your edits back as overrides. Faster than running `override` per PR.

## Calibration Loop

The scoring prompt isn't static. It improves through a feedback cycle:

```
eval fixtures ──→ run evals ──→ identify gaps ──→ refine prompt ──┐
      ↑                                                           │
      └───────────────────────────────────────────────────────────┘

real PRs ──→ score ──→ human disagrees ──→ record override ──→ gap analysis ──→ prompt update
```

**Eval loop**: Run the 31-fixture suite, find where the model diverges from expected scores, update the prompt with calibration guidance, re-run. Four iterations took pass rate from 77% to 97%.

**Production loop**: Score real PRs, record disagreements with `override`, run `gaps` to cluster similar misscores into patterns, update the prompt to address systematic weaknesses. This is where codebase-specific calibration happens.

The two loops reinforce each other. Eval fixtures catch regressions when the prompt changes. Overrides catch patterns the fixtures don't cover.

## Structured Output

All LLM scoring calls return Zod-validated objects, not free text. The schema constrains responses to a Fibonacci score, confidence level, rationale, key changes, and affected areas. Invalid output fails at parse time rather than propagating downstream.

This matters for batch operations. When you score 20 PRs in parallel, you need every response to conform to the same shape. Structured output with `Output.object` (Vercel AI SDK) makes LLM calls behave like typed API endpoints.

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

Different tasks have different cost/quality profiles. Single PR scoring is latency-sensitive and infrequent, so it gets the higher-quality model. Batch operations (backfill 20 PRs, run 31 eval fixtures) are throughput-sensitive and cost-multiplied, so they get the cheaper model. Analysis tasks need reasoning depth over speed.

| Model | Use Case | Why |
| --- | --- | --- |
| **Claude Haiku 4.5** (`haiku`) | Single PR scoring | Fast, high quality per-request |
| **Gemini 3 Flash** (`gemini-flash`) | Batch scoring, evals | 6x cheaper than Haiku at comparable accuracy |
| **Claude Sonnet 4.6** (`sonnet`) | SWOT analysis | Deeper reasoning for eval meta-analysis |

Model selection is a first-class config via `--model` flag, not hardcoded. The `ModelConfig` interface in `scoring/models.ts` makes adding models a registry entry.

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

## Future

### Shadow mode

Run scoring alongside an existing PR process without changing it. Every merged PR gets scored in the background, building a dataset of impact scores against real team activity. Use the overrides and gap analysis loop to calibrate the prompt before the scores mean anything official. Shadow mode is how you answer "does this match our judgment?" before committing to integration.

### CI integration

Once calibrated, run as a GitHub Action (or equivalent) on PR open/update. Score appears as a PR comment or check annotation. The team sees impact scores in their normal review flow without a separate tool. Scoring becomes part of the process, not a separate step.

### Retrospective baseline

Backfill scoring across months or years of merged PRs to establish a historical baseline. This gives you a before/after signal when you change something: new tooling, team restructure, sprint cadence, stack migration. Without a baseline, you're measuring change against nothing.

### Proactive scoring

Score issues and specs before code is written. Run the scorer against a proposed change description to estimate impact before implementation starts. This flips scoring from retrospective ("how impactful was this PR") to predictive ("how impactful will this work be"). Useful for sprint planning, prioritization, and catching scope creep early: if an issue scores higher than expected, it probably needs to be broken down.

### Codebase context layer

Current scoring operates on the diff alone. A context layer that vectorizes the codebase (or previous PRs) would let the scorer understand what a change means in the broader system, not just what it changes. A 3-line fix to an authentication module scores differently when the scorer knows that module handles 100% of login traffic. This shifts scoring from "what changed" to "what does this change mean here," closing the gap between the model's judgment and a reviewer who knows the system.

## Testing

```bash
pnpm test
```

Tests cover diff filtering, report generation, and gap detection.
