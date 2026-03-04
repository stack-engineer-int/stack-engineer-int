import { describe, it, expect } from 'vitest';
import { parsePRRef } from './client.js';

describe('parsePRRef', () => {
  it('parses valid owner/repo#number format', () => {
    const result = parsePRRef('acme/widget#42');
    expect(result).toEqual({ owner: 'acme', repo: 'widget', number: 42 });
  });

  it('handles hyphenated owner and repo names', () => {
    const result = parsePRRef('my-org/my-repo#999');
    expect(result).toEqual({ owner: 'my-org', repo: 'my-repo', number: 999 });
  });

  it('throws on missing hash separator', () => {
    expect(() => parsePRRef('owner/repo123')).toThrow('Invalid PR reference');
  });

  it('throws on missing owner', () => {
    expect(() => parsePRRef('/repo#1')).toThrow('Invalid PR reference');
  });

  it('throws on missing repo', () => {
    expect(() => parsePRRef('owner/#1')).toThrow('Invalid PR reference');
  });

  it('throws on empty string', () => {
    expect(() => parsePRRef('')).toThrow('Invalid PR reference');
  });

  it('throws on non-numeric PR number', () => {
    expect(() => parsePRRef('owner/repo#abc')).toThrow('Invalid PR reference');
  });

  it('includes the bad ref in the error message', () => {
    expect(() => parsePRRef('bad-format')).toThrow('bad-format');
  });
});
