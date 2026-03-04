import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { type ScoredPR, generateReviewTable } from "../feedback/review-table.js";
import { fetchPR, fetchRecentPRs } from "../github/client.js";
import type { ModelId } from "../scoring/models.js";
import { scorePR } from "../scoring/scorer.js";

const SCORE_LABELS: Record<number, string> = {
	1: "Trivial",
	2: "Minor",
	3: "Moderate",
	5: "Major",
	8: "Critical",
};

const REVIEWS_DIR = join(process.cwd(), ".pr-scorer", "reviews");

export function writeReviewFile(repo: string, scoredPRs: ScoredPR[]): string {
	mkdirSync(REVIEWS_DIR, { recursive: true });
	const date = new Date().toISOString().slice(0, 10);
	const safeRepo = repo.replace(/\//g, "-");
	const filename = `${date}-${safeRepo}.md`;
	const path = join(REVIEWS_DIR, filename);
	writeFileSync(path, generateReviewTable(repo, scoredPRs));
	return path;
}

export async function backfillCommand(
	repoRef: string,
	options: { count?: string; model?: ModelId; concurrency?: string; review?: boolean },
): Promise<void> {
	const count = Number.parseInt(options.count ?? "10", 10);
	const concurrency = Number.parseInt(options.concurrency ?? "3", 10);
	const modelId = options.model ?? "gemini-flash";

	console.log(chalk.dim(`Fetching last ${count} merged PRs from ${repoRef}...`));
	const prs = await fetchRecentPRs(repoRef, count);
	console.log(chalk.dim(`Found ${prs.length} merged PRs. Scoring with ${modelId}...`));
	console.log("");

	const scoredPRs: ScoredPR[] = [];

	for (let i = 0; i < prs.length; i += concurrency) {
		const chunk = prs.slice(i, i + concurrency);
		const results = await Promise.all(
			chunk.map(async (pr) => {
				const ref = `${repoRef}#${pr.number}`;
				try {
					const context = await fetchPR(ref);
					const score = await scorePR(context, { model: modelId });
					return { pr, score, error: null };
				} catch (error) {
					return { pr, score: null, error: error as Error };
				}
			}),
		);

		for (const { pr, score, error } of results) {
			if (error) {
				console.log(chalk.red(`  #${pr.number} ${pr.title} - ERROR: ${error.message}`));
			} else if (score) {
				const label = SCORE_LABELS[score.score] ?? "?";
				const conf = chalk.dim(`(${score.confidence})`);
				console.log(
					`  ${chalk.bold(`${score.score}`)} ${label} ${conf}  #${pr.number} ${pr.title}`,
				);
				scoredPRs.push({
					number: pr.number,
					title: pr.title,
					score: score.score,
					confidence: score.confidence,
					rationale: score.rationale,
				});
			}
		}
	}

	if (options.review && scoredPRs.length > 0) {
		const path = writeReviewFile(repoRef, scoredPRs);
		console.log("");
		console.log(chalk.green(`Review file written: ${path}`));
		console.log(
			chalk.dim("Edit the file, fill in disagreements, then run: pnpm dev calibrate <file>"),
		);
	}
}
