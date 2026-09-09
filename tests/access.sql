-- Run against a test database or in this rollback-only transaction. No emails are sent.
begin;
create temporary table diagnostic_qa_ids as select gen_random_uuid() ua, gen_random_uuid() ub,
  gen_random_uuid() ca, gen_random_uuid() cb, gen_random_uuid() da, gen_random_uuid() db;
grant select on diagnostic_qa_ids to authenticated;
insert into auth.users(id,email) select ua,'qa-access-a@example.invalid' from diagnostic_qa_ids
union all select ub,'qa-access-b@example.invalid' from diagnostic_qa_ids;
insert into public.digital_diagnostic_sessions(id,secret_hash,email,contact,state)
select da,'qa-only','qa-access-a@example.invalid','{}'::jsonb,'{}'::jsonb from diagnostic_qa_ids
union all select db,'qa-only','qa-access-b@example.invalid','{}'::jsonb,'{}'::jsonb from diagnostic_qa_ids;
insert into public.digital_diagnostics(id,email,contact,result,model_version,context)
select da,'  QA-ACCESS-A@example.invalid  ','{}'::jsonb,'{}'::jsonb,'qa','qa' from diagnostic_qa_ids
union all select db,'qa-access-b@example.invalid','{}'::jsonb,'{}'::jsonb,'qa','qa' from diagnostic_qa_ids;
insert into public.clients(id,first_name,last_name,email,phone,company_name,portal_access,status)
select ca,'QA','A','qa-access-a@example.invalid','3000000000','QA rollback A',true,'activo'::public.client_status from diagnostic_qa_ids
union all select cb,'QA','B','qa-access-b@example.invalid','3000000001','QA rollback B',true,'activo'::public.client_status from diagnostic_qa_ids;
insert into public.profiles(id,client_id) select ua,ca from diagnostic_qa_ids
union all select ub,cb from diagnostic_qa_ids;
do $$ begin
  if (select count(*) from public.digital_diagnostics d join diagnostic_qa_ids q on d.id=q.da or d.id=q.db where d.client_id is not null) <> 2 then
    raise exception 'Email normalization / late client association failed';
  end if;
end $$;
select set_config('request.jwt.claim.sub',(select ua::text from diagnostic_qa_ids),true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.digital_diagnostics d join diagnostic_qa_ids q on d.id=q.da or d.id=q.db) <> 1 then
    raise exception 'RLS leaked another client or hid own report';
  end if;
  if has_table_privilege(current_user,'public.digital_diagnostics','insert') then raise exception 'Browser can insert forged report'; end if;
  if has_table_privilege(current_user,'public.digital_diagnostic_sessions','select') then raise exception 'Browser can read session tokens'; end if;
end $$;
reset role;
update public.clients set portal_access=false where id=(select ca from diagnostic_qa_ids);
set local role authenticated;
do $$ begin
  if (select count(*) from public.digital_diagnostics d join diagnostic_qa_ids q on d.id=q.da or d.id=q.db) <> 0 then
    raise exception 'Revoked client retains access';
  end if;
end $$;
reset role;
update public.profiles set role='admin',client_id=null where id=(select ua from diagnostic_qa_ids);
set local role authenticated;
do $$ begin
  if (select count(*) from public.digital_diagnostics d join diagnostic_qa_ids q on d.id=q.da or d.id=q.db) <> 2 then
    raise exception 'Admin cannot read reports';
  end if;
end $$;
reset role;
do $$ begin
  if not public.diagnostic_consume_quota('qa-rollback-budget',1) then raise exception 'First quota rejected'; end if;
  if public.diagnostic_consume_quota('qa-rollback-budget',1) then raise exception 'Quota exceeded'; end if;
end $$;
rollback;
select 'PASS: email association, client isolation, revoked access, admin read, write denial, quota; fixtures rolled back' as result;
