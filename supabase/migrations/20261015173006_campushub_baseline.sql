
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create type public.app_role as enum ('student','faculty','admin');
create table public.departments(id uuid primary key default gen_random_uuid(), name text not null, code text not null unique, description text, created_at timestamptz not null default now());
create table public.courses(id uuid primary key default gen_random_uuid(), name text not null, department_id uuid not null references public.departments, duration_years integer not null default 3 check(duration_years between 1 and 10), created_at timestamptz not null default now());
create table public.semesters(id uuid primary key default gen_random_uuid(), department_id uuid not null references public.departments, semester_number integer not null check(semester_number between 1 and 12), academic_year text not null, unique(department_id,semester_number,academic_year));
create table public.classrooms(id uuid primary key default gen_random_uuid(), name text not null unique, building text, capacity integer check(capacity>0));
create table public.profiles(id uuid primary key references auth.users on delete cascade, full_name text not null default '', email text not null, avatar_url text, phone text, role public.app_role not null default 'student', department_id uuid references public.departments, semester_id uuid references public.semesters, roll_number text unique, registration_number text unique, account_status text not null default 'active' check(account_status in ('active','inactive')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.subjects(id uuid primary key default gen_random_uuid(), department_id uuid not null references public.departments, semester_id uuid not null references public.semesters, subject_name text not null, subject_code text not null unique, faculty_id uuid references public.profiles, credits numeric not null default 3 check(credits>0));
create table public.attendance(id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles, subject_id uuid not null references public.subjects, faculty_id uuid not null references public.profiles, attendance_date date not null, status text not null check(status in ('present','absent','late','excused')), created_at timestamptz not null default now(), unique(student_id,subject_id,attendance_date));
create table public.assignments(id uuid primary key default gen_random_uuid(), title text not null, description text not null, subject_id uuid not null references public.subjects, faculty_id uuid not null references public.profiles, due_date timestamptz not null, attachment_url text, max_marks numeric not null default 100 check(max_marks>0), created_at timestamptz not null default now());
create table public.assignment_submissions(id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments on delete cascade, student_id uuid not null references public.profiles, file_url text, submission_text text, submitted_at timestamptz not null default now(), status text not null default 'submitted' check(status in ('submitted','late','graded','rejected')), marks numeric check(marks>=0), feedback text, unique(assignment_id,student_id), check(file_url is not null or length(trim(submission_text))>0));
create table public.notices(id uuid primary key default gen_random_uuid(), title text not null, content text not null, author_id uuid not null references public.profiles, target_role text not null default 'all' check(target_role in ('all','student','faculty','admin')), department_id uuid references public.departments, attachment_url text, priority text not null default 'normal' check(priority in ('normal','important','urgent')), created_at timestamptz not null default now());
create table public.timetable(id uuid primary key default gen_random_uuid(), department_id uuid not null references public.departments, semester_id uuid not null references public.semesters, subject_id uuid not null references public.subjects, faculty_id uuid not null references public.profiles, room_number text not null, day_of_week integer not null check(day_of_week between 1 and 6), start_time time not null, end_time time not null, check(end_time>start_time), unique(room_number,day_of_week,start_time), unique(faculty_id,day_of_week,start_time));
create table public.exams(id uuid primary key default gen_random_uuid(), title text not null, subject_id uuid not null references public.subjects, semester_id uuid not null references public.semesters, exam_date date not null, start_time time not null, duration_minutes integer not null check(duration_minutes>0), room_number text not null, max_marks numeric not null check(max_marks>0));
create table public.results(id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles, subject_id uuid not null references public.subjects, exam_id uuid not null references public.exams, marks_obtained numeric not null check(marks_obtained>=0), grade text, remarks text, unique(student_id,exam_id));
create table public.study_materials(id uuid primary key default gen_random_uuid(), title text not null, description text, subject_id uuid not null references public.subjects, faculty_id uuid not null references public.profiles, file_url text not null, created_at timestamptz not null default now());
create table public.events(id uuid primary key default gen_random_uuid(), title text not null, description text not null, event_date timestamptz not null, location text not null, image_url text, created_by uuid not null references public.profiles, created_at timestamptz not null default now());
create table public.event_registrations(id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade, student_id uuid not null references public.profiles, registered_at timestamptz not null default now(), unique(event_id,student_id));
create table public.placements(id uuid primary key default gen_random_uuid(), company_name text not null, role_name text not null, description text not null, salary_package numeric check(salary_package>=0), eligibility text not null, department_id uuid references public.departments, deadline date not null, application_url text not null check(application_url ~ '^https://'), company_logo text, created_at timestamptz not null default now());
create table public.complaints(id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles, title text not null, description text not null, category text not null check(category in ('Academic','Examination','Infrastructure','Hostel','Library','Faculty','Administration','Other')), priority text not null default 'normal' check(priority in ('normal','important','urgent')), status text not null default 'submitted' check(status in ('submitted','under_review','in_progress','resolved','rejected')), assigned_to uuid references public.profiles, admin_response text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.complaint_updates(id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints on delete cascade, status text not null, response text, created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, title text not null, message text not null, type text not null default 'info', read boolean not null default false, created_at timestamptz not null default now());
create table public.grading_rules(id uuid primary key default gen_random_uuid(), grade text not null unique, min_percentage numeric not null unique check(min_percentage between 0 and 100), grade_points numeric not null check(grade_points between 0 and 10));
create table public.settings(id uuid primary key default gen_random_uuid(), name text not null unique, value numeric not null, check(name <> 'minimum_attendance' or value between 0 and 100));
create table public.audit_logs(id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles on delete set null, action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table public.ai_documents(id uuid primary key default gen_random_uuid(), title text not null, source_type text not null, source_id uuid, content text not null, department_id uuid references public.departments, created_at timestamptz not null default now());
create table public.ai_document_chunks(id uuid primary key default gen_random_uuid(), document_id uuid not null references public.ai_documents on delete cascade, content text not null, embedding jsonb, metadata jsonb not null default '{}');

create function private.current_role() returns public.app_role language sql stable security definer set search_path='' as $$
 select role from public.profiles where id=auth.uid() and account_status='active' and auth.uid() is not null
$$;
create function private.in_cohort(d uuid, s uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and account_status='active' and department_id=d and (s is null or semester_id=s))
$$;
create function private.teaches(s uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.current_role()='faculty' and exists(select 1 from public.subjects where id=s and faculty_id=auth.uid())
$$;
create function private.can_subject(s uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.current_role()='admin' or private.teaches(s) or (private.current_role()='student' and exists(select 1 from public.subjects where id=s and private.in_cohort(department_id,semester_id)))
$$;
create function private.can_student(st uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.current_role()='admin' or (private.current_role()='faculty' and exists(select 1 from public.profiles p join public.subjects s on s.department_id=p.department_id and s.semester_id=p.semester_id where p.id=st and p.role='student' and s.faculty_id=auth.uid()))
$$;
create function private.student_subject(st uuid,s uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles p join public.subjects sub on sub.semester_id=p.semester_id and sub.department_id=p.department_id where p.id=st and sub.id=s and p.role='student')
$$;
create function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger auth_profile after insert on auth.users for each row execute function private.new_profile();

create function private.guard_record() returns trigger language plpgsql set search_path='' as $$
declare a public.assignments; e public.exams; r public.app_role:=private.current_role();
begin
 if tg_table_name='profiles' then
  if auth.uid() is not null and r is distinct from 'admin' and (new.role,new.department_id,new.semester_id,new.roll_number,new.registration_number,new.account_status,new.email,new.id) is distinct from (old.role,old.department_id,old.semester_id,old.roll_number,old.registration_number,old.account_status,old.email,old.id) then raise exception 'Academic and account fields are administrator-only'; end if;
  new.updated_at=now();
 elsif tg_table_name='assignment_submissions' then
  select * into a from public.assignments where id=new.assignment_id;
  if new.marks>a.max_marks then raise exception 'Marks exceed assignment maximum'; end if;
  if r='student' then
   if tg_op='UPDATE' and (old.status in ('graded','rejected') or (new.assignment_id,new.student_id,new.marks,new.feedback) is distinct from (old.assignment_id,old.student_id,old.marks,old.feedback)) then raise exception 'Graded submissions and grading fields are protected'; end if;
   if tg_op='INSERT' and (new.marks is not null or new.feedback is not null) then raise exception 'Students cannot grade submissions'; end if;
   new.submitted_at=now(); new.status=case when now()>a.due_date then 'late' else 'submitted' end;
  elsif tg_op='UPDATE' and (new.assignment_id,new.student_id,new.file_url,new.submission_text,new.submitted_at) is distinct from (old.assignment_id,old.student_id,old.file_url,old.submission_text,old.submitted_at) then raise exception 'Submission content cannot be changed by reviewers'; end if;
 elsif tg_table_name='results' then
  select * into e from public.exams where id=new.exam_id;
  if new.subject_id<>e.subject_id or new.marks_obtained>e.max_marks then raise exception 'Invalid exam subject or marks'; end if;
  select grade into new.grade from public.grading_rules where min_percentage<=100*new.marks_obtained/e.max_marks order by min_percentage desc limit 1;
 elsif tg_table_name='complaints' then
  if r='student' and (new.status<>'submitted' or new.assigned_to is not null or new.admin_response is not null) then raise exception 'Complaint review fields are protected'; end if;
  if tg_op='UPDATE' and r='faculty' and (new.student_id,new.title,new.description,new.category,new.priority,new.assigned_to) is distinct from (old.student_id,old.title,old.description,old.category,old.priority,old.assigned_to) then raise exception 'Only response and status may be updated'; end if;
  new.updated_at=now();
 elsif tg_table_name='notifications' and tg_op='UPDATE' then
  if (new.id,new.user_id,new.title,new.message,new.type,new.created_at) is distinct from (old.id,old.user_id,old.title,old.message,old.type,old.created_at) then raise exception 'Only read status can be updated'; end if;
 end if;
 return new;
end $$;
create trigger profile_guard before update on public.profiles for each row execute function private.guard_record();
create trigger submission_guard before insert or update on public.assignment_submissions for each row execute function private.guard_record();
create trigger results_guard before insert or update on public.results for each row execute function private.guard_record();
create trigger complaints_guard before insert or update on public.complaints for each row execute function private.guard_record();
create trigger notifications_guard before update on public.notifications for each row execute function private.guard_record();

do $$ declare t text; begin
 foreach t in array array['departments','courses','semesters','classrooms','profiles','subjects','attendance','assignments','assignment_submissions','notices','timetable','exams','results','study_materials','events','event_registrations','placements','complaints','complaint_updates','notifications','grading_rules','settings','audit_logs','ai_documents','ai_document_chunks'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 if t not in ('audit_logs','complaint_updates','notifications') then
 execute format('create policy admin_all on public.%I for all to authenticated using ((select private.current_role())=''admin'') with check ((select private.current_role())=''admin'')',t);
 end if;
 end loop;
 foreach t in array array['departments','courses','semesters','classrooms','grading_rules','settings'] loop
 execute format('create policy active_read on public.%I for select to authenticated using ((select private.current_role()) is not null)',t);
 end loop;
 foreach t in array array['subjects','assignments','study_materials','exams','timetable'] loop
 execute format('create policy class_read on public.%I for select to authenticated using (private.can_subject(%I))',t,case when t='subjects' then 'id' else 'subject_id' end);
 end loop;
 foreach t in array array['assignments','study_materials'] loop
 execute format('create policy faculty_write on public.%I for all to authenticated using (private.teaches(subject_id) and faculty_id=(select auth.uid())) with check (private.teaches(subject_id) and faculty_id=(select auth.uid()))',t);
 end loop;
end $$;
create policy profile_read on public.profiles for select to authenticated using ((id=(select auth.uid()) and (select private.current_role()) is not null) or private.can_student(id));
create policy profile_update on public.profiles for update to authenticated using (id=(select auth.uid()) and (select private.current_role()) is not null) with check (id=(select auth.uid()) and (select private.current_role()) is not null);
create policy attendance_read on public.attendance for select to authenticated using (student_id=(select auth.uid()) and (select private.current_role())='student');
create policy attendance_faculty on public.attendance for all to authenticated using (private.teaches(subject_id)) with check (private.teaches(subject_id) and faculty_id=(select auth.uid()) and private.student_subject(student_id,subject_id));
create policy results_read on public.results for select to authenticated using (student_id=(select auth.uid()) and (select private.current_role())='student');
create policy results_faculty on public.results for all to authenticated using (private.teaches(subject_id)) with check (private.teaches(subject_id) and private.student_subject(student_id,subject_id));
create policy submission_read on public.assignment_submissions for select to authenticated using ((student_id=(select auth.uid()) and (select private.current_role())='student') or exists(select 1 from public.assignments a where a.id=assignment_id and private.teaches(a.subject_id)));
create policy submission_insert on public.assignment_submissions for insert to authenticated with check (student_id=(select auth.uid()) and (select private.current_role())='student' and exists(select 1 from public.assignments a where a.id=assignment_id and private.can_subject(a.subject_id)));
create policy submission_update on public.assignment_submissions for update to authenticated using ((student_id=(select auth.uid()) and (select private.current_role())='student' and status not in ('graded','rejected')) or exists(select 1 from public.assignments a where a.id=assignment_id and private.teaches(a.subject_id))) with check ((student_id=(select auth.uid()) and (select private.current_role())='student') or exists(select 1 from public.assignments a where a.id=assignment_id and private.teaches(a.subject_id)));
create policy notice_read on public.notices for select to authenticated using ((select private.current_role()) is not null and (target_role='all' or target_role=(select private.current_role())::text) and (department_id is null or private.in_cohort(department_id)));
create policy notice_author on public.notices for all to authenticated using (author_id=(select auth.uid()) and (select private.current_role())='faculty') with check (author_id=(select auth.uid()) and (select private.current_role())='faculty' and (department_id is null or private.in_cohort(department_id)));
create policy event_read on public.events for select to authenticated using ((select private.current_role()) is not null);
create policy placement_read on public.placements for select to authenticated using ((select private.current_role()) is not null and (department_id is null or private.in_cohort(department_id)));
create policy registration_read on public.event_registrations for select to authenticated using (student_id=(select auth.uid()) and (select private.current_role())='student');
create policy registration_insert on public.event_registrations for insert to authenticated with check (student_id=(select auth.uid()) and (select private.current_role())='student' and exists(select 1 from public.events e where e.id=event_id and e.event_date>now()));
create policy registration_delete on public.event_registrations for delete to authenticated using (student_id=(select auth.uid()) and (select private.current_role())='student');
create policy complaint_read on public.complaints for select to authenticated using ((student_id=(select auth.uid()) and (select private.current_role())='student') or (assigned_to=(select auth.uid()) and (select private.current_role())='faculty'));
create policy complaint_insert on public.complaints for insert to authenticated with check (student_id=(select auth.uid()) and (select private.current_role())='student');
create policy complaint_response on public.complaints for update to authenticated using (assigned_to=(select auth.uid()) and (select private.current_role())='faculty') with check (assigned_to=(select auth.uid()) and (select private.current_role())='faculty');
create policy complaint_history on public.complaint_updates for select to authenticated using (exists(select 1 from public.complaints c where c.id=complaint_id));
create policy notification_read on public.notifications for select to authenticated using (user_id=(select auth.uid()) and (select private.current_role()) is not null);
create policy notification_update on public.notifications for update to authenticated using (user_id=(select auth.uid()) and (select private.current_role()) is not null) with check (user_id=(select auth.uid()) and (select private.current_role()) is not null);
create policy audit_read on public.audit_logs for select to authenticated using ((select private.current_role())='admin');
create policy documents_read on public.ai_documents for select to authenticated using ((select private.current_role()) is not null and (department_id is null or private.in_cohort(department_id)));
create policy chunks_read on public.ai_document_chunks for select to authenticated using (exists(select 1 from public.ai_documents d where d.id=document_id));
create policy faculty_grading on public.grading_rules for all to authenticated using ((select private.current_role())='faculty') with check ((select private.current_role())='faculty');

create function private.activity() returns trigger language plpgsql security definer set search_path='' as $$
declare rowdata jsonb:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end; target uuid; subj uuid;
begin
 if auth.uid() is null then return coalesce(new,old); end if;
 if private.current_role() in ('admin','faculty') then
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),tg_op,tg_table_name,(rowdata->>'id')::uuid,jsonb_build_object('fields',array(select jsonb_object_keys(rowdata))));
 end if;
 if tg_table_name='complaints' and tg_op in ('INSERT','UPDATE') then
 insert into public.complaint_updates(complaint_id,status,response) values(new.id,new.status,new.admin_response);
 if tg_op='UPDATE' then insert into public.notifications(user_id,title,message,type) values(new.student_id,'Complaint updated',new.title||': '||replace(new.status,'_',' '),'complaint'); end if;
 elsif tg_table_name='assignment_submissions' and tg_op='UPDATE' and new.status='graded' then
 insert into public.notifications(user_id,title,message,type) values(new.student_id,'Assignment graded',coalesce(new.feedback,'Your grade is available.'),'assignment');
 elsif tg_table_name='event_registrations' and tg_op='INSERT' then
 insert into public.notifications(user_id,title,message,type) values(new.student_id,'Registration confirmed','Your place at the event is confirmed.','event');
 elsif tg_op='INSERT' and tg_table_name in ('assignments','exams') then
 subj=(rowdata->>'subject_id')::uuid;
 insert into public.notifications(user_id,title,message,type) select p.id,case when tg_table_name='exams' then 'Exam announced' else 'New assignment' end,rowdata->>'title',tg_table_name from public.profiles p join public.subjects s on s.department_id=p.department_id and s.semester_id=p.semester_id where s.id=subj and p.role='student' and p.account_status='active';
 elsif tg_op='INSERT' and tg_table_name='notices' then
 insert into public.notifications(user_id,title,message,type) select id,'New notice',new.title,'notice' from public.profiles where account_status='active' and (new.target_role='all' or role::text=new.target_role) and (new.department_id is null or department_id=new.department_id);
 elsif tg_op='INSERT' and tg_table_name='placements' then
 insert into public.notifications(user_id,title,message,type) select id,'New placement opportunity',new.company_name||' — '||new.role_name,'placement' from public.profiles where role='student' and account_status='active' and (new.department_id is null or department_id=new.department_id);
 end if;
 return coalesce(new,old);
end $$;
do $$ declare t text; c record; begin
 foreach t in array array['profiles','departments','courses','semesters','classrooms','subjects','attendance','assignments','assignment_submissions','notices','timetable','exams','results','study_materials','events','event_registrations','placements','complaints','grading_rules','settings','ai_documents'] loop
 execute format('create trigger activity after insert or update or delete on public.%I for each row execute function private.activity()',t);
 end loop;
 for c in select table_name,column_name from information_schema.columns where table_schema='public' and (column_name like '%\_id' escape '\' or column_name='created_at') loop
 execute format('create index on public.%I (%I)',c.table_name,c.column_name);
 end loop;
end $$;
revoke all on all functions in schema private from public,anon;
grant execute on function private.current_role(),private.in_cohort(uuid,uuid),private.teaches(uuid),private.can_subject(uuid),private.can_student(uuid),private.student_subject(uuid,uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
select b,b,false,10485760,array['application/pdf','image/jpeg','image/png','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip'] from unnest(array['avatars','assignments','submissions','study-materials','notices','event-images']) b;
create policy campus_upload on storage.objects for insert to authenticated with check (
 (select private.current_role()) is not null and (storage.foldername(name))[1]=(select auth.uid())::text and
 (bucket_id in ('avatars','submissions') or (bucket_id in ('assignments','study-materials','notices') and (select private.current_role()) in ('faculty','admin')) or (bucket_id='event-images' and (select private.current_role())='admin'))
);
create policy campus_file_read on storage.objects for select to authenticated using (
 (select private.current_role()) is not null and (
 (storage.foldername(name))[1]=(select auth.uid())::text or (select private.current_role())='admin'
 or (bucket_id='assignments' and exists(select 1 from public.assignments a where a.attachment_url=name))
 or (bucket_id='submissions' and exists(select 1 from public.assignment_submissions s where s.file_url=name))
 or (bucket_id='study-materials' and exists(select 1 from public.study_materials m where m.file_url=name))
 or (bucket_id='notices' and exists(select 1 from public.notices n where n.attachment_url=name))
 or (bucket_id='event-images' and exists(select 1 from public.events e where e.image_url=name))
));
create policy campus_file_delete on storage.objects for delete to authenticated using ((select private.current_role())='admin');
alter publication supabase_realtime add table public.notices,public.notifications;
insert into public.grading_rules(grade,min_percentage,grade_points) values('A+',90,10),('A',80,9),('B+',70,8),('B',60,7),('C',50,6),('Fail',0,0);
insert into public.settings(name,value) values('minimum_attendance',75);
insert into public.departments(name,code,description) values('Computer Applications','BCA','Bachelor of Computer Applications'),('Business Administration','BBA','Bachelor of Business Administration'),('Science','BSC','Bachelor of Science'),('Commerce','BCOM','Bachelor of Commerce');
insert into public.semesters(department_id,semester_number,academic_year) select id,n,'2026–2027' from public.departments cross join generate_series(1,6) n;
insert into public.courses(name,department_id) select 'Bachelor of Computer Applications',id from public.departments where code='BCA';
insert into public.subjects(department_id,semester_id,subject_name,subject_code,credits) select d.id,s.id,v.name,v.code,4 from public.departments d join public.semesters s on s.department_id=d.id and s.semester_number=1 cross join (values ('Programming in C','BCA101'),('Data Structures','BCA102'),('Database Management Systems','BCA103'),('Operating Systems','BCA104'),('Computer Networks','BCA105'),('Web Development','BCA106')) v(name,code) where d.code='BCA';
insert into public.classrooms(name,building,capacity) values('A-101','Academic Block',60),('Lab-201','Technology Block',40);

create table private.ai_rate_limits(user_id uuid primary key references auth.users on delete cascade, window_start timestamptz not null, requests integer not null);
alter table private.ai_rate_limits enable row level security;
create function private.consume_ai_request() returns void language plpgsql security definer set search_path='' as $$
declare n integer; begin
 if auth.uid() is null or private.current_role() is null then raise exception 'Authentication required'; end if;
 insert into private.ai_rate_limits(user_id,window_start,requests) values(auth.uid(),now(),1)
 on conflict(user_id) do update set requests=case when private.ai_rate_limits.window_start<now()-interval '1 minute' then 1 else private.ai_rate_limits.requests+1 end,window_start=case when private.ai_rate_limits.window_start<now()-interval '1 minute' then now() else private.ai_rate_limits.window_start end returning requests into n;
 if n>10 then raise exception 'Request limit reached'; end if; end $$;
revoke all on function private.consume_ai_request() from public,anon;
grant execute on function private.consume_ai_request() to authenticated;
create function public.consume_ai_request() returns void language sql security invoker set search_path='' as $$ select private.consume_ai_request() $$;
revoke all on function public.consume_ai_request() from public,anon;
grant execute on function public.consume_ai_request() to authenticated;

create function private.validate_relations() returns trigger language plpgsql set search_path='' as $$
declare semester_department uuid; assigned_role public.app_role;
begin
 if tg_table_name in ('profiles','subjects','timetable') then
  if new.semester_id is not null then select department_id into semester_department from public.semesters where id=new.semester_id;
   if new.department_id is distinct from semester_department then raise exception 'Semester must belong to the selected department'; end if;
  end if;
 end if;
 if tg_table_name in ('subjects','timetable') and new.faculty_id is not null then
  select role into assigned_role from public.profiles where id=new.faculty_id;
  if assigned_role not in ('faculty','admin') then raise exception 'Select a faculty or administrator account'; end if;
 end if;
 if tg_table_name='complaints' and new.assigned_to is not null then
  select role into assigned_role from public.profiles where id=new.assigned_to;
  if assigned_role not in ('faculty','admin') then raise exception 'Complaints must be assigned to staff'; end if;
 end if;
 if tg_table_name in ('timetable','exams') then
  if not exists(select 1 from public.subjects where id=new.subject_id and semester_id=new.semester_id) then raise exception 'Subject and semester must match'; end if;
 end if;
 return new;
end $$;
create trigger profile_relations before insert or update on public.profiles for each row execute function private.validate_relations();
create trigger subject_relations before insert or update on public.subjects for each row execute function private.validate_relations();
create trigger timetable_relations before insert or update on public.timetable for each row execute function private.validate_relations();
create trigger exam_relations before insert or update on public.exams for each row execute function private.validate_relations();
create trigger complaint_relations before insert or update on public.complaints for each row execute function private.validate_relations();

create function private.guard_file_reference() returns trigger language plpgsql set search_path='' as $$
declare col text; path text; previous text;
begin
 if auth.uid() is null or private.current_role()='admin' then return new; end if;
 foreach col in array tg_argv loop
 path=to_jsonb(new)->>col; previous=case when tg_op='UPDATE' then to_jsonb(old)->>col else null end;
 if path is distinct from previous and path is not null and split_part(path,'/',1)<>auth.uid()::text then raise exception 'Files must belong to the current user'; end if;
 end loop;
 return new;
end $$;
create trigger profile_file before insert or update on public.profiles for each row execute function private.guard_file_reference('avatar_url');
create trigger assignment_file before insert or update on public.assignments for each row execute function private.guard_file_reference('attachment_url');
create trigger submission_file before insert or update on public.assignment_submissions for each row execute function private.guard_file_reference('file_url');
create trigger material_file before insert or update on public.study_materials for each row execute function private.guard_file_reference('file_url');
create trigger notice_file before insert or update on public.notices for each row execute function private.guard_file_reference('attachment_url');
create trigger event_file before insert or update on public.events for each row execute function private.guard_file_reference('image_url');

create table public.faculty_directory(id uuid primary key references public.profiles on delete cascade, full_name text not null);
alter table public.faculty_directory enable row level security;
grant select on public.faculty_directory to authenticated;
create policy assigned_faculty_names on public.faculty_directory for select to authenticated using ((select private.current_role())='admin' or (id=(select auth.uid()) and (select private.current_role()) is not null) or exists(select 1 from public.subjects s where s.faculty_id=faculty_directory.id));
create function private.sync_faculty_directory() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.role in ('faculty','admin') then insert into public.faculty_directory(id,full_name) values(new.id,new.full_name) on conflict(id) do update set full_name=excluded.full_name;
 else delete from public.faculty_directory where id=new.id; end if;return new;
end $$;
create trigger sync_faculty_directory after insert or update on public.profiles for each row execute function private.sync_faculty_directory();
revoke all on function private.validate_relations(),private.guard_file_reference(),private.sync_faculty_directory() from public,anon,authenticated;
create extension if not exists btree_gist with schema extensions;
alter table public.timetable add constraint no_room_overlap exclude using gist(room_number with =,day_of_week with =,tsrange(date '2000-01-01'+start_time,date '2000-01-01'+end_time,'[)') with &&);
alter table public.timetable add constraint no_faculty_overlap exclude using gist(faculty_id with =,day_of_week with =,tsrange(date '2000-01-01'+start_time,date '2000-01-01'+end_time,'[)') with &&);
alter table public.timetable add constraint no_cohort_overlap exclude using gist(semester_id with =,day_of_week with =,tsrange(date '2000-01-01'+start_time,date '2000-01-01'+end_time,'[)') with &&);


create or replace function private.validate_relations() returns trigger language plpgsql set search_path='' as $$
declare semester_department uuid; assigned_role public.app_role;
begin
 if tg_table_name in ('profiles','subjects','timetable') then
  if new.semester_id is not null then select department_id into semester_department from public.semesters where id=new.semester_id;
   if new.department_id is distinct from semester_department then raise exception 'Semester must belong to the selected department'; end if;
  end if;
 end if;
 if tg_table_name in ('subjects','timetable') and (to_jsonb(new)->>'faculty_id') is not null then
  select role into assigned_role from public.profiles where id=new.faculty_id;
  if assigned_role not in ('faculty','admin') then raise exception 'Select a faculty or administrator account'; end if;
 end if;
 if tg_table_name='complaints' and (to_jsonb(new)->>'assigned_to') is not null then
  select role into assigned_role from public.profiles where id=new.assigned_to;
  if assigned_role not in ('faculty','admin') then raise exception 'Complaints must be assigned to staff'; end if;
 end if;
 if tg_table_name in ('timetable','exams') then
  if not exists(select 1 from public.subjects where id=new.subject_id and semester_id=new.semester_id) then raise exception 'Subject and semester must match'; end if;
 end if;
 return new;
end $$;


create index complaints_assigned_to_idx on public.complaints(assigned_to);
create index events_created_by_idx on public.events(created_by);
create policy no_client_access on private.ai_rate_limits to authenticated using(false) with check(false);
create policy no_client_access on private.bootstrap_admin to authenticated using(false) with check(false);

