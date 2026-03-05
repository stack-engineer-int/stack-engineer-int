# Contributing

## Setup

```bash
git clone https://github.com/stack-engineer-int/stack-engineer-int.git
cd stack-engineer-int
pnpm install
```

Copy the environment template and fill in your keys:

```bash
cp integrative/.env.example integrative/.env
```

## Development

All commands run from `integrative/`:

```bash
cd integrative
pnpm dev score owner/repo#123    # score a PR
pnpm dev eval                     # run eval suite
pnpm test                         # run unit tests
pnpm test:watch                   # watch mode
pnpm build                        # compile TypeScript
```

## Code Style

- TypeScript strict mode, no `any`
- ES modules with `.js` extensions in all imports (NodeNext resolution)
- Formatting and linting handled by Biome (runs automatically via pre-commit hook)

## Submitting Changes

1. Fork the repo and create a branch
2. Make your changes
3. Run `pnpm test` and confirm tests pass
4. Pre-commit hooks will run `pnpm format && pnpm lint:fix` automatically
5. Open a pull request with a clear description of what changed and why
