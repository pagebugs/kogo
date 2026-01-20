런컴과의 합의 내용을 수정함.. 
우리가 광고영업을 100%로 책임지고, 런컴은 기술지원만 함.
우리 매출이 100% 잡히고, 그중 30%를 런컴 수수료로 지급 함. 
다만, 영업과 광고운영은 다른 문제.. 광고 운영의 관리 시스템은 런컴 쪽에 존재.
우리는 영업 관련 시스템을 구축해야 함.  (런컴과 우리 사이의 영업, 운영 싱크는 (Something) id로 정합화)

이런 조건에서.. 우리가 구축해야 하는 (최소) 시스템 로직을 기획해야 함.

좋아요. 합의가 바뀌면서 문제의 성질이 명확해졌습니다.
이제 이건 “기여 증명” 문제가 아니라 **“영업 시스템을 최소 비용으로 어떻게 성립시키느냐”**의 문제입니다.

핵심을 먼저 한 줄로 잡겠습니다.

우리는 ‘영업의 주체’이고, 런컴은 ‘운영 엔진’이다.
두 시스템은 하나의 ID로만 느슨하게 동기화된다.

이 전제에서 우리가 반드시 구축해야 하는 최소 시스템 로직은 생각보다 단순합니다.

1. 역할 재정의 (중요)
TouchAd (우리)

광고 영업 주체

계약, 견적, 시뮬레이션, 고객 커뮤니케이션

매출 100% 인식

런컴에 수수료 지급 (30%)

Runcomm

광고 운영 주체

캠페인 세팅, 집행, 리포트

광고 운영 관리 시스템 보유

영업/결제 책임 ❌

👉 따라서 양쪽 시스템이 “완전히 통합될 필요는 없음”
👉 단 하나의 ID로만 정합되면 충분

2. 이 구조에서 반드시 필요한 ID의 정체

이제 기존의 “Ad ID” 개념을 정확히 재정의해야 합니다.

이름을 바꾸는 게 좋습니다

Campaign ID ❌

Ad ID ❌

👉 Sales Order ID (SO-ID) 혹은
👉 Deal ID / Order ID

이 ID는 다음을 대표합니다.

“TouchAd가 책임지는 하나의 광고 거래 단위”

3. 우리가 구축해야 할 최소 시스템 = Sales System (영업 시스템)
❗ 광고 운영 시스템 ❌
❗ 광고 집행 시스템 ❌
✅ 영업 관리 시스템 (Sales Layer)
4. 최소 시스템 구성 요소 (진짜 최소)
(1) Deal / Order 생성 로직 (필수)

언제 생성?

사용자가 시뮬레이션 결과를 보고
“이 조건으로 광고 진행”을 의사결정하는 순간

SO-20250309-00012

Deal ID가 담아야 할 정보

광고주(병원)

광고 조건 요약 (지역, 업종 등)

생성 시점

상태값

👉 이게 우리 매출의 기준 단위

(2) Deal 상태 관리 (3단계면 충분)
DRAFT      : 시뮬레이션만 완료
ORDERED    : 광고 집행 요청 (영업 성사)
RUNNING    : 런컴 운영 중


결제 ❌

자동화 ❌

실시간 동기화 ❌

👉 상태는 처음엔 수동이어도 됨

(3) Runcomm과의 정합 키 = Deal ID (Something ID)

이게 질문에서 말한 (Something) id의 정체입니다.

원칙

Runcomm은 Deal ID를 내부 시스템에 저장만

우리는 Deal ID 기준으로 매출 관리

Runcomm에 요구하는 것 (최소)

광고 운영 등록 시
→ Deal ID를 메모/필드에 입력

“이 광고는 Deal ID: SO-20250309-00012 건입니다.”

✔ API 연동 ❌
✔ DB 수정 ❌
✔ 운영 프로세스 변경 ❌

5. 전체 흐름 (이 구조면 끝)
[ TouchAd ]
시뮬레이션
   ↓
