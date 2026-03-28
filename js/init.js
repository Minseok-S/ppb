// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
window.onload = function () {
  renderSteps();
  addCollect("noConsent");
  addCollect("consent");
  updatePreview();
};

// ════════════════════════════════════════
//  SIDEBAR RESIZE
// ════════════════════════════════════════
(function () {
  const handle = document.getElementById("resizeHandle");
  const sidebar = document.querySelector(".sidebar");
  let dragging = false;
  let startX, startWidth;

  handle.addEventListener("mousedown", function (e) {
    dragging = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    handle.classList.add("dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const newWidth = Math.min(700, Math.max(280, startWidth + delta));
    sidebar.style.width = newWidth + "px";
  });

  document.addEventListener("mouseup", function () {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("dragging");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });
})();
