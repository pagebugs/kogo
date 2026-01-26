/**
 * Value Slider Logic (3x4 Grid Redesign)
 * Handles text updates for the value proposition slider.
 * Focuses on state management only, avoiding direct layout manipulation.
 */

const slides = [
  {
    key: "TARGET",
    main: "의료 서비스가 필요한 사람에게만 도달합니다.",
    desc: "단순 유입이 아닌 실구매력 기반 323만 명의 데이터 분석<br>감(感)이 아닌 행동 데이터로 선별된 가망 환자"
  },
  {
    key: "Time",
    main: "의료 서비스의 니즈가 떠올르는 시간에 도달합니다.",
    desc: "카드 소비 데이터로 검증된 고관여 의료 수요층<br>의료 서비스의 필요가 생기는 바로 그 순간"
  },
  {
    key: "Territory",
    main: "우리 병원을 선택할 수 있는 잠재적 이유를 만듭니다.",
    desc: "거주·근무·이동 동선을 포함한 실제 진료권<br>반경이 아닌 생활 루트 기반 도달 설계"
  }
];

let current = 0;

function renderSlide(index) {
  // Update Text Content
  const mainCopy = document.querySelector('.a3 .main-copy');
  const descCopy = document.querySelector('.a3 .desc-copy');
  const nextTitle = document.querySelector('.c3 .next-title');

  if (mainCopy) mainCopy.innerHTML = slides[index].main;
  if (descCopy) descCopy.innerHTML = slides[index].desc;
  
  // Calculate next index for the hint
  const nextIndex = (index + 1) % slides.length;
  if (nextTitle) nextTitle.innerText = slides[nextIndex].key;
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial Render
  renderSlide(0);

  // Event Listeners
  const nextBtn = document.querySelector('.nav.next');
  const prevBtn = document.querySelector('.nav.prev');

  if (nextBtn) {
    nextBtn.onclick = () => {
      current = (current + 1) % slides.length;
      renderSlide(current);
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      current = (current - 1 + slides.length) % slides.length;
      renderSlide(current);
    };
  }
});
