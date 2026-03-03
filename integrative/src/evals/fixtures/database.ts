import type { PRFixture } from '../types.js';

export const databaseFixtures: PRFixture[] = [
  {
    id: 'db-add-column',
    name: 'Add column to table',
    category: 'database',
    expectedScore: 2,
    pr: {
      title: 'feat: add lastLoginAt to users table',
      body: 'Track when users last logged in for analytics.',
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/server/db/schema.ts', status: 'modified', additions: 3, deletions: 0 },
      { filename: 'drizzle/0015_add_last_login.sql', status: 'added', additions: 5, deletions: 0 },
    ],
    diff: `diff --git a/src/lib/server/db/schema.ts b/src/lib/server/db/schema.ts
index 1234567..abcdefg 100644
--- a/src/lib/server/db/schema.ts
+++ b/src/lib/server/db/schema.ts
@@ -25,6 +25,7 @@ export const users = pgTable('users', {
   emailVerified: timestamp('email_verified'),
   image: text('image'),
   createdAt: timestamp('created_at').defaultNow().notNull(),
+  lastLoginAt: timestamp('last_login_at'),
 });

diff --git a/drizzle/0015_add_last_login.sql b/drizzle/0015_add_last_login.sql
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/drizzle/0015_add_last_login.sql
@@ -0,0 +1,2 @@
+ALTER TABLE users
+ADD COLUMN last_login_at TIMESTAMP;`,
    expected: {
      affectedAreas: ['database'],
      keyChanges: ['add column', 'migration'],
    },
  },
  {
    id: 'db-new-table',
    name: 'Create new table with relations',
    category: 'database',
    expectedScore: 3,
    pr: {
      title: 'feat: add audit_logs table',
      body: `Creates audit log table for compliance requirements.

- Tracks all sensitive operations
- Immutable records
- Foreign keys to users and organizations`,
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/server/db/schema.ts', status: 'modified', additions: 35, deletions: 0 },
      { filename: 'drizzle/0016_create_audit_logs.sql', status: 'added', additions: 25, deletions: 0 },
    ],
    diff: `diff --git a/src/lib/server/db/schema.ts b/src/lib/server/db/schema.ts
index 1234567..abcdefg 100644
--- a/src/lib/server/db/schema.ts
+++ b/src/lib/server/db/schema.ts
@@ -150,3 +150,35 @@ export const repositories = pgTable('repositories', {
   },
   (table) => [index('repositories_org_id_idx').on(table.orgId)]
 );
+
+export const auditLogs = pgTable(
+  'audit_logs',
+  {
+    id: uuid('id').primaryKey().defaultRandom(),
+    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
+    actorType: text('actor_type').notNull().default('user'),
+    action: text('action').notNull(),
+    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
+    targetType: text('target_type'),
+    targetId: text('target_id'),
+    metadata: jsonb('metadata').default({}),
+    createdAt: timestamp('created_at').defaultNow().notNull(),
+  },
+  (table) => [
+    index('audit_logs_org_id_idx').on(table.orgId),
+    index('audit_logs_actor_id_idx').on(table.actorId),
+    index('audit_logs_created_at_idx').on(table.createdAt),
+  ]
+);`,
    expected: {
      affectedAreas: ['database'],
      keyChanges: ['new table', 'audit logs', 'indexes'],
    },
  },
  {
    id: 'db-migration-data',
    name: 'Data migration with backfill',
    category: 'database',
    expectedScore: 5,
    pr: {
      title: 'feat: normalize user preferences into separate table',
      body: `## Summary
Extracts preferences from users.settings JSONB into dedicated table.

## Migration strategy
1. Create new preferences table
2. Backfill existing data from JSONB
3. Update application code
4. Drop old column (separate PR)

## Rollback
Migration is reversible - data preserved in both locations until confirmed.`,
      author: 'developer',
    },
    files: [
      { filename: 'src/lib/server/db/schema.ts', status: 'modified', additions: 28, deletions: 5 },
      { filename: 'drizzle/0017_create_preferences.sql', status: 'added', additions: 15, deletions: 0 },
      { filename: 'drizzle/0018_backfill_preferences.sql', status: 'added', additions: 25, deletions: 0 },
      { filename: 'src/lib/server/preferences.ts', status: 'modified', additions: 35, deletions: 42 },
    ],
    diff: `diff --git a/drizzle/0018_backfill_preferences.sql b/drizzle/0018_backfill_preferences.sql
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/drizzle/0018_backfill_preferences.sql
@@ -0,0 +1,25 @@
+-- Backfill user preferences from JSONB to normalized table
+BEGIN;
+
+INSERT INTO user_preferences (user_id, theme, language, timezone, email_notifications, slack_notifications)
+SELECT
+  id as user_id,
+  COALESCE(settings->>'theme', 'system') as theme,
+  COALESCE(settings->>'language', 'en') as language,
+  COALESCE(settings->>'timezone', 'UTC') as timezone,
+  COALESCE((settings->>'emailNotifications')::boolean, true) as email_notifications,
+  COALESCE((settings->>'slackNotifications')::boolean, false) as slack_notifications
+FROM users
+WHERE settings IS NOT NULL
+ON CONFLICT (user_id) DO UPDATE SET
+  theme = EXCLUDED.theme,
+  language = EXCLUDED.language,
+  timezone = EXCLUDED.timezone,
+  email_notifications = EXCLUDED.email_notifications,
+  slack_notifications = EXCLUDED.slack_notifications;
+
+SELECT COUNT(*) as migrated_users FROM user_preferences;
+
+COMMIT;`,
    expected: {
      affectedAreas: ['database'],
      keyChanges: ['data migration', 'backfill', 'normalization'],
    },
  },
];
