// ════════════════════════════════════════
//  DYNAMIC — SENSITIVE (Step 14)
// ════════════════════════════════════════
function addSensitive() {
  const id = "sen_" + Date.now();
  const c = document.getElementById("sensitiveRows");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">항목</span><button class="btn-icon" onclick="removeSensitive('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">재화 또는 서비스 명</label><input type="text" data-field="service" placeholder="예: 지도 서비스, 커뮤니티" oninput="syncSensitive();updatePreview()"></div>
      <div class="field-group"><label class="field-label">민감정보</label><input type="text" data-field="types" placeholder="예: 건강, 유전정보" oninput="syncSensitive();updatePreview()"></div>
    </div>
    <div class="field-row" style="margin-top:6px">
      <div class="field-group"><label class="field-label">공개 가능성</label><input type="text" data-field="exposure" placeholder="예: 정보주체가 직접 입력한 건강정보 포함 폴더 공개 시 노출" oninput="syncSensitive();updatePreview()"></div>
      <div class="field-group"><label class="field-label">비공개 선택 방법</label><input type="text" data-field="optout" placeholder="예: 게시물 비공개 처리 또는 삭제" oninput="syncSensitive();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeSensitive(id) {
  document.getElementById(id)?.remove();
  syncSensitive();
  updatePreview();
}

function syncSensitive() {
  S.sensitiveRows = [];
  document.querySelectorAll("#sensitiveRows .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.sensitiveRows.push({
      service: g("service"),
      types: g("types"),
      exposure: g("exposure"),
      optout: g("optout"),
    });
  });
}
