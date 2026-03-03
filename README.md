# stack-engineer-int

Research workspace for integrative AI scoring systems. pnpm monorepo.

## Projects

### [integrative/](./integrative/)

**PR Scorer** - LLM-powered PR impact scoring on a Fibonacci scale (1, 2, 3, 5, 8). Scores pull requests by analyzing diffs, file changes, and PR context, then outputs a structured impact assessment with confidence and rationale.

AI-accelerated teams merge more PRs than humans can review. Not every change matters equally. PR Scorer triages impact so reviewers know where to focus.

Stack: TypeScript, Vercel AI SDK, Claude Haiku 4.5, Gemini 2.0 Flash, Zod, Commander.

```bash
cd integrative
pnpm install
pnpm dev score owner/repo#123
pnpm dev eval --report
```

See [integrative/README.md](./integrative/README.md) for full docs.

## Setup

```bash
pnpm install
```

Required environment variables:

- `ANTHROPIC_API_KEY` - Claude Haiku scoring
- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini Flash scoring
- `GITHUB_TOKEN` - GitHub PR data

## License

MIT
