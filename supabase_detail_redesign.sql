-- =====================================================================
-- 상세 화면 개편: 처리 진행정보 · 주요 처리 이력 · 등록자 조치 완료 확인
-- 사용법: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 [Run].
-- =====================================================================

-- 1) 신규 컬럼 ----------------------------------------------------------
--    expected_date          : 예상 완료일 (YYYY-MM-DD)
--    delay_reason           : 처리 지연 사유
--    history                : 주요 처리 이력 [{ "date": "YYYY-MM-DD", "text": "..." }]
--    requester_confirmed_at : 등록자 조치 완료 확인 시각 (epoch ms)
--    requester_confirmed_by : 확인자 성명 (관리자 화면에만 표시, 공개 뷰 제외)
alter table public.complaints add column if not exists expected_date text;
alter table public.complaints add column if not exists delay_reason text;
alter table public.complaints add column if not exists history jsonb default '[]'::jsonb;
alter table public.complaints add column if not exists requester_confirmed_at bigint;
alter table public.complaints add column if not exists requester_confirmed_by text;

-- 2) 기존 진행상황 메모(progress_note)를 처리 이력으로 옮김 --------------
--    progress_note 는 더 이상 화면에서 쓰지 않는다. 컬럼/데이터는 그대로 둔다.
update public.complaints
   set history = jsonb_build_array(jsonb_build_object(
         'date', to_char(to_timestamp(updated_at / 1000.0) at time zone 'Asia/Seoul', 'YYYY-MM-DD'),
         'text', progress_note))
 where coalesce(trim(progress_note), '') <> ''
   and coalesce(jsonb_array_length(history), 0) = 0;

-- 3) 공개 현황 뷰에 신규 컬럼 추가 --------------------------------------
--    ※ create or replace view 는 기존 컬럼 순서를 바꿀 수 없으므로 반드시 끝에 추가.
create or replace view public.public_complaints as
  select id, ticket_number, type, category, title, description,
         location, floor, department, priority, status,
         photo_urls, result_photo_urls, result_note, assigned_to,
         completed_at, created_at, updated_at, progress_note,
         expected_date, delay_reason, history, requester_confirmed_at
    from public.complaints
   where deleted_at is null;
grant select on public.public_complaints to anon, authenticated;

-- 4) 등록자 조치 완료 확인 함수 -----------------------------------------
--    공개 사용자(anon)는 complaints 를 직접 수정할 수 없으므로, 처리 완료 상태이고
--    아직 확인되지 않은 건에 한해 확인 시각/성명만 기록하는 함수를 연다.
create or replace function public.confirm_complaint_done(p_id uuid, p_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(p_name), '') = '' then return false; end if;
  update public.complaints
     set requester_confirmed_at = (extract(epoch from now()) * 1000)::bigint,
         requester_confirmed_by = left(trim(p_name), 30)
   where id = p_id
     and status = 'completed'
     and requester_confirmed_at is null
     and deleted_at is null;
  return found;
end;
$$;
revoke all on function public.confirm_complaint_done(uuid, text) from public;
grant execute on function public.confirm_complaint_done(uuid, text) to anon, authenticated;
