import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Create a stable temp root before module loads (OVERRIDES_DIR computed at import time)
const tempRoot = mkdtempSync(join(tmpdir(), "pr-scorer-test-"));
vi.spyOn(process, "cwd").mockReturnValue(tempRoot);

const { saveOverride, loadAllOverrides, updateOverrideGap } = await import("./overrides.js");

afterAll(() => {
	rmSync(tempRoot, { recursive: true, force: true });
	vi.restoreAllMocks();
});

const makeOverride = (pr: string, originalScore = 3, overrideScore = 5) => ({
	pr,
	originalScore,
	originalConfidence: 0.8,
	originalRationale: "AI thought moderate",
	overrideScore,
	reason: "Actually major impact",
	timestamp: "2025-01-01T00:00:00.000Z",
});

// Clean overrides dir between tests
beforeEach(() => {
	const dir = join(tempRoot, ".pr-scorer", "overrides");
	if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
});

describe("saveOverride", () => {
	it("creates override directory and saves JSON file", () => {
		saveOverride(makeOverride("acme/repo#1"));

		const dir = join(tempRoot, ".pr-scorer", "overrides");
		expect(existsSync(dir)).toBe(true);
	});

	it("sanitizes PR ref in filename (replaces / and #)", () => {
		saveOverride(makeOverride("acme/repo#42"));

		const dir = join(tempRoot, ".pr-scorer", "overrides");
		expect(existsSync(join(dir, "acme-repo-42.json"))).toBe(true);
	});
});

describe("loadAllOverrides", () => {
	it("returns empty array when no overrides directory exists", () => {
		expect(loadAllOverrides()).toEqual([]);
	});

	it("loads all saved overrides", () => {
		saveOverride(makeOverride("acme/repo#1"));
		saveOverride(makeOverride("acme/repo#2"));

		const overrides = loadAllOverrides();
		expect(overrides).toHaveLength(2);
		expect(overrides.map((o) => o.pr).sort()).toEqual(["acme/repo#1", "acme/repo#2"]);
	});
});

describe("updateOverrideGap", () => {
	it("adds gapAnalysis to existing override", () => {
		saveOverride(makeOverride("acme/repo#5"));

		updateOverrideGap("acme/repo#5", {
			cause: "Missed security implications",
			suggestion: "Weight security keywords higher",
			confidence: 0.9,
		});

		const overrides = loadAllOverrides();
		expect(overrides).toHaveLength(1);
		expect(overrides[0].gapAnalysis).toEqual({
			cause: "Missed security implications",
			suggestion: "Weight security keywords higher",
			confidence: 0.9,
		});
	});
});
