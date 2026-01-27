(function() {
  function initIndexSession() {
    if (!document.getElementById("serviceTrialModal")) return;

    const state = (window.__indexState = window.__indexState || {});

    async function initSession() {
      let sessionId = sessionStorage.getItem("event_session_id");
      if (!sessionId) {
        sessionId =
          "sess_" +
          Date.now() +
          "_" +
          Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem("event_session_id", sessionId);
      }

      // DB에 세션 등록 (실패해도 진행)
      try {
        const res = await fetch("http://localhost:3000/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            user_agent: navigator.userAgent
          })
        });
        if (res.ok) {
          const data = await res.json();
          console.log(
            "[Session] Registered:",
            data.is_new ? "NEW" : "EXISTING",
            sessionId
          );
        }
      } catch (e) {
        console.warn(
          "[Session] DB registration failed (fallback to sessionStorage)",
          e
        );
      }

      return sessionId;
    }

    // 이벤트 로그 전송 (실험용)
    async function logDemoClick() {
      try {
        // 세션 ID 생성 또는 조회 (브라우저 탭 닫기 전까지 유지)
        let sessionId = sessionStorage.getItem("event_session_id");
        if (!sessionId) {
          sessionId =
            "sess_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem("event_session_id", sessionId);
        }

        // 실제 클라이언트 정보 수집
        const payloadData = {
          event_version: 1, // 데이터 구조 버전
          page: "index",
          button: "serviceTrialBtn",
          timestamp: new Date().toISOString(),

          // [식별 및 추적 정보]
          session_id: sessionId,
          page_url: window.location.href,
          client_time_offset: new Date().getTimezoneOffset(),
          referrer: document.referrer || "direct",

          // [클라이언트 환경 정보 (snake_case 통일)]
          user_agent: navigator.userAgent,
          language: navigator.language,
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        };

        // 로컬 백엔드로 로그 전송
        fetch("http://localhost:3000/api/log-event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            event_type: "demo_click",
            payload: payloadData
          })
        })
          .then((res) => {
            if (res.ok) console.log("[Event] Demo click logged", payloadData);
          })
          .catch((err) => {
            console.warn("[Event] Log failed:", err);
          });
      } catch (err) {
        console.warn("[Event] Log error", err);
      }
    }

    state.initSession = initSession;
    state.logDemoClick = logDemoClick;

    // 페이지 로드 시 세션 초기화
    initSession();
  }

  window.initIndexSession = initIndexSession;
})();

