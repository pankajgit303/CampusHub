begin;
insert into auth.users(id,email,raw_user_meta_data) values
('99999999-1111-4111-8111-111111111111','regression-admin@campushub.invalid','{}'),
('99999999-2222-4222-8222-222222222222','regression-faculty@campushub.invalid','{}');
update public.profiles set role='admin' where id='99999999-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub','99999999-1111-4111-8111-111111111111',true);
set local role authenticated;
update public.profiles set role='faculty',department_id=(select id from public.departments limit 1),semester_id=null where id='99999999-2222-4222-8222-222222222222';
do $$ begin
if not exists(select 1 from public.profiles where id='99999999-2222-4222-8222-222222222222' and role='faculty' and department_id is not null) then raise exception 'Faculty promotion failed'; end if;
if not exists(select 1 from public.audit_logs where entity_id='99999999-2222-4222-8222-222222222222' and action='UPDATE') then raise exception 'Audit missing'; end if;
end $$;
select 'PASS: authenticated administrator faculty promotion and audit log' as result;
rollback;
