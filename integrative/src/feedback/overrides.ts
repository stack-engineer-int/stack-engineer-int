import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface ScoreOverride {
  pr: string;
  originalScore: number;
  originalConfidence: number;
  originalRationale: string;
  overrideScore: number;
  reason: string;
  timestamp: string;
  gapAnalysis?: {
    cause: string;
    suggestion: string;
    confidence: number;
  };
}

const OVERRIDES_DIR = join(process.cwd(), '.pr-scorer', 'overrides');

function overridePath(prRef: string): string {
  const safe = prRef.replace(/[/#]/g, '-');
  return join(OVERRIDES_DIR, `${safe}.json`);
}

export function saveOverride(override: ScoreOverride): void {
  mkdirSync(OVERRIDES_DIR, { recursive: true });
  writeFileSync(overridePath(override.pr), JSON.stringify(override, null, 2));
}

export function loadAllOverrides(): ScoreOverride[] {
  if (!existsSync(OVERRIDES_DIR)) return [];
  return readdirSync(OVERRIDES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(OVERRIDES_DIR, f), 'utf-8')));
}

export function updateOverrideGap(
  prRef: string,
  gap: { cause: string; suggestion: string; confidence: number }
): void {
  const path = overridePath(prRef);
  const override: ScoreOverride = JSON.parse(readFileSync(path, 'utf-8'));
  override.gapAnalysis = gap;
  writeFileSync(path, JSON.stringify(override, null, 2));
}
