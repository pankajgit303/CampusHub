begin;
insert into auth.users(id,email,raw_user_meta_data) values
('99999999-1111-4111-8111-111111111111','notice-admin@campushub.invalid','{}'),
('99999999-2222-4222-8222-222222222222','notice-faculty@campushub.invalid','{}'),
('99999999-3333-4333-8333-333333333333','notice-student@campushub.invalid','{}');
update public.profiles set role='admin' where id='99999999-1111-4111-8111-111111111111';
update public.profiles set role='faculty' where id='99999999-2222-4222-8222-222222222222';
select set_config('request.jwt.claim.sub','99999999-1111-4111-8111-111111111111',true);
set local role authenticated;
insert into public.notices(title,content,author_id,target_role) values
('notice-regression-both','Test','99999999-1111-4111-8111-111111111111','all'),
('notice-regression-faculty','Test','99999999-1111-4111-8111-111111111111','faculty');
select set_config('request.jwt.claim.sub','99999999-2222-4222-8222-222222222222',true);
insert into public.notices(title,content,author_id,target_role) values
('notice-regression-students','Test','99999999-2222-4222-8222-222222222222','student');
do $$ begin
if (select count(*) from public.notices where title like 'notice-regression-%')<>3 then raise exception 'Faculty missing received/own notices'; end if;
begin
insert into public.notices(title,content,author_id,target_role) values ('invalid','Test','99999999-2222-4222-8222-222222222222','admin');
raise exception 'Faculty invalid audience accepted';
exception when insufficient_privilege then null; end;
update public.notices set content='Updated' where title='notice-regression-students';
if not found then raise exception 'Author cannot edit own notice'; end if;
update public.notices set content='Forbidden' where title='notice-regression-both';
if found then raise exception 'Faculty edited admin notice'; end if;
end $$;
select set_config('request.jwt.claim.sub','99999999-3333-4333-8333-333333333333',true);
do $$ begin
if (select count(*) from public.notices where title like 'notice-regression-%')<>2 then raise exception 'Student audience visibility failed'; end if;
if exists(select 1 from public.notices where title='notice-regression-faculty') then raise exception 'Student saw faculty notice'; end if;
begin
insert into public.notices(title,content,author_id,target_role) values ('invalid','Test','99999999-3333-4333-8333-333333333333','all');
raise exception 'Student can publish';
exception when insufficient_privilege then null; end;
update public.notices set content='Forbidden' where title='notice-regression-students';
if found then raise exception 'Student can edit'; end if;
delete from public.notices where title='notice-regression-students';
if found then raise exception 'Student can delete'; end if;
end $$;
select set_config('request.jwt.claim.sub','99999999-1111-4111-8111-111111111111',true);
do $$ begin
if (select count(*) from public.notices where title like 'notice-regression-%')<>3 then raise exception 'Admin cannot manage all notices'; end if;
end $$;
rollback;
select 'PASS: notice audiences, faculty ownership, student read-only, admin oversight; fixtures rolled back' as result;
