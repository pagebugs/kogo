# 회원 시스템 인수인계 문서 (Auth)

> 작성일: 2026-01-29  
> 담당: 프론트엔드 UI 구현 완료, 백엔드 API 미구현

---

## 1. 현재 구현 상태

### ✅ 완료된 항목 (프론트엔드 UI)

| 파일 | 설명 |
|------|------|
| `services/auth/index.html` | 로그인 페이지 |
| `services/auth/signup.html` | 2단계 회원가입 페이지 |
| `assets/css/auth/auth.css` | 인증 페이지 전용 스타일 |
| `assets/js/auth/auth.js` | 클라이언트 API 모듈 |
| `assets/js/auth/johap-list.js` | 조합사 목록 (정적 파일, 63개) |

### ❌ 미구현 항목 (백엔드 API)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/auth/signup` | POST | 회원가입 |
| `/api/auth/login` | POST | 로그인 |
| `/api/auth/logout` | POST | 로그아웃 |
| `/api/auth/check-email` | GET | 이메일 중복 확인 |

---

## 2. 회원 유형 (member_type)

```
GENERAL       - 일반 회원 (기본값)
COOP_MEMBER   - 조합 회원 (조합사 소속, 승인 필요)
PARTNER       - 파트너 (광고대행사 등, 승인 필요)
```

> `COOP_ASSOCIATE`, `ADMIN`은 DB 스키마에 존재하나 현재 UI에서 미사용

---

## 3. 회원가입 프로세스

### Step 1: 계정 정보
- 회원 유형 선택 (라디오: 일반/조합/파트너)
- 이메일 (중복확인 필수)
- 비밀번호 (8자 이상, 강도 표시)
- 비밀번호 확인
- 약관 동의 (서비스/개인정보 필수, 마케팅 선택)

### Step 2: 추가 정보
- 이름 (필수)
- 휴대폰 번호 (필수)
- **회원유형별 분기:**
  - 일반: 회사명(선택), 직책
  - 조합: 조합사 선택(셀렉트박스, 필수), 직책
  - 파트너: 회사명(필수), 직책

---

## 4. 백엔드 구현 시 참고

### 4.1 회원가입 API `/api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "plaintext (bcrypt 해시 필요)",
  "memberType": "GENERAL | COOP_MEMBER | PARTNER",
  "johapId": 1,          // 조합회원만
  "name": "홍길동",
  "phone": "010-1234-5678",
  "company": "회사명",   // 파트너 필수
  "position": "직책"
}
```

**처리 로직:**
1. 이메일 중복 체크
2. 비밀번호 bcrypt 해시
3. `user` 테이블 INSERT
4. 조합/파트너: `status='pending'`, `verification_status='PENDING'`
5. 일반: `status='active'`

### 4.2 로그인 API `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "plaintext"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": 1, "email": "...", "name": "...", "member_type": "..." },
  "token": "JWT or session token"
}
```

### 4.3 이메일 중복 확인 `/api/auth/check-email`

```
GET /api/auth/check-email?email=user@example.com
→ { "exists": true/false }
```

---

## 5. 조합사 목록 관리

- 파일: `assets/js/auth/johap-list.js`
- 원본: `docs/johaplist.csv` (EUC-KR 인코딩)
- 관리: Admin에서 조합 변경 시 JS 파일 재생성

---

## 6. DB 스키마 참조

- 테이블: `user`, `organization`
- 스키마 문서: `docs/database_schema.md`

### user 테이블 주요 컬럼
| 컬럼 | 설명 |
|------|------|
| email | 로그인 ID (unique) |
| password_hash | bcrypt 해시 |
| member_type | ENUM(ADMIN, COOP_MEMBER, ...) |
| status | ENUM(active, inactive, pending) |
| verification_status | ENUM(NONE, PENDING, APPROVED, REJECTED) |
| organization_id | FK → organization.id |

---

## 7. 향후 고도화 항목

### 프론트엔드
- [ ] 비밀번호 찾기 페이지 (`forgot-password.html`)
- [ ] 로그인 상태 유지 기능 (Remember Me)
- [ ] 회원정보 수정 페이지
- [ ] 로그인 후 리다이렉트 처리

### 백엔드
- [ ] JWT 또는 세션 기반 인증 구현
- [ ] 비밀번호 재설정 이메일 발송
- [ ] 조합/파트너 회원 승인 API
- [ ] Admin 회원관리 API 연동

---

## 8. 파일 경로 요약

```
services/auth/
├── index.html          # 로그인
└── signup.html         # 회원가입 (2단계)

assets/css/auth/
└── auth.css            # 인증 스타일

assets/js/auth/
├── auth.js             # API 모듈 (AuthAPI)
└── johap-list.js       # 조합사 목록 (정적)

docs/
├── database_schema.md  # DB 스키마
├── johaplist.csv       # 조합 원본 (EUC-KR)
└── auth.md             # 이 문서
```
