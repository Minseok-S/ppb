// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
window.onload = function () {
  renderSteps();
  // 법령 보존항목 통합 목록 초기 렌더 (기본 4개 항목 표시)
  if (typeof renderRetentionLegal === "function") renderRetentionLegal();
  // 설정 패널 입력칸을 줄바꿈 가능(Shift+Enter)하도록 전환 + 이후 추가 행 감시
  if (typeof setupAutoLine === "function") setupAutoLine();
  // 항상 빈 문서로 시작. 이전 작업이 있으면 상단 배너로 안내하고,
  // 사용자가 "이어서 작업"을 누를 때만 복원한다 (차단형 팝업 없음).
  if (typeof initAutosaveBanner === "function") initAutosaveBanner();
  updatePreview();
  // 시작 모드 선택 오버레이는 띄우지 않는다 — 항상 빈 문서로 바로 시작.
  // (이어서 작업/신구대조는 상단 툴바의 📂 불러오기 · 🔀 신구대조표로 진입)
};

// ════════════════════════════════════════
//  시작 모드 (신규 / 이어서 / 신구대조)
// ════════════════════════════════════════
function showModeOverlay() {
  const ov = document.getElementById("modeOverlay");
  if (ov) ov.style.display = "flex";
}
function hideModeOverlay() {
  const ov = document.getElementById("modeOverlay");
  if (ov) ov.style.display = "none";
}
function startMode(mode) {
  hideModeOverlay();
  if (mode === "continue") {
    // 저장한 프로젝트 파일 불러오기 (자동저장본이 있으면 상단 배너로도 복원 가능)
    const inp = document.getElementById("projectFileInput");
    if (inp) inp.click();
  } else if (mode === "compare") {
    // 신구대조: PPB로 만든 파일을 불러오면 그 문서가 '현행 기준'이 된다.
    // 이후 18단계를 수정하면 [신구대조표]에서 원본 대비 바뀐 부분이 표로 나온다.
    const btn = document.getElementById("compareBtn");
    if (btn) {
      btn.classList.add("btn-pulse");
      setTimeout(() => btn.classList.remove("btn-pulse"), 8000);
    }
    if (typeof showToast === "function")
      showToast("🔀 현행으로 쓸 PPB 파일(.json/HTML)을 불러오세요. 이후 수정하면 [신구대조표]에 바뀐 부분이 나옵니다.", "");
    const inp = document.getElementById("projectFileInput");
    if (inp) inp.click();
  }
  // mode === "new" 는 이미 빈 문서 상태이므로 오버레이만 닫는다.
}

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
