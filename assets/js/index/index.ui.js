/**
 * index.ui.js
 * Modal, Overlay, 이벤트 리스너 바인딩
 * @module IndexUI
 */

(function() {
  'use strict';

  // 상태 변수 (클로저)
  let postcode = '';
  let isTimedOut = false;
  let isDemoMode = false;
  let overlayTimeout;

  /**
   * Modal 열기
   */
  function openModal(demoMode) {
    const serviceTrialModal = document.getElementById('serviceTrialModal');
    if (!serviceTrialModal) return;
    
    isDemoMode = demoMode || false;
    serviceTrialModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Modal 닫기
   */
  function closeModal() {
    const serviceTrialModal = document.getElementById('serviceTrialModal');
    if (!serviceTrialModal) return;
    
    serviceTrialModal.style.display = 'none';
    document.body.style.overflow = '';
    isDemoMode = false;
  }

  /**
   * Daum 주소 API 호출
   */
  function openPostcodeSearch() {
    const hospitalAddressInput = document.getElementById('hospital-address');
    const submitAddressBtn = document.getElementById('submitAddressBtn');
    
    new daum.Postcode({
      oncomplete: function(data) {
        let roadAddr = data.roadAddress;
        let extraRoadAddr = '';

        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname))
          extraRoadAddr += data.bname;
        if (data.buildingName !== '')
          extraRoadAddr += extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName;
        if (extraRoadAddr !== '') extraRoadAddr = ' (' + extraRoadAddr + ')';

        postcode = data.zonecode;
        if (hospitalAddressInput) hospitalAddressInput.value = `${roadAddr}${extraRoadAddr}`;
        if (submitAddressBtn) submitAddressBtn.disabled = false;
      },
    }).open();
  }

  /**
   * 오버레이 타임아웃 (60초)
   */
  function startOverlayTimeout() {
    overlayTimeout = setTimeout(() => {
      isTimedOut = true;
      const waveLoader = document.getElementById('waveLoader');
      const processingMessages = document.getElementById('processingMessages');
      const errorMessage = document.getElementById('errorMessage');
      
      if (waveLoader) waveLoader.style.display = 'none';
      if (processingMessages) processingMessages.style.display = 'none';
      if (errorMessage) errorMessage.style.display = 'block';
    }, 60000);
  }

  /**
   * DOM 로드 후 이벤트 리스너 바인딩
   */
  function initUI() {
    // 페이지 가드
    const serviceTrialModal = document.getElementById('serviceTrialModal');
    if (!serviceTrialModal) {
      console.log('[IndexUI] Not index page, skipping initialization');
      return;
    }

    // DOM 요소
    const primaryCtaBtn = document.getElementById('primaryCtaBtn');
    const serviceTrialBtn = document.getElementById('serviceTrialBtn');
    const modalClose = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelBtn');
    const addressSearchBtn = document.getElementById('addressSearchBtn');
    const hospitalAddressInput = document.getElementById('hospital-address');
    const submitAddressBtn = document.getElementById('submitAddressBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const retryBtn = document.getElementById('retryBtn');

    // [DEV] 테스트용 버튼 활성화
    if (submitAddressBtn) submitAddressBtn.disabled = false;

    // MutationObserver로 오버레이 감시
    if (loadingOverlay) {
      const observeOverlay = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const errorMessage = document.getElementById('errorMessage');
          if (mutation.target.style.display === 'flex' &&
              errorMessage && errorMessage.style.display === 'none') {
            startOverlayTimeout();
          } else if (mutation.target.style.display === 'none') {
            clearTimeout(overlayTimeout);
          }
        });
      });
      observeOverlay.observe(loadingOverlay, { attributes: true });
    }

    // =========================================================
    // 이벤트 리스너
    // =========================================================

    // Primary CTA: 주소 입력 모달 열기
    primaryCtaBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(false);
    });

    // Secondary CTA: 데모 체험하기
    serviceTrialBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.IndexSimulation) {
        window.IndexSimulation.logDemoClick();
      }
      openModal(false);
    });

    // Modal 닫기
    modalClose?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // 백드롭 클릭으로 닫기
    window.addEventListener('click', (e) => {
      if (e.target === serviceTrialModal) {
        closeModal();
      }
    });

    // 주소 검색 버튼
    addressSearchBtn?.addEventListener('click', openPostcodeSearch);
    hospitalAddressInput?.addEventListener('click', openPostcodeSearch);

    // 주소 제출
    submitAddressBtn?.addEventListener('click', async () => {
      submitAddressBtn.disabled = true;
      submitAddressBtn.textContent = '처리 중...';
      isTimedOut = false;

      if (window.IndexSimulation) {
        await window.IndexSimulation.fetchRuncommData(postcode, hospitalAddressInput.value);
      }
    });

    // 재시도 버튼
    retryBtn?.addEventListener('click', async () => {
      const errorMessage = document.getElementById('errorMessage');
      const waveLoader = document.getElementById('waveLoader');
      const processingMessages = document.getElementById('processingMessages');
      
      if (errorMessage) errorMessage.style.display = 'none';
      if (waveLoader) waveLoader.style.display = 'flex';
      if (processingMessages) processingMessages.style.display = 'block';

      isTimedOut = false;
      if (window.IndexSimulation) {
        await window.IndexSimulation.fetchRuncommData(postcode, hospitalAddressInput.value);
      }
    });

    console.log('[IndexUI] Initialized successfully');
  }

  // 글로벌 네임스페이스
  window.IndexUI = {
    openModal: openModal,
    closeModal: closeModal,
    openPostcodeSearch: openPostcodeSearch,
    init: initUI
  };

  // DOM 로드 후 초기화
  document.addEventListener('DOMContentLoaded', initUI);

})();
