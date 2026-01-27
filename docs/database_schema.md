# TouchAd Database Schema Documentation

Last Updated: 2026-01-27

## 📋 Table of Contents
- [event_log](#event_log)
- [inquiry](#inquiry)
- [insight_report](#insight_report)
- [order](#order)
- [organization](#organization) ← NEW
- [session](#session)
- [simulation](#simulation)
- [simulation_access](#simulation_access)
- [user](#user)

---

## event_log
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **event_type** | varchar(50) | NOT NULL |  | NULL |  | 이벤트 유형 (예: demo_click) |
| **payload** | text | NULL |  | NULL |  | 이벤트 상세 정보 (JSON 형태 권장) |
| **created_at** | datetime | NULL |  | current_timestamp() |  |  |

## inquiry
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **inquiry_id** | varchar(64) | NOT NULL | UNI | NULL |  | 문의 고유 ID (INQ-xxxxx) |
| **session_id** | varchar(64) | NOT NULL | MUL | NULL |  | Session 참조 (FK) |
| **sim_uuid** | varchar(50) | NULL | MUL | NULL |  | 관련 Simulation UUID (optional) |
| **context_snapshot** | longtext | NULL |  | NULL |  | Simulation context snapshot at inquiry creation time |
| **source_type** | enum('analysis','simulation','direct') | NULL |  | NULL |  | Entry point tracking (analysis, simulation, direct) |
| **source_page** | varchar(255) | NULL |  | NULL |  | Entry page URL (index.html, newresult.html 등) |
| **title** | varchar(200) | NULL |  | NULL |  | [DEPRECATED] 제목 - Sales Lead로 전환됨 |
| **content** | text | NULL |  | NULL |  | 사용자 추가 문의/요청 내용 |
| **contact_info** | varchar(255) | NULL |  | NULL |  | DEPRECATED - Do not use for Contextual Inquiry |
| **password_hash** | varchar(64) | NULL |  | NULL |  | [DEPRECATED] 비밀번호 해시 - Sales Lead로 전환됨 |
| **status** | enum('open','referenced','used_for_order','archived','new','contacted','qualified','converted') | NULL | MUL | new |  | **Flow**: new(접수) → contacted(연락) → converted(주문생성) |
| **admin_reply** | text | NULL |  | NULL |  | 관리자 답변 |
| **replied_at** | datetime | NULL |  | NULL |  | 답변 시각 |
| **created_at** | datetime | NULL | MUL | current_timestamp() |  |  |
| **updated_at** | datetime | NULL |  | current_timestamp() | on update current_timestamp() |  |
| **contact_phone** | varchar(255) | NULL |  | NULL |  | 연락처 전화번호 (암호화됨) |
| **contact_email** | varchar(500) | NULL |  | NULL |  | 연락처 이메일 (암호화됨) |
| **interest_tags** | longtext | NULL |  | NULL |  | 관심 포인트 태그 배열 |
| **archived_at** | timestamp | NULL |  | NULL |  | Soft delete (숨김 처리) |

## insight_report
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **report_id** | varchar(64) | NOT NULL | UNI | NULL |  | 리포트 고유 ID (RPT-xxxxx) |
| **user_id** | int(11) | NOT NULL | MUL | NULL |  | User ID (FK) - 리포트 소유자 |
| **sim_id** | int(11) | NOT NULL | MUL | NULL |  | Simulation ID (FK) - 원본 시뮬레이션 |
| **title** | varchar(255) | NULL |  | NULL |  | 리포트 제목 (사용자 지정) |
| **snapshot** | longtext | NOT NULL |  | NULL |  | 계산 결과 요약 스냅샷 |
| **report_version** | varchar(10) | NULL |  | NULL |  | 리포트 로직 버전 (v1.0 등) |
| **generated_at** | datetime | NULL | MUL | current_timestamp() |  | 생성 시각 |
| **updated_at** | datetime | NULL |  | current_timestamp() | on update current_timestamp() |  |
| **archived_at** | timestamp | NULL |  | NULL |  | Soft delete |

## order
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **order_id** | varchar(64) | NOT NULL | UNI | NULL |  | 주문 고유 ID (ORD-xxxxx) |
| **inquiry_id** | varchar(64) | NULL | UNI | NULL |  | Inquiry ID (inquiry.inquiry_id 참조, VARCHAR) |
| **user_id** | int(11) | NULL | MUL | NULL |  | User ID (FK) - 주문자 (A안: 추후 연결) |
| **report_id** | int(11) | NULL |  | NULL |  | InsightReport ID (FK, optional) |
| **sim_snapshot** | longtext | NULL |  | NULL |  | Simulation 스냅샷 (report 없을 경우) |
| **amount** | decimal(12,0) | NOT NULL |  | NULL |  | 주문 금액 (원) |
| **status** | enum('DRAFT','CONFIRMED','ORDERED','RUNNING','DONE','CANCELLED') | NULL | MUL | DRAFT |  | DRAFT: 생성, CONFIRMED: 확정, ORDERED: 동의완료, RUNNING: 집행중, DONE: 완료 |
| **runcomm_ref** | varchar(100) | NULL |  | NULL |  | Runcomm 전달 참조값 |
| **runcomm_sent_at** | datetime | NULL |  | NULL |  | Runcomm 전달 시각 |
| **note** | text | NULL |  | NULL |  | 관리자 메모 |
| **memo** | text | NULL |  | NULL |  | Admin 메모 (컨택 기록 등) |
| **created_by_admin_id** | varchar(64) | NULL |  | NULL |  | Admin ID (책임 소재) |
| **decision_snapshot** | json | NULL |  | NULL |  | Order 생성 시점의 판단 근거 (Total, Target 등) |
| **archived_at** | timestamp | NULL |  | NULL |  | Soft delete |
| **created_at** | datetime | NULL | MUL | current_timestamp() |  |  |
| **updated_at** | datetime | NULL |  | current_timestamp() | on update current_timestamp() |  |

## session
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **session_id** | varchar(64) | NOT NULL | UNI | NULL |  | 클라이언트 생성 세션 ID (sess_xxx) |
| **user_id** | int(11) | NULL | MUL | NULL |  | 로그인 시 연결될 User ID (FK, nullable) |
| **created_at** | datetime | NULL | MUL | current_timestamp() |  |  |
| **expires_at** | datetime | NULL |  | NULL |  | 세션 만료 시간 (nullable = 무기한) |
| **last_active_at** | datetime | NULL |  | current_timestamp() | on update current_timestamp() |  |
| **user_agent** | text | NULL |  | NULL |  | 브라우저 정보 |
| **ip_address** | varchar(45) | NULL |  | NULL |  | IPv4/IPv6 지원 |
| **metadata** | longtext | NULL |  | NULL |  | 추가 컨텍스트 정보 |

## simulation
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **sim_uuid** | varchar(50) | NOT NULL | UNI | NULL |  | 외부 공개용 ID (예: SIM-...) |
| **session_id** | varchar(64) | NOT NULL | MUL | NULL |  | Session ID (FK to session.session_id) |
| **input_data** | longtext | NOT NULL |  | NULL |  | 시뮬레이션 조건 (Immutable) |
| **result_data** | longtext | NOT NULL |  | NULL |  | 시뮬레이션 결과 (Immutable) |
| **data_version** | tinyint(4) | NULL |  | 1 |  | 데이터 구조 버전 |
| **created_at** | datetime | NULL |  | current_timestamp() |  |  |

## simulation_access
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **sim_id** | int(11) | NOT NULL | MUL | NULL |  | Simulation ID (FK) |
| **user_id** | int(11) | NOT NULL | MUL | NULL |  | User ID (FK) |
| **granted_at** | datetime | NULL | MUL | current_timestamp() |  | 권한 부여 시각 |
| **source** | enum('login','manual_save','share') | NULL |  | login |  | 권한 부여 경로 |
| **grant_reason** | enum('login','manual','share') | NULL |  | NULL |  | 권한 부여 상세 사유 (Audit trail) |

## user
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **email** | varchar(255) | NOT NULL | UNI | NULL |  | 이메일 (로그인 ID) |
| **password_hash** | varchar(255) | NULL |  | NULL |  | 비밀번호 해시 (bcrypt, 카카오 로그인 시 NULL) |
| **name** | varchar(100) | NULL |  | NULL |  | 사용자 이름 |
| **phone** | varchar(20) | NULL |  | NULL |  | 연락처 |
| **company** | varchar(200) | NULL |  | NULL |  | 회사명 |
| **position** | varchar(100) | NULL |  | NULL |  | 직책 |
| **status** | enum('active','inactive','pending') | NULL | MUL | pending |  | 계정 상태 |
| **member_type** | enum('ADMIN','COOP_MEMBER','COOP_ASSOCIATE','PARTNER','GENERAL') | NULL | MUL | GENERAL |  | 회원 유형 |
| **kakao_id** | bigint(20) | NULL | UNI | NULL |  | 카카오 계정 고유 ID |
| **kakao_email** | varchar(255) | NULL |  | NULL |  | 카카오 프로필 이메일 |
| **kakao_nickname** | varchar(100) | NULL |  | NULL |  | 카카오 닉네임 |
| **kakao_linked_at** | datetime | NULL |  | NULL |  | 카카오 연동 시각 |
| **verification_status** | enum('NONE','PENDING','APPROVED','REJECTED') | NULL | MUL | NONE |  | 자격 확인 상태 (PARTNER용) |
| **verified_at** | datetime | NULL |  | NULL |  | 승인 시각 |
| **verified_by** | int(11) | NULL |  | NULL |  | 승인 관리자 ID |
| **organization_id** | int(11) | NULL | MUL | NULL |  | 소속 조직 ID (FK → organization.id) |
| **created_at** | datetime | NULL |  | current_timestamp() |  |  |
| **updated_at** | datetime | NULL |  | current_timestamp() | on update current_timestamp() |  |
| **last_login_at** | datetime | NULL |  | NULL |  | 마지막 로그인 시각 |

## organization
| Column | Type | Null | Key | Default | Extra | Comment |
|---|---|---|---|---|---|---|
| **id** | int(11) | NOT NULL | PRI | NULL | auto_increment |  |
| **org_code** | varchar(20) | NOT NULL | UNI | NULL |  | 조직 고유 코드 (예: ORG-001) |
| **org_name** | varchar(200) | NOT NULL |  | NULL |  | 업체명 (조합사명) |
| **org_type** | enum('COOP','ASSOCIATE_COOP','PARTNER_CORP') | NOT NULL |  | NULL |  | COOP=조합사, ASSOCIATE_COOP=준조합사, PARTNER_CORP=파트너법인 |
| **business_number** | varchar(20) | NULL | MUL | NULL |  | 사업자등록번호 |
| **division** | varchar(100) | NULL |  | NULL |  | 소속 분과 (옵션) |
| **status** | enum('ACTIVE','INACTIVE','PENDING') | NULL | MUL | ACTIVE |  | 조직 상태 |
| **created_at** | datetime | NULL |  | current_timestamp() |  |  |
| **updated_at** | datetime | NULL |  | current_timestamp() | on update current_timestamp() |  |

