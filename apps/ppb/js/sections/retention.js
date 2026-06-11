// ════════════════════════════════════════
//  DYNAMIC — CUSTOM RETENTION
// ════════════════════════════════════════
function addCustomRetentionLegal() {
  const id = "crl_" + Date.now(),
    c = document.getElementById("customRetentionLegal");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">법적 보존항목</span><button class="btn-icon" onclick="removeAndSyncCRL('${id}')">✕</button></div>
    <div class="field-group"><label class="field-label">보존 항목명</label><input type="text" data-field="label" placeholder="예: 전자금융거래 기록" oninput="syncCRL();updatePreview()"></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">근거 법령</label><input type="text" data-field="basis" placeholder="예: 전자금융거래법 제22조" oninput="syncCRL();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보존 기간</label><input type="text" data-field="period" placeholder="예: 5년" oninput="syncCRL();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncCRL(id) {
  document.getElementById(id)?.remove();
  syncCRL();
  updatePreview();
}

function syncCRL() {
  S.customRetentionLegal = [];
  document.querySelectorAll("#customRetentionLegal .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.customRetentionLegal.push({ label: g("label"), basis: g("basis"), period: g("period") });
  });
}

function addCustomRetentionOther() {
  const id = "cro_" + Date.now(),
    c = document.getElementById("customRetentionOther");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">그외 보존항목</span><button class="btn-icon" onclick="removeAndSyncCRO('${id}')">✕</button></div>
    <div class="field-group"><label class="field-label">보존 항목명</label><input type="text" data-field="label" placeholder="예: 서비스 이용 기록" oninput="syncCRO();updatePreview()"></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">보존 사유</label><input type="text" data-field="basis" placeholder="예: 사내 개인정보보호 규정" oninput="syncCRO();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보존 기간</label><input type="text" data-field="period" placeholder="예: 1년" oninput="syncCRO();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncCRO(id) {
  document.getElementById(id)?.remove();
  syncCRO();
  updatePreview();
}

function syncCRO() {
  S.customRetentionOther = [];
  document.querySelectorAll("#customRetentionOther .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.customRetentionOther.push({ label: g("label"), basis: g("basis"), period: g("period") });
  });
}
