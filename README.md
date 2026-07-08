# 🏢 FMS 시설관리 민원시스템

> 하자·민원 접수부터 처리 완료까지 통합 관리하는 풀스크린 웹 포털

---

## ✅ 완성된 기능

### 🌐 사용자 페이지
| 페이지 | 파일 | 설명 |
|--------|------|------|
| 메인 홈 | `index.html` | 풀스크린 히어로, 실시간 현황, 카테고리, 4단계 처리 안내 |
| 민원 접수 | `submit.html` | 4단계 폼 (유형→내용→사진→접수자), 층수·부서 입력 |
| 접수 조회 | `status.html` | 번호/이름 검색, 상태별 필터, 처리결과 모달 |

### 🛡️ 관리자 페이지
| 페이지 | 파일 | 설명 |
|--------|------|------|
| 로그인 | `admin-login.html` | 2컬럼 풀스크린, 테스트 계정 버튼 |
| 대시보드 | `admin-dashboard.html` | 다크 사이드바, KPI, 긴급 배너, 목록 테이블 |
| 민원 상세 | `admin-detail.html` | 상태변경, 담당자 배정, 처리결과 입력 |
| 통계 분석 | `admin-stats.html` | Chart.js 5종 차트, 월별·분류별·담당자별 |

---

## 🎨 디자인 특징 (풀스크린 리뉴얼)

- **index.html**: 100vh 다크 히어로 + 별빛 패턴 배경, 좌·우 2컬럼 레이아웃
- **submit.html**: 파란 히어로 배너 + 4스텝 진행 표시 + 우측 가이드 사이드바
- **status.html**: 히어로 검색 + 5개 상태 탭 카드 + 민원 카드 목록 + 상세 모달
- **admin-***: 다크 사이드바 고정 + 우측 콘텐츠 스크롤 앱 레이아웃

---

## 📌 접근 경로

| URL | 설명 |
|-----|------|
| `/index.html` | 메인 홈페이지 |
| `/submit.html` | 민원 접수 |
| `/submit.html?type=defect` | 하자 신고 바로 접수 |
| `/submit.html?type=complaint` | 민원 바로 접수 |
| `/submit.html?category=electric` | 전기·통신 카테고리로 접수 |
| `/status.html` | 접수 조회 |
| `/admin-login.html` | 관리자 로그인 |
| `/admin-dashboard.html` | 관리자 대시보드 (인증 필요) |
| `/admin-detail.html?id={id}` | 민원 상세/처리 (인증 필요) |
| `/admin-stats.html` | 통계 분석 (인증 필요) |

---

## 🔑 테스트 계정

| 구분 | 아이디 | 비밀번호 | 권한 |
|------|--------|----------|------|
| 슈퍼 관리자 | admin | admin1234 | 전체 |
| 전기·설비 팀장 | manager1 | manager1234 | 담당자 |
| 환경미화 팀장 | manager2 | manager1234 | 담당자 |

---

## 🗄️ 데이터 모델 (complaints 테이블)

| 필드 | 타입 | 설명 |
|------|------|------|
| ticket_number | text | 접수 번호 (HC-YYYYMMDD-XXX) |
| type | text | defect / complaint |
| category | text | electric / equipment / cleaning / construction / other |
| title | text | 제목 |
| description | rich_text | 상세 내용 |
| location | text | 위치 설명 |
| floor | text | 층수 (B3~10F, RF) |
| department | text | 부서명 |
| submitter_name | text | 접수자 이름 |
| submitter_contact | text | 연락처 |
| priority | text | low / medium / high / urgent |
| status | text | received / in_progress / completed / rejected |
| photo_urls | array | 접수 사진 URL 배열 |
| result_photo_urls | array | 처리 결과 사진 배열 |
| result_note | rich_text | 처리 결과 내용 |
| assigned_to | text | 담당자명 |
| admin_memo | rich_text | 관리자 내부 메모 |
| completed_at | datetime | 처리 완료 일시 |

---

## 🚀 개발 로드맵

### Phase 1 ✅ 완료
- 전체 페이지 구조 및 UI
- 민원 접수 / 조회 / 관리자 기능
- 풀스크린 반응형 디자인
- Chart.js 통계 차트

### Phase 2 권장 개선사항
- 이메일/SMS 알림 연동 (외부 API)
- 처리 결과 사진 실제 업로드 (스토리지 연동)
- 관리자별 권한 분리 강화
- 민원 댓글/메모 이력 관리
- PWA (모바일 앱처럼 설치 가능)
