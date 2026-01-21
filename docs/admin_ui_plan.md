# Admin UI Planning Document: Sales & Order Operation

## 1. 개요 (Overview)
본 문서는 Sales/Order 운영자가 **데이터를 기반으로 빠르게 세일즈 가치를 판단하고 의사결정(Conversion)을 내릴 수 있는 관리자 도구**를 정의합니다.
기존의 일반적인 CMS나 고객 관리 툴이 아닌, **"Inquiry의 가치 판단"**과 **"Order로의 전환"**에 집중된 운영 전용 대시보드입니다.

### 핵심 원칙
1. **Speed**: 정보 탐색 시간을 최소화 (판단에 필요한 분석 데이터가 최상단 노출)
2. **Context First**: "누가 문의했나"보다 **"어떤 분석 결과를 보고 문의했나"**를 우선 시각화
3. **Action-Oriented**: 상태 변경과 Order 생성이 물 흐르듯 이어지도록 설계

---

## 2. Information Architecture (IA)

```mermaid
graph TD
    A[Admin Main (Dashboard)] --> B[Inquiry List];
    A --> C[Order List];
    B --> D[Inquiry Detail];
    C --> E[Order Detail];
    D --> |Create Order| E;
    D --> |Link to| C;
    E --> |Link to| D;
```

### 메뉴 구조
1. **Dashboard**: 오늘의 현황, 시급한 건, 이번 주 성과 요약
2. **Inquiry (Sales Leads)**: 들어온 문의 목록 (필터/검색 중심)
3. **Order**: 생성된 주문 목록 (상태 관리 중심)

---

## 3. 화면 상세 설계 (Wireframes & Description)

### 3.1 Main Dashboard
**목적**: 출근 직후 "오늘 무엇을 처리해야 하는가?"를 3초 안에 파악

*   **KPI Cards (Top Row)**
    *   `New Inquiries (Today)`: 금일 신규 유입 건수 (클릭 시 New 필터로 이동)
    *   `Pending Actions`: 상태가 `NEW`이거나 `CONTACTED` 상태로 48시간 이상 경과한 건
    *   `Conversion Rate (Weekly)`: 이번 주 문의 대비 주문 전환율
*   **Recent Activity Stream**
    *   최근 들어온 Inquiry 5건 (간략 정보: 병원명, 지역, Total 규모)
    *   최근 생성된 Order 3건

### 3.2 Inquiry List (핵심 화면)
**목적**: 문의의 **"사이즈(규모)"**와 **"상태"**를 보고 우선순위를 매기는 곳

*   **Layout**: Data Grid 형태 (엑셀 스타일, 가독성 최우선)
*   **Key Columns**:
    1.  `Status` (Badge): NEW(빨강), CONTACTED(노랑), QUALIFIED(파랑), CONVERTED(초록)
    2.  `Created At`: "2시간 전", "어제" 등 상대 시간 + 툴팁 절대 시간
    3.  **`Analytics Context` (핵심)**:
        *   **Total**: 타겟 모수 (예: 15,000명) - **Bold 처리** (영업 가치 판단 기준)
        *   **Targeting**: 지역(강남구), 연령(30-40대), 성별(여성) 요약
    4.  `Hospital Name`: 병원명 (없으면 '미입력')
    5.  `Interest Tags`: 선택한 관심 사항 (태그 형태)
    6.  `Contact`: 마스킹된 전화번호 (클릭 시 `view_contact` 로그 남기고 마스킹 해제)
    7.  `Action`: `상세보기` 버튼
*   **Filters**:
    *   Status (Multi-select)
    *   Total Scale (Range: 1만 미만, 1~5만, 5만 이상 등)
    *   Date Range

### 3.3 Inquiry Detail (판단 및 처리 화면)
**목적**: 영업 담당자가 **이 고객에게 전화를 걸지 말지**, **건다면 무슨 이야기를 할지** 결정하는 화면

#### Layout Structure (2-Column)

