import { describe, it, expect } from 'vitest';
import { generateReport, formatReportJsonl } from './report.js';
import type { FixtureCategory, FixtureResult } from './types.js';

function makeResult(overrides: {
  fixtureId: string;
  category: FixtureCategory;
  expectedScore: number;
  actualScore: number;
  durationMs?: number;
}): FixtureResult {
  const match = overrides.expectedScore === overrides.actualScore;
  return {
    fixture: {
      id: overrides.fixtureId,
      name: overrides.fixtureId,
      category: overrides.category,
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

  it('breaks down results by expected score', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'trivial', expectedScore: 1, actualScore: 1 }),
      makeResult({ fixtureId: 'b', category: 'bugfix', expectedScore: 3, actualScore: 3 }),
      makeResult({ fixtureId: 'c', category: 'feature', expectedScore: 3, actualScore: 5 }),
    ];

    const report = generateReport('test-run', results);

    expect(report.byScore[1]).toEqual({ total: 1, passed: 1, passRate: 100 });
    expect(report.byScore[3]).toEqual({ total: 2, passed: 1, passRate: 50 });
  });

  it('detects under-scoring pattern in gap analysis', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'security', expectedScore: 5, actualScore: 2 }),
      makeResult({ fixtureId: 'b', category: 'security', expectedScore: 5, actualScore: 1 }),
      makeResult({ fixtureId: 'c', category: 'feature', expectedScore: 8, actualScore: 3 }),
    ];

    const report = generateReport('test-run', results);

    expect(report.gaps.some((g) => g.pattern.includes('under-scoring'))).toBe(true);
  });

  it('detects large score mismatches', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'security', expectedScore: 1, actualScore: 5 }),
    ];

    const report = generateReport('test-run', results);

    expect(report.gaps.some((g) => g.pattern.includes('Large score mismatches'))).toBe(true);
  });

  it('returns no gaps when all tests pass', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'trivial', expectedScore: 1, actualScore: 1 }),
      makeResult({ fixtureId: 'b', category: 'bugfix', expectedScore: 3, actualScore: 3 }),
    ];

    const report = generateReport('test-run', results);
    expect(report.gaps).toEqual([]);
  });

  it('computes average duration', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'trivial', expectedScore: 1, actualScore: 1, durationMs: 200 }),
      makeResult({ fixtureId: 'b', category: 'bugfix', expectedScore: 3, actualScore: 3, durationMs: 400 }),
    ];

    const report = generateReport('test-run', results);
    expect(report.avgDurationMs).toBe(300);
  });
});

describe('formatReportJsonl', () => {
  it('outputs one JSON line per result', () => {
    const results: FixtureResult[] = [
      makeResult({ fixtureId: 'a', category: 'trivial', expectedScore: 1, actualScore: 1 }),
      makeResult({ fixtureId: 'b', category: 'bugfix', expectedScore: 3, actualScore: 3 }),
    ];
    const report = generateReport('test-run', results);
    const lines = formatReportJsonl(report).split('\n');

    expect(lines).toHaveLength(2);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.id).toBe('a');
    expect(parsed.category).toBe('trivial');
    expect(parsed.pass).toBe(true);
    expect(parsed.expected).toBe(1);
    expect(parsed.actual).toBe(1);
    expect(parsed.delta).toBe(0);
  });

  it('aggregates LOC from fixture files', () => {
    const result = makeResult({ fixtureId: 'x', category: 'feature', expectedScore: 3, actualScore: 3 });
    result.fixture.files = [
      { filename: 'a.ts', status: 'modified', additions: 10, deletions: 5 },
      { filename: 'b.ts', status: 'added', additions: 20, deletions: 0 },
    ];

    const report = generateReport('test-run', [result]);
    const line = JSON.parse(formatReportJsonl(report));

    expect(line.loc).toEqual({ add: 30, del: 5 });
    expect(line.files).toBe(2);
  });
});
