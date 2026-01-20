/* =========================================================
   UI Loader - Load Header and Footer dynamically
========================================================= */

document.addEventListener("DOMContentLoaded", function() {
  
  const headerPlaceholder = document.getElementById('include-header');
  const footerPlaceholder = document.getElementById('include-footer');

  // Load Header
  if (headerPlaceholder) {
    fetch('../inc/header.html')
      .then(response => {
        if (!response.ok) throw new Error("Header load failed");
        return response.text();
      })
      .then(data => {
        headerPlaceholder.innerHTML = data;
        // Initialize GNB Interaction
        if (window.initGNB) {
          window.initGNB();
        } else {
          // GNB JS가 아직 로드되지 않았을 경우를 대비해 polling 하거나,
          // script 태그의 순서를 보장해야 함. (여기서는 순서 보장 가정)
          console.warn("initGNB function not found. Ensure gnb.js is loaded.");
        }
      })
      .catch(err => {
        console.error("Error loading header:", err);
        headerPlaceholder.innerHTML = "<div style='padding:20px; text-align:center;'>Header loading failed (CORS restriction on local file?)</div>";
      });
  }

  // Load Footer
  if (footerPlaceholder) {
    fetch('../inc/footer.html')
      .then(response => {
        if (!response.ok) throw new Error("Footer load failed");
        return response.text();
      })
      .then(data => {
        footerPlaceholder.innerHTML = data;
      })
      .catch(err => console.error("Error loading footer:", err));
  }
});
