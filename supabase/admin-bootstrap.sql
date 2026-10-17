create table private.bootstrap_admin(email text primary key, claimed_by uuid unique references auth.users on delete restrict);
alter table private.bootstrap_admin enable row level security;
insert into private.bootstrap_admin(email) values('pankajsingha303@gmail.com');
create function private.claim_bootstrap_admin() returns trigger language plpgsql security definer set search_path='' as $$
declare claimed uuid;
begin
 if new.email_confirmed_at is null then return new; end if;
 update private.bootstrap_admin set claimed_by=new.id where lower(email)=lower(new.email) and claimed_by is null returning claimed_by into claimed;
 if claimed is not null then update public.profiles set role='admin' where id=claimed; end if;
 return new;
end $$;
revoke all on function private.claim_bootstrap_admin() from public,anon,authenticated;
create trigger zz_claim_bootstrap_admin after insert or update of email_confirmed_at on auth.users for each row execute function private.claim_bootstrap_admin();
update private.bootstrap_admin b set claimed_by=u.id from auth.users u where lower(u.email)=lower(b.email) and u.email_confirmed_at is not null and b.claimed_by is null;
update public.profiles p set role='admin' from private.bootstrap_admin b where b.claimed_by=p.id;
