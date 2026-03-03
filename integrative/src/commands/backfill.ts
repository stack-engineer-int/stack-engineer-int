import chalk from 'chalk';
import { fetchPR, fetchRecentPRs } from '../github/client.js';
import { scorePR } from '../scoring/scorer.js';
import type { ModelId } from '../scoring/models.js';

const SCORE_LABELS: Record<number, string> = {
  1: 'Trivial',
  2: 'Minor',
  3: 'Moderate',
  5: 'Major',
  8: 'Critical',
};

export async function backfillCommand(
  repoRef: string,
  options: { count?: string; model?: ModelId; concurrency?: string }
): Promise<void> {
  const count = parseInt(options.count ?? '10', 10);
  const concurrency = parseInt(options.concurrency ?? '3', 10);
  const modelId = options.model ?? 'gemini-flash';

  console.log(chalk.dim(`Fetching last ${count} merged PRs from ${repoRef}...`));
  const prs = await fetchRecentPRs(repoRef, count);
  console.log(chalk.dim(`Found ${prs.length} merged PRs. Scoring with ${modelId}...`));
  console.log('');

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
      })
    );

    for (const { pr, score, error } of results) {
      if (error) {
        console.log(chalk.red(`  #${pr.number} ${pr.title} - ERROR: ${error.message}`));
      } else if (score) {
        const label = SCORE_LABELS[score.score] ?? '?';
        const conf = chalk.dim(`(${score.confidence})`);
        console.log(`  ${chalk.bold(`${score.score}`)} ${label} ${conf}  #${pr.number} ${pr.title}`);
      }
    }
  }
}
