/* =========================================================
   Multi Dropdown — Antigravity Navigation
   (Refactored for Dynamic Loading)
========================================================= */

window.initGNB = function() {
  // 1. 전역 변수 설정 (함수 내부 탐색)
  const body = document.body;
  const dropdownButtons = document.querySelectorAll(
    '.nav-item[data-type="dropdown"] .nav-button'
  );
  const panels = document.querySelectorAll('.mega-dropdown');

  // 요소가 없으면 종료 (오류 방지)
  if (dropdownButtons.length === 0) return;

  // 2. 핵심 유틸리티 함수
  const openPanel = (panel, btn) => {
    body.classList.add('has-mega-open');
    panels.forEach(p => p.classList.remove('open'));
    dropdownButtons.forEach(b => b.classList.remove('open'));

    panel.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    body.classList.add('has-mega-open');
  };

  const closePanel = (panel, btn) => {
    panel.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');

    const isAnyPanelStillOpen = document.querySelector('.mega-dropdown.open');
    if (!isAnyPanelStillOpen) {
      body.classList.remove('has-mega-open');
    }
  };

  // 3. 드롭다운 이벤트 바인딩
  dropdownButtons.forEach(btn => {
    const panelName = btn.dataset.panel;
    const panel = document.querySelector(`.mega-dropdown[data-panel="${panelName}"]`);

    if (!panel) return;

    btn.addEventListener('mouseenter', () => {
      openPanel(panel, btn);
    });

    panel.addEventListener('mouseenter', () => {
      openPanel(panel, btn);
    });

    btn.addEventListener('mouseleave', (e) => {
      if (e.relatedTarget && panel.contains(e.relatedTarget)) {
          return;
      }
      setTimeout(() => {
          if (!panel.matches(':hover') && !btn.matches(':hover')) {
              closePanel(panel, btn);
          }
      }, 100);
    });

    panel.addEventListener('mouseleave', () => {
      closePanel(panel, btn);
    });
  });

  // Mobile Menu
  const toggle = document.getElementById("mobileToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (toggle && mobileMenu) {
    // 기존 이벤트 리스너 중복 방지를 위해 클론 노드로 교체하거나 플래그 사용
    // 여기서는 간단히 새로 바인딩 (DOM이 새로 생성되었으므로 괜찮음)
    toggle.onclick = () => { // onclick 사용으로 중복 방지
      mobileMenu.style.display =
        mobileMenu.style.display === "block" ? "none" : "block";
    };
  }

  const mobileAccordions = document.querySelectorAll('.mobile-accordion');
  mobileAccordions.forEach(acc => {
    const title = acc.querySelector('.mobile-accordion-title');
    const body = acc.querySelector('.mobile-accordion-body');
    title.onclick = () => {
      const isOpen = body.style.display === 'block';
      body.style.display = isOpen ? 'none' : 'block';
    };
  });
  
  console.log("GNB Initialized");
};
