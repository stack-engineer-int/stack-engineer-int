import type { PRFixture } from '../types.js';

export const apiFixtures: PRFixture[] = [
  {
    id: 'api-new-endpoint',
    name: 'Add new API endpoint',
    category: 'api',
    expectedScore: 3,
    pr: {
      title: 'feat: add /api/analytics endpoint',
      body: `Adds endpoint to fetch analytics data for dashboards.

- Aggregates daily/weekly/monthly metrics
- Supports date range filtering
- Returns cached results for performance`,
      author: 'developer',
    },
    files: [
      { filename: 'src/routes/api/analytics/+server.ts', status: 'added', additions: 75, deletions: 0 },
      { filename: 'src/lib/server/analytics.ts', status: 'added', additions: 45, deletions: 0 },
    ],
    diff: `diff --git a/src/routes/api/analytics/+server.ts b/src/routes/api/analytics/+server.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/routes/api/analytics/+server.ts
@@ -0,0 +1,55 @@
+import { json, error } from '@sveltejs/kit';
+import type { RequestHandler } from './$types';
+import { getAnalytics, type AnalyticsParams } from '$lib/server/analytics';
+import { z } from 'zod';
+
+const QuerySchema = z.object({
+  start: z.string().datetime().optional(),
+  end: z.string().datetime().optional(),
+  period: z.enum(['day', 'week', 'month']).default('day'),
+  metrics: z.array(z.string()).optional(),
+});
+
+export const GET: RequestHandler = async ({ url, locals }) => {
+  if (!locals.userId) {
+    return error(401, 'Unauthorized');
+  }
+
+  const params = QuerySchema.safeParse({
+    start: url.searchParams.get('start'),
+    end: url.searchParams.get('end'),
+    period: url.searchParams.get('period'),
+    metrics: url.searchParams.getAll('metrics'),
+  });
+
+  if (!params.success) {
+    return error(400, 'Invalid parameters');
+  }
+
+  const analytics = await getAnalytics({
+    orgId: locals.orgId,
+    ...params.data,
+  });
+
+  return json(analytics, {
+    headers: {
+      'Cache-Control': 'private, max-age=300',
+    },
+  });
+};`,
    expected: {
      affectedAreas: ['api'],
      keyChanges: ['analytics endpoint', 'caching'],
    },
  },
  {
    id: 'api-breaking-v2',
    name: 'Breaking API v2 migration',
    category: 'api',
    expectedScore: 5,
    pr: {
      title: 'feat!: migrate to API v2 response format',
      body: `## BREAKING CHANGE
New API response structure across all endpoints.

### Old format
\`\`\`json
{ "result": {...}, "success": true }
\`\`\`

### New format
\`\`\`json
{ "data": {...}, "meta": { "version": "2.0" }, "errors": [] }
\`\`\`

### Migration
All clients must update to use \`data\` instead of \`result\`.
v1 endpoints deprecated, will be removed in 30 days.`,
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/server/api/response.ts', status: 'modified', additions: 45, deletions: 20 },
      { filename: 'src/routes/api/users/+server.ts', status: 'modified', additions: 8, deletions: 5 },
      { filename: 'src/routes/api/repos/+server.ts', status: 'modified', additions: 8, deletions: 5 },
      { filename: 'src/routes/api/changes/+server.ts', status: 'modified', additions: 12, deletions: 8 },
      { filename: 'docs/api-migration.md', status: 'added', additions: 85, deletions: 0 },
    ],
    diff: `diff --git a/src/lib/server/api/response.ts b/src/lib/server/api/response.ts
index 1234567..abcdefg 100644
--- a/src/lib/server/api/response.ts
+++ b/src/lib/server/api/response.ts
@@ -1,20 +1,45 @@
-export interface ApiResponse<T> {
-  result: T;
-  success: boolean;
-  error?: string;
+export interface ApiResponseV2<T> {
+  data: T;
+  meta: {
+    version: '2.0';
+    timestamp: string;
+    requestId: string;
+  };
+  errors?: ApiError[];
+}
+
+export interface ApiError {
+  code: string;
+  message: string;
+  field?: string;
 }

-export function success<T>(result: T): ApiResponse<T> {
+export function success<T>(data: T, requestId: string): ApiResponseV2<T> {
   return {
-    result,
-    success: true,
+    data,
+    meta: {
+      version: '2.0',
+      timestamp: new Date().toISOString(),
+      requestId,
+    },
   };
 }

-export function failure(error: string): ApiResponse<null> {
+export function failure(errors: ApiError[], requestId: string): ApiResponseV2<null> {
   return {
-    result: null,
-    success: false,
-    error,
+    data: null,
+    meta: {
+      version: '2.0',
+      timestamp: new Date().toISOString(),
+      requestId,
+    },
+    errors,
   };
 }`,
    expected: {
      affectedAreas: ['api'],
      keyChanges: ['API v2', 'breaking change', 'response format'],
    },
  },
  {
    id: 'api-rate-limiting',
    name: 'Add API rate limiting',
    category: 'api',
    expectedScore: 3,
    pr: {
      title: 'feat: implement API rate limiting',
      body: `Adds rate limiting to prevent abuse.

- 100 requests/minute for authenticated users
- 20 requests/minute for anonymous
- Redis-backed for distributed environments`,
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/server/ratelimit.ts', status: 'added', additions: 65, deletions: 0 },
      { filename: 'src/hooks.server.ts', status: 'modified', additions: 25, deletions: 2 },
    ],
    diff: `diff --git a/src/lib/server/ratelimit.ts b/src/lib/server/ratelimit.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/lib/server/ratelimit.ts
@@ -0,0 +1,50 @@
+import { Redis } from '@upstash/redis';
+import { Ratelimit } from '@upstash/ratelimit';
+import { UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN } from '$env/static/private';
+
+const redis = new Redis({
+  url: UPSTASH_REDIS_URL,
+  token: UPSTASH_REDIS_TOKEN,
+});
+
+export const authenticatedLimit = new Ratelimit({
+  redis,
+  limiter: Ratelimit.slidingWindow(100, '1 m'),
+  analytics: true,
+  prefix: 'ratelimit:auth',
+});
+
+export const anonymousLimit = new Ratelimit({
+  redis,
+  limiter: Ratelimit.slidingWindow(20, '1 m'),
+  analytics: true,
+  prefix: 'ratelimit:anon',
+});
+
+export async function checkRateLimit(
+  identifier: string,
+  isAuthenticated: boolean
+): Promise<{ success: boolean; remaining: number; reset: number }> {
+  const limiter = isAuthenticated ? authenticatedLimit : anonymousLimit;
+  const { success, remaining, reset } = await limiter.limit(identifier);
+
+  return { success, remaining, reset };
+}`,
    expected: {
      affectedAreas: ['api', 'security'],
      keyChanges: ['rate limiting', 'Redis'],
    },
  },
];
