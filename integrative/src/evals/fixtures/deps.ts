import type { PRFixture } from "../types.js";

export const depsFixtures: PRFixture[] = [
	{
		id: "deps-minor-update",
		name: "Minor dependency updates",
		category: "deps",
		expectedScore: 1,
		pr: {
			title: "chore(deps): bump minor versions",
			body: `Updates minor versions of dependencies.

| Package | From | To |
|---------|------|-----|
| svelte | 5.0.0 | 5.1.0 |
| drizzle-orm | 0.30.0 | 0.30.2 |`,
			author: "dependabot[bot]",
		},
		files: [
			{ filename: "package.json", status: "modified", additions: 2, deletions: 2 },
			{ filename: "pnpm-lock.yaml", status: "modified", additions: 50, deletions: 50 },
		],
		diff: `diff --git a/package.json b/package.json
index 1234567..abcdefg 100644
--- a/package.json
+++ b/package.json
@@ -15,8 +15,8 @@
   },
   "dependencies": {
-    "svelte": "^5.0.0",
-    "drizzle-orm": "^0.30.0",
+    "svelte": "^5.1.0",
+    "drizzle-orm": "^0.30.2",
     "@sveltejs/kit": "^2.0.0"
   }
 }`,
		expected: {
			affectedAreas: ["deps"],
			keyChanges: ["dependency update"],
		},
	},
	{
		id: "deps-major-upgrade",
		name: "Major framework upgrade",
		category: "deps",
		expectedScore: 5,
		pr: {
			title: "feat: upgrade to SvelteKit 2",
			body: `## Summary
Upgrades from SvelteKit 1.x to 2.x

## Breaking Changes
- Updated route structure
- New load function signature
- Removed deprecated APIs

## Migration steps
1. Updated all +page.server.ts files
2. Changed form actions syntax
3. Updated hooks.server.ts`,
			author: "developer",
		},
		files: [
			{ filename: "package.json", status: "modified", additions: 5, deletions: 5 },
			{ filename: "pnpm-lock.yaml", status: "modified", additions: 500, deletions: 500 },
			{ filename: "svelte.config.js", status: "modified", additions: 8, deletions: 5 },
			{ filename: "src/hooks.server.ts", status: "modified", additions: 12, deletions: 8 },
		],
		diff: `diff --git a/package.json b/package.json
index 1234567..abcdefg 100644
--- a/package.json
+++ b/package.json
@@ -15,9 +15,9 @@
   },
   "dependencies": {
     "svelte": "^5.0.0",
-    "@sveltejs/kit": "^1.30.0",
-    "@sveltejs/adapter-vercel": "^3.0.0"
+    "@sveltejs/kit": "^2.0.0",
+    "@sveltejs/adapter-vercel": "^4.0.0"
   },
   "devDependencies": {
-    "@sveltejs/vite-plugin-svelte": "^2.0.0",
+    "@sveltejs/vite-plugin-svelte": "^3.0.0",
     "vite": "^5.0.0"
   }
 }

diff --git a/src/hooks.server.ts b/src/hooks.server.ts
index 1234567..abcdefg 100644
--- a/src/hooks.server.ts
+++ b/src/hooks.server.ts
@@ -1,12 +1,16 @@
-import type { Handle } from '@sveltejs/kit';
+import type { Handle, HandleServerError } from '@sveltejs/kit';
+import { sequence } from '@sveltejs/kit/hooks';

-export const handle: Handle = async ({ event, resolve }) => {
+const authHandle: Handle = async ({ event, resolve }) => {
   const session = await getSession(event.cookies);
-  event.locals.session = session;
+  event.locals.user = session?.user;
   return resolve(event);
 };
+
+const loggingHandle: Handle = async ({ event, resolve }) => {
+  const start = Date.now();
+  const response = await resolve(event);
+  console.log(\`\${event.request.method} \${event.url.pathname} - \${Date.now() - start}ms\`);
+  return response;
+};
+
+export const handle = sequence(authHandle, loggingHandle);`,
		expected: {
			affectedAreas: ["deps", "framework"],
			keyChanges: ["SvelteKit 2 upgrade", "breaking changes", "hooks migration"],
		},
	},
	{
		id: "deps-new-library",
		name: "Add new library",
		category: "deps",
		expectedScore: 2,
		pr: {
			title: "feat: add zod for runtime validation",
			body: "Adds Zod for type-safe runtime validation of API inputs.",
			author: "developer",
		},
		files: [
			{ filename: "package.json", status: "modified", additions: 1, deletions: 0 },
			{ filename: "pnpm-lock.yaml", status: "modified", additions: 25, deletions: 0 },
			{ filename: "src/lib/validation.ts", status: "added", additions: 30, deletions: 0 },
		],
		diff: `diff --git a/package.json b/package.json
index 1234567..abcdefg 100644
--- a/package.json
+++ b/package.json
@@ -18,6 +18,7 @@
     "svelte": "^5.0.0",
     "@sveltejs/kit": "^2.0.0",
     "drizzle-orm": "^0.30.0",
+    "zod": "^3.22.0"
   }
 }

diff --git a/src/lib/validation.ts b/src/lib/validation.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/lib/validation.ts
@@ -0,0 +1,30 @@
+import { z } from 'zod';
+
+export const UserSchema = z.object({
+  id: z.string().uuid(),
+  email: z.string().email(),
+  name: z.string().min(1).max(100),
+  role: z.enum(['user', 'admin']),
+});
+
+export type User = z.infer<typeof UserSchema>;
+
+export const CreateUserSchema = UserSchema.omit({ id: true });
+
+export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
+  return schema.parse(data);
+}
+
+export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown):
+  { success: true; data: T } | { success: false; error: z.ZodError } {
+  const result = schema.safeParse(data);
+  if (result.success) {
+    return { success: true, data: result.data };
+  }
+  return { success: false, error: result.error };
+}`,
		expected: {
			affectedAreas: ["deps"],
			keyChanges: ["add Zod", "validation schemas"],
		},
	},
];
