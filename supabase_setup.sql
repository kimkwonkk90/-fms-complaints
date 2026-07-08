-- =====================================================================
-- 시설관리 하자/민원 시스템 — Supabase 스키마 & 보안 정책 & 사진 스토리지
-- 사용법: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 [Run].
-- =====================================================================

-- 1) 민원 테이블 ------------------------------------------------------
--    id 는 uuid(문자열) — 기존 프런트엔드가 id 를 문자열로 다루므로 그대로 호환.
--    created_at / updated_at 은 epoch ms(bigint) — 기존 정렬/날짜 로직 그대로 호환.
create table if not exists public.complaints (
  id                 uuid primary key default gen_random_uuid(),
  ticket_number      text,
  type               text,                       -- defect | complaint
  category           text,                       -- electric | equipment | cleaning | construction | other
  title              text,
  description        text,
  location           text,
  floor              text,
  department         text,
  submitter_name     text,
  submitter_contact  text,
  submitter_unit     text,
  priority           text default 'medium',      -- low | medium | high | urgent
  status             text not null default 'received', -- received | in_progress | completed | rejected
  photo_urls         jsonb default '[]'::jsonb,   -- 접수 사진 공개 URL 배열
  result_photo_urls  jsonb default '[]'::jsonb,   -- 처리결과 사진(선택)
  assigned_to        text,
  result_note        text,
  admin_memo         text,                        -- 내부용(접수자 미공개)
  completed_at       text,                        -- ISO 문자열(관리자 입력)
  created_at         bigint default (extract(epoch from now()) * 1000)::bigint,
  updated_at         bigint default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists idx_complaints_created_at on public.complaints (created_at desc);
create index if not exists idx_complaints_status     on public.complaints (status);

-- 2) RLS 활성화 ------------------------------------------------------
alter table public.complaints enable row level security;

-- 3) INSERT: 누구나(anon) 민원 접수 가능 -----------------------------
drop policy if exists "anyone can insert complaints" on public.complaints;
create policy "anyone can insert complaints"
  on public.complaints for insert
  to anon, authenticated with check (true);

-- 4) SELECT: 로그인한 관리자만 전체 민원(개인정보 포함) 조회 -----------
--    공개 현황 페이지(status.html / index.html)는 아래 8) 공개 뷰를 조회한다.
drop policy if exists "anyone can read complaints" on public.complaints;
drop policy if exists "admin can read complaints" on public.complaints;
create policy "admin can read complaints"
  on public.complaints for select
  to authenticated using (true);

-- 5) UPDATE / DELETE: 로그인한 관리자만 ------------------------------
drop policy if exists "admin can update complaints" on public.complaints;
create policy "admin can update complaints"
  on public.complaints for update
  to authenticated using (true) with check (true);

drop policy if exists "admin can delete complaints" on public.complaints;
create policy "admin can delete complaints"
  on public.complaints for delete
  to authenticated using (true);

-- =====================================================================
-- 6) 사진 스토리지 버킷 (Supabase Storage) ---------------------------
--    공개 버킷: 접수 사진을 <img src> 로 바로 표시 (현재 동작과 동일).
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do update set public = true;

-- 업로드(INSERT): 누구나 이 버킷에 사진 올리기 가능 (접수자가 첨부)
drop policy if exists "anyone can upload complaint photos" on storage.objects;
create policy "anyone can upload complaint photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'complaint-photos');

-- 읽기(SELECT): 공개 버킷이라 공개 URL 로 바로 열람 가능(별도 정책 보강)
drop policy if exists "anyone can read complaint photos" on storage.objects;
create policy "anyone can read complaint photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'complaint-photos');

-- 삭제: 관리자만 (선택)
drop policy if exists "admin can delete complaint photos" on storage.objects;
create policy "admin can delete complaint photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'complaint-photos');

-- =====================================================================
-- 7) 관리자 계정 만들기
--    대시보드 > Authentication > Users > "Add user" 로 이메일/비밀번호 생성.
--    외부 가입 차단: Authentication > Sign In / Providers > Email 에서
--      "Allow new users to sign up" 끄기.
-- =====================================================================

-- =====================================================================
-- 8) 공개 현황 뷰 (개인정보 제외) ------------------------------------
--    status.html / index.html 이 fetch('tables/public_complaints') 로 조회.
--    제외 컬럼(개인정보/내부용): submitter_name, submitter_contact,
--                                submitter_unit, admin_memo.
--    뷰는 SECURITY DEFINER(소유자 권한)로 동작해 base 테이블 RLS 를 우회하므로
--    위 4) 에서 SELECT 를 관리자 전용으로 잠가도 공개 페이지는 정상 동작한다.
--    (안전한 컬럼만 노출하므로 PII 는 새어나가지 않는다.)
-- =====================================================================
create or replace view public.public_complaints as
  select id, ticket_number, type, category, title, description,
         location, floor, department, priority, status,
         photo_urls, result_photo_urls, result_note, assigned_to,
         completed_at, created_at, updated_at
    from public.complaints;
grant select on public.public_complaints to anon, authenticated;
