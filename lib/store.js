// ================================================
//  공유 데이터 저장소 (Vercel KV / Upstash Redis)
//  complaints 데이터를 Redis 해시 한 개("complaints")에
//  { [id]: 민원객체 } 형태로 저장한다.
// ================================================
import { kv } from '@vercel/kv';
import { randomUUID } from 'crypto';

const HASH = 'complaints';

// 전체 목록 (배열)
export async function listComplaints() {
  const map = await kv.hgetall(HASH);
  if (!map) return [];
  return Object.values(map);
}

// 단건 조회
export async function getComplaint(id) {
  return (await kv.hget(HASH, id)) || null;
}

// 생성
export async function createComplaint(body) {
  const now = Date.now();
  const id = randomUUID();
  const item = {
    ...body,
    id,
    created_at: now,
    updated_at: now,
  };
  await kv.hset(HASH, { [id]: item });
  return item;
}

// 수정 (부분 업데이트)
export async function updateComplaint(id, patch) {
  const existing = await getComplaint(id);
  if (!existing) return null;
  const item = { ...existing, ...patch, id, updated_at: Date.now() };
  await kv.hset(HASH, { [id]: item });
  return item;
}

// 삭제
export async function deleteComplaint(id) {
  await kv.hdel(HASH, id);
}
