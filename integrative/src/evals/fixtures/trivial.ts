import type { PRFixture } from "../types.js";

export const trivialFixtures: PRFixture[] = [
	{
		id: "trivial-typo",
		name: "Fix typo in README",
		category: "trivial",
		expectedScore: 1,
		pr: {
			title: "fix: typo in README",
			body: "Fixed a small typo.",
			author: "developer",
		},
		files: [{ filename: "README.md", status: "modified", additions: 1, deletions: 1 }],
		diff: `diff --git a/README.md b/README.md
index 1234567..abcdefg 100644
--- a/README.md
+++ b/README.md
@@ -10,7 +10,7 @@ A powerful tool for teams.

 ## Getting Started

-To get started, run the follwing command:
+To get started, run the following command:

 \`\`\`bash
 npm install`,
		expected: {
			affectedAreas: ["docs"],
		},
	},
	{
		id: "trivial-formatting",
		name: "Code formatting only",
		category: "trivial",
		expectedScore: 1,
		pr: {
			title: "chore: run prettier",
			body: "Auto-formatted files with prettier.",
			author: "developer",
		},
		files: [{ filename: "src/utils.ts", status: "modified", additions: 5, deletions: 5 }],
		diff: `diff --git a/src/utils.ts b/src/utils.ts
index 1234567..abcdefg 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,10 +1,10 @@
-export function formatDate(date: Date): string{
-  return date.toISOString().split('T')[0]
+export function formatDate(date: Date): string {
+  return date.toISOString().split('T')[0];
 }

-export function capitalize(str: string): string{
-  return str.charAt(0).toUpperCase() + str.slice(1)
+export function capitalize(str: string): string {
+  return str.charAt(0).toUpperCase() + str.slice(1);
 }`,
		expected: {
			affectedAreas: ["utils"],
		},
	},
	{
		id: "trivial-comment",
		name: "Add code comment",
		category: "trivial",
		expectedScore: 1,
		pr: {
			title: "docs: add clarifying comment",
			body: null,
			author: "developer",
		},
		files: [{ filename: "src/core/parser.ts", status: "modified", additions: 2, deletions: 0 }],
		diff: `diff --git a/src/core/parser.ts b/src/core/parser.ts
index 1234567..abcdefg 100644
--- a/src/core/parser.ts
+++ b/src/core/parser.ts
@@ -45,6 +45,8 @@ export function parseConfig(input: string): Config {
   const tokens = tokenize(input);
   const ast = buildAST(tokens);

+  // Validate AST before transformation
+  // This catches malformed input early
   validateAST(ast);

   return transform(ast);`,
		expected: {
			affectedAreas: ["core"],
		},
	},
];
