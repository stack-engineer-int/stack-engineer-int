import { generateText } from "ai";
import { getModel } from "../scoring/models.js";
import type { RunReport } from "./report.js";

const ANALYSIS_PROMPT = `You are analyzing eval results for a PR impact scoring tool. The tool scores pull requests on a Fibonacci scale (1=trivial, 2=minor, 3=moderate, 5=major, 8=critical).

Below are the results of an eval run against fixture PRs with known expected scores.

## Run Summary

Pass rate: {passRate}% ({passed}/{total})
Avg duration: {avgDurationMs}ms

## Results by Category

{byCategory}

## Results by Expected Score

{byScore}

## Failed Fixtures

{failures}

## Current Scoring Prompt Guidance

{scoringGuidance}

---

Write a SWOT analysis of the scoring system's performance. Focus on:

**Strengths**: What categories/score levels are consistently accurate? What patterns does the model handle well?

**Weaknesses**: Where does scoring fail? Are there systematic biases (over/under-scoring)? Which categories need work?

**Opportunities**: Specific, actionable prompt changes that would fix the most failures. Reference the failed fixtures and their rationales to identify what the model misunderstands. Prioritize by number of fixtures each change would fix.

**Threats**: What could degrade performance? Fixture gaps, model drift, edge cases not covered.

Keep it concise. Use bullet points. Prioritize actionable insights over observations.`;

function buildAnalysisInput(report: RunReport, scoringPrompt: string): string {
	const byCategory = Object.entries(report.byCategory)
		.sort((a, b) => a[1].passRate - b[1].passRate)
		.map(([cat, s]) => `- ${cat}: ${s.passRate}% (${s.passed}/${s.total})`)
		.join("\n");

	const byScore = [1, 2, 3, 5, 8]
		.filter((s) => report.byScore[s])
		.map((s) => {
			const stats = report.byScore[s];
			return `- Score ${s}: ${stats.passRate}% (${stats.passed}/${stats.total})`;
		})
		.join("\n");

	const failures = report.results
		.filter((r) => !r.validation.scoreMatch)
		.map((r) => {
			const delta = r.validation.scoreDelta;
			const dir = delta > 0 ? "over-scored" : "under-scored";
			const loc = r.fixture.files.reduce(
				(acc, f) => ({ add: acc.add + f.additions, del: acc.del + f.deletions }),
				{ add: 0, del: 0 },
			);
			return [
				`### ${r.fixture.id} (${dir} by ${Math.abs(delta)})`,
				`Expected: ${r.validation.expectedScore}, Actual: ${r.validation.actualScore}`,
				`Category: ${r.fixture.category} | Files: ${r.fixture.files.length} | LOC: +${loc.add}/-${loc.del}`,
				`PR: ${r.fixture.pr.title}`,
				`Rationale: ${r.score.rationale}`,
			].join("\n");
		})
		.join("\n\n");

	return ANALYSIS_PROMPT.replace("{passRate}", String(report.passRate))
		.replace("{passed}", String(report.passed))
		.replace("{total}", String(report.totalTests))
		.replace("{avgDurationMs}", String(report.avgDurationMs))
		.replace("{byCategory}", byCategory)
		.replace("{byScore}", byScore)
		.replace("{failures}", failures || "None")
		.replace("{scoringGuidance}", scoringPrompt);
}

export async function generateAnalysis(report: RunReport, scoringPrompt: string): Promise<string> {
	const model = getModel("sonnet");
	const prompt = buildAnalysisInput(report, scoringPrompt);

	const { text } = await generateText({
		model: model.provider(),
		temperature: 0,
		prompt,
	});

	return text;
}
