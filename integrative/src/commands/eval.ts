import chalk from 'chalk';
import { allFixtures, getFixturesByCategory, getFixturesByScore } from '../evals/fixtures/index.js';
import { runFixtures } from '../evals/runner.js';
import { generateReport, saveReport } from '../evals/report.js';
import type { FixtureCategory } from '../evals/types.js';
import type { ModelId } from '../scoring/models.js';

export async function evalCommand(options: {
  model?: ModelId;
  category?: string;
  score?: string;
  report?: boolean;
  concurrency?: string;
}): Promise<void> {
  let fixtures = allFixtures;

  if (options.category) {
    const categories = options.category.split(',') as FixtureCategory[];
    fixtures = categories.flatMap((c) => getFixturesByCategory(c));
  }

  if (options.score) {
    const scores = options.score.split(',').map(Number) as Array<1 | 2 | 3 | 5 | 8>;
    fixtures = fixtures.filter((f) => scores.includes(f.expectedScore));
  }

  console.log(chalk.dim(`Running ${fixtures.length} fixtures with ${options.model ?? 'haiku'}...`));
  console.log('');

  const results = await runFixtures(fixtures, {
    model: options.model,
    concurrency: parseInt(options.concurrency ?? '5', 10),
  });

  const passed = results.filter((r) => r.validation.scoreMatch).length;
  const passRate = Math.round((passed / results.length) * 100);

  for (const r of results) {
    const icon = r.validation.scoreMatch ? chalk.green('PASS') : chalk.red('FAIL');
    const delta = r.validation.scoreDelta;
    const deltaStr = delta === 0 ? '' : chalk.dim(` (${delta > 0 ? '+' : ''}${delta})`);
    console.log(`  ${icon} ${r.fixture.id}: expected ${r.fixture.expectedScore}, got ${r.validation.actualScore}${deltaStr}`);
  }

  console.log('');
  console.log(`${chalk.bold('Pass rate:')} ${passRate}% (${passed}/${results.length})`);

  if (options.report) {
    const runName = `run-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}`;
    const report = generateReport(runName, results);
    const { runDir } = saveReport(report);
    console.log(chalk.dim(`Report saved to ${runDir}/`));
  }
}
