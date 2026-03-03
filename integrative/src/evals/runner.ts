import { scorePR } from '../scoring/scorer.js';
import type { ModelId } from '../scoring/models.js';
import type { PRFixture, FixtureResult } from './types.js';

export interface RunOptions {
  model?: ModelId;
  concurrency?: number;
}

export async function runFixture(
  fixture: PRFixture,
  options: RunOptions = {}
): Promise<FixtureResult> {
  const start = Date.now();

  const context = {
    title: fixture.pr.title,
    body: fixture.pr.body,
    diff: fixture.diff,
    filesChanged: fixture.files,
  };

  const result = await scorePR(context, {
    model: options.model ?? 'haiku',
    raw: true,
  });

  const durationMs = Date.now() - start;

  return {
    fixture,
    score: result,
    validation: {
      scoreMatch: result.score === fixture.expectedScore,
      expectedScore: fixture.expectedScore,
      actualScore: result.score,
      scoreDelta: result.score - fixture.expectedScore,
    },
    durationMs,
  };
}

export async function runFixtures(
  fixtures: PRFixture[],
  options: RunOptions = {}
): Promise<FixtureResult[]> {
  const concurrency = options.concurrency ?? 5;
  const results: FixtureResult[] = [];

  for (let i = 0; i < fixtures.length; i += concurrency) {
    const chunk = fixtures.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((f) => runFixture(f, options))
    );
    results.push(...chunkResults);
  }

  return results;
}
