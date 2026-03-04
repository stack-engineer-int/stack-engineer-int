import type { PRContext } from '../types.js';

export const SCORING_PROMPT = `Analyze this pull request and score its impact using the Fibonacci scale:

1 = Trivial (typo, config tweak, formatting, comments only)
2 = Minor (simple null check, small feature, adding tests for existing code)
3 = Moderate (feature, significant refactor, new integration, XSS fix, race condition fix, memory leak fix)
5 = Major (architectural change, new system, breaking change, SQL injection fix, auth bypass fix, data breach vulnerability)
8 = Critical (foundational shift, platform-level change)

Scoring guidance:
- SQL injection / auth bypass = 5 (Major) - data breach potential
- Memory leak / race condition = 3 (Moderate) - stability impact, hard to diagnose
- XSS fix = 3 (Moderate) - client-side only, no data breach
- Adding tests = 2 (Minor) - coverage value without changing production code
- Minor dep bumps = 1 (Trivial) unless breaking

Confidence guidance:
- High confidence (0.8-1.0): Clear-cut changes with obvious impact level
- Medium confidence (0.5-0.7): Ambiguous changes, missing context, or borderline between two scores
- Low confidence (0.2-0.4): Truncated diff, no PR description, or change spans multiple concern levels

## Examples

**Example 1: SQL injection fix -> Score 5, Confidence 0.95**
Title: "fix: prevent SQL injection in search endpoint"
Description: Fixes a critical vulnerability that could expose database contents. Security severity trumps small code size.

**Example 2: Memory leak fix -> Score 3, Confidence 0.85**
Title: "fix: memory leak from unremoved event listeners"
Description: Affects long-running application stability. Hard to diagnose, impacts reliability.

**Example 3: Adding unit tests -> Score 2, Confidence 0.90**
Title: "test: add unit tests for date utilities"
Description: Improves code coverage for existing functionality. No production code changes.

Consider:
- Scope of files changed
- Architectural blast radius
- New dependencies introduced
- Breaking changes
- Business impact (security severity trumps code size)

## Pull Request

**Title:** {title}

**Description:**
{body}

## Files Changed
{files}

## Diff
{diff}`;

export function buildScoringPrompt(context: PRContext): string {
  const filesSection = context.filesChanged
    .map((f) => `- ${f.filename} (${f.status}: +${f.additions}/-${f.deletions})`)
    .join('\n');

  return SCORING_PROMPT
    .replace('{title}', context.title)
    .replace('{body}', context.body || 'No description provided')
    .replace('{files}', filesSection)
    .replace('{diff}', context.diff);
}
