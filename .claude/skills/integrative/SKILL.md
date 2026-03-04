---
name: integrative
description: Guided workflow for PR Scorer CLI. Use when scoring PRs, running evals, recording overrides, or analyzing scoring gaps.
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

## Workflow

Ask the user which operation, collect inputs, execute.

1. **Score** - `pnpm dev score <pr> [--model gemini-flash] [--md]` - single PR, default haiku, JSON output (--md for markdown)
2. **Backfill** - `pnpm dev backfill <repo> [--count N --concurrency N]` - batch, default gemini-flash
3. **Eval** - `pnpm dev eval [--category X --score N --report]` - 31 fixtures, 12 categories
4. **Override** - `pnpm dev override <pr> --score N --reason "..."` - record disagreement
5. **Gaps** - `pnpm dev gaps` - analyze overrides for patterns

Scores are Fibonacci: 1 (trivial), 2 (minor), 3 (moderate), 5 (major), 8 (critical).

When `--report` is used with eval, read and summarize the report from `.pr-scorer/runs/`.

If `gaps` finds no overrides, prompt the user to record one first with `override`.

Requires: `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GITHUB_TOKEN`.

## References

- [references/commands.md](references/commands.md) - Full command syntax and examples
- [references/feedback-loop.md](references/feedback-loop.md) - Iterative prompt improvement workflow
