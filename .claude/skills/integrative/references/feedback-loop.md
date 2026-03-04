# Feedback Loop

Override-driven workflow for validating scoring accuracy against real PRs. Use after prompt calibration (eval loop) to catch patterns the fixtures don't cover.

## Steps

1. **Score real PRs** - `pnpm dev score owner/repo#123` and compare against human judgment
2. **Record disagreements** - `pnpm dev override owner/repo#123 --score N --reason "..."` for each mismatch
3. **Identify patterns** - `pnpm dev gaps` analyzes overrides with LLM gap analysis, groups similar suggestions
4. **Edit prompt** - Update `integrative/src/scoring/prompt.ts` based on gap suggestions
5. **Add fixtures** - If patterns recur, create new eval fixtures to cover the gap
6. **Re-calibrate** - Re-enter the eval calibration loop (see SKILL.md)

## Key files

- `integrative/src/scoring/prompt.ts` - Scoring prompt with calibration examples
- `integrative/src/feedback/overrides.ts` - Override persistence (`.pr-scorer/overrides/*.json`)
- `integrative/src/feedback/gap-analysis.ts` - LLM gap analysis
- `integrative/src/evals/analysis.ts` - Sonnet SWOT analysis of eval results

## What to look for in gap analysis

- **Consistent over-scoring**: prompt may anchor too high for certain categories. Add boundary conditions.
- **Consistent under-scoring**: prompt may not weight security/auth/infra changes enough. Add explicit guidance.
- **Category-specific misses**: create calibration examples for the weak category in prompt.ts
- **Scope ambiguity**: model confuses similar-looking PRs (e.g., Docker for dev vs prod). Add scope qualifiers.
