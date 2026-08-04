// =====================================================================
// supabase-config.js — Supabase 프로젝트 연결 정보
// Supabase 대시보드 > Project Settings > Data API / API Keys 에서 복사해 넣으세요.
//   - SUPABASE_URL      : Project URL              (예: https://abcd1234.supabase.co)
//   - SUPABASE_ANON_KEY : publishable / anon key   (공개돼도 RLS 로 보호됨)
// 이 키는 공개 키이므로 프런트엔드에 노출돼도 안전합니다(쓰기/읽기는 RLS 가 통제).
// =====================================================================
window.SUPABASE_URL = 'https://mxzrvmcbtpaovsemapdj.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_JBcfmDwgtQwZTinETyFTTQ_nBKWh_04';

// 민원 첨부사진을 올릴 Storage 버킷 이름 (supabase_setup.sql 과 동일해야 함)
// ※ 아래 self-hosted storage 로 옮긴 뒤에는 실제 업로드에 쓰이지 않지만,
//   db.js 의 fallback 값으로 남겨둡니다.
window.SUPABASE_PHOTO_BUCKET = 'complaint-photos';

// =====================================================================
// Self-hosted Storage (사진 전용) 연결 정보
// 구조: DB/Auth 는 위 클라우드 Supabase 그대로 사용하고, 사진 파일만
//       별도의 self-hosted Supabase Storage 인스턴스에 저장합니다.
//   - STORAGE_URL      : self-hosted Supabase 프로젝트 URL
//   - STORAGE_ANON_KEY : 해당 인스턴스의 anon key (RLS 로 보호되는 공개 키)
//   - STORAGE_BUCKET   : 버킷 이름 (다른 프로젝트와 공유하는 버킷이라
//                         업로드 경로 앞에 'complaint-photos/' 를 붙여 구분)
// =====================================================================
window.STORAGE_URL = 'https://storage-seegene.cloud';
window.STORAGE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg1NTY5NjE2LCJleHAiOjI0MTYyODk2MTZ9.hB_j3EuUjkL06iFXBs8pRcWEHNVbyzq5hxa5OlpAmLo';
window.STORAGE_BUCKET = 'storage';
