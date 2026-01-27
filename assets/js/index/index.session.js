/**
 * index.session.js
 * 세션 초기화 및 DB 등록
 * @module IndexSession
 */

(function() {
  'use strict';

  /**
   * 세션 초기화 (DB 등록)
   * @returns {Promise<string>} sessionId
   */
  async function initSession() {
    let sessionId = sessionStorage.getItem('event_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('event_session_id', sessionId);
    }

    // DB에 세션 등록 (실패해도 진행)
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId, 
          user_agent: navigator.userAgent 
        })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[Session] Registered:', data.is_new ? 'NEW' : 'EXISTING', sessionId);
      }
    } catch (e) {
      console.warn('[Session] DB registration failed (fallback to sessionStorage)', e);
    }

    return sessionId;
  }

  /**
   * 현재 세션 ID 반환
   * @returns {string|null}
   */
  function getSessionId() {
    return sessionStorage.getItem('event_session_id');
  }

  // 글로벌 네임스페이스
  window.IndexSession = {
    init: initSession,
    getSessionId: getSessionId
  };

  // DOM 로드 후 초기화 (페이지 가드 포함)
  document.addEventListener('DOMContentLoaded', () => {
    // 페이지 가드: index.html 전용
    if (!document.getElementById('serviceTrialModal')) {
      console.log('[IndexSession] Not index page, skipping auto-init');
      return;
    }
    initSession();
  });

})();
