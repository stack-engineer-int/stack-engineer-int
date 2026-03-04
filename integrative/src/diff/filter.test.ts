import { describe, expect, it } from "vitest";
import { filterDiff } from "./filter.js";

describe("filterDiff", () => {
	it("removes lockfile diffs", () => {
		const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,3 +1,4 @@
+import { foo } from 'bar';
 console.log('hello');
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -1,100 +1,200 @@
+lots of lockfile content`;

		const result = filterDiff(diff);
		expect(result).toContain("src/app.ts");
		expect(result).not.toContain("pnpm-lock.yaml");
	});

	it("removes build output diffs", () => {
		const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1 +1 @@
+real code
diff --git a/dist/app.js b/dist/app.js
--- a/dist/app.js
+++ b/dist/app.js
@@ -1 +1 @@
+compiled output`;

		const result = filterDiff(diff);
		expect(result).toContain("src/app.ts");
		expect(result).not.toContain("dist/app.js");
	});

	it("passes through normal diffs unchanged", () => {
		const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1 +1 @@
-old
+new`;

		const result = filterDiff(diff);
		expect(result).toContain("old");
		expect(result).toContain("new");
	});
});
