# Supabase 전환 가이드 — 시설관리 민원 시스템

기존 Vercel KV(Redis) 백엔드를 **Supabase**(Postgres + Storage + Auth)로 전환했습니다.
민원 첨부사진은 base64 로 DB 에 박지 않고 **Supabase Storage** 에 올린 뒤 공개 URL 만 저장합니다.

## 변경 요약
- 데이터 저장: Vercel KV → **Supabase Postgres** (`complaints` 테이블)
- 사진: base64 data URL → **Supabase Storage `complaint-photos` 버킷** + 공개 URL
- 관리자 로그인: 하드코딩 → **Supabase Auth** (이메일/비밀번호)
- 프런트엔드: `fetch('tables/...')` 호출은 그대로. 새 `db.js` 가 가로채 Supabase REST 로 변환.

## 설정 순서 (한 번만)

### 1. Supabase 프로젝트
1. https://supabase.com 에서 프로젝트 생성.
2. **Project Settings → API** 에서 다음 두 값 복사:
   - `Project URL`
   - `anon` / `publishable` key (공개 키 — RLS 로 보호되므로 노출돼도 안전)

### 2. `supabase-config.js` 채우기
```js
window.SUPABASE_URL = 'https://xxxx.supabase.co';   // 복사한 Project URL
window.SUPABASE_ANON_KEY = 'eyJhbGciOi...';          // 복사한 anon key
```

### 3. DB / 보안 / 스토리지 만들기
`supabase_setup.sql` 전체를 **Supabase 대시보드 → SQL Editor** 에 붙여넣고 **Run**.
- `complaints` 테이블 + 인덱스
- RLS 정책: **접수(INSERT)·조회(SELECT)는 누구나**, **수정/삭제는 로그인한 관리자만**
- `complaint-photos` 공개 버킷 + 업로드/읽기 정책

### 4. 관리자 계정 만들기
1. **Authentication → Users → Add user** 로 이메일/비밀번호 생성 (예: `kk0619@mf.seegene.com`).
2. **Authentication → Sign In / Providers → Email** 에서
   **"Allow new users to sign up" 끄기** (외부 회원가입 차단).
3. `admin-login.html` 에서 그 이메일/비밀번호로 로그인.

### 5. 배포 (Vercel)
정적 사이트라 빌드가 필요 없습니다. 사내망 프록시 환경이면:
```powershell
$env:NODE_OPTIONS = "--use-system-ca"   # 회사 CA 신뢰 (자가서명 인증서 우회)
vercel deploy --prod --yes
```
> `NODE_TLS_REJECT_UNAUTHORIZED=0` 은 보안 위반이므로 사용 금지.

## 동작 방식 (db.js 어댑터)
각 HTML `<head>` 에서 ① supabase-js CDN → ② `supabase-config.js` → ③ `db.js` 순으로 로드됩니다.
`db.js` 가 `window.fetch` 를 감싸 `tables/complaints...` 요청을 Supabase PostgREST 로 변환:
- `GET tables/complaints` → 목록 `{ data:[...] }`
- `GET tables/complaints/<id>` → 단건 객체
- `POST` → `created_at`/`updated_at`(epoch ms) 자동 주입 후 INSERT
- `PATCH`/`DELETE tables/complaints/<id>` → 관리자 토큰으로 수정/삭제
- 로그인 세션이 있으면 사용자 토큰, 없으면 anon 키 사용

사진 업로드는 `submit.html` 제출 시 `window.uploadPhotos()` 가 파일을 Storage 에 올리고
공개 URL 배열을 `photo_urls` 에 담습니다.

## 개인정보 보호 (적용됨 — PII 잠금)
제출자 개인정보를 보호하도록 잠금이 적용되어 있습니다.
- `complaints` 테이블의 **SELECT 는 로그인한 관리자만** 가능 (RLS).
- 공개 페이지(`status.html` / `index.html`)는 **개인정보를 제외한 공개 뷰 `public_complaints`** 만 조회.
  - 뷰 제외 컬럼: `submitter_name`, `submitter_contact`, `submitter_unit`, `admin_memo`(내부 메모).
  - 그래서 공개 현황/상세에는 **제출자명·연락처가 더 이상 노출되지 않습니다.**
- 접수(INSERT)는 여전히 누구나 가능하고, 수정/삭제는 관리자만 가능합니다.

> 다시 공개로 되돌리려면: `supabase_setup.sql` 4) 정책을 `to anon, authenticated` 로 바꾸고
> `status.html`/`index.html` 의 `tables/public_complaints` 를 `tables/complaints` 로 되돌리면 됩니다.

## 정리해도 되는 것 (이제 미사용 — 선택)
Supabase 전환 후 아래는 더 이상 호출되지 않는 죽은 코드입니다. 원하면 직접 삭제하세요:
- `api/tables/complaints/index.js`, `api/tables/complaints/[id].js` (옛 KV API)
- `lib/store.js` (옛 KV 저장소)
- `package.json` 의 `@vercel/kv` 의존성, `.env.local` 의 `KV_*` / `REDIS_*` 변수
- `vercel.json` 의 `/tables/:path*` rewrite (db.js 가 클라이언트에서 가로채므로 불필요)

> 단, `api/*.js` 를 지우기 전에 `package.json` 의 `@vercel/kv` 를 같이 지우면 안 됩니다
> (남아있는 함수가 import 하면 빌드 실패). 둘은 함께 지우세요.
