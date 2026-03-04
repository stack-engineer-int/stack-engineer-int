import { describe, expect, it } from "vitest";
import type { PRContext } from "../types.js";
import { buildScoringPrompt } from "./prompt.js";

describe("buildScoringPrompt", () => {
	const baseContext: PRContext = {
		title: "fix: null check on login",
		body: "Prevents crash when token is missing",
		diff: "diff --git a/auth.ts\n+if (!token) return;",
		filesChanged: [
			{ filename: "src/auth.ts", status: "modified", additions: 3, deletions: 1 },
			{ filename: "src/utils.ts", status: "added", additions: 10, deletions: 0 },
		],
	};

	it("substitutes title into prompt", () => {
		const result = buildScoringPrompt(baseContext);
		expect(result).toContain("fix: null check on login");
		expect(result).not.toContain("{title}");
	});

	it("substitutes body into prompt", () => {
		const result = buildScoringPrompt(baseContext);
		expect(result).toContain("Prevents crash when token is missing");
		expect(result).not.toContain("{body}");
	});

	it("formats file list with status and line counts", () => {
		const result = buildScoringPrompt(baseContext);
		expect(result).toContain("- src/auth.ts (modified: +3/-1)");
		expect(result).toContain("- src/utils.ts (added: +10/-0)");
	});

	it("substitutes diff into prompt", () => {
		const result = buildScoringPrompt(baseContext);
		expect(result).toContain("if (!token) return;");
		expect(result).not.toContain("{diff}");
	});

	it("uses fallback when body is null", () => {
		const context: PRContext = { ...baseContext, body: null };
		const result = buildScoringPrompt(context);
		expect(result).toContain("No description provided");
	});

	it("leaves no unreplaced placeholders", () => {
		const result = buildScoringPrompt(baseContext);
		expect(result).not.toMatch(/\{(title|body|files|diff)\}/);
	});
});
