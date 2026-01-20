/* =========================================================
   Multi Dropdown — Antigravity Navigation (Final Integrated Version)
========================================================= */

// 1. 전역 변수 설정
const body = document.body;
const dropdownButtons = document.querySelectorAll(
  '.nav-item[data-type="dropdown"] .nav-button'
);
const panels = document.querySelectorAll('.mega-dropdown');


// 2. 핵심 유틸리티 함수 (중복 제거 및 오버레이 로직 통합)
const openPanel = (panel, btn) => {
  // 모든 패널/버튼 닫기 (새로운 패널 열기 전에 필수)
  body.classList.add('has-mega-open'); // 클래스 추가
  panels.forEach(p => p.classList.remove('open'));
  dropdownButtons.forEach(b => b.classList.remove('open'));

  // 현재 패널/버튼 열기
  panel.classList.add('open');
  btn.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');

  // 오버레이 활성화 (body 클래스 추가)
  body.classList.add('has-mega-open');
};

const closePanel = (panel, btn) => {
  // 현재 패널/버튼 닫기
  panel.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');

  // 오버레이 비활성화 검사:
  // 현재 닫힌 패널을 제외하고, 열려있는 다른 패널이 있는지 확인합니다.
  // 이 검사는 DOM에 '.open' 클래스를 가진 요소가 없는지 확인하므로 안전합니다.
const isAnyPanelStillOpen = document.querySelector('.mega-dropdown.open');
  if (!isAnyPanelStillOpen) {
    body.classList.remove('has-mega-open'); // 클래스 제거
  }
};


// 3. 드롭다운 이벤트 바인딩 (Antigravity 로직 유지)
dropdownButtons.forEach(btn => {
  const panelName = btn.dataset.panel;
  const panel = document.querySelector(`.mega-dropdown[data-panel="${panelName}"]`);

  // 1. 버튼 mouseenter: 열기
  btn.addEventListener('mouseenter', () => {
    openPanel(panel, btn);
  });

  // 2. 패널 mouseenter: 열기 상태 유지
  panel.addEventListener('mouseenter', () => {
    openPanel(panel, btn);
  });

  // 3. 버튼 mouseleave: 지연 닫기 실행 (마우스 이탈 방지)
  btn.addEventListener('mouseleave', (e) => {
    // 버튼을 떠난 마우스가 패널로 이동 중이라면 닫지 않음
    if (e.relatedTarget && panel.contains(e.relatedTarget)) {
        return;
    }
    // 100ms 지연 후 닫기 시도 (마우스 떨림 및 버퍼 공간 커버)
    setTimeout(() => {
        // 100ms 후에도 마우스가 버튼이나 패널 어디에도 없다면 닫습니다.
        if (!panel.matches(':hover') && !btn.matches(':hover')) {
            closePanel(panel, btn);
        }
    }, 100);
  });

  // 4. 패널 mouseleave: 닫기
  panel.addEventListener('mouseleave', () => {
    closePanel(panel, btn);
  });
});


/* =========================================================
   Mobile Menu Toggle / Accordion (기존 로직 유지)
========================================================= */
const toggle = document.getElementById("mobileToggle");
const mobileMenu = document.getElementById("mobileMenu");

toggle.addEventListener("click", () => {
  mobileMenu.style.display =
    mobileMenu.style.display === "block" ? "none" : "block";
});

const mobileAccordions = document.querySelectorAll('.mobile-accordion');

mobileAccordions.forEach(acc => {
  const title = acc.querySelector('.mobile-accordion-title');
  const body = acc.querySelector('.mobile-accordion-body');

  title.addEventListener('click', () => {
    const isOpen = body.style.display === 'block';
    body.style.display = isOpen ? 'none' : 'block';
  });
});