import type { PRFixture } from "../types.js";

export const securityFixtures: PRFixture[] = [
	{
		id: "security-xss-fix",
		name: "Fix XSS vulnerability",
		category: "security",
		expectedScore: 3,
		pr: {
			title: "fix: sanitize user input to prevent XSS",
			body: `## Security Fix
User-provided HTML was rendered without sanitization, allowing XSS attacks.

## Impact
Attackers could inject malicious scripts via profile bio field.

## Fix
- Added DOMPurify sanitization
- Escape HTML in all user content displays`,
			author: "security-engineer",
		},
		files: [
			{ filename: "src/lib/utils/sanitize.ts", status: "added", additions: 25, deletions: 0 },
			{
				filename: "src/lib/components/UserBio.svelte",
				status: "modified",
				additions: 8,
				deletions: 3,
			},
		],
		diff: `diff --git a/src/lib/utils/sanitize.ts b/src/lib/utils/sanitize.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/lib/utils/sanitize.ts
@@ -0,0 +1,25 @@
+import DOMPurify from 'dompurify';
+
+const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'];
+const ALLOWED_ATTR = ['href', 'target', 'rel'];
+
+export function sanitizeHtml(dirty: string): string {
+  return DOMPurify.sanitize(dirty, {
+    ALLOWED_TAGS,
+    ALLOWED_ATTR,
+    ALLOW_DATA_ATTR: false,
+  });
+}
+
+export function escapeHtml(text: string): string {
+  const map: Record<string, string> = {
+    '&': '&amp;',
+    '<': '&lt;',
+    '>': '&gt;',
+    '"': '&quot;',
+    "'": '&#039;',
+  };
+  return text.replace(/[&<>"']/g, (m) => map[m]);
+}

diff --git a/src/lib/components/UserBio.svelte b/src/lib/components/UserBio.svelte
index 1234567..abcdefg 100644
--- a/src/lib/components/UserBio.svelte
+++ b/src/lib/components/UserBio.svelte
@@ -1,8 +1,13 @@
 <script lang="ts">
+  import { sanitizeHtml } from '$lib/utils/sanitize';
+
   let { bio }: { bio: string } = $props();
+
+  const safeBio = $derived(sanitizeHtml(bio));
 </script>

 <div class="user-bio prose">
-  {@html bio}
+  {@html safeBio}
 </div>`,
		expected: {
			affectedAreas: ["security", "frontend"],
			keyChanges: ["XSS fix", "sanitization"],
		},
	},
	{
		id: "security-sql-injection",
		name: "Fix SQL injection vulnerability",
		category: "security",
		expectedScore: 5,
		pr: {
			title: "fix: prevent SQL injection in search endpoint",
			body: `## CRITICAL SECURITY FIX

Search endpoint was vulnerable to SQL injection through the query parameter.

### Vulnerable code
\`\`\`ts
db.execute(\`SELECT * FROM users WHERE name LIKE '%\${query}%'\`)
\`\`\`

### Fixed code
Uses parameterized queries via Drizzle ORM.

### Testing
- Added SQL injection test cases
- Verified with sqlmap`,
			author: "security-engineer",
		},
		files: [
			{
				filename: "src/routes/api/search/+server.ts",
				status: "modified",
				additions: 15,
				deletions: 8,
			},
			{
				filename: "src/routes/api/search/+server.test.ts",
				status: "added",
				additions: 45,
				deletions: 0,
			},
		],
		diff: `diff --git a/src/routes/api/search/+server.ts b/src/routes/api/search/+server.ts
index 1234567..abcdefg 100644
--- a/src/routes/api/search/+server.ts
+++ b/src/routes/api/search/+server.ts
@@ -1,15 +1,22 @@
 import { json } from '@sveltejs/kit';
 import type { RequestHandler } from './$types';
 import { db } from '$lib/server/db';
-import { sql } from 'drizzle-orm';
+import { users } from '$lib/server/db/schema';
+import { ilike, or } from 'drizzle-orm';

 export const GET: RequestHandler = async ({ url }) => {
   const query = url.searchParams.get('q') ?? '';

-  const results = await db.execute(
-    sql\`SELECT * FROM users WHERE name LIKE '%\${query}%'\`
-  );
+  const sanitized = query.trim().slice(0, 100);
+  if (sanitized.length < 2) {
+    return json({ results: [] });
+  }
+
+  const results = await db
+    .select()
+    .from(users)
+    .where(or(
+      ilike(users.name, \`%\${sanitized}%\`),
+      ilike(users.email, \`%\${sanitized}%\`)
+    ))
+    .limit(20);

   return json({ results });
 };`,
		expected: {
			affectedAreas: ["security", "api"],
			keyChanges: ["SQL injection fix", "parameterized queries"],
		},
	},
	{
		id: "security-dependency-patch",
		name: "Patch vulnerable dependency",
		category: "security",
		expectedScore: 2,
		pr: {
			title: "fix: update lodash to patch prototype pollution",
			body: `Updates lodash from 4.17.19 to 4.17.21 to fix CVE-2021-23337.

npm audit clean after this update.`,
			author: "dependabot[bot]",
		},
		files: [
			{ filename: "package.json", status: "modified", additions: 1, deletions: 1 },
			{ filename: "pnpm-lock.yaml", status: "modified", additions: 15, deletions: 15 },
		],
		diff: `diff --git a/package.json b/package.json
index 1234567..abcdefg 100644
--- a/package.json
+++ b/package.json
@@ -25,7 +25,7 @@
   "dependencies": {
     "svelte": "^5.0.0",
     "@sveltejs/kit": "^2.0.0",
-    "lodash": "^4.17.19",
+    "lodash": "^4.17.21",
     "drizzle-orm": "^0.30.0"
   }
 }`,
		expected: {
			affectedAreas: ["deps", "security"],
			keyChanges: ["security patch", "lodash update"],
		},
	},
];
