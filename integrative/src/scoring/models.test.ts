import { describe, expect, it } from "vitest";
import { MODELS, type ModelId, getModel } from "./models.js";

describe("MODELS registry", () => {
	it("has haiku and gemini-flash entries", () => {
		expect(MODELS.haiku).toBeDefined();
		expect(MODELS["gemini-flash"]).toBeDefined();
	});

	it("each model has required fields", () => {
		for (const [id, config] of Object.entries(MODELS)) {
			expect(config.id).toBe(id);
			expect(config.name).toBeTruthy();
			expect(typeof config.provider).toBe("function");
			expect(config.costPer1MTokens).toBeGreaterThan(0);
			expect(config.description).toBeTruthy();
		}
	});
});

describe("getModel", () => {
	it("returns config for haiku", () => {
		const config = getModel("haiku");
		expect(config.id).toBe("haiku");
		expect(config.name).toContain("Haiku");
	});

	it("returns config for gemini-flash", () => {
		const config = getModel("gemini-flash");
		expect(config.id).toBe("gemini-flash");
		expect(config.name).toContain("Gemini");
	});

	it("throws for unknown model ID", () => {
		expect(() => getModel("gpt-4" as ModelId)).toThrow("Unknown model: gpt-4");
	});
});