**[Left Column: Context & Analysis] (고정 영역 - 60%)**
*   **Simulation Snapshot Card**:
    *   "고객이 보았던 그 데이터 화면"을 요약
    *   **Map Preview**: 중심 좌표 및 반경 (Kakao Static Map 활용 가능 시)
    *   **Key Metrics Table**:
        *   거주 인구 vs 유동 인구
        *   핵심 타겟(예: 30대 여성) 비중
        *   결제 데이터 추정 매출 (있을 경우)
    *   *Why this is here*: 영업 사원이 고객과 통화할 때 "사장님, 강남구 30대 여성 인구가 많아서..."라고 바로 말할 수 있어야 함.

**[Right Column: Action & Workflow] (스크롤 영역 - 40%)**
*   **Client Info Card**:
    *   Inquiry ID: `INQ-20240121-001`
    *   Hospital Name
    *   Contact (Click to Reveal)
    *   Interest Tags
*   **Status Workflow**:
    *   Current Status: `NEW`
    *   Buttons: `Mark as Contacted`, `Mark as Qualified`, `Archive (Spam)`
    *   **"Create Order" Button**: `QUALIFIED` 상태일 때만 활성화
*   **Internal Memo**:
    *   운영자 노트 (Timeline 방식). "1/21 14:00 부재중", "1/21 15:00 긍정적"

### 3.4 Order List / Detail
**목적**: 확정된 계약의 집행 상태 관리

*   **Order List Columns**:
    *   `Order ID`
    *   `Status`: DRAFT, CONFIRMED, RUNNING, DONE
    *   `Amount`: 금액
    *   `Linked Inquiry`: 원본 Inquiry ID (링크)
    *   `Memo`: 간단 메모
*   **Order Detail**:
    *   수정 불가능한 Snapshot 데이터 (계약 당시의 Simulation 결과)
    *   집행 관련 필드: `Runcomm Reference Key`, `Executor Note`
    *   상태 변경 로그

---

## 4. 시나리오 (Usage Scenarios)

### Scenario A: 아침 모니터링 (대표님)
1.  Admin 접속 -> Dashboard 확인.
2.  "어제 밤에 5건이 들어왔네? 그 중 3건은 Total 5천명 이하니까 패스, **1건은 5만명이네?**"
3.  5만명 건 클릭 (Inquiry Detail 이동).
4.  Simulation Snapshot을 보니 "강남구, 20대 여성 타겟".
5.  메모 남김: "김대리, 이거 오전에 바로 연락해보세요. 타겟 아주 좋음."
6.  접속 종료.

### Scenario B: 영업 실행 (실무자)
1.  Inquiry List에서 `NEW` 필터링.
2.  대표님 메모 확인 -> 상세 진입.
3.  **Simulation Context**를 보고 스크립트 준비 ("원장님, 강남구 20대 여성이 5만명 잡힙니다").
4.  `Contact Reveal` 클릭 -> 전화 통화.
5.  원장님이 긍정적 반응 -> 상태를 `CONTACTED` -> `QUALIFIED`로 변경.
6.  통화 내용 메모: "다음 주 미팅 잡힘. 예산 300만원 예상."

### Scenario C: 주문 생성 (계약 성사)
1.  미팅 후 계약 확정.
2.  `Admin` -> `Inquiry Detail` (해당 건) 접속.
3.  상태를 `CONVERTED`로 변경하거나, 화면 내 `Create Order` 버튼 클릭.
4.  시스템이 자동으로 `Order` 생성 (Status: DRAFT).
5.  Simulation 데이터가 Order의 Snapshot으로 복제됨 (나중에 분석 조건이 바뀌어도 계약 내용은 보존).
6.  금액(300만원) 입력 후 상태 `CONFIRMED` 변경.

---

## 5. 개발 시 고려사항 (Technical Note)

1.  **Context Snapshot Parsing**:
    *   `inquiry.context_snapshot` 컬럼은 JSON 문자열로 저장됨.
    *   Admin 프론트엔드는 이를 파싱하여 시각화해야 함.
    *   만약 `snapshot`이 비어있다면, `simulation_id`를 통해 `simulation` 테이블을 역조회 하는 Fallback 로직 필요.

2.  **보안 (Security)**:
    *   `contact_phone` 복호화 API는 별도로 분리하고, 호출 로그(`event_log` 또는 별도 감사 로그)를 남겨야 함.

3.  **데이터 무결성**:
    *   Order 생성 시 `inquiry_id`는 Unique 해야 함 (하나의 문의로 중복 오더 생성 방지).
