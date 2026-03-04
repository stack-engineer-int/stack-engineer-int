import chalk from "chalk";
import { analyzeGap } from "../feedback/gap-analysis.js";
import { loadAllOverrides, updateOverrideGap } from "../feedback/overrides.js";

export async function gapsCommand(): Promise<void> {
	const overrides = loadAllOverrides();

	if (overrides.length === 0) {
		console.log(
			chalk.dim("No overrides found. Use `pr-scorer override` to record score disagreements."),
		);
		return;
	}

	const unanalyzed = overrides.filter((o) => !o.gapAnalysis);
	const analyzed = overrides.filter((o) => o.gapAnalysis);

	if (unanalyzed.length > 0) {
		console.log(chalk.dim(`Analyzing ${unanalyzed.length} new overrides...`));
		console.log("");

		for (const override of unanalyzed) {
			try {
				const gap = await analyzeGap(override);
				updateOverrideGap(override.pr, gap);
				console.log(
					`  ${chalk.bold(override.pr)}: ${override.originalScore} -> ${override.overrideScore}`,
				);
				console.log(`    ${chalk.dim("Cause:")} ${gap.cause}`);
				console.log(`    ${chalk.dim("Suggestion:")} ${gap.suggestion}`);
				console.log(`    ${chalk.dim("Confidence:")} ${gap.confidence}`);
				console.log("");
				analyzed.push({ ...override, gapAnalysis: gap });
			} catch (error) {
				console.log(chalk.red(`  Failed to analyze ${override.pr}: ${(error as Error).message}`));
			}
		}
	}

	if (analyzed.length > 0) {
		console.log(chalk.bold(`Gap Analysis (${analyzed.length} overrides)`));
		console.log("");

		const suggestions = new Map<string, typeof analyzed>();
		for (const o of analyzed) {
			if (!o.gapAnalysis) continue;
			const key = o.gapAnalysis.suggestion.slice(0, 50);
			if (!suggestions.has(key)) suggestions.set(key, []);
			suggestions.get(key)?.push(o);
		}

		for (const [_, group] of suggestions) {
			if (group.length >= 2) {
				console.log(`  ${chalk.bold(`Pattern (${group.length} overrides):`)}`);
				console.log(`    ${group[0].gapAnalysis?.suggestion}`);
				console.log(`    ${chalk.dim("PRs:")} ${group.map((o) => o.pr).join(", ")}`);
				console.log("");
			}
		}

		const oneOffs = [...suggestions.values()].filter((g) => g.length === 1).flat();
		if (oneOffs.length > 0) {
			console.log(chalk.dim(`  ${oneOffs.length} one-off disagreements (no pattern detected)`));
		}
	}
}
