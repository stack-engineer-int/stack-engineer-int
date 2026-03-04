import { describe, it, expect } from 'vitest';
import { ImpactScoreSchema, FIBONACCI_SCORES } from './schema.js';

const validScore = {
  score: 3,
  confidence: 0.85,
  description: 'Adds caching layer',
  rationale: 'Moderate complexity refactor with performance implications.',
  keyChanges: ['Added Redis cache', 'Updated query layer'],
  affectedAreas: ['api', 'database'],
};

describe('ImpactScoreSchema', () => {
  it('accepts valid Fibonacci scores', () => {
    for (const score of FIBONACCI_SCORES) {
      const result = ImpactScoreSchema.safeParse({ ...validScore, score });
      expect(result.success).toBe(true);
    }
  });

  it('rejects non-Fibonacci scores', () => {
    for (const score of [0, 4, 6, 7, 10, -1]) {
      const result = ImpactScoreSchema.safeParse({ ...validScore, score });
      expect(result.success).toBe(false);
    }
  });

  it('requires all fields', () => {
    const partial = { score: 3, confidence: 0.9 };
    const result = ImpactScoreSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it('validates keyChanges is an array of strings', () => {
    const bad = { ...validScore, keyChanges: 'not an array' };
    const result = ImpactScoreSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('validates affectedAreas is an array of strings', () => {
    const bad = { ...validScore, affectedAreas: 42 };
    const result = ImpactScoreSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('accepts empty arrays for keyChanges and affectedAreas', () => {
    const result = ImpactScoreSchema.safeParse({
      ...validScore,
      keyChanges: [],
      affectedAreas: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('FIBONACCI_SCORES', () => {
  it('contains exactly [1, 2, 3, 5, 8]', () => {
    expect([...FIBONACCI_SCORES]).toEqual([1, 2, 3, 5, 8]);
  });
});
