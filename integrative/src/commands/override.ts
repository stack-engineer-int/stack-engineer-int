import chalk from "chalk";
import { saveOverride } from "../feedback/overrides.js";

export async function overrideCommand(
	prRef: string,
	options: { score: string; reason: string; originalScore?: string; originalRationale?: string },
): Promise<void> {
	const override = {
		pr: prRef,
		originalScore: Number.parseInt(options.originalScore ?? "0", 10),
		originalConfidence: 0,
		originalRationale: options.originalRationale ?? "Not provided",
		overrideScore: Number.parseInt(options.score, 10),
		reason: options.reason,
		timestamp: new Date().toISOString(),
	};

	saveOverride(override);
	console.log(
		chalk.green(
			`Override saved for ${prRef}: ${override.originalScore} -> ${override.overrideScore}`,
		),
	);
}
