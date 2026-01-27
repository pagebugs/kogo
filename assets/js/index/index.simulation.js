/**
 * index.simulation.js
 * Runcomm API 호출, 시뮬레이션 저장, 이벤트 로깅
 * @module IndexSimulation
 */

(function() {
  'use strict';

  /**
   * 간단 토큰 생성 (데모용)
   */
  function generateToken() {
    return 'demo_token_' + Date.now();
  }

  /**
   * 이벤트 로그 전송
   */
  async function logDemoClick() {
    try {
      let sessionId = sessionStorage.getItem('event_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('event_session_id', sessionId);
      }

      const payloadData = {
        event_version: 1,
        page: 'index',
        button: 'serviceTrialBtn',
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        page_url: window.location.href,
        client_time_offset: new Date().getTimezoneOffset(),
        referrer: document.referrer || 'direct',
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

      fetch('/api/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'demo_click',
          payload: payloadData
        })
      }).then(res => {
        if (res.ok) console.log('[Event] Demo click logged', payloadData);
      }).catch(err => {
        console.warn('[Event] Log failed:', err);
      });
    } catch (err) {
      console.warn('[Event] Log error', err);
    }
  }

  /**
   * 시뮬레이션 결과 저장 및 로그 전송
   */
  async function saveSimulation(inputData, resultData) {
    try {
      const sessionId = sessionStorage.getItem('event_session_id');
      if (!sessionId) {
        console.warn('[Simulation] No session ID, skipping save');
        return;
      }

      const simUuid = self.crypto && self.crypto.randomUUID 
        ? self.crypto.randomUUID() 
        : 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      const simPayload = {
        sim_uuid: simUuid,
        session_id: sessionId,
        input_data: inputData,
        result_data: resultData
      };

      console.log('[Simulation] Saving...', simPayload);

      const saveRes = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simPayload)
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save simulation');
      }
      
      console.log('[Simulation] Saved successfully');

      // 이벤트 로그 (simulation_run)
      const logPayload = {
        event_version: 1,
        page: 'index',
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        sim_uuid: simUuid,
        trigger: 'demo_completion',
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        client_time_offset: new Date().getTimezoneOffset()
      };

      await fetch('/api/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'simulation_run',
          payload: logPayload
        })
      });
      
      console.log('[Event] Simulation run logged', logPayload);

    } catch (err) {
      console.error('[Simulation] Error:', err);
    }
  }

  /**
   * 데모 모드 실행 (샘플 데이터)
   */
  async function runDemoMode() {
    const sampleData = {
      hospitalName: '데모 병원',
      generalData: {
        gender: '여성',
        age: '30대',
        partnerCd: '성형외과',
        addressBase: '서울특별시 강남구 테헤란로 123 (역삼동)',
        addressDetail: '',
      },
      resData: [
        { dunjugo: 12500 },
        { dunjugo: 7800 },
        { dunjugo: 8200 }
      ],
      dunjugoValues: [
        { index: 1, value: 12500 },
        { index: 2, value: 7800 },
        { index: 3, value: 8200 }
      ],
    };

    localStorage.setItem('touchadData', JSON.stringify(sampleData));
    localStorage.setItem('address-base', sampleData.generalData.addressBase);
    localStorage.setItem('address-detail', '');
    localStorage.setItem('dunjugoValues', JSON.stringify(sampleData.dunjugoValues));

    const token = localStorage.getItem('user_token') || generateToken();
    localStorage.setItem('user_token', token);

    await saveSimulation(
      sampleData.generalData,
      { resData: sampleData.resData, dunjugoValues: sampleData.dunjugoValues }
    );

    window.location.href = '/touch/newresult.html';
  }

  /**
   * Runcomm 서버 API 호출
   */
  async function fetchRuncommData(postcode, hospitalAddress, callbacks) {
    const { onSuccess, onError, onTimeout } = callbacks || {};
    
    const processingMessages = document.querySelectorAll('.processing-messages p');
    const loadingOverlay = document.getElementById('loadingOverlay');
    let msgIndex = 0;
    let isTimedOut = false;

    console.log('=== 런컴 서버 API 호출 시작 ===');
    console.log('우편번호:', postcode);

    try {
      loadingOverlay.style.display = 'flex';

      const msgInterval = setInterval(() => {
        processingMessages.forEach((m) => m.classList.remove('active'));
        processingMessages[msgIndex].classList.add('active');
        msgIndex = (msgIndex + 1) % processingMessages.length;
      }, 3000);

      if (processingMessages.length > 0) {
        processingMessages[0].classList.add('active');
      }

      // [DEV] Mock Data (IP 제한 우회)
      console.warn('[DEV MODE] Using Mock API Data (IP Restriction Bypass)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const apiData = [
        { dunjugo: 12500, card_dong_nm: 'TestLoc', grade: 'A' },
        { dunjugo: 4500 },
        { dunjugo: 8200 }
      ];
      console.log('응답 데이터:', apiData);

      if (!apiData || Object.keys(apiData).length === 0) {
        console.error('❌ 런컴 서버 응답이 없거나 비어있습니다.');
        document.getElementById('waveLoader').style.display = 'none';
        document.getElementById('processingMessages').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
        return;
      }

      // 던져주고 값 추출
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

      if (dunjugoValues.length > 0) {
        console.log('=== 던져주고 값 ===');
        dunjugoValues.forEach(dv => {
          console.log(`  항목${dv.index}: ${dv.value}`);
        });
      }

      if (!isTimedOut) {
        clearInterval(msgInterval);

        // GPT Insight 생성
        let gptInsight = '';
        try {
          console.log('[GPT] Generating AI insight...');
          if (typeof generateGptInsight === 'function') {
            gptInsight = await generateGptInsight({
              resData: apiData,
              dunjugoValues: dunjugoValues,
              filters: { gender: '여성', age: '30대', radius: '1km' }
            });
          }
          console.log('[GPT] Insight generated:', gptInsight);
        } catch (gptError) {
          console.warn('[GPT] Failed to generate insight:', gptError);
          gptInsight = typeof GPT_FALLBACK_MESSAGE !== 'undefined' ? GPT_FALLBACK_MESSAGE : '';
        }

        const localData = {
          hospitalName: '체험 병원',
          generalData: {
            gender: '여성',
            age: '30대',
            partnerCd: '성형외과',
            addressBase: hospitalAddress,
            addressDetail: '',
          },
          resData: apiData,
          dunjugoValues: dunjugoValues,
          gptInsight: gptInsight,
        };

        localStorage.setItem('touchadData', JSON.stringify(localData));
        localStorage.setItem('address-base', hospitalAddress);
        localStorage.setItem('address-detail', '');
        localStorage.setItem('dunjugoValues', JSON.stringify(dunjugoValues));

        const token = localStorage.getItem('user_token') || generateToken();
        localStorage.setItem('user_token', token);

        // Decision Snapshot 저장
        const decisionSnapshot = {
          total: dunjugoValues[0]?.value || 0,
          age_target: dunjugoValues[1]?.value || 0,
          gender_target: dunjugoValues[2]?.value || 0,
          precision_rate: dunjugoValues[0]?.value > 0 ? ((dunjugoValues[1]?.value / dunjugoValues[0]?.value) * 100).toFixed(1) : 0,
          relevance_rate: dunjugoValues[0]?.value > 0 ? ((dunjugoValues[2]?.value / dunjugoValues[0]?.value) * 100).toFixed(1) : 0,
          hospital_name: hospitalAddress,
          calculated_at: new Date().toISOString()
        };
        localStorage.setItem('pending_decision_snapshot', JSON.stringify(decisionSnapshot));
        console.log('[DecisionSnapshot] Prepared:', decisionSnapshot);

        await saveSimulation(
          { 
            address: hospitalAddress,
            postcode: postcode,
            filters: { gender: '여성', age: '30대' },
            source_page: 'index.html'
          },
          { 
            resData: apiData, 
            dunjugoValues: dunjugoValues,
            gptInsight: gptInsight 
          }
        );

        window.location.href = '/touch/newresult.html';
      }
    } catch (err) {
      console.error('런컴 API 호출 오류:', err);
      document.getElementById('waveLoader').style.display = 'none';
      document.getElementById('processingMessages').style.display = 'none';
      document.getElementById('errorMessage').style.display = 'block';
    }
  }

  // 글로벌 네임스페이스 (즉시 등록 - 다른 모듈에서 사용 가능)
  window.IndexSimulation = {
    logDemoClick: logDemoClick,
    saveSimulation: saveSimulation,
    runDemoMode: runDemoMode,
    fetchRuncommData: fetchRuncommData,
    generateToken: generateToken
  };

})();
