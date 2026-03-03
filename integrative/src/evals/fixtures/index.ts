import type { PRFixture, FixtureCategory } from '../types.js';

import { trivialFixtures } from './trivial.js';
import { bugfixFixtures } from './bugfix.js';
import { featureFixtures } from './feature.js';
import { authFixtures } from './auth.js';
import { apiFixtures } from './api.js';
import { databaseFixtures } from './database.js';
import { securityFixtures } from './security.js';
import { performanceFixtures } from './performance.js';
import { testsFixtures } from './tests.js';
import { ciFixtures } from './ci.js';
import { depsFixtures } from './deps.js';
import { infraFixtures } from './infra.js';

export const allFixtures: PRFixture[] = [
  ...trivialFixtures,
  ...bugfixFixtures,
  ...featureFixtures,
  ...authFixtures,
  ...apiFixtures,
  ...databaseFixtures,
  ...securityFixtures,
  ...performanceFixtures,
  ...testsFixtures,
  ...ciFixtures,
  ...depsFixtures,
  ...infraFixtures,
];

export function getFixture(id: string): PRFixture | undefined {
  return allFixtures.find((f) => f.id === id);
}

export function getFixturesByCategory(category: FixtureCategory): PRFixture[] {
  return allFixtures.filter((f) => f.category === category);
}

export function getFixturesByScore(score: 1 | 2 | 3 | 5 | 8): PRFixture[] {
  return allFixtures.filter((f) => f.expectedScore === score);
}
