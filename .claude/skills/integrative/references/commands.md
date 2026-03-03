# Command Reference

All commands run from `integrative/`.

## Score a PR

Collect: PR reference (`owner/repo#number`), model preference.

```bash
cd integrative && pnpm dev score owner/repo#123
cd integrative && pnpm dev score owner/repo#123 --model gemini-flash
```

Default model: `haiku`. Output: Fibonacci score (1-8), confidence (0-1), rationale, key changes, affected areas.

## Backfill recent PRs

Collect: repo (`owner/repo`), count, concurrency.

```bash
cd integrative && pnpm dev backfill owner/repo --count 20 --model gemini-flash --concurrency 5
```

Defaults: 10 PRs, gemini-flash, concurrency 3.

## Run eval suite

Collect: optional category filter, score filter, whether to save report.

```bash
cd integrative && pnpm dev eval
cd integrative && pnpm dev eval --category security,auth --score 5,8
cd integrative && pnpm dev eval --report
```

31 fixtures across 12 categories: trivial, bugfix, feature, auth, api, database, security, performance, tests, ci, deps, infra.

When `--report` is used, read and summarize the generated report from `.pr-scorer/runs/`.

## Record a score override

Collect: PR reference, corrected score, reason, optional original score and rationale.

```bash
cd integrative && pnpm dev override owner/repo#123 \
  --score 5 \
  --reason "Fixes critical auth bypass" \
  --original-score 2 \
  --original-rationale "AI thought it was minor"
```

Valid scores: 1, 2, 3, 5, 8. Both `--score` and `--reason` are required.

## Analyze scoring gaps

No inputs needed. Analyzes all recorded overrides.

```bash
cd integrative && pnpm dev gaps
```

Groups similar suggestions into patterns. If no overrides exist, prompt the user to record one first.

## Models

| Model | Flag | Best for | Cost/1M tokens |
|-------|------|----------|----------------|
| Claude Haiku 4.5 | `--model haiku` | Single PR scoring | $1.00 |
| Gemini 2.0 Flash | `--model gemini-flash` | Batch operations | $0.15 |

## Scoring Scale

| Score | Impact | Example |
|-------|--------|---------|
| 1 | Trivial | Typo, comment, dep bump |
| 2 | Minor | Small refactor, test addition |
| 3 | Moderate | Bug fix, minor feature, XSS fix |
| 5 | Major | SQL injection fix, major feature |
| 8 | Critical | Architecture overhaul, data migration |
