-- =====================================================================
-- 시설관리 하자/민원 시스템 — self-hosted Storage 설정
-- 사용법: self-hosted Supabase 인스턴스(storage-seegene.cloud)의
--        SQL Editor 에 전체 붙여넣고 [Run].
--
-- 배경: DB/Auth 는 기존 클라우드 Supabase(supabase_setup.sql)를 그대로 쓰고,
--       민원 첨부사진(photo_urls / result_photo_urls)만 이 self-hosted
--       인스턴스의 Storage 로 옮깁니다. 버킷 'storage' 는 씨젠아트홀
--       행사신청 프로젝트와 공유하므로, 이 프로젝트의 파일은 모두
--       'complaint-photos/' 경로 하위에 저장합니다(예: complaint-photos/2026/...).
-- =====================================================================

-- 1) 버킷 준비: public 버킷으로 보장 (이미 생성되어 있어도 안전하게 재실행 가능)
insert into storage.buckets (id, name, public)
values ('storage', 'storage', true)
on conflict (id) do update set public = true;

-- 2) 업로드(INSERT): 누구나 이 버킷에 사진 올리기 가능 (접수자가 첨부)
drop policy if exists "anyone can upload storage objects" on storage.objects;
create policy "anyone can upload storage objects"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'storage');

-- 3) 읽기(SELECT): 공개 버킷이라 공개 URL 로 바로 열람 가능(별도 정책 보강)
drop policy if exists "anyone can read storage objects" on storage.objects;
create policy "anyone can read storage objects"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'storage');

-- 4) 삭제: 로그인한 사용자만 (관리자 계정으로 로그인 시)
drop policy if exists "authenticated can delete storage objects" on storage.objects;
create policy "authenticated can delete storage objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'storage');
