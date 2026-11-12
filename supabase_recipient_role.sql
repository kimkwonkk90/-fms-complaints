-- =====================================================================
-- 메일 발송 대상 권한 (슈퍼관리자 / 일반관리자) — 일회성 마이그레이션
-- - fms_notify_recipients 에 role 컬럼 추가 ('super' | 'general').
-- - 관리자 페이지에 로그인한 메일주소가 이 표에서 role = 'super' 이면 슈퍼관리자.
--   슈퍼관리자만 메일 발송 대상 화면을 보고(메뉴 노출) 추가·수정·삭제할 수 있다.
--   그 외 관리자(일반관리자)는 메뉴가 안 보이고 DB에서도 조회가 막힌다.
-- - 알림 메일 발송(api/notify.js)은 서비스 롤 키로 조회하므로 영향 없음.
-- 사용법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run (딱 한 번만 실행).
-- =====================================================================

alter table public.fms_notify_recipients
  add column if not exists role text not null default 'general'
  check (role in ('super', 'general'));

-- 지금 로그인한 사람이 슈퍼관리자인지 (정책 안에서 같은 테이블을 다시 조회하면
-- RLS 무한 재귀가 나므로 security definer 함수로 확인)
create or replace function public.fms_is_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fms_notify_recipients
     where role = 'super'
       and lower(trim(email)) = lower(auth.jwt() ->> 'email')
  );
$$;
grant execute on function public.fms_is_super() to authenticated;

-- 조회/등록/수정/삭제 모두 슈퍼관리자만
drop policy if exists "auth can read fms_notify_recipients" on public.fms_notify_recipients;
drop policy if exists "super can read fms_notify_recipients" on public.fms_notify_recipients;
create policy "super can read fms_notify_recipients"
  on public.fms_notify_recipients for select to authenticated using (public.fms_is_super());

drop policy if exists "auth can insert fms_notify_recipients" on public.fms_notify_recipients;
drop policy if exists "super can insert fms_notify_recipients" on public.fms_notify_recipients;
create policy "super can insert fms_notify_recipients"
  on public.fms_notify_recipients for insert to authenticated with check (public.fms_is_super());

drop policy if exists "auth can update fms_notify_recipients" on public.fms_notify_recipients;
drop policy if exists "super can update fms_notify_recipients" on public.fms_notify_recipients;
create policy "super can update fms_notify_recipients"
  on public.fms_notify_recipients for update to authenticated
  using (public.fms_is_super()) with check (public.fms_is_super());

drop policy if exists "auth can delete fms_notify_recipients" on public.fms_notify_recipients;
drop policy if exists "super can delete fms_notify_recipients" on public.fms_notify_recipients;
create policy "super can delete fms_notify_recipients"
  on public.fms_notify_recipients for delete to authenticated using (public.fms_is_super());

-- 첫 슈퍼관리자: 김권 (관리자 로그인 메일과 같은 주소의 행)
update public.fms_notify_recipients
   set role = 'super'
 where lower(trim(email)) in (
   select lower(email) from auth.users where lower(split_part(email, '@', 1)) = 'kk0619'
 );

-- 확인용: 슈퍼관리자로 지정된 사람 (김권 1명이 나와야 정상)
select name, email, role from public.fms_notify_recipients where role = 'super';
