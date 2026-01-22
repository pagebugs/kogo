# Admin API 설계 문서 (Phase 1)

## 전략적 결정

> Phase 1에서는 기존 `/api/inquiry/:id/view`를 유지하되,  
> Admin Key 기반으로 복호화 접근을 제한한다.  
> Admin 전용 경로 통일은 Phase 2에서 수행한다.

---

## 현행 API 경로 (Phase 1)

### Inquiry 관련
| 기능 | Method | 경로 | 비고 |
|------|--------|------|------|
| 리스트 조회 | GET | `/api/admin/inquiries` | source_type, source_page 필터 지원 |
| 상세 조회 | POST | `/api/inquiry/:id/view` | Admin Key 필수, 복호화 포함 |
| 상태 변경 | PATCH | `/api/inquiry/:id/status` | Admin Key 필수 |

### Order 관련
| 기능 | Method | 경로 | 비고 |
|------|--------|------|------|
| 생성 | POST | `/api/admin/order` | inquiry_id 기반 |
| 리스트 조회 | GET | `/api/admin/orders` | Inquiry 요약 포함 |
| 상태 변경 | PATCH | `/api/order/:id/status` | Admin Key 필수 |

---

## 의도된 비통일성 설명

현재 경로 구조가 일관되지 않은 이유:
1. **기존 코드 안정성 유지**: 운영 중 API 변경 최소화
2. **Phase 1 목표 집중**: Inquiry→Order 연동 기능 우선
3. **Admin Key 기반 보호**: 경로보다 인증이 더 중요

---

## Phase 2 전환 조건

다음 중 **하나라도 발생** 시 Admin 전용 경로로 통일:

1. User Order 생성 기능 요구 발생
2. 외부 파트너 API 제공 필요
3. Admin 권한 레벨 2단계 이상 분리 필요
4. API Gateway / Rate Limiting 도입 시

---

## Phase 2 예상 경로 구조

```
/api/admin/inquiry/:id        ← 상세 조회
/api/admin/inquiry/:id/status ← 상태 변경
/api/admin/order/:id          ← 상세 조회
/api/admin/order/:id/status   ← 상태 변경
```

---

*문서 작성일: 2026-01-22*
