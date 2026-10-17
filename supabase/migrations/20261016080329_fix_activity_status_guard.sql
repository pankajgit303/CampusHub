CREATE OR REPLACE FUNCTION private.activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rowdata jsonb:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end; target uuid; subj uuid;
begin
 if auth.uid() is null then return coalesce(new,old); end if;
 if private.current_role() in ('admin','faculty') then
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),tg_op,tg_table_name,(rowdata->>'id')::uuid,jsonb_build_object('fields',array(select jsonb_object_keys(rowdata))));
 end if;
 if tg_table_name='complaints' and tg_op in ('INSERT','UPDATE') then
 insert into public.complaint_updates(complaint_id,status,response) values(new.id,new.status,new.admin_response);
 if tg_op='UPDATE' then insert into public.notifications(user_id,title,message,type) values(new.student_id,'Complaint updated',new.title||': '||replace(new.status,'_',' '),'complaint'); end if;
 elsif tg_table_name='assignment_submissions' and tg_op='UPDATE' then
 if new.status='graded' then
 insert into public.notifications(user_id,title,message,type) values(new.student_id,'Assignment graded',coalesce(new.feedback,'Your grade is available.'),'assignment');
 end if;
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
end $function$
