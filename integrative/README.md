# PR Scorer

LLM-powered PR impact scoring with evaluation framework. Extracted from [Cohesion](https://github.com/stack-engineer-int/cohesion) as a standalone CLI tool.

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

Runs 31 fixtures across 12 categories (trivial, bugfix, feature, auth, api, database, security, performance, tests, ci, deps, infra). Use `--report` to save a detailed markdown report to `.pr-scorer/runs/`.

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

| Score | Impact | Example |
|-------|--------|---------|
| 1 | Trivial | Typo fix, comment update, dep bump |
| 2 | Low | Small refactor, test addition, config tweak |
| 3 | Moderate | Bug fix, minor feature, API change |
| 5 | High | Security fix, major feature, breaking change |
| 8 | Critical | Architecture overhaul, data migration, auth system |

## Models

- **Claude Haiku 4.5** (`haiku`) - Default for single PR scoring. Fast, high quality.
- **Gemini 2.0 Flash** (`gemini-flash`) - Default for batch operations. 6x cheaper.

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
    models.ts         # Model registry (Haiku, Gemini Flash)
    scorer.ts         # Core scoring function
  diff/
    filter.ts         # Remove lockfiles, build output
    truncate.ts       # Token-aware truncation
  github/
    client.ts         # Octokit wrapper for PR fetching
  evals/
    types.ts          # Fixture and result types
    runner.ts         # Concurrent fixture runner
    report.ts         # Report generation and gap detection
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
