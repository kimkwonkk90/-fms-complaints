# 🚀 Vercel 배포 가이드 (회사 동료들과 공유하기)

이 문서대로 따라 하면 인터넷 주소(예: `https://fms-xxxx.vercel.app`)가 생기고,
동료들이 그 주소로 접속해 **같은 민원 데이터를 함께** 보고 접수할 수 있습니다.

---

## 📦 무엇이 추가되었나

기존 화면(HTML) 코드는 **한 줄도 바꾸지 않았습니다.** 대신 데이터 저장용 백엔드를 추가했습니다.

| 파일 | 역할 |
|------|------|
| `vercel.json` | `/tables/...` 요청을 서버리스 함수로 연결 |
| `api/tables/complaints/index.js` | 민원 목록 조회 / 접수(POST) |
| `api/tables/complaints/[id].js` | 민원 단건 조회 / 수정(PATCH) / 삭제 |
| `lib/store.js` | 공유 데이터베이스(KV) 읽기/쓰기 |
| `package.json` | 의존성(`@vercel/kv`) 선언 |

데이터는 **Vercel KV (Upstash Redis)** 라는 무료 공유 데이터베이스에 저장됩니다.

---

## 🟢 배포 순서

### 1단계 — Vercel 계정 만들기
1. https://vercel.com 접속 → **Sign Up** (회사 GitHub 계정 또는 이메일로 가입)

### 2단계 — 프로젝트 올리기 (두 방법 중 택1)

**방법 A. Vercel CLI (가장 빠름, 추천)**

PowerShell에서 이 폴더 안에서 실행:
```powershell
# 1) Vercel CLI 설치 (최초 1회, Node.js 필요)
npm i -g vercel

# 2) 로그인 (브라우저가 열립니다)
vercel login

# 3) 배포 — 질문이 나오면 대부분 Enter로 진행
vercel
```
> Node.js가 없다면 https://nodejs.org 에서 LTS 버전을 먼저 설치하세요.

**방법 B. GitHub 연동 (자동 재배포까지 원할 때)**
1. 이 폴더를 GitHub 저장소로 push
2. Vercel 대시보드 → **Add New → Project** → 해당 저장소 **Import**

### 3단계 — 공유 데이터베이스(KV) 연결 ⭐ 가장 중요
1. Vercel 대시보드 → 방금 만든 프로젝트 클릭
2. 상단 **Storage** 탭 → **Create Database**
3. **KV (Redis / Upstash)** 선택 → 이름 입력 → 생성
4. 만든 DB 화면에서 **Connect Project** → 이 프로젝트 선택해 연결
   - 연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 등의 환경변수가 **자동으로** 프로젝트에 추가됩니다.

### 4단계 — 다시 배포 (환경변수 적용)
환경변수는 다음 배포부터 적용됩니다. 한 번 더 배포하세요:
```powershell
vercel --prod
```
(방법 B(GitHub)라면 대시보드 **Deployments → Redeploy**)

### 5단계 — 동료에게 주소 공유 🎉
- 배포 완료 후 나오는 `https://...vercel.app` 주소를 동료에게 전달
- 관리자 페이지: `https://...vercel.app/admin-login.html`

---

## 🔑 관리자 계정 (코드에 내장)

| 아이디 | 비밀번호 | 권한 |
|--------|----------|------|
| admin | admin1234 | 슈퍼관리자 |
| manager1 | manager1234 | 담당자 |
| manager2 | manager1234 | 담당자 |

> ⚠️ 실제 사내 운영 시에는 `admin-login.html` 안의 비밀번호를 꼭 바꾸세요.

---

## ⚠️ 알아둘 점 / 제한사항

- **사진 첨부 용량**: 사진은 글자 데이터(base64)로 변환돼 민원과 함께 저장됩니다.
  큰 사진을 여러 장 올리면 요청 용량 제한(서버리스 약 4.5MB)에 걸려 접수가 실패할 수 있습니다.
  → 사진은 작게(또는 1~2장) 올리는 것을 권장합니다. 대용량이 꼭 필요하면 추후 **Vercel Blob** 연동으로 개선 가능합니다.
- **로그인 보안**: 현재 로그인은 화면 코드에 비밀번호가 들어있는 간이 방식입니다(사내 도구 수준). 보안 강화가 필요하면 알려주세요.
- **무료 한도**: Vercel/KV 무료 플랜은 소규모 사내 사용에 충분합니다.

---

## 💻 로컬에서 먼저 테스트하려면 (선택)

```powershell
npm i -g vercel
vercel dev
```
→ `http://localhost:3000` 에서 확인. (KV 연결을 위해 `vercel link` 후 `vercel env pull` 필요)