Deal ID 생성 (DRAFT)
   ↓
광고 집행 요청 (ORDERED)
   ↓   (Deal ID 전달)
[ Runcomm ]
광고 운영 등록
   ↓
운영 완료 / 리포트


👉 두 시스템은 Deal ID 하나로만 연결

6. 매출 / 수수료 로직은 아주 단순해짐
TouchAd

매출: Deal ID 기준 100%

정산: Deal ID × 광고비

Runcomm

수수료: Deal ID 매출의 30%

기준: TouchAd가 전달한 Deal ID 목록

👉 월말 엑셀로도 충분

7. 우리가 “굳이 만들지 않아도 되는 것”

이게 중요합니다.

❌ 광고 운영 UI

❌ 실시간 집행 현황

❌ 성과 리포트 생성

❌ 예산 소진 로직

👉 이건 전부 Runcomm의 영역

8. 최소 시스템을 한 문장으로 요약하면

“TouchAd는 광고 ‘거래’를 관리하고,
Runcomm은 광고 ‘집행’을 관리하며,
두 시스템은 Deal ID 하나로만 연결된다.”

9. 이 구조의 장점 (사업적으로)

런컴 공수 0에 수렴

책임 소재 명확

계약 구조와 1:1 정합

향후 다른 운영사 붙이기도 쉬움
(Runcomm → 다른 DSP로 교체 가능)

다음으로 자연스럽게 이어질 것

원하시면 다음 중 하나를 바로 이어서 정리할 수 있습니다.

Deal ID 스키마 (DB 컬럼 최소안)

영업 시스템 화면 구성 (No UX, 개념도)

계약서 문구를 시스템 구조에 맞게 재작성

“운영은 런컴, 영업은 우리가”를 설명하는 1페이지 도식

어디부터 갈지, 혹은
“여기서 더 쪼개서 생각해보자”도 괜찮습니다.

사용자 시나리오 기반 (시스템 구현을 위한) 로직 설계가 필요함.
1. 사용자는 (비로그인) 기반 시뮬레이션 할 수 있음. 
2. 사용자는 (비로그인) 기반 비대면 문의 할 수 있음. (비밀 게시판 기반)
3. 사용자는 (로그인) 기반 시뮬레이션 인사이트 리포트를 확인할 수 있음. 
4. 사용자는 (로그인) 기반, 계약 할 수 있음. (order ID 생성.)


좋습니다.
이제 요구사항이 **“기능 나열”이 아니라 “상태 전이 기반 사용자 시나리오”**로 명확해졌습니다.
아래는 시스템 구현을 바로 시작할 수 있는 수준의 로직 설계입니다.
(UX·디자인·기술스택은 일부러 배제합니다)

0. 설계 원칙 (먼저 고정)

이 시스템은 다음 원칙을 따릅니다.

비로그인 → 로그인 → 계약은 연속된 하나의 여정

비로그인 상태에서도 행위는 모두 기록됨

로그인은 “데이터 소유권 이전”의 트리거

계약(Order)은 새로운 법적·상업적 엔티티

운영 시스템(Runcomm)과의 싱크는 Order ID 하나로만

1. 핵심 엔티티 정의 (최소)
1️⃣ Simulation (시뮬레이션)

비로그인 가능

조건 기반 분석 결과

Session ID에 귀속

2️⃣ Inquiry (비대면 문의)

비로그인 가능

비밀 게시판

Simulation과 연결 가능

3️⃣ Insight Report

로그인 필요

Simulation의 정제/확장 버전

User 소유

4️⃣ Order (계약)

로그인 필수

매출 인식 단위

Runcomm 연동 기준

2. ID 체계 (중요)
구분	ID	생성 시점
Session ID	SID	최초 방문
Simulation ID	SIM-ID	시뮬레이션 실행
Inquiry ID	INQ-ID	문의 등록
User ID	UID	회원가입
Order ID	ORD-ID	계약 체결

