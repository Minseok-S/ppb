// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
window.onload = function () {
  renderSteps();
  // 설정 패널 입력칸을 줄바꿈 가능(Shift+Enter)하도록 전환 + 이후 추가 행 감시
  if (typeof setupAutoLine === "function") setupAutoLine();
  // 자동 저장된 작업이 있으면 이어서 복원, 없으면 기본 행으로 시작
  const restored =
    typeof tryRestoreAutosave === "function" && tryRestoreAutosave();
  if (!restored) {
    addCollect("noConsent");
    addCollect("consent");
  }
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
