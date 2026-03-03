import type { PRFixture } from '../types.js';

export const testsFixtures: PRFixture[] = [
  {
    id: 'tests-add-unit',
    name: 'Add unit tests for utility',
    category: 'tests',
    expectedScore: 2,
    pr: {
      title: 'test: add unit tests for date utilities',
      body: 'Increases test coverage for date formatting functions.',
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/utils/date.test.ts', status: 'added', additions: 55, deletions: 0 },
    ],
    diff: `diff --git a/src/lib/utils/date.test.ts b/src/lib/utils/date.test.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/lib/utils/date.test.ts
@@ -0,0 +1,55 @@
+import { describe, it, expect } from 'vitest';
+import { formatDate, formatRelative, parseDate } from './date';
+
+describe('formatDate', () => {
+  it('formats ISO date to locale string', () => {
+    const date = new Date('2024-01-15T10:30:00Z');
+    expect(formatDate(date)).toBe('Jan 15, 2024');
+  });
+
+  it('handles invalid date', () => {
+    expect(formatDate(new Date('invalid'))).toBe('Invalid date');
+  });
+});
+
+describe('formatRelative', () => {
+  it('shows "just now" for recent times', () => {
+    const now = new Date();
+    expect(formatRelative(now)).toBe('just now');
+  });
+
+  it('shows minutes ago', () => {
+    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
+    expect(formatRelative(fiveMinAgo)).toBe('5 minutes ago');
+  });
+
+  it('shows hours ago', () => {
+    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
+    expect(formatRelative(twoHoursAgo)).toBe('2 hours ago');
+  });
+
+  it('shows days ago', () => {
+    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
+    expect(formatRelative(threeDaysAgo)).toBe('3 days ago');
+  });
+});
+
+describe('parseDate', () => {
+  it('parses ISO string', () => {
+    const result = parseDate('2024-01-15');
+    expect(result.getFullYear()).toBe(2024);
+    expect(result.getMonth()).toBe(0);
+    expect(result.getDate()).toBe(15);
+  });
+
+  it('returns null for invalid input', () => {
+    expect(parseDate('not-a-date')).toBeNull();
+  });
+});`,
    expected: {
      affectedAreas: ['tests'],
      keyChanges: ['unit tests', 'test coverage'],
    },
  },
  {
    id: 'tests-fix-flaky',
    name: 'Fix flaky integration test',
    category: 'tests',
    expectedScore: 2,
    pr: {
      title: 'fix: stabilize flaky auth flow test',
      body: `The login test was failing intermittently due to race conditions.

## Root cause
Test wasn't waiting for redirect to complete before assertions.

## Fix
Added explicit wait for navigation and retry logic.`,
      author: 'developer',
    },
    files: [{ filename: 'tests/auth.spec.ts', status: 'modified', additions: 12, deletions: 5 }],
    diff: `diff --git a/tests/auth.spec.ts b/tests/auth.spec.ts
index 1234567..abcdefg 100644
--- a/tests/auth.spec.ts
+++ b/tests/auth.spec.ts
@@ -15,11 +15,18 @@ test.describe('Authentication', () => {
     await page.fill('[name="password"]', 'testpassword123');
     await page.click('button[type="submit"]');

-    expect(page.url()).toContain('/app');
+    await page.waitForURL('**/app', { timeout: 10000 });

-    const welcome = page.locator('h1');
-    await expect(welcome).toContainText('Welcome');
+    await expect(page).toHaveURL(/\\/app$/);
+
+    const welcome = page.getByRole('heading', { level: 1 });
+    await expect(welcome).toBeVisible({ timeout: 5000 });
+    await expect(welcome).toContainText('Welcome');
   });
 });`,
    expected: {
      affectedAreas: ['tests'],
      keyChanges: ['flaky test fix', 'explicit waits'],
    },
  },
];
