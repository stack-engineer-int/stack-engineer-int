import type { PRFixture } from '../types.js';

export const performanceFixtures: PRFixture[] = [
  {
    id: 'perf-query-optimization',
    name: 'Optimize slow database query',
    category: 'performance',
    expectedScore: 3,
    pr: {
      title: 'perf: add index and optimize dashboard query',
      body: `Dashboard was taking 3+ seconds to load for large orgs.

## Changes
- Added composite index on (org_id, created_at)
- Rewrote query to avoid N+1
- Results now cached for 5 minutes

## Before/After
- Before: 3200ms avg
- After: 180ms avg`,
      author: 'developer',
    },
    files: [
      { filename: 'src/routes/app/+page.server.ts', status: 'modified', additions: 25, deletions: 15 },
      { filename: 'drizzle/0019_add_dashboard_index.sql', status: 'added', additions: 5, deletions: 0 },
    ],
    diff: `diff --git a/src/routes/app/+page.server.ts b/src/routes/app/+page.server.ts
index 1234567..abcdefg 100644
--- a/src/routes/app/+page.server.ts
+++ b/src/routes/app/+page.server.ts
@@ -1,20 +1,30 @@
 import type { PageServerLoad } from './$types';
 import { db } from '$lib/server/db';
-import { changes, repositories } from '$lib/server/db/schema';
-import { eq } from 'drizzle-orm';
+import { changes, repositories, engineers } from '$lib/server/db/schema';
+import { eq, desc, and, gte } from 'drizzle-orm';
+import { cache } from '$lib/server/cache';

 export const load: PageServerLoad = async ({ locals }) => {
-  const repos = await db.query.repositories.findMany({
-    where: eq(repositories.orgId, locals.orgId),
-  });
-
-  const recentChanges = [];
-  for (const repo of repos) {
-    const changes = await db.query.changes.findMany({
-      where: eq(changes.repoId, repo.id),
-      limit: 10,
-    });
-    recentChanges.push(...changes);
-  }
+  const cacheKey = \`dashboard:\${locals.orgId}\`;
+
+  return cache.getOrSet(cacheKey, async () => {
+    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
+
+    const recentChanges = await db
+      .select({
+        change: changes,
+        repo: repositories,
+        author: engineers,
+      })
+      .from(changes)
+      .innerJoin(repositories, eq(changes.repoId, repositories.id))
+      .leftJoin(engineers, eq(changes.authorId, engineers.id))
+      .where(and(
+        eq(changes.orgId, locals.orgId),
+        gte(changes.occurredAt, thirtyDaysAgo)
+      ))
+      .orderBy(desc(changes.occurredAt))
+      .limit(50);
+
+    return { recentChanges };
+  }, { ttl: 300 });
 };`,
    expected: {
      affectedAreas: ['api', 'database'],
      keyChanges: ['query optimization', 'caching', 'index'],
    },
  },
  {
    id: 'perf-bundle-splitting',
    name: 'Implement code splitting',
    category: 'performance',
    expectedScore: 3,
    pr: {
      title: 'perf: lazy load heavy components',
      body: `Reduces initial bundle size by 45% through code splitting.

- Chart library loaded on demand
- Admin components lazy loaded
- Markdown editor deferred`,
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/components/Chart.svelte', status: 'modified', additions: 15, deletions: 8 },
      { filename: 'src/routes/app/admin/+layout.svelte', status: 'modified', additions: 12, deletions: 5 },
    ],
    diff: `diff --git a/src/lib/components/Chart.svelte b/src/lib/components/Chart.svelte
index 1234567..abcdefg 100644
--- a/src/lib/components/Chart.svelte
+++ b/src/lib/components/Chart.svelte
@@ -1,12 +1,19 @@
 <script lang="ts">
-  import { Chart as ChartJS } from 'chart.js/auto';
+  import { onMount } from 'svelte';

   let { data, type = 'bar' }: { data: ChartData; type?: ChartType } = $props();
   let canvas: HTMLCanvasElement;
+  let ChartJS: typeof import('chart.js/auto').Chart;
+  let loaded = $state(false);

-  $effect(() => {
-    const chart = new ChartJS(canvas, { type, data });
-    return () => chart.destroy();
+  onMount(async () => {
+    const module = await import('chart.js/auto');
+    ChartJS = module.Chart;
+    loaded = true;
   });
+
+  $effect(() => {
+    if (!loaded || !ChartJS) return;
+    const chart = new ChartJS(canvas, { type, data });
+    return () => chart.destroy();
+  });
 </script>

-<canvas bind:this={canvas}></canvas>
+{#if loaded}
+  <canvas bind:this={canvas}></canvas>
+{:else}
+  <div class="animate-pulse bg-muted h-64 rounded" />
+{/if}`,
    expected: {
      affectedAreas: ['frontend', 'performance'],
      keyChanges: ['lazy loading', 'code splitting'],
    },
  },
];
