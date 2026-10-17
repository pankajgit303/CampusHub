-- Faculty publish to students; authors retain access to manage their notices.
alter policy notice_author on public.notices
with check (
 author_id=(select auth.uid())
 and (select private.current_role())='faculty'
 and target_role='student'
 and (department_id is null or private.in_cohort(department_id))
);
