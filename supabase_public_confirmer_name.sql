-- =====================================================================
-- 등록자 조치 완료 확인자 성명을 접수 조회 화면에도 공개
-- 사용법: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 [Run].
-- =====================================================================

-- 공개 현황 뷰 끝에 requester_confirmed_by 추가
--    ※ create or replace view 는 기존 컬럼 순서를 바꿀 수 없으므로 반드시 끝에 추가.
create or replace view public.public_complaints as
  select id, ticket_number, type, category, title, description,
         location, floor, department, priority, status,
         photo_urls, result_photo_urls, result_note, assigned_to,
         completed_at, created_at, updated_at, progress_note,
         expected_date, delay_reason, history, requester_confirmed_at,
         requester_confirmed_by
    from public.complaints
   where deleted_at is null;
grant select on public.public_complaints to anon, authenticated;
