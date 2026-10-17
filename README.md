# CampusHub — Smart College. Connected Campus.

React, Vite, strict TypeScript, Tailwind CSS, shadcn-style Radix primitives, Lucide, React Hook Form, Zod, Recharts, React Router and Sonner. Supabase supplies Auth, PostgreSQL, private Storage, Realtime and the Campus AI Edge Function.

## Run locally

```sh
npm ci
npm run dev
```

The existing `.env.local` connects this workspace to the approved Supabase project. Only its publishable browser key is included. For another environment, copy `.env.example` to `.env.local` and supply its URL and publishable key.

```sh
npm run build
npm test
```

## First administrator

The sign-in chooser at `/auth/login` links to separate `/auth/login/student`, `/auth/login/faculty`, and `/auth/login/admin` pages. Each portal checks the signed-in account's database role and signs out accounts using the wrong portal. Portal selection never changes roles; database RLS remains authoritative.

Sign up using **pankajsingha303@gmail.com** and verify that email. A private database allowlist promotes that verified account once. A user cannot grant themselves a role through signup metadata. The administrator can then assign roles, departments, semesters and roll numbers under **People**. Other users register through verified email signup.

In Supabase Authentication → URL Configuration, add `http://127.0.0.1:5173/**` for local testing and the exact production origin plus `/app` and `/auth/reset` redirects for deployment. Set the production Site URL. Keep email confirmation enabled, configure production SMTP, and enable abuse controls appropriate to the college.

## Database and security

The connected project already has the schema, six private buckets, role policies, private helper functions, notification and audit triggers, academic seed structure and deployed `campus-ai` function. RLS uses current database roles and active account state, not editable user metadata. Student role/academic fields are protected by a trigger. Faculty permissions depend on assigned subjects. Graded submissions cannot be edited by students. New file references must belong to their uploader. Room, faculty and cohort schedule overlaps are rejected by exclusion constraints.

`supabase/migrations/*_campushub_baseline.sql` is a **fresh-database baseline** that includes the fixes made during development. Do not apply it to the already provisioned project or mark its new timestamp as a remote incremental change. Remote migration history is recorded separately by the Supabase connector. `supabase/schema.sql` preserves the initial schema reference; the baseline is the complete replay source. `supabase/admin-bootstrap.sql` contains this owner's separate, verified-email bootstrap and should be adapted before use in another college.

`supabase/tests/security.sql` runs transactional role-isolation and privilege-escalation checks, then rolls back all test users and records. It was executed successfully on the connected database. Run it as the database owner on a test database before future permission changes.

Audit logs contain action, actor, entity and changed field names. Private rate-limit and bootstrap tables explicitly deny client access. Their privileged triggers are not exposed through the Data API. Multiple narrowly scoped permissive policies are intentional; Supabase's performance advisor suggests consolidating them, which remains a future measured optimisation. Unused-index informational findings are expected before real traffic.

## Workflows

To add a faculty member, an administrator opens **People → Add faculty**, selects a registered account and department, and saves. The dialog includes a copyable signup link for people who have not registered yet. The action assigns the Faculty role and clears the student semester; teaching subjects are assigned separately under **Subjects**. Authentication passwords are never created or shared through this form.

- Students: attendance, timetable, notices, assignment upload/text submissions, grade feedback, results, exams, events and registration, placements, grievances with history, private materials, profile, search and notifications.
- Faculty: assigned student information, attendance upserts, assignment creation and grading, materials, notices, marks, grading rules and assigned grievances.
- Administrators: people and role/account management, academic structure, schedules, events, placements, exams, records, storage files, settings, knowledge documents and audit history.
- Notices and notifications subscribe to Supabase Realtime. Notification generation runs in database triggers.
- New accounts without a cohort see an onboarding message and real empty states. No mock activity is substituted.

## Campus AI

The current assistant uses the signed-in Supabase client and existing database access policies for deterministic **campus-data lookups**, not generated prose. It supports role-specific attendance, outstanding assignments, faculty review queues, today's/next classes, exams, notices and materials. Source links lead back to the relevant screen. It never uses a service-role client. The older deployed Edge Function remains available but is no longer called by the assistant page.

An external language-model integration is **not enabled**, as requested. No external AI key or model charges are required. Dashboard priority briefs use explicit rules on accessible records; suggestions never modify records automatically. Contextual shortcuts prepare a question for the user to send. RAG document/chunk tables exist, but embedding ingestion, semantic search and generated advice are not implemented.

## Demo accounts

The academic structure is seeded with four departments, six semesters per department, six BCA subjects, two classrooms and configurable grading rules. Auth demo accounts are intentionally created through the supported Admin API, not direct writes to `auth.users`.

On a **separate demo project**, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CAMPUSHUB_DEMO_PASSWORD` (16+ characters) in a trusted terminal, then run:

```sh
node scripts/seed-demo.mjs
```

This creates the requested `student@campushub.demo`, `faculty@campushub.demo` and `admin@campushub.demo` accounts and labelled demo records. No password is hardcoded or printed. The script stops on pre-existing accounts rather than changing their credentials. It has not been run against the user's production project because a service-role credential is not available in the local workspace.

## Deploy to Vercel

1. Import this directory's repository into Vercel and choose Vite.
2. Build command: `npm run build`. Output directory: `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel environment. Never add a service-role key under a `VITE_` name.
4. Deploy and add its origin to Supabase Auth's approved redirects and Site URL.
5. Verify signup/email confirmation, password recovery, each role's workflows, file uploads and Realtime on the production origin.

`vercel.json` includes SPA routing and baseline response headers. No Vercel account or deployment credentials were available, so the web frontend has not been published by this task.

## Operational limits

The data layer fetches permitted records in ordered 1,000-row network pages, then paginates the loaded collection for display. It does not silently truncate analytics. For large institutions, move filtering and aggregation into server-side queries/RPCs to reduce browser memory and network traffic. End-to-end checks with verified accounts and production email settings are still required before rollout.

Private file deletion is admin-only. Failed form writes can leave an uploaded file orphaned; admins can inspect and remove these through Uploaded files. Saved filenames are immutable and reads use short-lived signed URLs. Storage uploads are limited to 10 MB and an explicit MIME allowlist.

No real-user testimonials were supplied, so the landing page does not invent endorsements. College-specific branding, policies, SMTP, monitoring, backup retention, load testing and data-retention choices remain deployment-owner configuration.
