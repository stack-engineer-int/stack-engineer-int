import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

const tempRoot = mkdtempSync(join(tmpdir(), "pr-scorer-backfill-test-"));
vi.spyOn(process, "cwd").mockReturnValue(tempRoot);

const { writeReviewFile } = await import("./backfill.js");

afterAll(() => {
	rmSync(tempRoot, { recursive: true, force: true });
	vi.restoreAllMocks();
});

describe("writeReviewFile", () => {
	it("writes markdown review file to .pr-scorer/reviews/", () => {
		const path = writeReviewFile("acme/widget", [
			{ number: 123, title: "Fix bug", score: 3, confidence: 0.85, rationale: "Bug fix" },
		]);

		expect(existsSync(path)).toBe(true);
		const content = readFileSync(path, "utf-8");
		expect(content).toContain("# PR Scores: acme/widget");
		expect(content).toContain("[Fix bug]");
	});
});
