-- =====================================================================
-- 메일 발송 대상 테이블 (시설관리 민원 시스템 전용)
-- 관리자 페이지("메일 발송 대상" 페이지)에서 등록한 이메일 목록.
-- api/notify.js 가 접수 직후 이 테이블을 서버에서 직접 조회해(서비스 롤 키)
-- NOTIFY_TO 와 합쳐서 발송합니다.
--
-- 이 프로젝트는 씨젠아트홀 행사신청과 같은 Supabase 프로젝트를 공유하므로,
-- 테이블명을 fms_notify_recipients 로 이 시스템 전용임을 명시합니다
-- (씨젠아트홀 쪽은 arthall_notify_recipients — supabase_split_notify_recipients.sql 참고).
--
-- created_at / updated_at 은 이 프로젝트의 db.js 관례에 맞춰 epoch ms(bigint)
-- 로 통일합니다 (db.js 가 POST/PATCH 때마다 이 두 값을 Date.now() 로 채워 보냄
-- — complaints 테이블과 동일한 패턴, supabase_setup.sql 참고).
--
-- 사용법: 이미 supabase_split_notify_recipients.sql 을 실행했다면 이 파일은
-- 다시 실행할 필요 없음 (동일 테이블을 처음부터 다시 만들 때 참고용).
-- =====================================================================

create table if not exists public.fms_notify_recipients (
  id          bigint generated always as identity primary key,
  name        text,
  department  text,
  email       text,
  created_at  bigint default (extract(epoch from now()) * 1000)::bigint,
  updated_at  bigint default (extract(epoch from now()) * 1000)::bigint
);

alter table public.fms_notify_recipients enable row level security;

-- 조회/등록/수정/삭제: 로그인한 관리자만 (complaints 테이블과 동일한 정책)
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
