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
window.SUPABASE_PHOTO_BUCKET = 'complaint-photos';
