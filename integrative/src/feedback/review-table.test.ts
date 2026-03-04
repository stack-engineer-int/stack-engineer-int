import { describe, expect, it } from "vitest";
import { generateReviewTable } from "./review-table.js";

describe("generateReviewTable", () => {
	it("generates markdown table from scored PRs", () => {
		const result = generateReviewTable("acme/widget", [
			{
				number: 123,
				title: "Fix auth bypass",
				score: 5,
				confidence: 0.95,
				rationale: "Security fix",
			},
			{ number: 124, title: "Update deps", score: 1, confidence: 0.9, rationale: "Minor bump" },
		]);

		expect(result).toContain("# PR Scores: acme/widget");
		expect(result).toContain("| AI Score | Your Score | Reason |");
		expect(result).toContain("[Fix auth bypass](https://github.com/acme/widget/pull/123)");
		expect(result).toContain("5 (Major)");
		expect(result).toContain("1 (Trivial)");
		expect(result).toMatch(/5 \(Major\)\s*\|\s*\|\s*\|/);
	});

	it("includes rationale as context below the table", () => {
		const result = generateReviewTable("acme/widget", [
			{
				number: 123,
				title: "Fix auth bypass",
				score: 5,
				confidence: 0.95,
				rationale: "Security fix with data breach potential",
			},
		]);

		expect(result).toContain("## AI Rationale");
		expect(result).toContain("#123");
		expect(result).toContain("Security fix with data breach potential");
	});
});
