// =====================================================================
// /api/storage-delete  —  self-hosted Storage 파일 영구 삭제 (Vercel Serverless Function)
// admin-detail.html 의 "영구 삭제" 버튼이 DB 행을 지우기 전에 호출해,
// self-hosted Supabase Storage(storage-seegene.cloud)에 있는 사진 파일을
// 실제로 삭제합니다.
//
// self-hosted storage 의 DELETE 정책은 authenticated role 에게만 허용되어
// 있는데, 이 프로젝트의 관리자 로그인은 클라우드 Supabase 프로젝트
// (mxzrvmcbtpaovsemapdj.supabase.co) 의 Auth 이고 self-hosted storage 와는
// 별개의 Auth 시스템이라 브라우저에서 직접 authenticated 가 될 수 없습니다.
// 그래서 이 서버 함수가 service_role key 로 대신 삭제를 수행합니다.
//
// 필요한 Vercel 환경변수 (Project Settings > Environment Variables):
//   SELFHOSTED_STORAGE_SERVICE_ROLE_KEY   self-hosted storage(storage-seegene.cloud)의 service_role key
//
// 요청: POST { paths: string[] }  — 버킷('storage') 내부 객체 경로 배열
//   예: { "paths": ["complaint-photos/2026/xxx.png", "complaint-photos/2026/yyy.png"] }
// 인증: 헤더 Authorization: Bearer <클라우드 Supabase 관리자 세션 access_token>
// 응답: 성공 { ok: true } / 실패 { error: string, detail?: string }
// =====================================================================
import { createClient } from '@supabase/supabase-js';

const CLOUD_SUPABASE_URL = 'https://mxzrvmcbtpaovsemapdj.supabase.co';
const CLOUD_SUPABASE_ANON_KEY = 'sb_publishable_JBcfmDwgtQwZTinETyFTTQ_nBKWh_04';
const SELFHOSTED_STORAGE_URL = 'https://storage-seegene.cloud';
const SELFHOSTED_STORAGE_BUCKET = 'storage';

// Authorization 헤더의 토큰이 클라우드 Supabase 의 유효한 로그인 세션인지 확인
async function isAuthenticatedAdmin(authHeader) {
  if (!authHeader || authHeader.indexOf('Bearer ') !== 0) return false;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return false;
  try {
    const res = await fetch(CLOUD_SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: CLOUD_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
    });
    return res.ok;
  } catch (e) {
    console.error('[storage-delete] 인증 확인 실패:', e && e.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const authed = await isAuthenticatedAdmin(req.headers.authorization);
  if (!authed) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const paths = Array.isArray(body.paths) ? body.paths.filter(function (p) { return typeof p === 'string' && p; }) : [];

  if (paths.length === 0) {
    res.status(400).json({ error: 'paths 가 비어있습니다.' });
    return;
  }

  if (!process.env.SELFHOSTED_STORAGE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'SELFHOSTED_STORAGE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.' });
    return;
  }

  try {
    const sb = createClient(SELFHOSTED_STORAGE_URL, process.env.SELFHOSTED_STORAGE_SERVICE_ROLE_KEY);
    const { error } = await sb.storage.from(SELFHOSTED_STORAGE_BUCKET).remove(paths);
    if (error) {
      console.error('[storage-delete] 삭제 실패:', error.message);
      res.status(500).json({ error: 'delete failed', detail: error.message });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[storage-delete] 삭제 실패:', e && e.message);
    res.status(500).json({ error: 'delete failed', detail: String((e && e.message) || e) });
  }
}
