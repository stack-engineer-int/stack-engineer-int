export type FixtureCategory =
  | 'trivial' | 'bugfix' | 'feature' | 'auth' | 'api'
  | 'database' | 'security' | 'performance' | 'tests'
  | 'ci' | 'deps' | 'infra';

export interface PRFixture {
  id: string;
  name: string;
  category: FixtureCategory;
  expectedScore: 1 | 2 | 3 | 5 | 8;
  pr: {
    title: string;
    body: string | null;
    author: string;
  };
  files: Array<{
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions: number;
    deletions: number;
  }>;
  diff: string;
  expected?: {
    affectedAreas?: string[];
    keyChanges?: string[];
  };
}

export interface FixtureResult {
  fixture: PRFixture;
  score: {
    score: number;
    confidence: number;
    description: string;
    rationale: string;
    keyChanges: string[];
    affectedAreas: string[];
  };
  validation: {
    scoreMatch: boolean;
    expectedScore: number;
    actualScore: number;
    scoreDelta: number;
  };
  durationMs: number;
}
