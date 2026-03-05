# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PR Scorer: LLM-powered CLI tool that impact-scores pull requests on a Fibonacci scale (1, 2, 3, 5, 8). Lives in the `integrative/` workspace.

## Commands

All commands run from `integrative/`:

```bash
pnpm install          # install deps (from repo root)
pnpm dev              # run CLI via tsx (e.g., pnpm dev score owner/repo#123)
pnpm build            # tsc compile to dist/
pnpm test             # vitest run
pnpm test:watch       # vitest watch mode
```

Run a single test file:
```bash
cd integrative && pnpm vitest run src/diff/filter.test.ts
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Claude Haiku scoring
- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini Flash scoring
- `GITHUB_TOKEN` - PR data fetching via Octokit

## Architecture

pnpm workspace: root `package.json` + `integrative/` package. All source code is in `integrative/src/`.

### Scoring Pipeline

```
PRContext -> filterDiff() -> truncateDiff(30k tokens) -> buildScoringPrompt() -> generateText() -> Zod-validated ImpactScore
```

- `scoring/scorer.ts`: orchestrates the pipeline via Vercel AI SDK's `generateText` with `Output.object`
- `scoring/prompt.ts`: system prompt with calibration examples that anchor score boundaries
- `scoring/schema.ts`: Zod schema constraining output to `ImpactScore` (score, confidence, rationale, keyChanges, affectedAreas)
- `scoring/models.ts`: model registry with `ModelConfig` interface. Haiku for quality, Gemini Flash for cost (6x cheaper)

### Diff Preprocessing

- `diff/filter.ts`: strips lockfiles, build output, generated files (.d.ts, .map, .min.js), caps hunks at 50 per file
- `diff/truncate.ts`: token-aware truncation at clean diff boundaries

### Evaluation Framework

31 fixtures across 12 categories in `evals/fixtures/`. Each fixture defines a synthetic PR with an expected Fibonacci score.

- `evals/runner.ts`: `runFixtures()` with configurable concurrency (default 5)
- `evals/report.ts`: generates pass-rate reports by category and score level, detects over/under-scoring gaps

### Feedback Loop

- `feedback/overrides.ts`: persists human disagreements to `.pr-scorer/overrides/*.json`
- `feedback/gap-analysis.ts`: analyzes override patterns with Gemini Flash, groups similar suggestions

### CLI Commands

Five commands in `commands/`: `score` (single PR), `backfill` (batch recent PRs), `eval` (fixture suite), `override` (record disagreement), `gaps` (analyze patterns).

## Key Patterns

- **Structured output**: all LLM calls use Zod schemas with `Output.object` for type-safe responses
- **Deterministic**: temperature 0 on all model calls
- **Multi-model**: `ModelId` type union (`'haiku' | 'gemini-flash'`), default varies by command (haiku for single, gemini-flash for batch)
- **Concurrency control**: batch operations (backfill, eval) accept `--concurrency` flag
- **ES modules**: `.js` extensions in all imports (NodeNext resolution)

## TypeScript

- Strict mode, ES2022 target, NodeNext modules
- All imports use `.js` extension (required by NodeNext)
- Zod 4 for runtime validation and type inference
