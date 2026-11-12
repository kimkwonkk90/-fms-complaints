-- =====================================================================
-- 메일 발송 대상 분류 추가 (일회성 마이그레이션)
-- 관리자 "메일 발송 대상" 화면을 시설관리실 / FM사 두 표로 나눠 관리하기 위해
-- fms_notify_recipients 에 category 컬럼을 추가한다.
-- 발송 대상 자체는 바뀌지 않음 (api/notify.js 는 분류와 관계없이 전체에게 발송).
-- 사용법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run (딱 한 번만 실행).
-- =====================================================================

alter table public.fms_notify_recipients
  add column if not exists category text not null default 'FM사';

-- 기존 등록자 중 시설관리실 인원 지정 (나머지는 기본값 FM사)
update public.fms_notify_recipients
   set category = '시설관리실'
 where trim(name) in ('임원식', '김진규', '고영무', '김권');

-- 확인용: 분류별 인원
select category, name, email from public.fms_notify_recipients order by category, id;
