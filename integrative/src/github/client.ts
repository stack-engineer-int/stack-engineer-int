import { Octokit } from "@octokit/rest";
import type { PRContext } from "../types.js";

function getOctokit(): Octokit {
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		throw new Error("GITHUB_TOKEN environment variable is required");
	}
	return new Octokit({ auth: token });
}

export function parsePRRef(ref: string): { owner: string; repo: string; number: number } {
	const match = ref.match(/^([^/]+)\/([^#]+)#(\d+)$/);
	if (!match) {
		throw new Error(`Invalid PR reference: ${ref}. Expected format: owner/repo#123`);
	}
	return { owner: match[1], repo: match[2], number: Number.parseInt(match[3], 10) };
}

export async function fetchPR(ref: string): Promise<PRContext> {
	const { owner, repo, number } = parsePRRef(ref);
	const octokit = getOctokit();

	const [pr, files] = await Promise.all([
		octokit.pulls.get({ owner, repo, pull_number: number }),
		octokit.pulls.listFiles({ owner, repo, pull_number: number, per_page: 100 }),
	]);

	const diffResponse = await octokit.pulls.get({
		owner,
		repo,
		pull_number: number,
		mediaType: { format: "diff" },
	});

	return {
		title: pr.data.title,
		body: pr.data.body,
		diff: diffResponse.data as unknown as string,
		filesChanged: files.data.map((f) => ({
			filename: f.filename,
			status: f.status ?? "modified",
			additions: f.additions,
			deletions: f.deletions,
		})),
	};
}

export async function fetchRecentPRs(
	repoRef: string,
	count: number,
): Promise<Array<{ number: number; title: string }>> {
	const [owner, repo] = repoRef.split("/");
	if (!owner || !repo) {
		throw new Error(`Invalid repo reference: ${repoRef}. Expected format: owner/repo`);
	}

	const octokit = getOctokit();
	const { data } = await octokit.pulls.list({
		owner,
		repo,
		state: "closed",
		sort: "updated",
		direction: "desc",
		per_page: count,
	});

	return data
		.filter((pr) => pr.merged_at !== null)
		.map((pr) => ({ number: pr.number, title: pr.title }));
}
