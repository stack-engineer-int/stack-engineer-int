import type { PRFixture } from '../types.js';

export const featureFixtures: PRFixture[] = [
  {
    id: 'feature-notification-prefs',
    name: 'Add notification preferences',
    category: 'feature',
    expectedScore: 3,
    pr: {
      title: 'feat: add notification preferences',
      body: `## What
Adds ability for users to configure notification preferences.

## Changes
- New NotificationPrefs component
- API endpoint for saving preferences
- Database migration for preferences table`,
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/components/NotificationPrefs.svelte', status: 'added', additions: 85, deletions: 0 },
      { filename: 'src/routes/api/preferences/+server.ts', status: 'added', additions: 42, deletions: 0 },
      { filename: 'src/lib/server/db/schema.ts', status: 'modified', additions: 15, deletions: 0 },
    ],
    diff: `diff --git a/src/lib/components/NotificationPrefs.svelte b/src/lib/components/NotificationPrefs.svelte
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/lib/components/NotificationPrefs.svelte
@@ -0,0 +1,45 @@
+<script lang="ts">
+  import { Switch } from '$lib/components/ui/switch';
+  import { Label } from '$lib/components/ui/label';
+  import * as Select from '$lib/components/ui/select';
+
+  let { prefs = $bindable() }: { prefs: NotificationPrefs } = $props();
+</script>
+
+<div class="space-y-4">
+  <div class="flex items-center justify-between">
+    <Label for="email-notifs">Email notifications</Label>
+    <Switch id="email-notifs" bind:checked={prefs.email} />
+  </div>
+
+  <div class="flex items-center justify-between">
+    <Label for="slack-notifs">Slack notifications</Label>
+    <Switch id="slack-notifs" bind:checked={prefs.slack} />
+  </div>
+
+  <div class="space-y-2">
+    <Label>Frequency</Label>
+    <Select.Root bind:value={prefs.frequency}>
+      <Select.Trigger>
+        <Select.Value />
+      </Select.Trigger>
+      <Select.Content>
+        <Select.Item value="realtime">Real-time</Select.Item>
+        <Select.Item value="daily">Daily digest</Select.Item>
+        <Select.Item value="weekly">Weekly digest</Select.Item>
+      </Select.Content>
+    </Select.Root>
+  </div>
+</div>

diff --git a/src/routes/api/preferences/+server.ts b/src/routes/api/preferences/+server.ts
new file mode 100644
index 0000000..abcdefg
--- /dev/null
+++ b/src/routes/api/preferences/+server.ts
@@ -0,0 +1,25 @@
+import { json, error } from '@sveltejs/kit';
+import type { RequestHandler } from './$types';
+import { db } from '$lib/server/db';
+import { userPreferences } from '$lib/server/db/schema';
+import { eq } from 'drizzle-orm';
+
+export const PUT: RequestHandler = async ({ request, locals }) => {
+  if (!locals.userId) {
+    return error(401, 'Unauthorized');
+  }
+
+  const prefs = await request.json();
+
+  await db
+    .insert(userPreferences)
+    .values({ userId: locals.userId, ...prefs })
+    .onConflictDoUpdate({
+      target: userPreferences.userId,
+      set: prefs,
+    });
+
+  return json({ success: true });
+};`,
    expected: {
      affectedAreas: ['frontend', 'api', 'database'],
      keyChanges: ['notification preferences', 'new component', 'API endpoint'],
    },
  },
  {
    id: 'feature-dark-mode',
    name: 'Add dark mode support',
    category: 'feature',
    expectedScore: 3,
    pr: {
      title: 'feat: implement dark mode toggle',
      body: `Implements system-aware dark mode with manual override.

Uses CSS custom properties for theming.`,
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/stores/theme.svelte.ts', status: 'added', additions: 35, deletions: 0 },
      { filename: 'src/app.css', status: 'modified', additions: 45, deletions: 10 },
      { filename: 'src/lib/components/ThemeToggle.svelte', status: 'added', additions: 28, deletions: 0 },
    ],
    diff: `diff --git a/src/lib/stores/theme.svelte.ts b/src/lib/stores/theme.svelte.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/lib/stores/theme.svelte.ts
@@ -0,0 +1,35 @@
+type Theme = 'light' | 'dark' | 'system';
+
+class ThemeStore {
+  current = $state<Theme>('system');
+  resolved = $derived(this.#resolveTheme());
+
+  constructor() {
+    if (typeof window !== 'undefined') {
+      const saved = localStorage.getItem('theme') as Theme | null;
+      if (saved) this.current = saved;
+    }
+  }
+
+  #resolveTheme(): 'light' | 'dark' {
+    if (this.current !== 'system') return this.current;
+    if (typeof window === 'undefined') return 'light';
+    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
+  }
+
+  set(theme: Theme) {
+    this.current = theme;
+    localStorage.setItem('theme', theme);
+    this.#applyTheme();
+  }
+
+  #applyTheme() {
+    document.documentElement.classList.remove('light', 'dark');
+    document.documentElement.classList.add(this.resolved);
+  }
+}
+
+export const theme = new ThemeStore();`,
    expected: {
      affectedAreas: ['frontend', 'stores'],
    },
  },
];
