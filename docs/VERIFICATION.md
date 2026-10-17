# Verification record

## Completed

- TypeScript strict compilation and Vite production build pass.
- Four unit tests pass: empty attendance, attendance denominator, unsafe URL rejection, HTTPS application links.
- Live PostgreSQL security tests pass inside a rolled-back transaction: student profile isolation, cross-student access denial, role-escalation prevention, foreign file-reference rejection, self-grading prevention, legitimate submission creation, grievance timeline creation, scoped faculty grading, grade visibility, graded-submission immutability, grade notification and immediate inactive-account access revocation.
- Supabase security advisor: zero findings after targeted fixes.
- Dependency audit: zero reported vulnerabilities after pinned updates.
- The Supabase email provider is enabled and automatic email confirmation is disabled.
- The deployed Campus AI endpoint returns HTTP 401 without authentication.
- The local preview returns HTTP 200.
- Automated Edge browser checks pass for public desktop/mobile pages, login/signup navigation, unauthenticated route protection, invalid email input, absence of horizontal overflow and absence of browser runtime exceptions.
- Desktop and mobile landing screenshots have been visually inspected.
- Isolated workspace UI checks pass for student, faculty and administrator layouts, all feature routes, the admin department dialog, student route guard, dark mode and mobile navigation. The student dashboard screenshot was visually inspected.

## Important distinctions

`scripts/workspace-ui-smoke.mjs` uses isolated network fixtures solely to check authenticated layout rendering, navigation and forms. No fixtures are shipped in the application or written to the database. These are UI checks, not proof of real sign-in or successful browser-to-database writes.

The real database checks use authenticated PostgreSQL roles and claims in a transaction. They exercise policies and triggers but do not test Supabase email delivery or the hosted login flow.

## Before production rollout

Use verified staging accounts to exercise signup, verification, recovery, each role's CRUD workflows, actual storage transfers, Realtime delivery and authenticated Campus AI requests through the deployed frontend. Configure the Auth Site URL, redirect allowlist and production SMTP. Publish to Vercel and repeat these checks on that origin. No real administrator account has been created on the user's behalf; its verified-email role reservation is configured.

Demo accounts require the supplied server-side provisioning script and a privately supplied service-role credential. Conversational language-model generation and semantic RAG are not active. Campus AI currently performs authorised database lookups.

The performance advisor reports overlapping permissive policies and initially unused indexes. These are performance considerations, not security findings. Existing policies are retained because automatic review rejected a broad rewrite. References: [permissive policy performance](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies), [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
