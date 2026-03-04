import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FixtureResult } from './types.js';

export interface GapAnalysisItem {
  pattern: string;
  occurrences: number;
  affectedTests: string[];
  suggestedFix: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RunReport {
  runName: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  byCategory: Record<string, { total: number; passed: number; passRate: number }>;
  byScore: Record<number, { total: number; passed: number; passRate: number }>;
  avgDurationMs: number;
  gaps: GapAnalysisItem[];
  results: FixtureResult[];
}

export function generateReport(runName: string, results: FixtureResult[]): RunReport {
  const passed = results.filter((r) => r.validation.scoreMatch).length;

  const byCategory: Record<string, { total: number; passed: number; passRate: number }> = {};
  for (const r of results) {
    const cat = r.fixture.category;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, passed: 0, passRate: 0 };
    byCategory[cat].total++;
    if (r.validation.scoreMatch) byCategory[cat].passed++;
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].passRate = Math.round((byCategory[cat].passed / byCategory[cat].total) * 100);
  }

  const byScore: Record<number, { total: number; passed: number; passRate: number }> = {};
  for (const r of results) {
    const score = r.fixture.expectedScore;
    if (!byScore[score]) byScore[score] = { total: 0, passed: 0, passRate: 0 };
    byScore[score].total++;
    if (r.validation.scoreMatch) byScore[score].passed++;
  }
  for (const s of Object.keys(byScore)) {
    const n = Number(s);
    byScore[n].passRate = Math.round((byScore[n].passed / byScore[n].total) * 100);
  }

  const durations = results.map((r) => r.durationMs);
  const gaps = analyzeGaps(results);

  return {
    runName,
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    passRate: Math.round((passed / results.length) * 100),
    byCategory,
    byScore,
    avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    gaps,
    results,
  };
}

function analyzeGaps(results: FixtureResult[]): GapAnalysisItem[] {
  const gaps: GapAnalysisItem[] = [];
  const failed = results.filter((r) => !r.validation.scoreMatch);
  if (failed.length === 0) return gaps;

  const overScored = failed.filter((r) => r.validation.scoreDelta > 0);
  const underScored = failed.filter((r) => r.validation.scoreDelta < 0);

  if (overScored.length >= 3) {
    gaps.push({
      pattern: 'Consistent over-scoring',
      occurrences: overScored.length,
      affectedTests: overScored.map((r) => r.fixture.id),
      suggestedFix: 'Review scoring prompt to be more conservative. Model may be overweighting certain signals.',
      priority: 'high',
    });
  }

  if (underScored.length >= 3) {
    gaps.push({
      pattern: 'Consistent under-scoring',
      occurrences: underScored.length,
      affectedTests: underScored.map((r) => r.fixture.id),
      suggestedFix: 'Review scoring prompt to better recognize impact. Model may be missing architectural significance.',
      priority: 'high',
    });
  }

  const largeDelta = failed.filter((r) => Math.abs(r.validation.scoreDelta) >= 3);
  if (largeDelta.length >= 1) {
    gaps.push({
      pattern: 'Large score mismatches (delta >= 3)',
      occurrences: largeDelta.length,
      affectedTests: largeDelta.map((r) => r.fixture.id),
      suggestedFix: 'These fixtures may need expected score review, or represent edge cases needing special handling.',
      priority: 'high',
    });
  }

  return gaps;
}

export function formatReportJsonl(report: RunReport): string {
  return report.results.map((r) => {
    const loc = r.fixture.files.reduce(
      (acc, f) => ({ add: acc.add + f.additions, del: acc.del + f.deletions }),
      { add: 0, del: 0 },
    );
    return JSON.stringify({
      id: r.fixture.id,
      category: r.fixture.category,
      pass: r.validation.scoreMatch,
      expected: r.validation.expectedScore,
      actual: r.validation.actualScore,
      delta: r.validation.scoreDelta,
      confidence: r.score.confidence,
      durationMs: r.durationMs,
      loc,
      files: r.fixture.files.length,
      rationale: r.score.rationale,
      keyChanges: r.score.keyChanges,
      affectedAreas: r.score.affectedAreas,
    });
  }).join('\n');
}

export function saveReport(report: RunReport): { runDir: string; files: string[] } {
  const baseDir = join(process.cwd(), '.pr-scorer', 'runs');
  const runDir = join(baseDir, report.runName);

  if (!existsSync(runDir)) {
    mkdirSync(runDir, { recursive: true });
  }

  const files: string[] = [];

  const summaryPath = join(runDir, 'summary.json');
  const { results: _, ...summaryData } = report;
  writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
  files.push(summaryPath);

  const reportPath = join(runDir, 'results.jsonl');
  const header = '# JSONL: one result per line, compact structured output with LOC and file count per fixture';
  writeFileSync(reportPath, header + '\n' + formatReportJsonl(report) + '\n');
  files.push(reportPath);

  return { runDir, files };
}
