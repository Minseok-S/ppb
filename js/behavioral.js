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
//  DYNAMIC — AUTO DEVICE (제3자 웹·앱에서 수집) = 가이드 §14 ④
// ════════════════════════════════════════
function addAutoDevice() {
  const id = "ad_" + Date.now(),
    c = document.getElementById("adItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">제3자 웹·앱 수집 항목</span><button class="btn-icon" onclick="removeAndSyncAD('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">법적 근거</label><input type="text" data-field="legal" placeholder="예: 「개인정보 보호법」제15조제1항제1호 (동의)" oninput="syncAD();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집 항목</label><input type="text" data-field="items" placeholder="예: 타사 웹사이트 방문·이용 이력" oninput="syncAD();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집 방법</label><input type="text" data-field="method" placeholder="예: 타사 웹사이트 방문·이용 시 자동수집" oninput="syncAD();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집 목적</label><input type="text" data-field="purpose" placeholder="예: 관심에 기반한 맞춤형 광고 제공" oninput="syncAD();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">보유·이용기간</label><input type="text" data-field="retention" placeholder="예: 수집일로부터 90일" oninput="syncAD();updatePreview()"></div>
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
      legal: g("legal"),
      items: g("items"),
      method: g("method"),
      purpose: g("purpose"),
      retention: g("retention"),
    });
  });
}

// ════════════════════════════════════════
//  DYNAMIC — COOKIE EXT DEVICES (제3자가 수집해가는 자동수집장치) = 가이드 §15
// ════════════════════════════════════════
function addCookieExtDevice() {
  const id = "ced_" + Date.now(),
    c = document.getElementById("cedItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">제3자 자동수집장치</span><button class="btn-icon" onclick="removeAndSyncCED('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집장치 명칭</label><input type="text" data-field="device" placeholder="예: □□ 태그, △△ SDK" oninput="syncCED();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집장치 종류</label><input type="text" data-field="type" placeholder="예: 자바스크립트(웹), SDK(앱)" oninput="syncCED();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집해가는 사업자</label><input type="text" data-field="company" placeholder="예: ㈜OOO, OOO Inc" oninput="syncCED();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집해가는 행태정보 항목</label><input type="text" data-field="items" placeholder="예: 웹사이트 방문 이력, 광고식별자" oninput="syncCED();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집해가는 목적</label><input type="text" data-field="purpose" placeholder="예: 맞춤형 광고 게재" oninput="syncCED();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncCED(id) {
  document.getElementById(id)?.remove();
  syncCED();
  updatePreview();
}

function syncCED() {
  S.cookieExtDevices = [];
  document.querySelectorAll("#cedItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.cookieExtDevices.push({
      device: g("device"),
      type: g("type"),
      company: g("company"),
      items: g("items"),
      purpose: g("purpose"),
    });
  });
}