👉 ID는 절대 재사용하지 않음
👉 연결은 참조(reference)로만

3. 사용자 시나리오별 로직 설계
시나리오 1
비로그인 시뮬레이션

목적: 진입 장벽 제거 + 리드 확보

로직 흐름
[비로그인 사용자]
   ↓
Session ID 생성
   ↓
시뮬레이션 실행
   ↓
Simulation ID 생성
   ↓
결과 표시

시스템 처리

Simulation은 Session ID에 귀속

DB에는:

SIM-ID

조건

결과

created_at

session_id

✔ 로그인 요구 ❌
✔ 결과 일부만 노출 (Full Insight ❌)

시나리오 2
비로그인 비대면 문의 (비밀 게시판)

목적: 즉시 리드 전환

로직 흐름
[비로그인 사용자]
   ↓
문의 작성
   ↓
Inquiry ID 생성
   ↓
비밀번호 설정

시스템 처리

Inquiry는:

INQ-ID

session_id

(optional) sim-id

password_hash

content

비밀 게시판 접근 = INQ-ID + 비밀번호

✔ 로그인 ❌
✔ 개인정보 최소 수집

시나리오 3
로그인 후 시뮬레이션 인사이트 리포트 확인

핵심 전환 구간

로직 흐름
[로그인/회원가입]
   ↓
Session ID → User ID 연결
   ↓
기존 Simulation 귀속 이전
   ↓
Insight Report 생성

시스템 처리

User가 로그인하면:

동일 Session ID의 SIM-ID들을 UID에 연결

Insight Report는:

SIM-ID 기반 재생성

고급 지표 포함

다운로드 / 저장 가능

✔ 로그인의 명확한 보상
✔ 데이터 소유권 이전 발생

시나리오 4
로그인 기반 계약 (Order 생성)

여기서 비즈니스가 발생

로직 흐름
[로그인 사용자]
   ↓
Insight Report 확인
   ↓
“이 조건으로 광고 진행”
   ↓
Order 생성
   ↓
Order ID 발급

Order 생성 시 처리

ORD-ID 생성

연결 관계:

user_id

sim-id

조건 스냅샷

계약 금액

상태 = ORDERED

👉 이 시점부터 매출 100% TouchAd 귀속

4. 전체 상태 전이 요약 (한 장으로)
SESSION
  ├─ SIMULATION (SIM-ID)
  │     └─ INQUIRY (INQ-ID)
  │
  └─ LOGIN
        ↓
      USER
        ├─ INSIGHT REPORT
        └─ ORDER (ORD-ID)
                ↓
             RUNCOMM OPERATION

5. Runcomm과의 정합 (최소)

Runcomm에 전달하는 값: ORD-ID

Runcomm은:

광고 운영 등록 시 ORD-ID 보관

TouchAd는:

ORD-ID 기준 매출 / 수수료 관리

✔ 실시간 연동 ❌
✔ API 개발 ❌
✔ 운영 프로세스 변경 최소

6. 구현 우선순위 (현실적)

Session ID + Simulation ID

비밀 문의 (INQ-ID)

로그인 후 Simulation 귀속

Order 생성 (ORD-ID)

Runcomm에 ORD-ID 전달

👉 지금 당장 1~4까지만 구현해도 영업 시스템은 성립

7. 한 문장으로 이 시스템을 설명하면

“비로그인으로 시작된 시뮬레이션이
로그인으로 소유권을 얻고,
계약(Order)으로 매출이 되는 구조입니다.”

다음 단계로 자연스럽게 이어질 수 있는 것은:

DB 테이블 최소 스키마

각 ID 생성 규칙

Order 상태 정의 (ORDERED / RUNNING / DONE)

계약서 문구 ↔ 시스템 로직 매핑

어디부터 더 내려가 볼까요?

