const IGNORE_PATTERNS = [
	// Lockfiles
	/^diff --git a\/.*pnpm-lock\.yaml/,
	/^diff --git a\/.*package-lock\.json/,
	/^diff --git a\/.*yarn\.lock/,
	/^diff --git a\/.*bun\.lockb/,
	/^diff --git a\/.*Cargo\.lock/,
	/^diff --git a\/.*Gemfile\.lock/,
	/^diff --git a\/.*poetry\.lock/,
	/^diff --git a\/.*composer\.lock/,
	// Generated/minified files
	/^diff --git a\/.*\.min\.js/,
	/^diff --git a\/.*\.min\.css/,
	/^diff --git a\/.*\.map$/,
	/^diff --git a\/.*\.d\.ts/,
	// Build outputs
	/^diff --git a\/.*\/dist\//,
	/^diff --git a\/.*\/build\//,
	/^diff --git a\/.*\/\.svelte-kit\//,
	/^diff --git a\/.*\/\.next\//,
	/^diff --git a\/.*\/node_modules\//,
];

const MAX_HUNKS_PER_FILE = 50;

export function filterDiff(rawDiff: string): string {
	const lines = rawDiff.split("\n");
	const result: string[] = [];
	let skipCurrentFile = false;
	let currentFileHunks = 0;
	let skipCurrentHunk = false;

	for (const line of lines) {
		if (line.startsWith("diff --git")) {
			skipCurrentFile = IGNORE_PATTERNS.some((pattern) => pattern.test(line));
			currentFileHunks = 0;
			skipCurrentHunk = false;

			if (!skipCurrentFile) {
				result.push(line);
			}
			continue;
		}

		if (skipCurrentFile) continue;

		if (line.startsWith("@@")) {
			currentFileHunks++;
			if (currentFileHunks > MAX_HUNKS_PER_FILE) {
				skipCurrentHunk = true;
				if (currentFileHunks === MAX_HUNKS_PER_FILE + 1) {
					result.push("... [additional hunks collapsed]");
				}
				continue;
			}
			skipCurrentHunk = false;
		}

		if (skipCurrentHunk) continue;

		result.push(line);
	}

	return result.join("\n");
}
