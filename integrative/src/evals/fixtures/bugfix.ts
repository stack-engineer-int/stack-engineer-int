import type { PRFixture } from '../types.js';

export const bugfixFixtures: PRFixture[] = [
  {
    id: 'bugfix-null-check',
    name: 'Fix null pointer exception',
    category: 'bugfix',
    expectedScore: 2,
    pr: {
      title: 'fix: handle null user in profile endpoint',
      body: `Fixes #123

Users were getting a 500 error when accessing their profile if they hadn't completed onboarding.

## Root cause
The profile endpoint assumed user.settings would always exist.

## Fix
Added null check before accessing settings.`,
      author: 'developer',
    },
    files: [
      {
        filename: 'src/routes/api/profile/+server.ts',
        status: 'modified',
        additions: 5,
        deletions: 2,
      },
    ],
    diff: `diff --git a/src/routes/api/profile/+server.ts b/src/routes/api/profile/+server.ts
index 1234567..abcdefg 100644
--- a/src/routes/api/profile/+server.ts
+++ b/src/routes/api/profile/+server.ts
@@ -15,8 +15,11 @@ export const GET: RequestHandler = async ({ locals }) => {
   const user = await db.query.users.findFirst({
     where: eq(users.id, locals.userId)
   });
-
-  const theme = user.settings.theme;
+
+  if (!user) {
+    return error(404, 'User not found');
+  }
+
+  const theme = user.settings?.theme ?? 'system';

   return json({ user, theme });
 };`,
    expected: {
      affectedAreas: ['api'],
      keyChanges: ['null check', 'error handling'],
    },
  },
  {
    id: 'bugfix-race-condition',
    name: 'Fix race condition in state update',
    category: 'bugfix',
    expectedScore: 3,
    pr: {
      title: 'fix: race condition in cart state updates',
      body: `## Problem
Multiple rapid "add to cart" clicks could result in incorrect quantities due to stale state reads.

## Solution
Use functional state updates to ensure we always operate on the latest state.`,
      author: 'developer',
    },
    files: [
      {
        filename: 'src/lib/stores/cart.svelte.ts',
        status: 'modified',
        additions: 12,
        deletions: 8,
      },
    ],
    diff: `diff --git a/src/lib/stores/cart.svelte.ts b/src/lib/stores/cart.svelte.ts
index 1234567..abcdefg 100644
--- a/src/lib/stores/cart.svelte.ts
+++ b/src/lib/stores/cart.svelte.ts
@@ -10,14 +10,18 @@ interface CartItem {

 class CartStore {
   items = $state<CartItem[]>([]);
+  #pendingUpdates = new Map<string, number>();

   addItem(product: Product) {
-    const existing = this.items.find(i => i.productId === product.id);
-    if (existing) {
-      existing.quantity += 1;
-    } else {
-      this.items.push({ productId: product.id, quantity: 1, price: product.price });
-    }
+    const pending = this.#pendingUpdates.get(product.id) ?? 0;
+    this.#pendingUpdates.set(product.id, pending + 1);
+
+    queueMicrotask(() => {
+      const delta = this.#pendingUpdates.get(product.id) ?? 0;
+      this.#pendingUpdates.delete(product.id);
+      this.#applyUpdate(product, delta);
+    });
   }
+
+  #applyUpdate(product: Product, quantity: number) {
+    const existing = this.items.find(i => i.productId === product.id);
+    if (existing) {
+      existing.quantity += quantity;
+    } else {
+      this.items.push({ productId: product.id, quantity, price: product.price });
+    }
+  }
 }`,
    expected: {
      affectedAreas: ['frontend', 'stores'],
      keyChanges: ['race condition fix', 'state batching'],
    },
  },
  {
    id: 'bugfix-memory-leak',
    name: 'Fix memory leak in event listener',
    category: 'bugfix',
    expectedScore: 3,
    pr: {
      title: 'fix: memory leak from unremoved event listeners',
      body: 'Event listeners were not being cleaned up on component unmount, causing memory leaks in long-running sessions.',
      author: 'developer',
    },
    files: [
      {
        filename: 'src/lib/components/Dropdown.svelte',
        status: 'modified',
        additions: 8,
        deletions: 3,
      },
    ],
    diff: `diff --git a/src/lib/components/Dropdown.svelte b/src/lib/components/Dropdown.svelte
index 1234567..abcdefg 100644
--- a/src/lib/components/Dropdown.svelte
+++ b/src/lib/components/Dropdown.svelte
@@ -5,11 +5,16 @@
   let open = $state(false);
   let dropdownRef: HTMLDivElement;

-  $effect(() => {
-    document.addEventListener('click', handleClickOutside);
+  function handleClickOutside(e: MouseEvent) {
+    if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
+      open = false;
+    }
+  }
+
+  $effect(() => {
+    document.addEventListener('click', handleClickOutside);
+    return () => {
+      document.removeEventListener('click', handleClickOutside);
+    };
   });
-
-  function handleClickOutside(e: MouseEvent) {
-    if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
-      open = false;
-    }
-  }
 </script>`,
    expected: {
      affectedAreas: ['frontend', 'components'],
      keyChanges: ['cleanup function', 'memory leak fix'],
    },
  },
];
