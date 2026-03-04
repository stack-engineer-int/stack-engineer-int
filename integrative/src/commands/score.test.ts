import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../github/client.js", () => ({
	fetchPR: vi.fn(),
}));

vi.mock("../scoring/scorer.js", () => ({
	scorePR: vi.fn(),
}));

import { fetchPR } from "../github/client.js";
import { scorePR } from "../scoring/scorer.js";
import { scoreCommand } from "./score.js";

const mockFetchPR = vi.mocked(fetchPR);
const mockScorePR = vi.mocked(scorePR);

const fakePR = {
	title: "fix: patch login bug",
	body: "Fixes null check on auth token",
	diff: "diff --git a/src/auth.ts...",
	filesChanged: [{ filename: "src/auth.ts", status: "modified", additions: 3, deletions: 1 }],
};

const fakeScore = {
	score: 2 as const,
	confidence: 0.9,
	description: "Adds null check to auth token",
	rationale: "Simple defensive fix, low risk.",
	keyChanges: ["Added null check in auth handler"],
	affectedAreas: ["auth"],
};

describe("scoreCommand", () => {
	beforeEach(() => {
		mockFetchPR.mockResolvedValue(fakePR);
		mockScorePR.mockResolvedValue(fakeScore);
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("outputs valid JSON by default", async () => {
		await scoreCommand("owner/repo#1", { model: "haiku" });

		const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0];
		const parsed = JSON.parse(output);

		expect(parsed.pr).toBe("owner/repo#1");
		expect(parsed.title).toBe("fix: patch login bug");
		expect(parsed.score).toBe(2);
		expect(parsed.confidence).toBe(0.9);
		expect(parsed.keyChanges).toEqual(["Added null check in auth handler"]);
	});

	it("outputs markdown with --md flag", async () => {
		await scoreCommand("owner/repo#1", { model: "haiku", md: true });

		const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0];

		expect(output).toContain("## fix: patch login bug");
		expect(output).toContain("**Score:** 2 (Minor)");
		expect(output).toContain("**Confidence:** 0.9");
		expect(output).toContain("- Added null check in auth handler");
	});

	it("calls fetchPR and scorePR with correct args", async () => {
		await scoreCommand("owner/repo#42", { model: "gemini-flash" });

		expect(mockFetchPR).toHaveBeenCalledWith("owner/repo#42");
		expect(mockScorePR).toHaveBeenCalledWith(fakePR, { model: "gemini-flash" });
	});
});
