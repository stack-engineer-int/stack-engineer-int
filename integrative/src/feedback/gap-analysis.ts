import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import type { ScoreOverride } from './overrides.js';

const KnowledgeGapSchema = z.object({
  cause: z.string().describe('Root cause of why the AI scored incorrectly'),
  suggestion: z.string().describe('Actionable suggestion for improving scoring accuracy'),
  confidence: z.number().min(0).max(1).describe('Confidence in this analysis'),
});

const ANALYSIS_PROMPT = `Analyze this score override to understand why the AI's original scoring was inaccurate.

## Original AI Assessment
- AI Score: {originalScore}
- AI Rationale: {originalRationale}

## Human Override
- New Score: {overrideScore}
- Human's Reason: {reason}

## PR Reference
{pr}

Identify:
1. Root cause of the scoring mismatch
2. A specific suggestion for improving future scoring accuracy
3. Your confidence in this analysis (0-1)`;

export async function analyzeGap(
  override: ScoreOverride
): Promise<{ cause: string; suggestion: string; confidence: number }> {
  const prompt = ANALYSIS_PROMPT
    .replace('{originalScore}', String(override.originalScore))
    .replace('{originalRationale}', override.originalRationale)
    .replace('{overrideScore}', String(override.overrideScore))
    .replace('{reason}', override.reason)
    .replace('{pr}', override.pr);

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: KnowledgeGapSchema,
    prompt,
  });

  return object;
}
