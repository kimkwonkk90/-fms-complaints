-- =====================================================================
-- 민원 소프트 삭제(삭제됨 보관) 지원
-- 사용법: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 [Run].
-- =====================================================================

-- 1) 삭제 시각 컬럼 추가 (null이면 정상, 값이 있으면 삭제됨) ------------
alter table public.complaints add column if not exists deleted_at bigint;
create index if not exists idx_complaints_deleted_at on public.complaints (deleted_at);

-- 2) 공개 현황 뷰에서 삭제된 민원 제외 ---------------------------------
--    status.html / index.html 은 이 뷰만 조회하므로, 삭제된 민원은
--    관리자 화면(삭제됨 목록)에서만 보이고 공개 화면에는 노출되지 않는다.
create or replace view public.public_complaints as
  select id, ticket_number, type, category, title, description,
         location, floor, department, priority, status,
         photo_urls, result_photo_urls, result_note, assigned_to,
         completed_at, created_at, updated_at
    from public.complaints
   where deleted_at is null;
grant select on public.public_complaints to anon, authenticated;
