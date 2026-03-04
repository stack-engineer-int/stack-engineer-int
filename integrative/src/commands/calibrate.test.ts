import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const tempRoot = mkdtempSync(join(tmpdir(), "pr-scorer-calibrate-test-"));
vi.spyOn(process, "cwd").mockReturnValue(tempRoot);

const { calibrateFromFile } = await import("./calibrate.js");
const { loadAllOverrides } = await import("../feedback/overrides.js");

afterAll(() => {
	rmSync(tempRoot, { recursive: true, force: true });
	vi.restoreAllMocks();
});

beforeEach(() => {
	const dir = join(tempRoot, ".pr-scorer", "overrides");
	if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
});

describe("calibrateFromFile", () => {
	it("creates overrides from edited review table", () => {
		const reviewDir = join(tempRoot, ".pr-scorer", "reviews");
		mkdirSync(reviewDir, { recursive: true });

		const table = [
			"# PR Scores: acme/widget (2026-03-04)",
			"",
			"| # | PR | AI Score | Your Score | Reason |",
			"|---|---|---|---|---|",
			"| 1 | [Fix auth](https://github.com/acme/widget/pull/123) | 5 (Major) | | |",
			"| 2 | [Update deps](https://github.com/acme/widget/pull/124) | 1 (Trivial) | 2 | Patches security CVE |",
		].join("\n");

		const filePath = join(reviewDir, "2026-03-04-acme-widget.md");
		writeFileSync(filePath, table);

		const result = calibrateFromFile(filePath);

		expect(result.created).toBe(1);
		expect(result.skipped).toBe(1);

		const overrides = loadAllOverrides();
		expect(overrides).toHaveLength(1);
		expect(overrides[0].pr).toBe("acme/widget#124");
		expect(overrides[0].overrideScore).toBe(2);
		expect(overrides[0].reason).toBe("Patches security CVE");
	});

	it("throws if file does not exist", () => {
		expect(() => calibrateFromFile("/nonexistent/file.md")).toThrow();
	});
});
