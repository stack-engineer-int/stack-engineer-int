# PR Scorer Test Plan

## Prerequisites

```bash
cd ~/Work/stack-engineer-int/integrative
```

Confirm env vars are set:
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `GITHUB_TOKEN`

## 1. Automated tests

```bash
pnpm test
```

Expected: 6/6 passing (diff filter x3, report generation x3)

## 2. Score a single PR (Haiku)

```bash
pnpm dev score stack-engineer-int/cohesion#1
```

Expected: Fibonacci score (1/2/3/5/8), rationale, confidence value. Uses Haiku by default.

## 3. Score a single PR (Gemini Flash)

```bash
pnpm dev score stack-engineer-int/cohesion#1 --model gemini-flash
```

Expected: Same output format, different model attribution.

## 4. Backfill a repo

```bash
pnpm dev backfill stack-engineer-int/cohesion --count 3 --concurrency 2
```

Expected: Scores 3 most recent merged PRs. Progress output, then summary table.

## 5. Run eval suite

```bash
pnpm dev eval --concurrency 3
```

Expected: Runs 31 fixtures, shows pass/fail per fixture, summary with pass rate. This hits the LLM so it will take a minute.

## 6. Run eval with filters + report

```bash
pnpm dev eval --category security,auth --score 5 --report
```

Expected: Only runs matching fixtures. Saves markdown report to `.pr-scorer/runs/`.

## 7. Record a score override

```bash
pnpm dev override stack-engineer-int/cohesion#1 \
  --score 5 \
  --reason "This PR has higher impact than scored" \
  --original-score 2 \
  --original-rationale "AI thought it was minor"
```

Expected: "Override saved" confirmation. Check file exists:

```bash
ls .pr-scorer/overrides/
```

## 8. Analyze gaps

```bash
pnpm dev gaps
```

Expected: Picks up the override from step 7, runs LLM gap analysis, shows cause/suggestion/confidence.

## 9. Verify help output

```bash
pnpm dev --help
```

Expected: All 5 commands listed (score, backfill, eval, override, gaps).

## Cleanup

```bash
rm -rf .pr-scorer/
```

Removes any generated overrides and eval reports from testing.
