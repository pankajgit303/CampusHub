-- A student's course is derived from their semester, avoiding duplicate assignments.
alter table public.semesters add column course_id uuid references public.courses(id);
alter table public.courses add constraint courses_id_department_key unique (id, department_id);
alter table public.semesters add constraint semesters_course_department_fkey
 foreign key (course_id, department_id) references public.courses(id, department_id);
alter table public.semesters drop constraint semesters_department_id_semester_number_academic_year_key;
create unique index semesters_course_number_year_key on public.semesters(course_id,semester_number,academic_year) where course_id is not null;
create unique index semesters_unassigned_number_year_key on public.semesters(department_id,semester_number,academic_year) where course_id is null;
-- Only infer existing links where the department has exactly one course.
update public.semesters s set course_id=c.id from public.courses c
where c.department_id=s.department_id
and (select count(*) from public.courses other where other.department_id=s.department_id)=1;

