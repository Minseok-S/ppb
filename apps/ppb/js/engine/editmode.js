// ════════════════════════════════════════
//  EDIT MODE — 미리보기 직접 편집
// ════════════════════════════════════════
function toggleEditMode() {
  const content = document.getElementById("previewContent");
  if (!S.editMode) {
    S.editMode = true;
    content.contentEditable = "true";
    content.focus();
    showToast("✏️ 편집모드 — 미리보기 내용을 직접 수정할 수 있습니다.");
  } else {
    S.editMode = false;
    content.contentEditable = "false";
    S.editedHTML = content.innerHTML;
    showToast("✅ 편집 내용이 적용되었습니다. 다운로드에 그대로 반영됩니다.", "success");
  }
  updateEditUI();
}

function revertEdits() {
  if (
    !confirm(
      "수동으로 편집한 내용을 모두 버리고 폼 입력값으로 다시 생성합니다.\n계속할까요?",
    )
  )
    return;
  S.editMode = false;
  S.editedHTML = null;
  document.getElementById("previewContent").contentEditable = "false";
  updateEditUI();
  updatePreview();
  showToast("↺ 편집 전 원본으로 되돌렸습니다.");
}

function updateEditUI() {
  const btn = document.getElementById("editModeBtn");
  const revertBtn = document.getElementById("revertEditBtn");
  const banner = document.getElementById("editBanner");
  const doc = document.querySelector(".preview-doc");
  const hasEdits = S.editedHTML !== null;

  btn.textContent = S.editMode ? "✅ 편집완료" : "✏️ 편집";
  btn.classList.toggle("editing", S.editMode);
  revertBtn.style.display = S.editMode || hasEdits ? "" : "none";
  doc.classList.toggle("edit-active", S.editMode);

  if (S.editMode) {
    banner.textContent =
      "✏️ 편집모드 — 미리보기 문서를 클릭해 내용을 직접 수정하세요. [편집완료]를 누르면 수정 내용이 다운로드에 반영됩니다.";
    banner.style.display = "";
  } else if (hasEdits) {
    banner.textContent =
      "수동 편집 내용이 적용 중입니다 — 설정 패널 변경은 미리보기에 반영되지 않습니다. 반영하려면 [↺ 원본으로]를 누르세요.";
    banner.style.display = "";
  } else {
    banner.style.display = "none";
  }
}
