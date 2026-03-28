// ════════════════════════════════════════
//  DYNAMIC — THIRD PARTY (Step 5)
// ════════════════════════════════════════
function addTP(type) {
  const id = "tp_" + type + "_" + Date.now(),
    c = document.getElementById("tp" + cap(type));
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  const legalBasisHtml =
    type === "legal"
      ? `<div class="field-group"><label class="field-label">제공 법적 근거</label><input type="text" data-field="basis" placeholder="예: 개인정보보호법 제17조①2호, 소득세법 제165조" oninput="syncTP();updatePreview()"></div>`
      : "";
  d.innerHTML = `
    <div class="card-header"><span class="card-title">제공 대상</span><button class="btn-icon" onclick="removeAndSyncTP('${id}')">✕</button></div>
    ${legalBasisHtml}
    <div class="field-row">
      <div class="field-group"><label class="field-label">제공받는 자</label><input type="text" data-field="receiver" placeholder="기관·업체명" oninput="syncTP();updatePreview()"></div>
      <div class="field-group"><label class="field-label">제공 목적</label><input type="text" data-field="purpose" placeholder="목적" oninput="syncTP();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">제공 항목</label><input type="text" data-field="items" placeholder="항목" oninput="syncTP();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보유·이용기간</label><input type="text" data-field="retention" placeholder="기간" oninput="syncTP();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncTP(id) {
  document.getElementById(id)?.remove();
  syncTP();
  updatePreview();
}

function syncTP() {
  ["Consent", "Legal"].forEach((t) => {
    S["tp" + t] = [];
    document.querySelectorAll("#tp" + t + " .card-item").forEach((d) => {
      const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
      S["tp" + t].push({
        basis: g("basis"),
        receiver: g("receiver"),
        purpose: g("purpose"),
        items: g("items"),
        retention: g("retention"),
      });
    });
  });
}
