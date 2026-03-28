// ════════════════════════════════════════
//  DYNAMIC — OVERSEAS
// ════════════════════════════════════════
function addOverseas() {
  const id = "ot_" + Date.now(),
    c = document.getElementById("otItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">이전 대상</span><button class="btn-icon" onclick="removeAndSyncOT('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">이전받는 자</label><input type="text" data-field="receiver" placeholder="업체명·연락처" oninput="syncOT();updatePreview()"></div>
      <div class="field-group"><label class="field-label">이전 국가</label><input type="text" data-field="country" placeholder="예: 미국" oninput="syncOT();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">이전 항목</label><input type="text" data-field="items" placeholder="항목" oninput="syncOT();updatePreview()"></div>
      <div class="field-group"><label class="field-label">이용 목적</label><input type="text" data-field="purpose" placeholder="목적" oninput="syncOT();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">이전 시기·방법</label><input type="text" data-field="method" placeholder="예: 서비스 이용 시점, VPN 전송" oninput="syncOT();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보유·이용기간</label><input type="text" data-field="retention" placeholder="기간" oninput="syncOT();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncOT(id) {
  document.getElementById(id)?.remove();
  syncOT();
  updatePreview(); // [fix] was missing in original
}

function syncOT() {
  S.otItems = [];
  document.querySelectorAll("#otItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.otItems.push({
      receiver: g("receiver"),
      country: g("country"),
      items: g("items"),
      purpose: g("purpose"),
      method: g("method"),
      retention: g("retention"),
    });
  });
  S.otRefuseDisadvantage = document.getElementById("otRefuseDisadvantage")?.value || "";
  S.otRefuseMethod = document.getElementById("otRefuseMethod")?.value || "";
}
