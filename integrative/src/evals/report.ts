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

export function formatReportMarkdown(report: RunReport): string {
  const lines: string[] = [];

  lines.push(`# Eval Run: ${report.runName}`);
  lines.push('');
  lines.push(`**Timestamp:** ${report.timestamp}`);
  lines.push(`**Pass Rate:** ${report.passRate}% (${report.passed}/${report.totalTests})`);
  lines.push(`**Avg Duration:** ${report.avgDurationMs}ms`);
  lines.push('');

  lines.push('## Results by Category');
  lines.push('');
  lines.push('| Category | Pass Rate | Passed | Total |');
  lines.push('|----------|-----------|--------|-------|');
  for (const [cat, stats] of Object.entries(report.byCategory).sort((a, b) => a[1].passRate - b[1].passRate)) {
    lines.push(`| ${cat} | ${stats.passRate}% | ${stats.passed} | ${stats.total} |`);
  }
  lines.push('');

  lines.push('## Results by Expected Score');
  lines.push('');
  lines.push('| Score | Pass Rate | Passed | Total |');
  lines.push('|-------|-----------|--------|-------|');
  for (const score of [1, 2, 3, 5, 8]) {
    const stats = report.byScore[score];
    if (stats) {
      lines.push(`| ${score} | ${stats.passRate}% | ${stats.passed} | ${stats.total} |`);
    }
  }
  lines.push('');

  const failedResults = report.results.filter((r) => !r.validation.scoreMatch);
  if (failedResults.length > 0) {
    lines.push('## Failed Tests');
    lines.push('');
    lines.push('| Test ID | Expected | Actual | Delta |');
    lines.push('|---------|----------|--------|-------|');
    for (const r of failedResults) {
      const delta = r.validation.scoreDelta;
      const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
      lines.push(`| ${r.fixture.id} | ${r.validation.expectedScore} | ${r.validation.actualScore} | ${deltaStr} |`);
    }
    lines.push('');
  }

  if (report.gaps.length > 0) {
    lines.push('## Gap Analysis');
    lines.push('');
    for (const gap of report.gaps) {
      lines.push(`### ${gap.pattern}`);
      lines.push('');
      lines.push(`**Occurrences:** ${gap.occurrences}`);
      lines.push(`**Affected Tests:** ${gap.affectedTests.join(', ')}`);
      lines.push(`**Suggested Fix:** ${gap.suggestedFix}`);
      lines.push('');
    }
  }

  lines.push('## Test Details');
  lines.push('');
  for (const r of report.results) {
    const icon = r.validation.scoreMatch ? 'PASS' : 'FAIL';
    lines.push('<details>');
    lines.push(`<summary>${icon}: ${r.fixture.id} (expected: ${r.validation.expectedScore}, actual: ${r.validation.actualScore})</summary>`);
    lines.push('');
    lines.push(`**Category:** ${r.fixture.category}`);
    lines.push(`**PR Title:** ${r.fixture.pr.title}`);
    lines.push(`**Confidence:** ${r.score.confidence}`);
    lines.push(`**Duration:** ${r.durationMs}ms`);
    lines.push('');
    lines.push('**Description:**');
    lines.push(`> ${r.score.description}`);
    lines.push('');
    lines.push('**Rationale:**');
    lines.push(`> ${r.score.rationale}`);
    lines.push('');
    lines.push(`**Key Changes:** ${r.score.keyChanges.join(', ')}`);
    lines.push(`**Affected Areas:** ${r.score.affectedAreas.join(', ')}`);
    lines.push('</details>');
    lines.push('');
  }

  return lines.join('\n');
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

  const reportPath = join(runDir, 'report.md');
  writeFileSync(reportPath, formatReportMarkdown(report));
  files.push(reportPath);

  return { runDir, files };
}
