import { readFileSync } from "node:fs";
import chalk from "chalk";
import { saveOverride } from "../feedback/overrides.js";
import { parseReviewTable } from "../feedback/review-table.js";

export function calibrateFromFile(filePath: string): { created: number; skipped: number } {
	const content = readFileSync(filePath, "utf-8");
	const parsed = parseReviewTable(content);

	for (const override of parsed) {
		saveOverride({
			pr: override.pr,
			originalScore: override.originalScore,
			originalConfidence: 0,
			originalRationale: "From review table",
			overrideScore: override.overrideScore,
			reason: override.reason,
			timestamp: new Date().toISOString(),
		});
	}

	const tableRows = content
		.split("\n")
		.filter(
			(line) => line.startsWith("|") && !line.startsWith("|---") && !line.includes("AI Score"),
		).length;

	return { created: parsed.length, skipped: tableRows - parsed.length };
}

export async function calibrateCommand(filePath: string): Promise<void> {
	const { created, skipped } = calibrateFromFile(filePath);

	if (created === 0) {
		console.log(chalk.dim("No disagreements found. All AI scores accepted."));
		return;
	}

	console.log(chalk.green(`Created ${created} override(s), ${skipped} accepted as-is.`));
	console.log(chalk.dim("Run `pnpm dev gaps` to analyze patterns."));
}
