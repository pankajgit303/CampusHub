begin;
insert into auth.users(id,email,raw_user_meta_data) values ('99999999-3333-4333-8333-333333333333','course-test@campushub.invalid','{}');
do $$ declare d uuid; c1 uuid; c2 uuid; s1 uuid; s2 uuid; begin
insert into public.departments(name,code) values ('Course regression','TEST-COURSES') returning id into d;
insert into public.courses(name,department_id) values ('Course A',d) returning id into c1;
insert into public.courses(name,department_id) values ('Course B',d) returning id into c2;
insert into public.semesters(department_id,course_id,semester_number,academic_year) values(d,c1,1,'TEST') returning id into s1;
insert into public.semesters(department_id,course_id,semester_number,academic_year) values(d,c2,1,'TEST') returning id into s2;
insert into public.subjects(subject_name,subject_code,department_id,semester_id) values ('Course A subject','TEST-A',d,s1),('Course B subject','TEST-B',d,s2);
update public.profiles set department_id=d,semester_id=s1 where id='99999999-3333-4333-8333-333333333333';
begin
insert into public.semesters(department_id,course_id,semester_number,academic_year) values(d,c1,1,'TEST');
raise exception 'Duplicate course semester permitted';
exception when unique_violation then null; end;
begin
insert into public.semesters(department_id,course_id,semester_number,academic_year) values ((select id from public.departments where id<>d limit 1),c1,2,'TEST');
raise exception 'Mismatched department permitted';
exception when foreign_key_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','99999999-3333-4333-8333-333333333333',true);
set local role authenticated;
do $$ begin
if not exists(select 1 from public.subjects where subject_code='TEST-A') then raise exception 'Student own subject missing'; end if;
if exists(select 1 from public.subjects where subject_code='TEST-B') then raise exception 'Other course subject exposed'; end if;
begin
update public.profiles set semester_id=(select id from public.semesters where academic_year='TEST' and course_id=(select id from public.courses where name='Course B')) where id=auth.uid();
raise exception 'Student changed academic assignment';
exception when raise_exception then
if SQLERRM <> 'Academic and account fields are administrator-only' then raise; end if;
end;
end $$;
rollback;
select 'PASS: course semester uniqueness, department integrity, student subject isolation and protected assignment; fixtures rolled back' as result;
