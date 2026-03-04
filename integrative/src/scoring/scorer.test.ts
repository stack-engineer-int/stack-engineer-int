import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: { object: vi.fn((opts: unknown) => opts) },
}));

vi.mock('../diff/filter.js', () => ({
  filterDiff: vi.fn((d: string) => `filtered:${d}`),
}));

vi.mock('../diff/truncate.js', () => ({
  truncateDiff: vi.fn((d: string) => `truncated:${d}`),
}));

import { scorePR } from './scorer.js';
import { generateText } from 'ai';
import { filterDiff } from '../diff/filter.js';
import { truncateDiff } from '../diff/truncate.js';

const mockGenerateText = vi.mocked(generateText);
const mockFilterDiff = vi.mocked(filterDiff);
const mockTruncateDiff = vi.mocked(truncateDiff);

const fakeOutput = {
  score: 3,
  confidence: 0.85,
  description: 'test change',
  rationale: 'Moderate impact',
  keyChanges: ['Updated handler'],
  affectedAreas: ['api'],
};

const context = {
  title: 'fix: patch endpoint',
  body: 'Fixes timeout',
  diff: 'diff --git a/api.ts\n+fix',
  filesChanged: [{ filename: 'api.ts', status: 'modified', additions: 5, deletions: 2 }],
};

describe('scorePR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateText.mockResolvedValue({ output: fakeOutput } as never);
  });

  it('filters and truncates diff by default', async () => {
    await scorePR(context);

    expect(mockFilterDiff).toHaveBeenCalledWith(context.diff);
    expect(mockTruncateDiff).toHaveBeenCalled();
  });

  it('skips filter/truncate when raw: true', async () => {
    await scorePR(context, { raw: true });

    expect(mockFilterDiff).not.toHaveBeenCalled();
    expect(mockTruncateDiff).not.toHaveBeenCalled();
  });

  it('uses temperature 0', async () => {
    await scorePR(context);

    const call = mockGenerateText.mock.calls[0][0];
    expect(call.temperature).toBe(0);
  });

  it('returns the parsed output', async () => {
    const result = await scorePR(context);
    expect(result).toEqual(fakeOutput);
  });

  it('throws when model returns no output', async () => {
    mockGenerateText.mockResolvedValue({ output: null } as never);

    await expect(scorePR(context)).rejects.toThrow('No output from model');
  });

  it('uses specified model when provided', async () => {
    await scorePR(context, { model: 'gemini-flash' });

    const call = mockGenerateText.mock.calls[0][0];
    // model is a provider instance, verify it was passed through
    expect(call.model).toBeDefined();
    expect(call.temperature).toBe(0);
  });
});
