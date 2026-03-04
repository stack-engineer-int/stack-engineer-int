const SCORE_LABELS: Record<number, string> = {
	1: "Trivial",
	2: "Minor",
	3: "Moderate",
	5: "Major",
	8: "Critical",
};

export interface ScoredPR {
	number: number;
	title: string;
	score: number;
	confidence: number;
	rationale: string;
}

export function generateReviewTable(repo: string, prs: ScoredPR[]): string {
	const date = new Date().toISOString().slice(0, 10);
	const lines: string[] = [
		`# PR Scores: ${repo} (${date})`,
		"",
		"| # | PR | AI Score | Your Score | Reason |",
		"|---|---|---|---|---|",
	];

	for (let i = 0; i < prs.length; i++) {
		const pr = prs[i];
		const label = SCORE_LABELS[pr.score] ?? "?";
		const link = `[${pr.title}](https://github.com/${repo}/pull/${pr.number})`;
		lines.push(`| ${i + 1} | ${link} | ${pr.score} (${label}) | | |`);
	}

	lines.push("");
	lines.push(
		"Leave **Your Score** blank to accept the AI score. Fill in both columns to record a disagreement.",
	);
	lines.push("");
	lines.push("Valid scores: 1, 2, 3, 5, 8");
	lines.push("");
	lines.push("## AI Rationale");
	lines.push("");

	for (const pr of prs) {
		lines.push(`**#${pr.number}** (${pr.score}, confidence ${pr.confidence}): ${pr.rationale}`);
		lines.push("");
	}

	return lines.join("\n");
}
