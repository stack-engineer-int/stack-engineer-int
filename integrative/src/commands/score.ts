import { fetchPR } from '../github/client.js';
import { scorePR } from '../scoring/scorer.js';
import type { ModelId } from '../scoring/models.js';

const SCORE_LABELS: Record<number, string> = {
  1: 'Trivial',
  2: 'Minor',
  3: 'Moderate',
  5: 'Major',
  8: 'Critical',
};

export async function scoreCommand(
  prRef: string,
  options: { model?: ModelId; md?: boolean }
): Promise<void> {
  const context = await fetchPR(prRef);
  const result = await scorePR(context, { model: options.model });

  if (options.md) {
    const label = SCORE_LABELS[result.score] ?? 'Unknown';
    const lines = [
      `## ${context.title}`,
      '',
      `**Score:** ${result.score} (${label}) | **Confidence:** ${result.confidence}`,
      '',
      `**Description:** ${result.description}`,
      '',
      `**Rationale:** ${result.rationale}`,
      '',
      '**Key Changes:**',
      ...result.keyChanges.map((c) => `- ${c}`),
      '',
      `**Affected Areas:** ${result.affectedAreas.join(', ')}`,
    ];
    console.log(lines.join('\n'));
  } else {
    console.log(JSON.stringify({ pr: prRef, title: context.title, ...result }, null, 2));
  }
}
