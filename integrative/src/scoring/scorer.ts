import { generateText, Output } from 'ai';
import { ImpactScoreSchema, type ImpactScore } from './schema.js';
import { buildScoringPrompt } from './prompt.js';
import { getModel, type ModelId } from './models.js';
import { filterDiff } from '../diff/filter.js';
import { truncateDiff } from '../diff/truncate.js';
import type { PRContext } from '../types.js';

export interface ScoreOptions {
  model?: ModelId;
  raw?: boolean;
}

export async function scorePR(
  context: PRContext,
  options: ScoreOptions = {}
): Promise<ImpactScore> {
  const modelId = options.model ?? 'haiku';
  const model = getModel(modelId);

  const processedDiff = options.raw
    ? context.diff
    : truncateDiff(filterDiff(context.diff));

  const processedContext: PRContext = {
    ...context,
    diff: processedDiff,
  };

  const prompt = buildScoringPrompt(processedContext);

  const { output } = await generateText({
    model: model.provider(),
    temperature: 0,
    output: Output.object({
      schema: ImpactScoreSchema,
    }),
    prompt,
  });

  if (!output) {
    throw new Error('No output from model');
  }

  return output;
}