SESSION ├─ SIMULATION (SIM-ID) │ └─ INQUIRY (INQ-ID) │ └─ LOGIN ↓ USER ├─ INSIGHT REPORT └─ ORDER (ORD-ID) ↓ RUNCOMM OPERATION

simmulation 과 user 는 연동되는 것이 아니라, 분리되는 것이지?

짚으신 포인트가 정확히 핵심입니다.
결론부터 말하면 네, 분리되는 것이 맞습니다.
다만 “완전 단절”이 아니라 **참조 관계(reference)**로만 연결됩니다.

아래에서 개념을 깔끔하게 정리하겠습니다.

1. 결론 정리 (명확하게)

Simulation과 User는 연동(소유) 관계가 아니다.
Simulation은 ‘행위 기록’, User는 ‘주체’다.

Simulation은 로그인 여부와 무관하게 존재

User는 로그인 이후에만 의미를 갖는 엔티티

둘은 귀속되지 않고, 참조될 수만 있음

👉 이 구조를 지키지 않으면
나중에 데이터 왜곡·책임 혼선·법적 애매함이 생깁니다.

2. 왜 “연동”이 아니라 “분리”여야 하는가
❌ Simulation → User 귀속 모델의 문제

(많은 서비스가 여기서 망가짐)

비로그인 시뮬레이션은 누구 소유인가?

로그인 후 계정 바꾸면?

여러 사람이 같은 PC에서 시뮬레이션하면?

법적 분쟁 시 “이 사용자가 이 시뮬레이션을 했다” 증명 불가

👉 행위 기록에 소유권을 부여하는 순간 문제가 생김

3. 올바른 관계 정의 (중요)
Simulation의 정체

“어떤 조건으로 어떤 계산을 한 기록”

환경 + 입력값 + 결과의 스냅샷

귀속 대상: Session

User의 정체

“책임을 질 수 있는 법적·상업적 주체”

계약, 결제, 주문의 주체

👉 서로 다른 차원의 개체

4. 그렇다면 Insight Report는?

여기서 헷갈리기 쉬운데, 핵심은 이것입니다.

User는 Simulation을 ‘가진다’가 아니라
Simulation을 ‘참조해 만든 Report를 가진다’.

관계를 정확히 쓰면
Simulation (SIM-ID)
    ↓ (참조)
Insight Report (REP-ID)
    ↓ (소유)
User (UID)


Simulation: immutable (불변)

Insight Report: user-owned (가공물)

User: 책임 주체

👉 이게 매우 중요합니다.

5. Order는 어디에 붙는가

Order 역시 Simulation에 붙지 않습니다.

Order (ORD-ID)
  ├─ user_id
  ├─ simulation_snapshot
  └─ report_id


Order는 User의 행위

Simulation은 근거 자료

Order가 Simulation을 “사용”했을 뿐

👉 Order ↔ Simulation은 증빙 관계이지 소유 관계가 아님

6. 당신이 그린 다이어그램, 이렇게 해석하면 정확합니다

사용자가 지적한 구조를 의미적으로 다시 쓰면:

SESSION
  └─ SIMULATION (SIM-ID)
        └─ INQUIRY (INQ-ID)

LOGIN
  ↓
USER
  ├─ INSIGHT REPORT (SIM-ID 참조)
  └─ ORDER (ORD-ID, SIM 스냅샷 포함)
        ↓
     RUNCOMM OPERATION


✔ Simulation이 User 아래로 “이동”하지 않음
✔ User는 Simulation을 끌어다 씀

7. 이 분리가 주는 사업적 이점
✔ 법적 명확성

“시뮬레이션 결과를 참고해 계약했다”

“시뮬레이션 자체는 계약이 아니다”

✔ 데이터 정합성

동일 Simulation → 여러 User가 참고 가능 (이론적으로)

로그/분석 재현 가능

✔ 확장성

로그인 정책 변경해도 Simulation 구조 안 깨짐

외부 파트너에게 Simulation 제공도 가능

