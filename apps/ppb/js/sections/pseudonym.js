// ════════════════════════════════════════
//  DYNAMIC — PSEUDONYM (Step 15)
// ════════════════════════════════════════
function addPseudo() {
  const id = "pseudo_" + Date.now();
  const c = document.getElementById("pseudonymRows");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">가명처리 항목</span><button class="btn-icon" onclick="removePseudo('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">구분</label><input type="text" data-field="category" placeholder="예: 내부 통계, 연구 목적" oninput="syncPseudo();updatePreview()"></div>
      <div class="field-group"><label class="field-label">처리 목적</label><input type="text" data-field="purpose" placeholder="예: 통계작성, 과학적 연구" oninput="syncPseudo();updatePreview()"></div>
    </div>
    <div class="field-row" style="margin-top:6px">
      <div class="field-group"><label class="field-label">이용 항목</label><input type="text" data-field="items" placeholder="예: 이름→코드, 연락처→마스킹" oninput="syncPseudo();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보유 및 이용 기간</label><input type="text" data-field="retention" placeholder="예: 처리 목적 달성 후 즉시 파기" oninput="syncPseudo();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removePseudo(id) {
  document.getElementById(id)?.remove();
  syncPseudo();
  updatePreview();
}

function syncPseudo() {
  S.pseudonymRows = [];
  document.querySelectorAll("#pseudonymRows .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.pseudonymRows.push({
      category: g("category"),
      purpose: g("purpose"),
      items: g("items"),
      retention: g("retention"),
    });
  });
}

function addPseudoProvide() {
  const id = "pseudotp_" + Date.now();
  const c = document.getElementById("pseudonymProvideRows");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">제공 항목</span><button class="btn-icon" onclick="removePseudoProvide('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">제공받는 자</label><input type="text" data-field="recipient" placeholder="기관·업체명" oninput="syncPseudoProvide();updatePreview()"></div>
      <div class="field-group"><label class="field-label">제공 항목</label><input type="text" data-field="items" placeholder="예: 연령대, 접속지역" oninput="syncPseudoProvide();updatePreview()"></div>
    </div>
    <div class="field-row" style="margin-top:6px">
      <div class="field-group"><label class="field-label">제공 목적</label><input type="text" data-field="purpose" placeholder="예: 통계 분석 서비스 제공" oninput="syncPseudoProvide();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보유 기간</label><input type="text" data-field="retention" placeholder="예: 계약 종료 후 즉시 파기" oninput="syncPseudoProvide();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removePseudoProvide(id) {
  document.getElementById(id)?.remove();
  syncPseudoProvide();
  updatePreview();
}

function syncPseudoProvide() {
  S.pseudonymProvideRows = [];
  document.querySelectorAll("#pseudonymProvideRows .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.pseudonymProvideRows.push({
      recipient: g("recipient"),
      items: g("items"),
      purpose: g("purpose"),
      retention: g("retention"),
    });
  });
}

function syncPseudoSecurity() {
  const ps = S.pseudonymSecurity;
  ["ps_mgmt","ps_edu","ps_org","ps_sep","ps_destroy","ps_access","ps_log","ps_sec","ps_phys"].forEach((k) => {
    const el = document.querySelector(`.toggle-item[data-key="${k}"]`);
    if (el) ps[k] = el.classList.contains("checked");
  });
}
