(function() {
  function initIndexUI() {
    const serviceTrialModal = document.getElementById("serviceTrialModal");
    if (!serviceTrialModal) return;

    const state = (window.__indexState = window.__indexState || {});

    state.refs = state.refs || {};
    state.refs.heroTitle = document.querySelector(".hero-title");
    state.refs.headerPlaceholder = document.getElementById("include-header");
    state.refs.primaryCtaBtn = document.getElementById("primaryCtaBtn");
    state.refs.serviceTrialBtn = document.getElementById("serviceTrialBtn");
    state.refs.serviceTrialModal = serviceTrialModal;
    state.refs.modalClose = document.querySelector(".modal-close");
    state.refs.cancelBtn = document.getElementById("cancelBtn");
    state.refs.addressSearchBtn = document.getElementById("addressSearchBtn");
    state.refs.hospitalAddressInput = document.getElementById("hospital-address");
    state.refs.submitAddressBtn = document.getElementById("submitAddressBtn");
    state.refs.loadingOverlay = document.getElementById("loadingOverlay");
    state.refs.retryBtn = document.getElementById("retryBtn");

    const {
      heroTitle,
      headerPlaceholder,
      primaryCtaBtn,
      serviceTrialBtn,
      modalClose,
      cancelBtn,
      addressSearchBtn,
      hospitalAddressInput,
      submitAddressBtn,
      loadingOverlay,
      retryBtn
    } = state.refs;

    // [DEV] Enable button for testing
    if (submitAddressBtn) submitAddressBtn.disabled = false;

    state.postcode = state.postcode || "";
    state.isTimedOut = false;
    state.isDemoMode = false;
    state.overlayTimeout = state.overlayTimeout || null;

    const ENABLE_HERO_TYPING = false;

    function runHeroTyping() {
      if (
        !ENABLE_HERO_TYPING ||
        !heroTitle ||
        !window.gsap ||
        heroTitle.dataset.typed === "true"
      ) {
        return;
      }
      const fullText = heroTitle.textContent.trim();
      const chars = [...fullText];
      const typedState = { index: 0 };

      heroTitle.textContent = "";
      const textSpan = document.createElement("span");
      const caretSpan = document.createElement("span");
      caretSpan.className = "hero-title-caret";
      caretSpan.textContent = "|";
      heroTitle.append(textSpan, caretSpan);

      gsap.to(typedState, {
        index: chars.length,
        duration: chars.length * 0.05,
        ease: "none",
        onUpdate: () => {
          textSpan.textContent = chars
            .slice(0, Math.floor(typedState.index))
            .join("");
        }
      });
      heroTitle.dataset.typed = "true";
    }

    // Prefer running after the async header load completes.
    document.addEventListener("header:loaded", runHeroTyping, { once: true });
    if (headerPlaceholder && headerPlaceholder.children.length > 0) {
      runHeroTyping();
    } else {
      // Fallback in case header loading is slow or fails.
      setTimeout(runHeroTyping, 300);
    }

    function openModal(demoMode) {
      state.isDemoMode = demoMode === true;
      serviceTrialModal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      serviceTrialModal.style.display = "none";
      document.body.style.overflow = "";
      state.isDemoMode = false;
    }

    function openPostcodeSearch() {
      new daum.Postcode({
        oncomplete: function(data) {
          let roadAddr = data.roadAddress;
          let extraRoadAddr = "";

          if (data.bname !== "" && /[동|로|가]$/g.test(data.bname))
            extraRoadAddr += data.bname;
          if (data.buildingName !== "")
            extraRoadAddr +=
              extraRoadAddr !== ""
                ? ", " + data.buildingName
                : data.buildingName;
          if (extraRoadAddr !== "") extraRoadAddr = " (" + extraRoadAddr + ")";

          state.postcode = data.zonecode;
          hospitalAddressInput.value = `${roadAddr}${extraRoadAddr}`;
          submitAddressBtn.disabled = false;
        }
      }).open();
    }

    // 60초 타임아웃
    function startOverlayTimeout() {
      state.overlayTimeout = setTimeout(() => {
        state.isTimedOut = true;
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
      }, 60000);
    }

    // 오버레이 표시 시 타임아웃 시작
    const observeOverlay = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.target.style.display === "flex" &&
          document.getElementById("errorMessage").style.display === "none"
        ) {
          startOverlayTimeout();
        } else if (mutation.target.style.display === "none") {
          clearTimeout(state.overlayTimeout);
        }
      });
    });

    if (loadingOverlay) {
      observeOverlay.observe(loadingOverlay, { attributes: true });
    }

    state.openModal = openModal;
    state.closeModal = closeModal;
    state.openPostcodeSearch = openPostcodeSearch;

    // 이벤트 리스너
    primaryCtaBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(false);
    });

    serviceTrialBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      state.logDemoClick?.();
      openModal(false);
    });

    modalClose?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);

    window.addEventListener("click", (e) => {
      if (e.target === serviceTrialModal) {
        closeModal();
      }
    });

    addressSearchBtn?.addEventListener("click", openPostcodeSearch);
    hospitalAddressInput?.addEventListener("click", openPostcodeSearch);

    submitAddressBtn?.addEventListener("click", async () => {
      submitAddressBtn.disabled = true;
      submitAddressBtn.textContent = "처리 중...";
      state.isTimedOut = false;

      await state.fetchRuncommData?.();
    });

    retryBtn?.addEventListener("click", async () => {
      document.getElementById("errorMessage").style.display = "none";
      document.getElementById("waveLoader").style.display = "flex";
      document.getElementById("processingMessages").style.display = "block";

      state.isTimedOut = false;
      await state.fetchRuncommData?.();
    });
  }

  window.initIndexUI = initIndexUI;
})();