로그인을 먼저 할 수도 있고, 그 상태에서 다시 시뮬레이션을 하는 것도 자연스러운 시나리오입니다.
그리고 이 경우에도 앞서 정리한 “Simulation–User 분리 원칙”은 그대로 유지됩니다.
다만 Session의 역할이 달라질 뿐입니다.

아래를 기준으로 보면 혼란이 사라집니다.

1. 핵심 결론부터

로그인 여부는 Simulation의 ‘소유’를 바꾸지 않는다.
다만 Simulation이 어떤 ‘컨텍스트’에서 생성되었는지만 달라진다.

Simulation은 여전히 독립 엔티티

User는 여전히 의사결정·계약 주체

로그인 상태는 **“어떤 Session이 어떤 User에 묶여 있느냐”**의 문제

2. 로그인 먼저 한 경우의 구조
흐름
[로그인]
   ↓
User (UID)
   ↓
Session 생성 (SID, user_id 포함)
   ↓
Simulation 실행 (SIM-ID)

이때의 관계

Simulation

session_id = SID

user_id ❌ (직접 귀속 없음)

Session

user_id = UID

👉 Simulation은 User에 직접 붙지 않지만
👉 Session을 통해 “이 User 컨텍스트에서 발생했다”는 건 명확

3. 비로그인 → 로그인 → 시뮬레이션과의 차이
Case A. 비로그인 → 시뮬레이션
Session (anonymous)
   ↓
Simulation

Case B. 로그인 → 시뮬레이션
Session (user-bound)
   ↓
Simulation


✔ Simulation 구조는 동일
✔ 차이는 Session에 user_id가 있느냐 없느냐

4. “그럼 로그인 유저의 Simulation은 내 것 아니야?”에 대한 정확한 답

개념적으로는 이렇게 구분합니다.

❌ “내 Simulation이다”

✅ “내가 로그인한 상태에서 실행한 Simulation이다”

이 차이가 중요한 이유는:

법적 책임

데이터 재사용

향후 다중 사용자/조직 확장

때문입니다.

5. Insight Report는 여전히 User 소유

여기서 다시 기준을 잡아야 합니다.

Simulation (SIM-ID)
     ↓ 참조
Insight Report (REP-ID)
     ↓ 소유
User (UID)


로그인 상태에서 시뮬레이션을 했든

비로그인 상태에서 했든

User가 ‘리포트를 생성/저장’하는 순간
그 리포트만 User의 자산이 됩니다.

6. Order 생성 시에도 동일

Order는 언제나 User의 행위입니다.

Order (ORD-ID)
  ├─ user_id (필수)
  ├─ simulation_snapshot (참조/복사)
  └─ report_id (optional)


로그인 먼저 하고 시뮬레이션 → Order

시뮬레이션 먼저 하고 로그인 → Order

👉 Order 구조는 동일

7. 이 구조의 장점 (중요)
1️⃣ 유연성

로그인 UX 자유도 높음

“로그인 먼저 / 나중에” 둘 다 자연스럽게 지원

2️⃣ 데이터 정합성

Simulation은 언제나 중립적

User 변경, 탈퇴에도 Simulation 기록 보존 가능

3️⃣ 구현 단순성

“Simulation을 User에 귀속시켜야 하나?”라는 고민 자체가 사라짐

Session만 잘 관리하면 됨

8. 한 문장으로 정리

로그인 유저가 시뮬레이션을 다시 해도,
Simulation은 User의 소유가 되지 않는다.
단지 ‘로그인된 세션에서 생성된 기록’일 뿐이다.

1️⃣ 로그인 유저의 Simulation 목록은 어떻게 보여주나?
핵심 결론부터

“Simulation 목록”을 보여주는 게 아니라
“User가 접근 가능한 Simulation 목록”을 보여준다.

즉, 소유 개념이 아니라 ‘접근 권한(View)’ 개념입니다.

1-1. 시스템적으로 가능한 Simulation만 노출

