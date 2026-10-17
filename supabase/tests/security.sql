begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','test-student-a@campushub.invalid','{"full_name":"Test Student A"}'),
('22222222-2222-4222-8222-222222222222','test-student-b@campushub.invalid','{"full_name":"Test Student B"}'),
('33333333-3333-4333-8333-333333333333','test-faculty@campushub.invalid','{"full_name":"Test Faculty"}');
update public.profiles set role='faculty' where id='33333333-3333-4333-8333-333333333333';
update public.profiles set department_id=(select id from public.departments where code='BCA'),semester_id=(select s.id from public.semesters s join public.departments d on d.id=s.department_id where d.code='BCA' and semester_number=1) where id in ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333');
update public.profiles set department_id=(select id from public.departments where code='BBA'),semester_id=(select s.id from public.semesters s join public.departments d on d.id=s.department_id where d.code='BBA' and semester_number=1) where id='22222222-2222-4222-8222-222222222222';
update public.subjects set faculty_id='33333333-3333-4333-8333-333333333333' where subject_code='BCA103';
insert into public.assignments(id,title,description,subject_id,faculty_id,due_date) values('44444444-4444-4444-8444-444444444444','Security test','Testing authorised submissions',(select id from public.subjects where subject_code='BCA103'),'33333333-3333-4333-8333-333333333333',now()+interval '1 day');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.profiles)<>1 then raise exception 'FAIL student profile isolation'; end if;
 if exists(select 1 from public.profiles where id='22222222-2222-4222-8222-222222222222') then raise exception 'FAIL cross-student visibility'; end if;
 begin update public.profiles set role='admin' where id=auth.uid();raise exception 'FAIL role escalation succeeded';exception when raise_exception then if sqlerrm like 'FAIL%' then raise;end if;end;
 begin insert into public.assignment_submissions(assignment_id,student_id,file_url) values('44444444-4444-4444-8444-444444444444',auth.uid(),'22222222-2222-4222-8222-222222222222/stolen.pdf');raise exception 'FAIL foreign file reference';exception when raise_exception then if sqlerrm like 'FAIL%' then raise;end if;end;
 begin insert into public.assignment_submissions(assignment_id,student_id,submission_text,marks) values('44444444-4444-4444-8444-444444444444',auth.uid(),'Answer',100);raise exception 'FAIL self grading';exception when raise_exception then if sqlerrm like 'FAIL%' then raise;end if;end;
 insert into public.assignment_submissions(assignment_id,student_id,submission_text) values('44444444-4444-4444-8444-444444444444',auth.uid(),'A legitimate answer');
 insert into public.complaints(student_id,title,description,category) values(auth.uid(),'A test concern','Testing complaint timeline','Academic');
 if (select count(*) from public.complaint_updates)<>1 then raise exception 'FAIL complaint timeline';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.profiles where id='22222222-2222-4222-8222-222222222222') then raise exception 'FAIL faculty unrelated student access';end if;
 update public.assignment_submissions set marks=85,feedback='Good work',status='graded' where assignment_id='44444444-4444-4444-8444-444444444444';
 if not found then raise exception 'FAIL faculty grading';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ declare affected integer;begin
 if (select marks from public.assignment_submissions where assignment_id='44444444-4444-4444-8444-444444444444')<>85 then raise exception 'FAIL grade visibility';end if;
 update public.assignment_submissions set submission_text='Tampered answer' where assignment_id='44444444-4444-4444-8444-444444444444';
 get diagnostics affected=row_count;if affected<>0 then raise exception 'FAIL graded answer editable';end if;
 if not exists(select 1 from public.notifications where title='Assignment graded') then raise exception 'FAIL notification';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
update public.profiles set account_status='inactive' where id='11111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.assignment_submissions) or exists(select 1 from public.profiles) or exists(select 1 from public.subjects) then raise exception 'FAIL inactive access';end if;
end $$;
reset role;
select 'PASS: student isolation, role protection, file ownership, self-grading prevention, submission, complaint history, scoped faculty grading, notifications, graded lock, inactive-account revocation' as result;
rollback;
