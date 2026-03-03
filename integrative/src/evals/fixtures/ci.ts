import type { PRFixture } from '../types.js';

export const ciFixtures: PRFixture[] = [
  {
    id: 'ci-add-workflow',
    name: 'Add CI workflow',
    category: 'ci',
    expectedScore: 2,
    pr: {
      title: 'ci: add GitHub Actions workflow',
      body: 'Sets up CI pipeline with lint, type-check, and tests.',
      author: 'developer',
    },
    files: [{ filename: '.github/workflows/ci.yml', status: 'added', additions: 45, deletions: 0 }],
    diff: `diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,45 @@
+name: CI
+
+on:
+  push:
+    branches: [main]
+  pull_request:
+    branches: [main]
+
+jobs:
+  build:
+    runs-on: ubuntu-latest
+
+    steps:
+      - uses: actions/checkout@v4
+
+      - uses: pnpm/action-setup@v2
+        with:
+          version: 9
+
+      - uses: actions/setup-node@v4
+        with:
+          node-version: '20'
+          cache: 'pnpm'
+
+      - run: pnpm install --frozen-lockfile
+
+      - name: Lint
+        run: pnpm lint
+
+      - name: Type check
+        run: pnpm check
+
+      - name: Unit tests
+        run: pnpm test:unit
+
+      - name: Build
+        run: pnpm build`,
    expected: {
      affectedAreas: ['ci'],
      keyChanges: ['CI workflow', 'GitHub Actions'],
    },
  },
  {
    id: 'ci-add-deployment',
    name: 'Add deployment workflow',
    category: 'ci',
    expectedScore: 3,
    pr: {
      title: 'ci: add Vercel preview and production deployments',
      body: `Configures automatic deployments:
- Preview on PR
- Production on main
- Notifications to Slack`,
      author: 'developer',
    },
    files: [
      { filename: '.github/workflows/deploy.yml', status: 'added', additions: 75, deletions: 0 },
      { filename: 'vercel.json', status: 'added', additions: 15, deletions: 0 },
    ],
    diff: `diff --git a/.github/workflows/deploy.yml b/.github/workflows/deploy.yml
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/.github/workflows/deploy.yml
@@ -0,0 +1,65 @@
+name: Deploy
+
+on:
+  push:
+    branches: [main]
+  pull_request:
+    types: [opened, synchronize]
+
+env:
+  VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
+  VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
+
+jobs:
+  deploy-preview:
+    if: github.event_name == 'pull_request'
+    runs-on: ubuntu-latest
+    environment:
+      name: preview
+      url: \${{ steps.deploy.outputs.url }}
+
+    steps:
+      - uses: actions/checkout@v4
+
+      - name: Deploy to Vercel
+        id: deploy
+        uses: vercel/action@v1
+        with:
+          vercel-token: \${{ secrets.VERCEL_TOKEN }}
+          vercel-org-id: \${{ env.VERCEL_ORG_ID }}
+          vercel-project-id: \${{ env.VERCEL_PROJECT_ID }}
+
+      - name: Comment PR
+        uses: actions/github-script@v7
+        with:
+          script: |
+            github.rest.issues.createComment({
+              issue_number: context.issue.number,
+              owner: context.repo.owner,
+              repo: context.repo.repo,
+              body: 'Preview: \${{ steps.deploy.outputs.url }}'
+            })
+
+  deploy-production:
+    if: github.ref == 'refs/heads/main'
+    runs-on: ubuntu-latest
+    environment:
+      name: production
+
+    steps:
+      - uses: actions/checkout@v4
+
+      - name: Deploy to Vercel
+        uses: vercel/action@v1
+        with:
+          vercel-token: \${{ secrets.VERCEL_TOKEN }}
+          vercel-org-id: \${{ env.VERCEL_ORG_ID }}
+          vercel-project-id: \${{ env.VERCEL_PROJECT_ID }}
+          vercel-args: '--prod'`,
    expected: {
      affectedAreas: ['ci', 'infra'],
      keyChanges: ['deployment', 'Vercel', 'preview environments'],
    },
  },
];
