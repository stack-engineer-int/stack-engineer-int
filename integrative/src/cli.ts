import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { scoreCommand } from './commands/score.js';
import { backfillCommand } from './commands/backfill.js';
import { evalCommand } from './commands/eval.js';
import { overrideCommand } from './commands/override.js';
import { gapsCommand } from './commands/gaps.js';

// Load .env if present
try {
  const envPath = resolve(process.cwd(), '.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // no .env, that's fine
}

const program = new Command();

program
  .name('pr-scorer')
  .description('LLM-powered PR impact scoring with evaluation framework')
  .version('0.1.0');

program
  .command('score')
  .description('Score a single PR')
  .argument('<pr>', 'PR reference (owner/repo#123)')
  .option('-m, --model <model>', 'Model to use (haiku, gemini-flash)', 'haiku')
  .option('--md', 'Output as markdown instead of JSON')
  .action(scoreCommand);

program
  .command('backfill')
  .description('Score last N merged PRs from a repo')
  .argument('<repo>', 'Repository (owner/repo)')
  .option('-n, --count <count>', 'Number of PRs to score', '10')
  .option('-m, --model <model>', 'Model to use (haiku, gemini-flash)', 'gemini-flash')
  .option('-c, --concurrency <n>', 'Concurrent scoring requests', '3')
  .action(backfillCommand);

program
  .command('eval')
  .description('Run eval fixture suite')
  .option('-m, --model <model>', 'Model to use (haiku, gemini-flash)', 'haiku')
  .option('--category <categories>', 'Filter by category (comma-separated)')
  .option('--score <scores>', 'Filter by expected score (comma-separated)')
  .option('--report', 'Save detailed report to .pr-scorer/runs/')
  .option('-c, --concurrency <n>', 'Concurrent requests', '5')
  .action(evalCommand);

program
  .command('override')
  .description('Record a human score override')
  .argument('<pr>', 'PR reference (owner/repo#123)')
  .requiredOption('-s, --score <score>', 'Your corrected score (1, 2, 3, 5, or 8)')
  .requiredOption('-r, --reason <reason>', 'Why you disagree with the AI score')
  .option('--original-score <score>', 'Original AI score (if known)')
  .option('--original-rationale <text>', 'Original AI rationale (if known)')
  .action(overrideCommand);

program
  .command('gaps')
  .description('Analyze score overrides for patterns')
  .action(gapsCommand);

program.parse();
