// ════════════════════════════════════════
//  DYNAMIC — BEHAVIORAL
// ════════════════════════════════════════
function addBehavioral() {
  const id = "bh_" + Date.now(),
    c = document.getElementById("bhItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">행태정보 항목</span><button class="btn-icon" onclick="removeAndSyncBH('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">법적 근거</label><input type="text" data-field="legal" placeholder="예: 정보주체 동의" oninput="syncBH();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집 항목</label><input type="text" data-field="items" placeholder="예: 웹사이트 방문·이용 이력" oninput="syncBH();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집 방법</label><input type="text" data-field="method" placeholder="예: 웹사이트 방문 시 자동수집" oninput="syncBH();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집 목적</label><input type="text" data-field="purpose" placeholder="예: 맞춤형 광고 제공" oninput="syncBH();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">보유·이용기간</label><input type="text" data-field="retention" placeholder="예: 수집일로부터 90일" oninput="syncBH();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncBH(id) {
  document.getElementById(id)?.remove();
  syncBH();
  updatePreview();
}

function syncBH() {
  S.bhItems = [];
  document.querySelectorAll("#bhItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.bhItems.push({
      legal: g("legal"),
      items: g("items"),
      method: g("method"),
      purpose: g("purpose"),
      retention: g("retention"),
    });
  });
}

// ════════════════════════════════════════
//  DYNAMIC — TP PROVIDE (행태정보 제3자 제공)
// ════════════════════════════════════════
function addTpItem() {
  const id = "tp_" + Date.now(),
    c = document.getElementById("tpBhItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">제3자 제공 항목</span><button class="btn-icon" onclick="removeAndSyncBhTP('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">법적 근거</label><input type="text" data-field="legal" placeholder="예: 정보주체 동의" oninput="syncBhTP();updatePreview()"></div>
      <div class="field-group"><label class="field-label">제공받는 자</label><input type="text" data-field="recipient" placeholder="예: 광고사업자명" oninput="syncBhTP();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">제공 항목</label><input type="text" data-field="items" placeholder="예: 방문이력, 구매이력" oninput="syncBhTP();updatePreview()"></div>
      <div class="field-group"><label class="field-label">이용 목적</label><input type="text" data-field="purpose" placeholder="예: 맞춤형 광고 제공" oninput="syncBhTP();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">보유·이용기간</label><input type="text" data-field="retention" placeholder="예: 제공일로부터 1년" oninput="syncBhTP();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

// [fix] renamed from removeAndSyncTP to removeAndSyncBhTP to avoid conflict with thirdparty.js
function removeAndSyncBhTP(id) {
  document.getElementById(id)?.remove();
  syncBhTP();
  updatePreview();
}

// [fix] renamed from syncTP to syncBhTP to avoid conflict with thirdparty.js
function syncBhTP() {
  S.bhTpItems = [];
  document.querySelectorAll("#tpBhItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.bhTpItems.push({
      legal: g("legal"),
      recipient: g("recipient"),
      items: g("items"),
      purpose: g("purpose"),
      retention: g("retention"),
    });
  });
}

// ════════════════════════════════════════
//  DYNAMIC — AUTO DEVICE (제3자 자동수집장치)
// ════════════════════════════════════════
function addAutoDevice() {
  const id = "ad_" + Date.now(),
    c = document.getElementById("adItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">자동수집장치</span><button class="btn-icon" onclick="removeAndSyncAD('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집장치 명칭</label><input type="text" data-field="device" placeholder="예: Google Analytics 4" oninput="syncAD();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집장치 종류</label><input type="text" data-field="type" placeholder="예: 쿠키, SDK" oninput="syncAD();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집해가는 사업자</label><input type="text" data-field="company" placeholder="예: Google LLC" oninput="syncAD();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집해가는 항목</label><input type="text" data-field="items" placeholder="예: 방문이력, 클릭 이벤트" oninput="syncAD();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집해가는 목적</label><input type="text" data-field="purpose" placeholder="예: 온라인 맞춤형 광고" oninput="syncAD();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncAD(id) {
  document.getElementById(id)?.remove();
  syncAD();
  updatePreview();
}

function syncAD() {
  S.bhAutoDevices = [];
  document.querySelectorAll("#adItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.bhAutoDevices.push({
      device: g("device"),
      type: g("type"),
      company: g("company"),
      items: g("items"),
      purpose: g("purpose"),
    });
  });
}
