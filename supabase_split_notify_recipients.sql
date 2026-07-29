-- =====================================================================
-- 메일 발송 대상 테이블 분리 (일회성 마이그레이션)
-- 씨젠아트홀 행사신청 / 시설관리 민원 시스템이 같은 Supabase 프로젝트를
-- 공유하면서 notify_recipients 테이블 하나를 두 시스템이 같이 쓰고 있었음
-- (한쪽에서 등록한 이메일이 다른 쪽 알림도 받는 문제). 시스템별 전용 테이블로
-- 분리한다.
-- 사용법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run (딱 한 번만 실행).
-- =====================================================================

-- 1) 시설관리 민원 시스템 전용 테이블 (created_at/updated_at 은 epoch ms bigint)
create table if not exists public.fms_notify_recipients (
  id          bigint generated always as identity primary key,
  name        text,
  department  text,
  email       text,
  created_at  bigint default (extract(epoch from now()) * 1000)::bigint,
  updated_at  bigint default (extract(epoch from now()) * 1000)::bigint
);
alter table public.fms_notify_recipients enable row level security;

drop policy if exists "auth can read fms_notify_recipients" on public.fms_notify_recipients;
create policy "auth can read fms_notify_recipients"
  on public.fms_notify_recipients for select to authenticated using (true);
drop policy if exists "auth can insert fms_notify_recipients" on public.fms_notify_recipients;
create policy "auth can insert fms_notify_recipients"
  on public.fms_notify_recipients for insert to authenticated with check (true);
drop policy if exists "auth can update fms_notify_recipients" on public.fms_notify_recipients;
create policy "auth can update fms_notify_recipients"
  on public.fms_notify_recipients for update to authenticated using (true) with check (true);
drop policy if exists "auth can delete fms_notify_recipients" on public.fms_notify_recipients;
create policy "auth can delete fms_notify_recipients"
  on public.fms_notify_recipients for delete to authenticated using (true);

-- 2) 씨젠아트홀 행사신청 전용 테이블 (created_at 은 timestamptz)
create table if not exists public.arthall_notify_recipients (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text,
  department  text,
  email       text
);
alter table public.arthall_notify_recipients enable row level security;

drop policy if exists "auth can read arthall_notify_recipients" on public.arthall_notify_recipients;
create policy "auth can read arthall_notify_recipients"
  on public.arthall_notify_recipients for select to authenticated using (true);
drop policy if exists "auth can insert arthall_notify_recipients" on public.arthall_notify_recipients;
create policy "auth can insert arthall_notify_recipients"
  on public.arthall_notify_recipients for insert to authenticated with check (true);
drop policy if exists "auth can update arthall_notify_recipients" on public.arthall_notify_recipients;
create policy "auth can update arthall_notify_recipients"
  on public.arthall_notify_recipients for update to authenticated using (true) with check (true);
drop policy if exists "auth can delete arthall_notify_recipients" on public.arthall_notify_recipients;
create policy "auth can delete arthall_notify_recipients"
  on public.arthall_notify_recipients for delete to authenticated using (true);

-- 3) 기존 공유 테이블(notify_recipients)의 데이터는 지금까지 시설관리 쪽에서
--    테스트하며 등록한 것들이므로 시설관리 전용 테이블로 옮긴다.
--    (행사신청 쪽은 아직 실사용 등록 전이라 빈 테이블로 새로 시작)
insert into public.fms_notify_recipients (name, department, email)
select name, department, email from public.notify_recipients;

-- 4) 더 이상 어느 앱 코드도 참조하지 않는 기존 공유 테이블 삭제
drop table if exists public.notify_recipients;
