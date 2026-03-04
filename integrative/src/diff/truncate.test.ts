import { describe, it, expect } from 'vitest';
import { estimateTokens, truncateDiff } from './truncate.js';

describe('estimateTokens', () => {
  it('estimates ~4 chars per token', () => {
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('')).toBe(0);
  });

  it('rounds up partial tokens', () => {
    // 5 chars / 4 = 1.25 -> ceil = 2
    expect(estimateTokens('abcde')).toBe(2);
  });
});

describe('truncateDiff', () => {
  it('returns short diffs unchanged', () => {
    const diff = 'diff --git a/foo.ts b/foo.ts\n+hello';
    expect(truncateDiff(diff, 100)).toBe(diff);
  });

  it('truncates at last diff header boundary when available', () => {
    const file1 = 'diff --git a/a.ts b/a.ts\n' + '+'.repeat(200);
    const file2 = 'diff --git a/b.ts b/b.ts\n' + '+'.repeat(200);
    const diff = file1 + '\n' + file2;

    // Use a token limit that fits file1 but not file2
    const maxTokens = Math.ceil((file1.length + 50) / 4);
    const result = truncateDiff(diff, maxTokens);

    expect(result).toContain('a/a.ts');
    expect(result).toContain('... [diff truncated for length]');
  });

  it('truncates at raw char boundary when no good diff header found', () => {
    // Single file with a very long diff, no second diff header to cut at
    const diff = 'diff --git a/a.ts b/a.ts\n' + '+'.repeat(1000);
    const maxTokens = 50; // 200 chars
    const result = truncateDiff(diff, maxTokens);

    expect(result.length).toBeLessThan(diff.length);
    expect(result).toContain('... [diff truncated for length]');
  });

  it('defaults to 30k token limit', () => {
    const shortDiff = 'diff --git a/a.ts b/a.ts\n+x';
    // Under 30k tokens, should pass through
    expect(truncateDiff(shortDiff)).toBe(shortDiff);
  });
});
