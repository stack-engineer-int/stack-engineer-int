import { describe, expect, it } from "vitest";
import { generateReviewTable, parseReviewTable } from "./review-table.js";

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

describe("parseReviewTable", () => {
	it("returns empty array when no overrides present", () => {
		const table = generateReviewTable("acme/widget", [
			{
				number: 123,
				title: "Fix auth bypass",
				score: 5,
				confidence: 0.95,
				rationale: "Security fix",
			},
		]);

		const overrides = parseReviewTable(table);
		expect(overrides).toEqual([]);
	});

	it("extracts overrides from rows with filled-in scores", () => {
		const table = [
			"# PR Scores: acme/widget (2026-03-04)",
			"",
			"| # | PR | AI Score | Your Score | Reason |",
			"|---|---|---|---|---|",
			"| 1 | [Fix auth bypass](https://github.com/acme/widget/pull/123) | 5 (Major) | | |",
			"| 2 | [Update deps](https://github.com/acme/widget/pull/124) | 1 (Trivial) | 2 | Patches a security CVE |",
			"| 3 | [Add search](https://github.com/acme/widget/pull/125) | 3 (Moderate) | 5 | Rewrites entire auth flow |",
		].join("\n");

		const overrides = parseReviewTable(table);
		expect(overrides).toHaveLength(2);
		expect(overrides[0]).toEqual({
			pr: "acme/widget#124",
			originalScore: 1,
			overrideScore: 2,
			reason: "Patches a security CVE",
		});
		expect(overrides[1]).toEqual({
			pr: "acme/widget#125",
			originalScore: 3,
			overrideScore: 5,
			reason: "Rewrites entire auth flow",
		});
	});

	it("skips rows where override matches AI score", () => {
		const table = [
			"| # | PR | AI Score | Your Score | Reason |",
			"|---|---|---|---|---|",
			"| 1 | [Fix](https://github.com/acme/widget/pull/123) | 3 (Moderate) | 3 | Confirmed |",
		].join("\n");

		const overrides = parseReviewTable(table);
		expect(overrides).toEqual([]);
	});
});
