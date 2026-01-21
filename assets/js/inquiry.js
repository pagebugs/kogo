/**
 * Contextual Inquiry UX Module
 * ⚠️ This is NOT a CS ticket system.
 * Inquiry captures where user understanding stopped at a specific data context.
 * 
 * Dependencies:
 * - sessionStorage.event_session_id (세션 ID)
 * - localStorage.touchadData (시뮬레이션 데이터)
 * - baseTotal, baseAge, baseGender (dashboard 변수)
 */

(function() {
  'use strict';

  const ORDER_THRESHOLD = 5000; // 조건부 Order 노출 기준값
  const API_BASE = 'http://localhost:3000';

  // Modal Elements
  let openInquiryBtn, inquiryModal, closeInquiryBtn, cancelInquiryBtn;
  let inquiryForm, inquirySuccessModal, closeSuccessBtn, orderNextStepBtn;

  // Dashboard data references (set by initInquiry)
  let dashboardData = {
    baseTotal: 0,
    baseAge: 0,
    baseGender: 0
  };

  /**
   * Initialize Inquiry Module
   * @param {Object} data - Dashboard data { baseTotal, baseAge, baseGender }
   */
  function initInquiry(data) {
    dashboardData = data || dashboardData;

    // Cache DOM elements
    openInquiryBtn = document.getElementById('openInquiryBtn');
    inquiryModal = document.getElementById('inquiryModal');
    closeInquiryBtn = document.getElementById('closeInquiryBtn');
    cancelInquiryBtn = document.getElementById('cancelInquiryBtn');
    inquiryForm = document.getElementById('inquiryForm');
    inquirySuccessModal = document.getElementById('inquirySuccessModal');
    closeSuccessBtn = document.getElementById('closeSuccessBtn');
    orderNextStepBtn = document.getElementById('orderNextStepBtn');

    if (!inquiryModal || !inquiryForm) {
      console.warn('[Contextual Inquiry] Modal elements not found');
      return;
    }

    bindEvents();
    console.log('[Contextual Inquiry] Module initialized');
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    openInquiryBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(inquiryModal);
      console.log('[Contextual Inquiry] Modal opened');
    });

    closeInquiryBtn?.addEventListener('click', () => closeModal(inquiryModal));
    cancelInquiryBtn?.addEventListener('click', () => closeModal(inquiryModal));
    closeSuccessBtn?.addEventListener('click', () => closeModal(inquirySuccessModal));

    // Backdrop click to close
    inquiryModal?.querySelector('.inquiry-modal-backdrop')?.addEventListener('click', () => {
      closeModal(inquiryModal);
    });

    inquirySuccessModal?.querySelector('.inquiry-modal-backdrop')?.addEventListener('click', () => {
      closeModal(inquirySuccessModal);
    });

    // Form submit
    inquiryForm?.addEventListener('submit', handleFormSubmit);

    // Order next step button
    orderNextStepBtn?.addEventListener('click', handleOrderNextStep);
  }

  /**
   * Build context snapshot (auto-collected)
   */
  function buildContextSnapshot() {
    const sessionId = sessionStorage.getItem('event_session_id');
    const storedData = localStorage.getItem('touchadData');
    const parsedData = storedData ? JSON.parse(storedData) : {};

    return {
      session_id: sessionId,
      simulation_id: parsedData.sim_uuid || null,
      hospital_name: parsedData.hospitalName || parsedData.generalData?.addressBase || '체험 병원',
      source_page: 'newresult.html',
      captured_at: new Date().toISOString(),
      resData_snapshot: {
        total: dashboardData.baseTotal,
        age: dashboardData.baseAge,
        gender: dashboardData.baseGender,
        radius: parsedData.generalData?.radius || '700m',
        period: '최근 4주'
      }
    };
  }

  /**
   * Modal open/close utilities
   */
  function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * Handle form submit
   */
  /**
   * Handle form submit
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = inquiryForm.querySelector('button[type="submit"]');
    
    // A. 중복 전송 방지
    if (submitBtn.disabled) {
      console.log('[Sales Lead] Duplicate submission prevented');
      return;
    }

    // 1. Collect Contact Info
    const phone = document.getElementById('contactPhone').value.trim();
    const email = document.getElementById('contactEmail').value.trim();

    if (!phone) {
      alert('연락받으실 전화번호를 입력해주세요.');
      return;
    }

    // 2. Collect Interest Tags
    const interestTags = [];
    const checkboxes = inquiryForm.querySelectorAll('input[name="interest"]:checked');
    checkboxes.forEach((cb) => interestTags.push(cb.value));

    const sessionId = sessionStorage.getItem('event_session_id');
    if (!sessionId) {
      alert('세션 정보가 없습니다. 페이지를 새로고침 해주세요.');
      return;
    }

    // C. context_snapshot 무결성 검증
    const contextSnapshot = buildContextSnapshot();

    if (!contextSnapshot.resData_snapshot.total || contextSnapshot.resData_snapshot.total <= 0) {
      console.warn('[Sales Lead] resData.total is empty, applying fallback');
      contextSnapshot.resData_snapshot.total = 1;
      contextSnapshot.resData_snapshot._fallback_applied = true;
    }

    const storedData = localStorage.getItem('touchadData');
    const parsedData = storedData ? JSON.parse(storedData) : {};

    // 3. User Content (Textarea)
    const extraContent = document.getElementById('inquiryContent')?.value.trim();

    const payload = {
      session_id: sessionId,
      contact: {
        phone: phone,
        email: email || null
      },
      interest_tags: interestTags,
      sim_uuid: parsedData.sim_uuid || null,
      context_snapshot: contextSnapshot,
      content: extraContent || null
    };

    console.log('[Sales Lead] Submitting:', payload);

    // A. 중복 전송 방지 - 버튼 disabled
    submitBtn.disabled = true;
    submitBtn.textContent = '처리 중...';

    try {
      const res = await fetch(`${API_BASE}/api/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.hint || 'Unknown error');
      }

      const result = await res.json();
      console.log('[Sales Lead] Created:', result);

      // Close input modal
      closeModal(inquiryModal);
      inquiryForm.reset();

      // Show success modal
      document.getElementById('inquirySuccessId').textContent = result.inquiry_id;
      openModal(inquirySuccessModal);

      // 조건부 Order CTA 노출 판별
      const orderCtaSection = document.getElementById('orderCtaSection');
      if (contextSnapshot.resData_snapshot.total >= ORDER_THRESHOLD) {
        orderCtaSection.style.display = 'block';
        console.log('[Sales Lead] Order CTA shown (total >= threshold)');
      } else {
        orderCtaSection.style.display = 'none';
      }

    } catch (err) {
      console.error('[Sales Lead] Error:', err);
      // B. 실패 UX 개선
      alert('요청을 기록하지 못했습니다. 잠시 후 다시 시도해 주세요.\n\n(상세: ' + err.message + ')');
    } finally {
      // A. 중복 전송 방지 - 버튼 복원
      submitBtn.disabled = false;
      submitBtn.textContent = '설명 요청하기';
    }
  }

  /**
   * Handle order next step button
   */
  function handleOrderNextStep() {
    closeModal(inquirySuccessModal);
    const subscriptionCard = document.querySelector('.subscription-card');
    if (subscriptionCard) {
      subscriptionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      subscriptionCard.classList.add('highlight-pulse');
      setTimeout(() => subscriptionCard.classList.remove('highlight-pulse'), 2000);
    }
  }

  // Export to global scope
  window.InquiryModule = {
    init: initInquiry
  };

})();
