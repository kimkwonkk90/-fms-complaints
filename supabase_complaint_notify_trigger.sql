-- =====================================================================
-- 신규 민원/하자 접수 시 알림메일 트리거
-- complaints 테이블에 INSERT 되면 Supabase 가 Vercel 의 /api/notify 를 호출하고,
-- 해당 함수가 회사 SMTP 로 관리자 + notify_recipients 테이블에 등록된 대상
-- 전원에게 알림 메일을 보냅니다.
--
-- 실행 전 확인:
--   1) Vercel 에 환경변수(SMTP_*, NOTIFY_TO, WEBHOOK_SECRET)가 설정되어 있어야 함
--   2) 아래 'x-webhook-secret' 값을 Vercel 의 WEBHOOK_SECRET 과 동일하게 맞출 것
--   3) notify_url 이 실제 배포 도메인인지 확인
--   4) supabase_notify_recipients.sql 을 먼저 실행해 notify_recipients 테이블을 만들 것
-- 사용법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run.
-- =====================================================================

-- pg_net 확장 (HTTP 호출용) — Supabase 에 기본 제공
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_complaint()
returns trigger
language plpgsql
security definer
as $$
declare
  notify_url text := 'https://fms-complaints-gih2.vercel.app/api/notify';
  shared_secret text := 'c8d9b6cdbd239437622fcaf1e0d738a6e7276f4b8790c6a6';
  recipient_emails jsonb;
begin
  select coalesce(jsonb_agg(email), '[]'::jsonb)
    into recipient_emails
    from public.notify_recipients
   where email is not null and trim(email) <> '';

  perform net.http_post(
    url     := notify_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-webhook-secret', shared_secret
               ),
    body    := jsonb_build_object(
                 'table',      tg_table_name,
                 'record',     row_to_json(new),
                 'recipients', recipient_emails
               )
  );
  return new;
exception when others then
  -- 메일 호출이 실패해도 접수 저장 자체는 막지 않음
  raise warning 'notify_new_complaint 실패: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists trg_notify_complaint on public.complaints;
create trigger trg_notify_complaint
  after insert on public.complaints
  for each row execute function public.notify_new_complaint();
