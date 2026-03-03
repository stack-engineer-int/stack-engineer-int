import { describe, it, expect } from 'vitest';
import { generateReport } from './report.js';
import type { FixtureResult } from './types.js';

function makeResult(overrides: {
  fixtureId: string;
  category: string;
  expectedScore: number;
  actualScore: number;
  durationMs?: number;
}): FixtureResult {
  const match = overrides.expectedScore === overrides.actualScore;
  return {
    fixture: {
      id: overrides.fixtureId,
      name: overrides.fixtureId,
      category: overrides.category as FixtureResult['fixture']['category'],
      expectedScore: overrides.expectedScore as 1 | 2 | 3 | 5 | 8,
      pr: { title: 'test', body: null, author: 'dev' },
      files: [],
      diff: '',
    },
    score: {
      score: overrides.actualScore,
      confidence: 0.9,
      description: 'test',
      rationale: 'test',
      keyChanges: [],
      affectedAreas: [],
    },
    validation: {
      scoreMatch: match,
      expectedScore: overrides.expectedScore,
      actualScore: overrides.actualScore,
      scoreDelta: overrides.actualScore - overrides.expectedScore,
    },
    durationMs: overrides.durationMs ?? 100,
  };
}

describe('generateReport', () => {
  it('computes correct pass rate from results', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'trivial', expectedScore: 1, actualScore: 1 }),
      makeResult({ fixtureId: 'b', category: 'trivial', expectedScore: 1, actualScore: 2 }),
      makeResult({ fixtureId: 'c', category: 'bugfix', expectedScore: 3, actualScore: 3 }),
    ];

    const report = generateReport('test-run', results);

    expect(report.totalTests).toBe(3);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(1);
    expect(report.passRate).toBe(67);
  });

  it('breaks down results by category', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'trivial', expectedScore: 1, actualScore: 1 }),
      makeResult({ fixtureId: 'b', category: 'trivial', expectedScore: 1, actualScore: 2 }),
      makeResult({ fixtureId: 'c', category: 'bugfix', expectedScore: 3, actualScore: 3 }),
    ];

    const report = generateReport('test-run', results);

    expect(report.byCategory['trivial']).toEqual({ total: 2, passed: 1, passRate: 50 });
    expect(report.byCategory['bugfix']).toEqual({ total: 1, passed: 1, passRate: 100 });
  });

  it('detects over-scoring pattern in gap analysis', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'trivial', expectedScore: 1, actualScore: 3 }),
      makeResult({ fixtureId: 'b', category: 'trivial', expectedScore: 1, actualScore: 2 }),
      makeResult({ fixtureId: 'c', category: 'deps', expectedScore: 1, actualScore: 3 }),
    ];

    const report = generateReport('test-run', results);

    expect(report.gaps.length).toBeGreaterThan(0);
    expect(report.gaps.some((g) => g.pattern.includes('over-scoring'))).toBe(true);
  });
});
