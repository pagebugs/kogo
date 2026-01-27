(function() {
  function initIndexSimulation() {
    if (!document.getElementById("serviceTrialModal")) return;

    const state = (window.__indexState = window.__indexState || {});
    const refs = state.refs || {};
    const hospitalAddressInput = refs.hospitalAddressInput;
    const submitAddressBtn = refs.submitAddressBtn;
    const loadingOverlay = refs.loadingOverlay;

    // 간단 토큰 생성 (데모용)
    function generateToken() {
      return "demo_token_" + Date.now();
    }

    // 시뮬레이션 결과 저장 및 로그 전송
    async function saveSimulation(inputData, resultData) {
      try {
        const sessionId = sessionStorage.getItem("event_session_id");
        if (!sessionId) {
          console.warn("[Simulation] No session ID, skipping save");
          return;
        }

        // UUID 생성 (브라우저 지원 확인)
        const simUuid =
          self.crypto && self.crypto.randomUUID
            ? self.crypto.randomUUID()
            : "sim_" +
              Date.now() +
              "_" +
              Math.random().toString(36).substr(2, 9);

        const simPayload = {
          sim_uuid: simUuid,
          session_id: sessionId,
          input_data: inputData,
          result_data: resultData
        };

        console.log("[Simulation] Saving...", simPayload);

        // 1. 시뮬레이션 저장
        const saveRes = await fetch("http://localhost:3000/api/simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(simPayload)
        });

        if (!saveRes.ok) {
          throw new Error("Failed to save simulation");
        }

        console.log("[Simulation] Saved successfully");

        // 2. 이벤트 로그 (simulation_run)
        const logPayload = {
          event_version: 1,
          page: "index",
          timestamp: new Date().toISOString(),
          session_id: sessionId,
          sim_uuid: simUuid, // 연결 고리

          // 메타 데이터
          trigger: "demo_completion",

          // 환경 정보
          user_agent: navigator.userAgent,
          page_url: window.location.href,
          client_time_offset: new Date().getTimezoneOffset()
        };

        await fetch("http://localhost:3000/api/log-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "simulation_run",
            payload: logPayload
          })
        });

        console.log("[Event] Simulation run logged", logPayload);
      } catch (err) {
        console.error("[Simulation] Error:", err);
        // 에러가 나도 사용자 플로우는 막지 않음
      }
    }

    // 데모 모드로 바로 체험 (샘플 데이터)
    async function runDemoMode() {
      const sampleData = {
        hospitalName: "데모 병원",
        generalData: {
          gender: "여성",
          age: "30대",
          partnerCd: "성형외과",
          addressBase: "서울특별시 강남구 테헤란로 123 (역삼동)",
          addressDetail: ""
        },
        resData: [{ dunjugo: 12500 }, { dunjugo: 7800 }, { dunjugo: 8200 }],
        dunjugoValues: [
          { index: 1, value: 12500 },
          { index: 2, value: 7800 },
          { index: 3, value: 8200 }
        ]
      };

      localStorage.setItem("touchadData", JSON.stringify(sampleData));
      localStorage.setItem("address-base", sampleData.generalData.addressBase);
      localStorage.setItem("address-detail", "");
      localStorage.setItem(
        "dunjugoValues",
        JSON.stringify(sampleData.dunjugoValues)
      );

      const token = localStorage.getItem("user_token") || generateToken();
      localStorage.setItem("user_token", token);

      // [New] 시뮬레이션 저장 및 로그
      await saveSimulation(sampleData.generalData, {
        resData: sampleData.resData,
        dunjugoValues: sampleData.dunjugoValues
      });

      // Navigate to newresult.html
      window.location.href = "/touch/newresult.html";
    }

    // 런컴 서버 API 호출
    async function fetchRuncommData() {
      const processingMessages = document.querySelectorAll(
        ".processing-messages p"
      );
      let msgIndex = 0;

      // 디버깅용 로그 추가
      console.log("=== 런컴 서버 API 호출 시작 ===");
      console.log("우편번호:", state.postcode);

      try {
        if (loadingOverlay) {
          loadingOverlay.style.display = "flex";
        }

        // 메시지 순환 시작
        const msgInterval = setInterval(() => {
          processingMessages.forEach((m) => m.classList.remove("active"));
          processingMessages[msgIndex].classList.add("active");
          msgIndex = (msgIndex + 1) % processingMessages.length;
        }, 3000);

        if (processingMessages.length > 0) {
          processingMessages[0].classList.add("active");
        }

        // [DEV] Hardcoded payload for testing
        console.warn("[DEV MODE] Runcomm payload is hardcoded");

        const DEV_RUNCOMM_PAYLOAD = [
          {
            card_dong_nm: "06164", // 테스트용 우편번호 (강남)
            sex: "M,F,Z",
            age: "A,B,C,D,E,F,G",
            card_sub: "미용원"
          },
          {
            card_dong_nm: "06164",
            sex: "M,F,Z",
            age: "C", // 30대
            card_sub: "미용원"
          },
          {
            card_dong_nm: "06164",
            sex: "F,Z", // 여성
            age: "A,B,C,D,E,F,G",
            card_sub: "미용원"
          }
        ];

        const apiRequestData = DEV_RUNCOMM_PAYLOAD;

        console.log("요청 데이터:", JSON.stringify(apiRequestData, null, 2));
        console.log(
          "API 엔드포인트: https://t.at.runcomm.co.kr/service/v1/post/health/care"
        );

        /*
        const response = await fetch(
          "https://t.at.runcomm.co.kr/service/v1/post/health/care",
          {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(apiRequestData),
          }
        );

        const apiData = await response.json();
        */

        // [DEV] MOCK DATA INJECTION
        console.warn("[DEV MODE] Using Mock API Data (IP Restriction Bypass)");
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

        const apiData = [
          { dunjugo: 12500, card_dong_nm: "TestLoc", grade: "A" },
          { dunjugo: 4500 },
          { dunjugo: 8200 }
        ];
        console.log("응답 데이터:", apiData);

        // 런컴 서버 응답 검증
        if (!apiData || Object.keys(apiData).length === 0) {
          console.error("❌ 런컴 서버 응답이 없거나 비어있습니다.");
          document.getElementById("waveLoader").style.display = "none";
          document.getElementById("processingMessages").style.display = "none";
          document.getElementById("errorMessage").style.display = "block";
          document.getElementById("errorMessage").innerHTML = `
              서버 응답을 받지 못했습니다.<br/>
              잠시 후 다시 시도해주세요.<br/><br/>
              <small>디버깅: postcode="${state.postcode}"</small>
            `;
          return;
        }

        // 응답 데이터 구조 파악 및 던져주고 값 저장
        let dunjugoValues = [];
        if (Array.isArray(apiData) && apiData.length > 0) {
          apiData.forEach((item, index) => {
            if (item && item.dunjugo) {
              dunjugoValues.push({
                index: index + 1,
                value: item.dunjugo
              });
            }
          });
        }

        // 던져주고 값 로그
        if (dunjugoValues.length > 0) {
          console.log("=== 던져주고 값 ===");
          dunjugoValues.forEach((dv) => {
            console.log(`  항목${dv.index}: ${dv.value}`);
          });
          console.log("====================");
        }

        if (!state.isTimedOut) {
          clearInterval(msgInterval);

          // GPT Insight 생성 (병렬 호출)
          let gptInsight = "";
          try {
            console.log("[GPT] Generating AI insight...");
            gptInsight = await generateGptInsight({
              resData: apiData,
              dunjugoValues: dunjugoValues,
              filters: {
                gender: "여성",
                age: "30대",
                radius: "1km"
              }
            });
            console.log("[GPT] Insight generated:", gptInsight);
          } catch (gptError) {
            console.warn("[GPT] Failed to generate insight:", gptError);
            gptInsight = GPT_FALLBACK_MESSAGE || "";
          }

          const localData = {
            hospitalName: "체험 병원",
            generalData: {
              gender: "여성",
              age: "30대",
              partnerCd: "성형외과",
              addressBase: hospitalAddressInput?.value,
              addressDetail: ""
            },
            resData: apiData,
            dunjugoValues: dunjugoValues,
            gptInsight: gptInsight // GPT 해석 결과 저장
          };

          localStorage.setItem("touchadData", JSON.stringify(localData));
          localStorage.setItem("address-base", hospitalAddressInput?.value || "");
          localStorage.setItem("address-detail", "");
          localStorage.setItem(
            "dunjugoValues",
            JSON.stringify(dunjugoValues)
          );

          const token = localStorage.getItem("user_token") || generateToken();
          localStorage.setItem("user_token", token);

          console.log("=== 페이지 이동 ===");
          console.log("GPT Insight 저장 완료");
          console.log("====================");

          // decisionSnapshot: Admin Order 생성 시 판단 근거로 사용 (Front는 준비만)
          const decisionSnapshot = {
            total: dunjugoValues[0]?.value || 0,
            age_target: dunjugoValues[1]?.value || 0,
            gender_target: dunjugoValues[2]?.value || 0,
            precision_rate:
              dunjugoValues[0]?.value > 0
                ? (
                    (dunjugoValues[1]?.value / dunjugoValues[0]?.value) *
                    100
                  ).toFixed(1)
                : 0,
            relevance_rate:
              dunjugoValues[0]?.value > 0
                ? (
                    (dunjugoValues[2]?.value / dunjugoValues[0]?.value) *
                    100
                  ).toFixed(1)
                : 0,
            hospital_name: hospitalAddressInput?.value,
            calculated_at: new Date().toISOString()
          };
          localStorage.setItem(
            "pending_decision_snapshot",
            JSON.stringify(decisionSnapshot)
          );
          console.log(
            "[DecisionSnapshot] Prepared (pending_decision_snapshot):",
            decisionSnapshot
          );

          await saveSimulation(
            {
              address: hospitalAddressInput?.value,
              postcode: state.postcode,
              filters: { gender: "여성", age: "30대" }, // 현재 하드코딩된 필터
              source_page: "index.html" // DB source_type 동기화용
            },
            {
              resData: apiData,
              dunjugoValues: dunjugoValues,
              gptInsight: gptInsight
            }
          );

          // Redirect to dashboard
          window.location.href = "/touch/newresult.html";
        }
      } catch (err) {
        console.error("런컴 API 호출 오류:", err);

        const processingMessages = document.querySelectorAll(
          ".processing-messages p"
        );
        const msgInterval = processingMessages?.dataset?.interval;

        if (msgInterval) {
          clearInterval(parseInt(msgInterval, 10));
        }

        document.getElementById("waveLoader").style.display = "none";
        document.getElementById("processingMessages").style.display = "none";
        document.getElementById("errorMessage").style.display = "block";
      }
    }

    state.generateToken = generateToken;
    state.saveSimulation = saveSimulation;
    state.runDemoMode = runDemoMode;
    state.fetchRuncommData = fetchRuncommData;
  }

  window.initIndexSimulation = initIndexSimulation;
})();

