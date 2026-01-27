/**
 * index.bootstrap.js
 * 진입점 - 초기화 순서 조율
 * @module IndexBootstrap
 */

(function() {
  'use strict';

  // 페이지 가드
  if (!document.getElementById('serviceTrialModal')) {
    console.log('[IndexBootstrap] Not index page, skipping initialization');
    return;
  }

  console.log('[IndexBootstrap] Initializing index page modules...');

  // 모듈 로드 확인
  document.addEventListener('DOMContentLoaded', () => {
    const modules = {
      Session: !!window.IndexSession,
      Simulation: !!window.IndexSimulation,
      UI: !!window.IndexUI
    };

    console.log('[IndexBootstrap] Module status:', modules);

    // 모든 모듈이 로드되었는지 확인
    const allLoaded = Object.values(modules).every(v => v);
    if (allLoaded) {
      console.log('[IndexBootstrap] All modules loaded successfully');
    } else {
      console.warn('[IndexBootstrap] Some modules failed to load:', modules);
    }
  });

})();
