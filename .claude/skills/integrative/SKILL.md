---
name: integrative
description: Guided workflow for PR Scorer CLI. Use when scoring PRs, running evals, recording overrides, analyzing scoring gaps, or iterating on prompt calibration.
---

# PR Scorer CLI

Interactive workflow for the PR impact scoring tool. All commands run from `integrative/`.

## Quick Start

```bash
cd integrative && pnpm dev score owner/repo#123
```

## Pre-flight

Before running any command, verify environment. Run this check and report missing vars:

```bash
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+set}" && echo "GOOGLE_GENERATIVE_AI_API_KEY: ${GOOGLE_GENERATIVE_AI_API_KEY:+set}" && echo "GITHUB_TOKEN: ${GITHUB_TOKEN:+set}"
```

If `GITHUB_TOKEN` is blank but `gh auth status` shows logged in, use: `GITHUB_TOKEN=$(gh auth token) pnpm dev ...`

If other vars are blank, stop and tell the user which ones to set before proceeding.

## Commands

Ask the user which operation, collect inputs, execute.

1. **Score** - `pnpm dev score <pr> [--model gemini-flash] [--md]` - single PR, default haiku, JSON output (--md for markdown)
2. **Backfill** - `pnpm dev backfill <repo> [--count N --concurrency N]` - batch, default gemini-flash
3. **Eval** - `pnpm dev eval [--model X --category X --score N --report]` - 31 fixtures, 12 categories
4. **Override** - `pnpm dev override <pr> --score N --reason "..."` - record disagreement
5. **Gaps** - `pnpm dev gaps` - analyze overrides for patterns

Scores are Fibonacci: 1 (trivial), 2 (minor), 3 (moderate), 5 (major), 8 (critical).

If `gaps` finds no overrides, prompt the user to record one first with `override`.

Requires: `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GITHUB_TOKEN`.

## Prompt Calibration Loop

The core workflow for improving scoring accuracy. This is RLHF without weight adjustment: push the prompt until scores match human reviewers.

```
eval --report → read analysis.md → apply prompt changes → re-eval → repeat
```

### Steps

1. **Baseline** - `pnpm dev eval --model gemini-flash --report`
2. **Review SWOT** - Read `analysis.md` from the run dir. Sonnet analyzes failures and suggests specific prompt changes in the Opportunities section, prioritized by number of fixtures each change would fix.
3. **Apply changes** - Edit `src/scoring/prompt.ts` scoring guidance based on the SWOT Opportunities. Add specific examples for the model to anchor on.
4. **Re-evaluate** - Run eval again with `--report`. Compare pass rate to previous run.
5. **Repeat** - Keep iterating until pass rate plateaus or regressions appear.

### What to watch for

- **Under-scoring** (model rates lower than expected): add explicit guidance elevating that category
- **Over-scoring** (model rates higher than expected): add boundary conditions that cap the score
- **Regressions**: a fix for one fixture breaks another. Tighten the scope qualifier (e.g., "Docker for local dev" vs "Docker for prod")
- **Plateau**: diminishing returns mean the prompt is well-calibrated for the fixture set. Move to real PR validation.

### Report outputs

Each `--report` run saves to `.pr-scorer/runs/<run-name>/`:

| File | Contents |
|------|----------|
| `summary.json` | Aggregates: pass rate, by-category, by-score, gaps |
| `results.jsonl` | One JSON line per fixture with LOC, score, rationale |
| `analysis.md` | Sonnet-generated SWOT analysis with actionable prompt changes |

### After calibration

Prompt calibration overfits on fixtures by design. To validate against real PRs:
1. Run `pnpm dev score` on real PRs and compare against human judgment
2. Record disagreements with `pnpm dev override`
3. Run `pnpm dev gaps` to find patterns in overrides
4. Add new fixtures for patterns that recur, then re-enter the calibration loop

## References

- [references/commands.md](references/commands.md) - Full command syntax and examples
- [references/feedback-loop.md](references/feedback-loop.md) - Override-driven feedback loop for real PR validation