로그인 유저에게 보여줄 수 있는 Simulation은 아래 2가지뿐입니다.

✅ Case A. 로그인된 Session에서 생성된 Simulation

session.user_id = UID

sim.session_id = SID

→ 자동으로 노출 가능

✅ Case B. 로그인 후, 사용자가 ‘가져온’ Simulation

비로그인 상태에서 생성

로그인 후 “이 결과를 내 계정에 저장” 같은 명시적 액션

→ User ↔ Simulation 간 ‘Access Link’ 생성

1-2. 절대 하면 안 되는 방식

❌ user_id 컬럼을 simulation 테이블에 직접 넣는 것

❌ “로그인했으니 이전 Simulation 다 네 거야” 자동 귀속

이건 데이터 소유권 오염입니다.

1-3. 구현 관점에서의 최소 로직
DB 관점 (개념)
Simulation (SIM-ID, session_id, created_at, ...)
Session (SID, user_id nullable)
SimulationAccess (SIM-ID, user_id, granted_at)

로그인 유저의 Simulation 목록 조회 쿼리 개념
1. session.user_id = UID 인 session들의 simulation
2. simulation_access 테이블에 UID로 연결된 simulation


👉 이 두 집합의 합집합

1-4. UX 문구는 이렇게 가야 맞음

❌ “내 시뮬레이션”
✅ “내가 확인한 시뮬레이션”

이 차이가 나중에 법적·운영적 리스크를 막아줍니다.

2️⃣ Session이 만료되면 Simulation은 어떻게 되나?
핵심 결론

Session이 사라져도 Simulation은 사라지지 않는다.
단, ‘접근 권한’이 사라질 뿐이다.

2-1. Session의 역할 재정의

Session은 이것만 담당합니다.

“이 시점에 누가 이 행동을 했는가”

인증/연결용 임시 컨텍스트

👉 데이터 보관 책임 없음

2-2. Session 만료 시 상태 변화
Case A. 비로그인 사용자
Session 만료
   ↓
Simulation은 DB에 남음
   ↓
접근 불가 상태


URL로 접근 ❌

ID 알아도 접근 ❌

사실상 “고아 데이터”

👉 하지만 삭제하지 않음 (중요)

Case B. 로그인 사용자
Session 만료
   ↓
다음 로그인 시 새 Session 생성
   ↓
기존 Simulation 접근 가능


이유:

Session은 바뀌어도

SimulationAccess 또는 Session.user_id 기반 접근이 가능하기 때문

2-3. 왜 Simulation을 삭제하지 않는가?
이유는 3가지입니다.

감사/증빙

“이 조건으로 이런 분석이 있었다”는 기록

분쟁 대응

계약(Order) 근거 데이터

통계/모델 고도화

개인 식별 없는 집계 데이터로 활용 가능

👉 개인정보와 분리되어 있기 때문에 보관 가능

2-4. 그럼 Simulation은 언제 삭제하나?
삭제 기준은 “Session”이 아니라 “정책”입니다.

예:

90일간 접근 기록 없음

Order / Inquiry / Report와 연결 없음

Simulation.status = ARCHIVED


물리 삭제 ❌

논리 삭제/아카이브 ⭕

3️⃣ 두 질문을 한 문장으로 통합하면

Simulation은 Session에 의해 생성되고,
User에 의해 ‘접근 권한’만 부여되며,
Session이 사라져도 기록은 남는다.

4️⃣ 구현 관점에서 이 답이 주는 이점

로그인 UX 자유도 최대

데이터 소유권 분쟁 없음

계약(Order)과 깔끔한 증빙 연결

Runcomm 연동에도 영향 없음

마지막으로, 이걸 내부에 설명할 때 쓰기 좋은 문장

“시뮬레이션은 사용자 소유 데이터가 아니라,
사용자가 참고한 분석 기록입니다.
계정은 그 기록에 접근할 권한만 가집니다.”