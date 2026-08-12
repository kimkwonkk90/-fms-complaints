-- =====================================================================
-- 처리 중 진행상황 메모 컬럼 추가
-- 사용법: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 [Run].
-- =====================================================================

-- 1) 진행상황 메모 컬럼 추가 -------------------------------------------
--    처리 완료 시의 result_note 와 별개로, "처리 중" 상태일 때 접수자에게
--    보여줄 중간 진행 상황을 담당자가 남기는 용도.
alter table public.complaints add column if not exists progress_note text;

-- 2) 공개 현황 뷰에 진행상황 메모 포함 ----------------------------------
--    status.html 이 이 뷰를 조회해 접수자에게 처리 중 진행상황을 보여준다.
create or replace view public.public_complaints as
  select id, ticket_number, type, category, title, description,
         location, floor, department, priority, status,
         photo_urls, result_photo_urls, result_note, progress_note, assigned_to,
         completed_at, created_at, updated_at
    from public.complaints
   where deleted_at is null;
grant select on public.public_complaints to anon, authenticated;
