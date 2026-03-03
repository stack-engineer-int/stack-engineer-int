# Feedback Loop

Iterative workflow for improving scoring accuracy through human-in-the-loop prompt tuning.

## Steps

1. **Baseline** - Run `cd integrative && pnpm dev eval --report` to get current pass rate
2. **Score real PRs** - Use `pnpm dev score` on real PRs and compare against human judgment
3. **Record disagreements** - Use `pnpm dev override` for each scoring mismatch
4. **Identify patterns** - Run `pnpm dev gaps` to analyze overrides with LLM gap analysis
5. **Edit prompt** - Update `integrative/src/scoring/prompt.ts` based on gap suggestions
6. **Re-evaluate** - Run eval again and compare pass rates against baseline

## Key files

- `integrative/src/scoring/prompt.ts` - Scoring prompt with calibration examples
- `integrative/src/feedback/overrides.ts` - Override persistence (`.pr-scorer/overrides/*.json`)
- `integrative/src/feedback/gap-analysis.ts` - LLM gap analysis using Gemini Flash
- `integrative/src/evals/report.ts` - Report generation with gap detection

## What to look for in gap analysis

- **Consistent over-scoring**: prompt calibration examples may anchor too high
- **Consistent under-scoring**: prompt may not weight security/auth changes enough
- **Category-specific misses**: add calibration examples for the weak category
- **Confidence miscalibration**: adjust confidence guidance in prompt
