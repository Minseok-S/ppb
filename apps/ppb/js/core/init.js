// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
window.onload = function () {
  renderSteps();
  // 설정 패널 입력칸을 줄바꿈 가능(Shift+Enter)하도록 전환 + 이후 추가 행 감시
  if (typeof setupAutoLine === "function") setupAutoLine();
  // 항상 빈 문서로 시작. 이전 작업이 있으면 상단 배너로 안내하고,
  // 사용자가 "이어서 작업"을 누를 때만 복원한다 (차단형 팝업 없음).
  addCollect("noConsent");
  addCollect("consent");
  if (typeof initAutosaveBanner === "function") initAutosaveBanner();
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
