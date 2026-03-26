// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
const S = {
  companyName: "",
  serviceName: "",
  effectiveDate: "",
  collectNoConsent: [],
  collectConsent: [],
  collectOther: [],
  collectAuto: [],
  child: "no",
  childItems: "",
  childMethod: "",
  retention: { contract: true, dispute: true, ad: true, log: true },
  customRetentionLegal: [],
  customRetentionOther: [],
  destroy: { electronic: true, paper: true },
  thirdParty: "no",
  tpConsent: [],
  tpLegal: [],
  delegate: "no",
  dlItems: [],
  dlSubItems: [],
  overseas: "no",
  otItems: [],
  otRefuseDisadvantage: "",
  otRefuseMethod: "",
  security: {
    s_plan: true,
    s_edu: true,
    s_org: false,
    s_access: true,
    s_encrypt: true,
    s_sec: true,
    s_log: false,
    s_vuln: false,
    s_phys: true,
    s_media: false,
    s_isms: false,
    s_isms_cert: false,
    s_mgmt_extra: [],
    s_tech_extra: [],
    s_phys_extra: [],
    s_cert_extra: [],
  },
  cookie: "yes",
  browser: { b_chrome: true, b_edge: true, b_chrome_m: false, b_safari: false, b_samsung: false },
  behavioral: "no",
  bhItems: [],
  rights: {
    r_written: true,
    r_phone: true,
    r_email: true,
    r_fax: false,
    r_web: false,
  },
  rightsPath: "",
  mydata: "no",
  cpoName: "",
  cpoTitle: "",
  cpoPhone: "",
  cpoEmail: "",
  depts: [{ name: "", phone: "", email: "" }],
  agency: { ag_kopico: true, ag_kisa: true, ag_spo: true, ag_police: true },
  addUsage: "no",
  addUsageText: "",
  sensitive: "no",
  sensitiveText: "",
  pseudonym: "no",
  pseudonymText: "",
  autoDecision: "no",
  autoDecisionText: "",
  domAgent: "no",
  daName: "",
  daPhone: "",
  daAddr: "",
  daEmail: "",
};

// ════════════════════════════════════════
//  STEP NAV
// ════════════════════════════════════════
let curStep = 1;
const TOTAL = 13;
const stepLabels = [
  "기본 정보",
  "수집 항목",
  "아동 개인정보",
  "파기",
  "제3자 제공",
  "위탁",
  "국외이전",
  "안전조치",
  "쿠키",
  "행태정보",
  "권리행사",
  "책임자",
  "추가항목",
];

function goStep(n) {
  document.getElementById("step" + curStep).classList.remove("active");
  document
    .querySelector('[data-step="' + curStep + '"]')
    .classList.remove("active");
  curStep = n;
  document.getElementById("step" + curStep).classList.add("active");
  document
    .querySelector('[data-step="' + curStep + '"]')
    .classList.add("active");
  document.getElementById("progressFill").style.width =
    Math.round((curStep / TOTAL) * 100) + "%";
  document.getElementById("progressText").textContent =
    "STEP " + curStep + "/" + TOTAL + " · " + stepLabels[curStep - 1];
  document.getElementById("prevBtn").style.display =
    curStep > 1 ? "flex" : "none";
  document.getElementById("nextBtn").style.display =
    curStep < TOTAL ? "flex" : "none";
}
function nextStep() {
  if (curStep < TOTAL) {
    document
      .querySelector('[data-step="' + curStep + '"]')
      .classList.add("done");
    goStep(curStep + 1);
  }
}
function prevStep() {
  if (curStep > 1) goStep(curStep - 1);
}

// ════════════════════════════════════════
//  RADIO / TOGGLE HELPERS
// ════════════════════════════════════════
function selectR(onId, offId, key, val) {
  document.getElementById(onId).classList.add("selected");
  document.getElementById(offId).classList.remove("selected");
  S[key] = val;
  // show/hide detail panels
  const map = {
    child: ["childDetail", "yes"],
    thirdParty: ["tpDetail", "yes"],
    delegate: ["dlDetail", "yes"],
    overseas: ["otDetail", "yes"],
    cookie: ["cookieDetail", "yes"],
    behavioral: ["bhDetail", "yes"],
    addUsage: ["addUsageDetail", "yes"],
    sensitive: ["sensitiveDetail", "yes"],
    pseudonym: ["pseudonymDetail", "yes"],
    autoDecision: ["autoDecisionDetail", "yes"],
    domAgent: ["domAgentDetail", "yes"],
  };
  if (map[key]) {
    const [panelId, showVal] = map[key];
    const el = document.getElementById(panelId);
    if (el) el.style.display = val === showVal ? "block" : "none";
    if (key === "child" && val === showVal) syncChildItems();
  }
  updatePreview();
}

function toggleItem(el, group) {
  el.classList.toggle("checked");
  const key = el.dataset.key;
  const maps = {
    retention: S.retention,
    destroy: S.destroy,
    security: S.security,
    browser: S.browser,
    rights: S.rights,
    agency: S.agency,
  };
  if (maps[group]) maps[group][key] = el.classList.contains("checked");
  updatePreview();
}

// ════════════════════════════════════════
//  DYNAMIC ROWS — COLLECT
// ════════════════════════════════════════
const basisOpts = [
  { v: "contract", l: "제15조①4호 (계약 체결·이행)" },
  { v: "consent", l: "제15조①1호 (정보주체 동의)" },
  { v: "legal", l: "제15조①2호 (법률 특별 규정)" },
  { v: "public", l: "제15조①3호 (공공기관 소관업무)" },
  { v: "interest", l: "제15조①6호 (정당한 이익)" },
];
const basisMap = Object.fromEntries(
  basisOpts.map((o) => [o.v, "「개인정보 보호법」 " + o.l]),
);

function addCollect(type) {
  const cid = "ci_" + type + "_" + Date.now();
  const container = document.getElementById("collect" + cap(type));
  const num = container.children.length + 1;
  const needBasis = type !== "auto";
  const div = document.createElement("div");
  div.className = "card-item";
  div.id = cid;
  div.innerHTML = `
    <div class="card-header"><span class="card-title">#${num}</span><button class="btn-icon" onclick="removeAndSync('${cid}','${type}')">✕</button></div>
    ${needBasis ? `<div class="field-group"><label class="field-label">법적 근거</label><select data-field="basis" onchange="syncCollect('${type}');updatePreview()">${basisOpts.map((o) => `<option value="${o.v}">${o.l}</option>`).join("")}</select></div>` : ""}
    <div class="field-row">
      <div class="field-group"><label class="field-label">구분</label><input type="text" data-field="category" placeholder="예: 회원 서비스 운영" oninput="syncCollect('${type}');updatePreview()"></div>
      <div class="field-group"><label class="field-label">처리 목적</label><input type="text" data-field="purpose" placeholder="예: 본인 식별, 회원 관리" oninput="syncCollect('${type}');updatePreview()"></div>
    </div>
    <div class="field-group"><label class="field-label">처리 항목</label><input type="text" data-field="items" placeholder="예: ID, 휴대전화번호, 성명" oninput="syncCollect('${type}');updatePreview()"></div>
    ${type !== "auto" ? `<div class="field-group"><label class="field-label">처리 및 보유기간</label><input type="text" data-field="retention" placeholder="예: 회원 탈퇴 시까지" oninput="syncCollect('${type}');updatePreview()"></div>` : ""}
  `;
  container.appendChild(div);
  syncCollect(type);
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function syncCollect(type) {
  const arr = [];
  document
    .querySelectorAll("#collect" + cap(type) + " .card-item")
    .forEach((d) => {
      const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
      arr.push({
        basis: g("basis") || "consent",
        category: g("category"),
        purpose: g("purpose"),
        items: g("items"),
        retention: g("retention"),
      });
    });
  S["collect" + cap(type)] = arr;
  // state updated; caller triggers updatePreview
}

function removeAndSync(id, type) {
  document.getElementById(id)?.remove();
  syncCollect(type);
  updatePreview();
}

// ════════════════════════════════════════
//  DYNAMIC ROWS — COLLECT OTHER (3가)
// ════════════════════════════════════════
function addCollectOther() {
  const id = "ci_other_" + Date.now();
  const container = document.getElementById("collectOther");
  const num = container.children.length + 1;
  const div = document.createElement("div");
  div.className = "card-item";
  div.id = id;
  div.innerHTML = `
    <div class="card-header"><span class="card-title">#${num}</span><button class="btn-icon" onclick="removeAndSyncCollectOther('${id}')">✕</button></div>
    <div class="field-group"><label class="field-label">법적 근거</label><select data-field="basis" onchange="syncCollectOther();updatePreview()">${basisOpts.map((o) => `<option value="${o.v}">${o.l}</option>`).join("")}</select></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집 목적</label><input type="text" data-field="purpose" placeholder="예: 간편로그인" oninput="syncCollectOther();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집 항목</label><input type="text" data-field="items" placeholder="예: 이름, 생년월일, CI" oninput="syncCollectOther();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">제공하는 자 <span style="color:#aaa;font-size:11px;">(선택)</span></label><input type="text" data-field="provider" placeholder="예: OOO" oninput="syncCollectOther();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보유기간</label><input type="text" data-field="retention" placeholder="예: 회원 탈퇴 시까지" oninput="syncCollectOther();updatePreview()"></div>
    </div>
  `;
  container.appendChild(div);
  syncCollectOther();
}

function syncCollectOther() {
  S.collectOther = [];
  document.querySelectorAll("#collectOther .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.collectOther.push({
      basis: g("basis") || "consent",
      purpose: g("purpose"),
      items: g("items"),
      provider: g("provider"),
      retention: g("retention"),
    });
  });
}

function removeAndSyncCollectOther(id) {
  document.getElementById(id)?.remove();
  syncCollectOther();
  updatePreview();
}

let childCustomItems = [];

function addChildCustomItem() {
  const input = document.getElementById("childItemsCustomInput");
  const val = input.value.trim();
  if (!val) return;
  childCustomItems.push(val);
  input.value = "";
  renderChildCustomTags();
  syncChildItems();
}

function removeChildCustomItem(idx) {
  childCustomItems.splice(idx, 1);
  renderChildCustomTags();
  syncChildItems();
}

function renderChildCustomTags() {
  const container = document.getElementById("childCustomTags");
  if (!container) return;
  container.innerHTML = childCustomItems
    .map(
      (item, i) =>
        `<span style="display:inline-flex;align-items:center;gap:3px;background:#eef1fe;border:1px solid #c5cdf7;border-radius:12px;padding:2px 8px;font-size:11px;">
          ${item}
          <button onclick="removeChildCustomItem(${i})" style="background:none;border:none;cursor:pointer;color:#999;font-size:13px;padding:0;line-height:1;">×</button>
        </span>`
    )
    .join("");
}

function syncChildItems() {
  const items = [];
  if (document.getElementById("childItemName")?.checked) items.push("법정대리인의 성명");
  if (document.getElementById("childItemPhone")?.checked) items.push("전화번호");
  if (document.getElementById("childItemEmail")?.checked) items.push("이메일주소");
  items.push(...childCustomItems);
  const val = items.join(", ");
  const hidden = document.getElementById("childItems");
  if (hidden) hidden.value = val;
  S.childItems = val;
  updatePreview();
}

function selectChildPreset(el) {
  const isCustom = el.value === "custom";
  const ta = document.getElementById("childMethod");
  ta.style.display = isCustom ? "" : "none";
  if (!isCustom) ta.value = el.value;
  else ta.value = "";
  updatePreview();
}

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

// ════════════════════════════════════════
//  DYNAMIC — THIRD PARTY
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
  // state updated
}

// ════════════════════════════════════════
//  DYNAMIC — DELEGATE
// ════════════════════════════════════════
function addDelegate() {
  const id = "dl_" + Date.now(),
    c = document.getElementById("dlItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">수탁업체</span><button class="btn-icon" onclick="removeAndSyncDL('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수탁자</label><input type="text" data-field="company" placeholder="업체명" oninput="syncDL();updatePreview()"></div>
      <div class="field-group"><label class="field-label">위탁 업무</label><input type="text" data-field="task" placeholder="업무 내용" oninput="syncDL();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}
function removeAndSyncDL(id) {
  document.getElementById(id)?.remove();
  syncDL();
  updatePreview();
}
function syncDL() {
  S.dlItems = [];
  document.querySelectorAll("#dlItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.dlItems.push({ company: g("company"), task: g("task") });
  });
  // state updated
}

function addSubDelegate() {
  const id = "sdl_" + Date.now(),
    c = document.getElementById("dlSubItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">재수탁업체</span><button class="btn-icon" onclick="removeAndSyncSDL('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">재수탁자</label><input type="text" data-field="company" placeholder="업체명" oninput="syncSDL();updatePreview()"></div>
      <div class="field-group"><label class="field-label">위탁 업무</label><input type="text" data-field="task" placeholder="업무 내용" oninput="syncSDL();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}
function removeAndSyncSDL(id) {
  document.getElementById(id)?.remove();
  syncSDL();
  updatePreview();
}
function syncSDL() {
  S.dlSubItems = [];
  document.querySelectorAll("#dlSubItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.dlSubItems.push({ company: g("company"), task: g("task") });
  });
}

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

// ════════════════════════════════════════
//  SECURITY — CUSTOM ITEMS
// ════════════════════════════════════════
function addSecItem(cat) {
  const inp = document.getElementById("sec_" + cat + "_input");
  const val = inp.value.trim();
  if (!val) return;
  S.security["s_" + cat + "_extra"].push(val);
  inp.value = "";
  renderSecChips(cat);
  updatePreview();
}
function removeSecItem(cat, idx) {
  S.security["s_" + cat + "_extra"].splice(idx, 1);
  renderSecChips(cat);
  updatePreview();
}
function renderSecChips(cat) {
  const container = document.getElementById("sec_" + cat + "_chips");
  if (!container) return;
  const items = S.security["s_" + cat + "_extra"] || [];
  container.innerHTML = items
    .map(
      (v, i) =>
        `<span class="sec-chip">${v}<button onclick="removeSecItem('${cat}',${i})">×</button></span>`
    )
    .join("");
}

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
      <div class="field-group"><label class="field-label">수집 항목</label><input type="text" data-field="items" placeholder="예: 웹사이트 방문·이용 이력" oninput="syncBH();updatePreview()"></div>
      <div class="field-group"><label class="field-label">수집 목적</label><input type="text" data-field="purpose" placeholder="예: 맞춤형 광고 제공" oninput="syncBH();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수집 방법</label><input type="text" data-field="method" placeholder="예: 웹사이트 방문 시 자동수집" oninput="syncBH();updatePreview()"></div>
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
      items: g("items"),
      purpose: g("purpose"),
      method: g("method"),
      retention: g("retention"),
    });
  });
  // state updated
}

// ════════════════════════════════════════
//  DYNAMIC — DEPT
// ════════════════════════════════════════
function addDept() {
  const id = "dept_" + Date.now(),
    c = document.getElementById("deptItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">담당부서</span><button class="btn-icon" onclick="removeAndSyncDept('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">부서명</label><input type="text" data-field="name" placeholder="부서명" oninput="syncDepts();updatePreview()"></div>
      <div class="field-group"><label class="field-label">전화번호</label><input type="text" data-field="phone" placeholder="전화번호" oninput="syncDepts();updatePreview()"></div>
    </div>
    <input type="email" data-field="email" placeholder="이메일" style="margin-top:6px;" oninput="syncDepts();updatePreview()">
  `;
  c.appendChild(d);
}
function removeAndSyncDept(id) {
  document.getElementById(id)?.remove();
  syncDepts();
  updatePreview();
}
function syncDepts() {
  S.depts = [];
  // default row
  S.depts.push({
    name: document.getElementById("dept1Name")?.value || "",
    phone: document.getElementById("dept1Phone")?.value || "",
    email: document.getElementById("dept1Email")?.value || "",
  });
  document.querySelectorAll("#deptItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.depts.push({ name: g("name"), phone: g("phone"), email: g("email") });
  });
  // state updated
}

// ════════════════════════════════════════
//  READ SIMPLE FIELDS
// ════════════════════════════════════════
function readFields() {
  [
    "companyName",
    "serviceName",
    "effectiveDate",
    "childItems",
    "childMethod",
    "cpoName",
    "cpoTitle",
    "cpoPhone",
    "cpoEmail",
    "rightsPath",
    "addUsageText",
    "sensitiveText",
    "pseudonymText",
    "autoDecisionText",
    "daName",
    "daPhone",
    "daAddr",
    "daEmail",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) S[id] = el.value;
  });
  syncDepts(); // sync depts state without triggering updatePreview
}

// ════════════════════════════════════════
//  PREVIEW UPDATE
// ════════════════════════════════════════
function updatePreview() {
  readFields();
  document.getElementById("previewContent").innerHTML = buildPreview();
  // bind TOC scroll
  const panel = document.getElementById("previewPanel");
  document.querySelectorAll("#previewContent .pp-toc-link").forEach((a) => {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      const tid = this.getAttribute("href").replace("#", "");
      const target = document
        .getElementById("previewContent")
        .querySelector("#" + tid);
      if (target && panel) {
        const pr = panel.getBoundingClientRect(),
          tr = target.getBoundingClientRect();
        panel.scrollTo({
          top: panel.scrollTop + (tr.top - pr.top) - 20,
          behavior: "smooth",
        });
      }
    });
  });
}

// ════════════════════════════════════════
//  CELL MERGE HELPER
// ════════════════════════════════════════
function computeSpans(arr, keyFn) {
  const n = arr.length,
    span = new Array(n).fill(1),
    skip = new Array(n).fill(false);
  let i = 0;
  while (i < n) {
    const val = keyFn(i);
    if (!val) {
      i++;
      continue;
    }
    let s = 1;
    while (i + s < n && keyFn(i + s) === val) s++;
    span[i] = s;
    for (let k = 1; k < s; k++) skip[i + k] = true;
    i += s;
  }
  return { span, skip };
}

function buildCollectTable(arr, showBasis) {
  if (!arr.length || !arr.some((r) => r.category || r.purpose || r.items))
    return '<p style="color:#aaa;font-style:italic;font-size:12px;">← 항목을 추가해 주세요</p>';
  const bs = showBasis
    ? computeSpans(arr, (i) => arr[i].basis || "")
    : { span: [], skip: [] };
  const cs = computeSpans(arr, (i) => arr[i].category || "");
  const is = computeSpans(arr, (i) => arr[i].items || "");
  const rs = computeSpans(arr, (i) => arr[i].retention || "");
  let rows = arr
    .map((r, i) => {
      const bCell = showBasis
        ? bs.skip[i]
          ? ""
          : `<td class="c" style="vertical-align:middle;font-size:11px;" rowspan="${bs.span[i]}">${basisMap[r.basis] || r.basis || "-"}</td>`
        : "";
      const cCell = cs.skip[i]
        ? ""
        : `<td class="c" style="vertical-align:middle;" rowspan="${cs.span[i]}">${r.category || "-"}</td>`;
      const iCell = is.skip[i]
        ? ""
        : `<td class="c" style="vertical-align:middle;" rowspan="${is.span[i]}">${r.items || "-"}</td>`;
      const rCell =
        showBasis && !rs.skip[i]
          ? `<td class="c" style="vertical-align:middle;" rowspan="${rs.span[i]}">${r.retention || "-"}</td>`
          : !showBasis
            ? ""
            : rs.skip[i]
              ? ""
              : "";
      return `<tr>${bCell}${cCell}<td>${r.purpose || "-"}</td>${iCell}${showBasis ? rCell : ""}</tr>`;
    })
    .join("");
  const headers = showBasis
    ? '<th style="width:22%">법적 근거</th><th style="width:12%">구분</th><th style="width:28%">처리 목적</th><th style="width:24%">처리 항목</th><th style="width:14%">보유기간</th>'
    : '<th style="width:18%">구분</th><th style="width:40%">처리 목적</th><th style="width:42%">처리 항목</th>';
  return `<table class="pp-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildCollectOtherTable(arr) {
  if (!arr.length || !arr.some((r) => r.purpose || r.items))
    return '<p style="color:#aaa;font-style:italic;font-size:12px;">← 항목을 추가해 주세요</p>';
  return `<table class="pp-table">
  <thead><tr>
    <th style="width:22%">법적 근거</th>
    <th style="width:20%">수집 목적</th>
    <th style="width:28%">수집 항목</th>
    <th style="width:16%">제공하는 자 (선택)</th>
    <th style="width:14%">보유기간</th>
  </tr></thead>
  <tbody>${arr
    .map(
      (r) => `<tr>
    <td class="c" style="font-size:11px;vertical-align:middle;">${basisMap[r.basis] || r.basis || "-"}</td>
    <td>${r.purpose || "-"}</td>
    <td>${r.items || "-"}</td>
    <td class="c">${r.provider || "-"}</td>
    <td class="c">${r.retention || "-"}</td>
  </tr>`,
    )
    .join("")}</tbody>
</table>`;
}

// ════════════════════════════════════════
//  HELPER — table with rowspan merge on all columns independently
// ════════════════════════════════════════
function buildMergedTable(rows, cols) {
  if (!rows.length) return "";
  const n = rows.length, m = cols.length;
  const rsVal = Array.from({length: n}, () => Array(m).fill(1));
  const skip  = Array.from({length: n}, () => Array(m).fill(false));
  for (let c = 0; c < m; c++) {
    let r = 0;
    while (r < n) {
      const val = rows[r][cols[c].key] || "-";
      let span = 1;
      while (r + span < n && (rows[r + span][cols[c].key] || "-") === val) span++;
      rsVal[r][c] = span;
      for (let k = 1; k < span; k++) skip[r + k][c] = true;
      r += span;
    }
  }
  const thead = `<tr>${cols.map(col => `<th>${col.label}</th>`).join("")}</tr>`;
  const tbody = rows.map((row, r) =>
    `<tr>${cols.map((col, c) => {
      if (skip[r][c]) return "";
      const rs = rsVal[r][c] > 1 ? ` rowspan="${rsVal[r][c]}"` : "";
      const cls = col.cls ? ` class="${col.cls}"` : "";
      return `<td${rs}${cls}>${row[col.key] || "-"}</td>`;
    }).join("")}</tr>`
  ).join("");
  return `<table class="pp-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}


// ════════════════════════════════════════
//  BUILD PREVIEW HTML
// ════════════════════════════════════════
function buildPreview() {
  const co = S.companyName || "개인정보처리자명";
  const svc = S.serviceName || "";
  const eff = S.effectiveDate || "YYYY. MM. DD";
  const alias = "회사";

  // Retention table
  const retMap = {
    contract: {
      label: "계약 또는 청약철회, 대금결제, 재화 등의 공급기록",
      basis: "전자상거래 등에서의 소비자보호에 관한 법률 제6조",
      period: "5년",
    },
    dispute: {
      label: "소비자의 불만 또는 분쟁처리에 관한 기록",
      basis: "전자상거래 등에서의 소비자보호에 관한 법률 제6조",
      period: "3년",
    },
    ad: {
      label: "표시·광고에 관한 기록",
      basis: "전자상거래 등에서의 소비자보호에 관한 법률 제6조",
      period: "6개월",
    },
    log: {
      label: "웹사이트 방문기록(로그기록, IP 등) 및 본인확인 기록",
      basis: "통신비밀보호법 시행령 제41조",
      period: "3개월",
    },
  };
  const activeRet = Object.keys(S.retention)
    .filter((k) => S.retention[k])
    .map((k) => retMap[k]);
  const legalRet = [
    ...activeRet,
    ...(S.customRetentionLegal || []).filter((r) => r.label),
  ];
  const otherRet = (S.customRetentionOther || []).filter((r) => r.label);

  // Security
  const secMap = {
    s_plan: "내부 관리계획 수립·시행",
    s_edu: "정기적 직원 교육",
    s_org: "전담 조직 운영",
    s_access: "개인정보처리시스템 접근 권한의 관리 및 접근통제시스템 설치",
    s_encrypt: "개인정보의 암호화",
    s_sec: "보안프로그램 설치 및 갱신",
    s_log: "접속기록의 보관 및 점검",
    s_vuln: "개인정보처리시스템 취약점 점검 및 보완",
    s_phys: "전산실, 자료보관실 등의 접근통제",
    s_media: "보조저장매체 반출·입 통제",
    s_isms: "국내 정보보호 관리체계(ISMS-P) 인증 취득",
    s_isms_cert: "국내 정보보호 관리체계(ISMS) 인증 취득",
  };
  const secMgmt = ["s_plan", "s_edu", "s_org"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_mgmt_extra || []);
  const secTech = ["s_access", "s_encrypt", "s_sec", "s_log", "s_vuln"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_tech_extra || []);
  const secPhys = ["s_phys", "s_media"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_phys_extra || []);
  const secExtra = ["s_isms", "s_isms_cert"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_cert_extra || []);

  // Rights methods
  const rMap = {
    r_written: "서면",
    r_phone: "전화",
    r_email: "전자우편",
    r_fax: "팩스(FAX)",
    r_web: "인터넷",
  };
  const activeMethods = Object.keys(S.rights)
    .filter((k) => S.rights[k])
    .map((k) => rMap[k])
    .join(", ");

  // Browsers
  const bMap = {
    b_chrome: {
      n: "크롬(Chrome)",
      p: "웹브라우저 오른쪽 상단 '⋮' > 새 시크릿 창 (Ctrl+Shift+N)",
    },
    b_edge: {
      n: "엣지(Edge)",
      p: "웹브라우저 오른쪽 상단 '…' > 새 InPrivate 창 (Ctrl+Shift+N)",
    },
    b_chrome_m: {
      n: "크롬(Chrome)",
      p: "모바일 브라우저 오른쪽 상단 '⋮' > 새 시크릿 탭",
    },
    b_safari: {
      n: "사파리(Safari)",
      p: "모바일 기기 설정 > 사파리(Safari) > 고급 > 모든 쿠키 차단",
    },
    b_samsung: {
      n: "삼성 인터넷",
      p: "모바일 브라우저 아래쪽 '탭' 아이콘 > 비밀 모드 켜기 > 시작",
    },
  };
  const webBrowsers = ["b_chrome", "b_edge"].filter((k) => S.browser[k]);
  const mobileBrowsers = ["b_chrome_m", "b_safari", "b_samsung"].filter((k) => S.browser[k]);

  // Agencies
  const agMap = {
    ag_kopico: {
      n: "개인정보 분쟁조정위원회",
      u: "www.kopico.go.kr",
      t: "(국번없이) 1833-6972",
    },
    ag_kisa: {
      n: "개인정보침해 신고센터",
      u: "privacy.kisa.or.kr",
      t: "(국번없이) 118",
    },
    ag_spo: { n: "대검찰청", u: "www.spo.go.kr", t: "(국번없이) 1301" },
    ag_police: { n: "경찰청", u: "ecrm.police.go.kr", t: "(국번없이) 182" },
  };
  const activeAgencies = Object.keys(S.agency).filter((k) => S.agency[k]);

  // Icons
  const icons = [
    { e: "📋", l: "개인정보 수집" },
    { e: "🎯", l: "처리 목적" },
    { e: "🗓️", l: "보유 기간" },
    { e: "🤝", l: "처리 위탁" },
    { e: "🔗", l: "제3자 제공" },
    { e: "📨", l: "고충 처리" },
    { e: "🌏", l: "국외 이전" },
    { e: "🔒", l: "안전 조치" },
  ];
  const iconColors = [
    "#4f6ef7",
    "#7c5ce7",
    "#00b894",
    "#e17055",
    "#fdcb6e",
    "#0984e3",
    "#6c5ce7",
    "#00cec9",
  ];

  // Build TOC items — stable key, dynamic sequential numbering
  const tocItems = [
    {
      k: "collect",
      l: "개인정보의 처리 목적, 처리 항목, 보유 및 이용기간",
      show: true,
    },
    {
      k: "child",
      l: "만 14세 미만 아동의 개인정보 처리",
      show: S.child === "yes",
      opt: true,
    },
    { k: "destroy", l: "개인정보의 파기 절차 및 방법", show: true },
    {
      k: "tp",
      l: "개인정보의 제3자 제공",
      show: S.thirdParty === "yes",
      opt: true,
    },
    {
      k: "delegate",
      l: "개인정보 처리업무의 위탁",
      show: S.delegate === "yes",
      opt: true,
    },
    {
      k: "overseas",
      l: "개인정보의 국외 이전",
      show: S.overseas === "yes",
      opt: true,
    },
    { k: "security", l: "개인정보의 안전성 확보 조치", show: true },
    {
      k: "adduse",
      l: "추가적인 이용·제공 판단 기준",
      show: S.addUsage === "yes",
      opt: true,
    },
    {
      k: "sensitive",
      l: "민감정보의 공개 가능성 및 비공개 선택 방법",
      show: S.sensitive === "yes",
      opt: true,
    },
    {
      k: "pseudo",
      l: "가명정보 처리에 관한 사항",
      show: S.pseudonym === "yes",
      opt: true,
    },
    {
      k: "cookie",
      l: "개인정보 자동수집 장치의 설치·운영 및 거부",
      show: S.cookie === "yes",
      opt: true,
    },
    {
      k: "behavior",
      l: "행태정보의 수집·이용·제공 및 거부",
      show: S.behavioral === "yes",
      opt: true,
    },
    {
      k: "autodec",
      l: "자동화된 결정에 관한 사항",
      show: S.autoDecision === "yes",
      opt: true,
    },
    {
      k: "rights",
      l: "정보주체와 법정대리인의 권리·의무 및 행사방법",
      show: true,
    },
    { k: "cpo", l: "개인정보 보호책임자 및 고충처리 부서", show: true },
    {
      k: "remedy",
      l: "정보주체의 권익침해에 대한 구제방법",
      show: activeAgencies.length > 0,
    },
    { k: "agent", l: "국내대리인 지정", show: S.domAgent === "yes", opt: true },
    { k: "change", l: "개인정보 처리방침의 변경", show: true },
  ];
  const visibleToc = tocItems.filter((t) => t.show);
  // numMap: key → zero-padded sequential number string
  const numMap = {};
  visibleToc.forEach((t, i) => {
    numMap[t.k] = String(i + 1).padStart(2, "0");
  });
  // Helper: render section heading (skips if key not in numMap)
  const sec = (k, label, opt = false) => {
    if (!numMap[k]) return "";
    return (
      '<div id="pp-' +
      k +
      '" class="pp-sec"><div class="pp-sec-num">' +
      numMap[k] +
      "</div>" +
      label +
      (opt
        ? ' <span style="font-size:11px;color:#aaa;font-weight:400;"></span>'
        : "") +
      "</div>"
    );
  };

  return `
<h2 class="pp-h2">${svc ? svc + " " : co + " "}개인정보 처리방침</h2>
<div class="pp-date-row"><div class="pp-date-badge">${eff} 시행</div></div>

<p class="pp-intro">${svc ? co + " " + svc : co}(이하 '${alias}')는(은) 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.</p>
<p class="pp-intro">이에 「개인정보 보호법」 제30조에 따라 정보주체에게 개인정보의 처리와 보호에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>

<div class="pp-icon-nav">
  ${icons.map((ic, i) => `<div class="pp-icon-item"><div class="pp-icon-circle" style="background:${iconColors[i]}22">${ic.e}</div><div class="pp-icon-label">${ic.l}</div></div>`).join("")}
</div>


<p class="pp-sub-title">[ 목 차 ]</p>
<div class="pp-toc-box">
  <ul>${visibleToc
    .map((t, i) => {
      const n = numMap[t.k];
      return `<li><a href="#pp-${t.k}" class="pp-toc-link"><span class="pp-toc-num">${n}</span>${t.l}${t.opt ? '<span class="pp-toc-opt"></span>' : ""}</a></li>`;
    })
    .join("")}</ul>
</div>
<p class="pp-intro" style="font-size:11px;color:#e87d31;margin-top:4px;">※ 목차를 클릭 시 해당 본문으로 이동됩니다.</p>

${sec("collect", "개인정보의 처리 목적, 처리 항목, 보유 및 이용기간")}
<p>${alias}는 「개인정보 보호법」에 따라 서비스 제공을 위해 필요 최소한의 범위에서 개인정보를 수집·이용합니다.</p>

${
  S.collectNoConsent.length > 0 &&
  S.collectNoConsent.some((r) => r.category || r.items)
    ? `
<p class="pp-sub-title">1. 정보주체의 동의 없이 처리하는 개인정보</p>
<p>${alias}는 다음의 개인정보 항목을 정보주체의 동의 없이 처리하고 있습니다.</p>
${buildCollectTable(S.collectNoConsent, true)}`
    : ""
}

${
  S.collectConsent.length > 0 &&
  S.collectConsent.some((r) => r.category || r.items)
    ? `
<p class="pp-sub-title">${S.collectNoConsent.length > 0 && S.collectNoConsent.some((r) => r.category || r.items) ? "2" : "1"}. 정보주체의 동의를 받아 처리하는 개인정보</p>
<p>${alias}는 다음의 개인정보 항목을 정보주체의 동의를 받아 처리하고 있습니다.</p>
${buildCollectTable(S.collectConsent, true)}`
    : ""
}

${(() => {
  const hasGa =
    S.collectOther.length > 0 &&
    S.collectOther.some((r) => r.purpose || r.items);
  const hasNa =
    S.collectAuto.length > 0 &&
    S.collectAuto.some((r) => r.category || r.items);
  if (!hasGa && !hasNa) return "";
  const n1 =
    S.collectNoConsent.length > 0 &&
    S.collectNoConsent.some((r) => r.category || r.items);
  const n2 =
    S.collectConsent.length > 0 &&
    S.collectConsent.some((r) => r.category || r.items);
  const secNum = n1 && n2 ? 3 : n1 || n2 ? 2 : 1;
  return `
<p class="pp-sub-title">${secNum}. 그 밖에 수집하는 개인정보</p>
${
  hasGa
    ? `<p class="pp-sub-title" style="font-size:12px;padding-left:4px;">가. 정보주체 이외로부터 수집한 개인정보</p>
${buildCollectOtherTable(S.collectOther)}`
    : ""
}
${
  hasNa
    ? `<p class="pp-sub-title" style="font-size:12px;padding-left:4px;">${hasGa ? "나" : "가"}. 서비스 이용 과정에서 자동으로 생성·수집되는 개인정보</p>
${buildCollectTable(S.collectAuto, false)}`
    : ""
}
`;
})()}

${!S.collectNoConsent.some((r) => r.category || r.items) && !S.collectConsent.some((r) => r.category || r.items) && !S.collectOther.some((r) => r.purpose || r.items) && !S.collectAuto.some((r) => r.category || r.items) ? '<p style="color:#aaa;font-style:italic;">← STEP 2에서 수집 항목을 추가해 주세요.</p>' : ""}

<!-- 02 아동 -->
${
  S.child === "yes"
    ? `
${sec("child", "만 14세 미만 아동의 개인정보 처리", true)}
<p style="font-size:13px;color:#000;line-height:1.8;margin:0 0 8px;">① ${alias}는 14세 미만 아동의 개인정보를 수집할 때 법정대리인의 동의를 얻어 해당 서비스 수행에 필요한 최소한의 개인정보를 수집합니다.</p>
${S.childItems ? `<table class="pp-table" style="margin:0 0 14px;">
  <thead><tr><th style="text-align:center;">수집항목</th></tr></thead>
  <tbody><tr><td style="text-align:center;">${S.childItems}</td></tr></tbody>
</table>` : `<p style="margin:0 0 14px;"></p>`}
<p style="font-size:13px;color:#000;line-height:1.8;margin:0;">② ${alias}는 만 14세 미만 아동의 개인정보를 수집할 때에는 아동에게 법정대리인의 성명, 연락처와 같이 최소한의 정보를 요구할 수 있으며, ${S.childMethod || '<span style="color:#bbb;">동의 확인 방법을 선택해 주세요.</span>'}</p>
`
    : ""
}

${sec("destroy", "개인정보의 파기 절차 및 방법")}
<ul class="pp-list">
  <li>① ${alias}는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
  <li>② 정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</li>
</ul>
${
  legalRet.length > 0
    ? `
<p style="font-size:12px;font-weight:700;margin:8px 0 4px;">▶ 법령에 따른 보존</p>
${buildMergedTable(legalRet, [{key:"label",label:"보존 항목"},{key:"basis",label:"근거 법령"},{key:"period",label:"보존 기간",cls:"c"}])}`
    : ""
}${
  otherRet.length > 0
    ? `
<p style="font-size:12px;font-weight:700;margin:8px 0 4px;">▶ 그외 보존 (사내규정·기타사유)</p>
${buildMergedTable(otherRet, [{key:"label",label:"보존 항목"},{key:"basis",label:"보존 사유"},{key:"period",label:"보존 기간",cls:"c"}])}`
    : ""
}
<ul class="pp-list" style="margin-top:8px;">
  <li>③ 파기절차: ${alias}는 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.</li>
  <li>④ 파기방법${S.destroy.electronic || S.destroy.paper ? `<ul style="margin:4px 0 0 0;padding-left:16px;list-style:none;">${S.destroy.electronic ? '<li style="padding:2px 0;">• 전자적 파일: 기록을 재생할 수 없도록 파기합니다.</li>' : ""}${S.destroy.paper ? '<li style="padding:2px 0;">• 종이 문서: 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>' : ""}</ul>` : ""}</li>
</ul>

<!-- 04 제3자 제공 -->
${
  S.thirdParty === "yes"
    ? `
${sec("tp", "개인정보의 제3자 제공", true)}
${
  S.tpConsent.length > 0 && S.tpConsent.some((r) => r.receiver)
    ? `
<p>① ${alias}는 원활한 서비스 제공을 위해 다음의 경우 「개인정보 보호법」 제17조제1항제1호에 따라 정보주체의 동의를 얻어 필요 최소한의 범위로만 제공합니다.</p>
${buildMergedTable(S.tpConsent, [
  {key:"receiver", label:"제공받는 자"},
  {key:"purpose",  label:"제공 목적"},
  {key:"items",    label:"제공 항목"},
  {key:"retention",label:"보유·이용기간", cls:"c"},
])}`
    : ""
}
${
  S.tpLegal.length > 0 && S.tpLegal.some((r) => r.receiver)
    ? `
<p style="margin-top:10px;">② ${alias}는 다음과 같이 정보주체의 동의 없이 관계 기관에 개인정보를 제공할 수 있습니다.</p>
${buildMergedTable(S.tpLegal, [
  {key:"basis",    label:"관련 근거"},
  {key:"receiver", label:"제공받는 자"},
  {key:"purpose",  label:"제공 목적"},
  {key:"items",    label:"제공 항목"},
])}`
    : ""
}
`
    : ""
}

<!-- 05 위탁 -->
${
  S.delegate === "yes"
    ? `
${sec("delegate", "개인정보 처리업무의 위탁", true)}
<p>① ${alias}는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
<p style="font-weight:700;margin:10px 0 4px;">가. 위탁받는 자 (수탁자)</p>
${
  S.dlItems.length > 0 && S.dlItems.some((r) => r.company)
    ? buildMergedTable(S.dlItems, [{key:"company",label:"위탁받는 자 (수탁자)",cls:"c"},{key:"task",label:"위탁 업무"}])
    : '<p style="color:#aaa;font-style:italic;font-size:12px;">수탁업체를 추가해 주세요.</p>'
}${
  S.dlSubItems && S.dlSubItems.length > 0 && S.dlSubItems.some((r) => r.company)
    ? `<p style="font-weight:700;margin:10px 0 4px;">나. 재위탁받는 자 (재수탁자)</p>
${buildMergedTable(S.dlSubItems, [{key:"company",label:"재위탁받는 자 (재수탁자)",cls:"c"},{key:"task",label:"위탁 업무"}])}`
    : ""
}
<p style="margin-top:10px;">② ${alias}는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>${
  S.dlSubItems && S.dlSubItems.length > 0 && S.dlSubItems.some((r) => r.company)
    ? `<p style="margin-top:6px;">③ 「개인정보 보호법」 제26조제6항에 따라 수탁자가 ${alias}의 개인정보 처리 업무를 재위탁하는 경우 ${alias}의 동의를 받고 있으며, 본 개인정보 처리방침을 통하여 재수탁자와 재수탁하는 업무의 내용을 공개하고 있습니다.</p>
<p style="margin-top:6px;">${S.dlSubItems && S.dlSubItems.some((r) => r.company) ? "④" : "③"} 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.</p>`
    : `<p style="margin-top:6px;">③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.</p>`
}
`
    : ""
}

<!-- 06 국외이전 -->
${
  S.overseas === "yes"
    ? `
${sec("overseas", "개인정보의 국외 이전", true)}
<p>${alias}는 서비스 이용자로부터 수집한 개인정보를 아래와 같이 국외에 이전하고 있으며, 「개인정보 보호법」 제28조의8제2항에 따라 국외이전에 대해 다음과 같이 안내합니다.</p>
${S.otRefuseDisadvantage ? `<p style="margin-top:6px;">국외 이전을 거부할 경우 ${S.otRefuseDisadvantage}합니다.</p>` : ""}
${
  S.otItems.length > 0 && S.otItems.some((r) => r.receiver)
    ? `
${buildMergedTable(S.otItems, [
  {key:"receiver", label:"이전받는 자"},
  {key:"country",  label:"이전 국가", cls:"c"},
  {key:"items",    label:"이전 항목"},
  {key:"purpose",  label:"이용 목적"},
  {key:"method",   label:"이전 방법"},
  {key:"retention",label:"보유기간", cls:"c"},
])}`
    : '<p style="color:#aaa;font-style:italic;font-size:12px;">이전 대상을 추가해 주세요.</p>'
}
${S.otRefuseMethod ? `<p style="margin-top:8px;">국외 이전을 원치 않을 경우 ${S.otRefuseMethod}를 통하여 회원 탈퇴를 요청할 수 있습니다.</p>` : ""}
`
    : ""
}

${sec("security", "개인정보의 안전성 확보 조치")}
<p>${alias}는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
<ul class="pp-list">
  ${secMgmt.length > 0 ? `<li><strong>관리적 조치:</strong> ${secMgmt.join(", ")}</li>` : ""}
  ${secTech.length > 0 ? `<li><strong>기술적 조치:</strong> ${secTech.join(", ")}</li>` : ""}
  ${secPhys.length > 0 ? `<li><strong>물리적 조치:</strong> ${secPhys.join(", ")}</li>` : ""}
  ${secExtra.length > 0 ? `<li><strong>기타:</strong> ${secExtra.join(", ")}</li>` : ""}
</ul>

<!-- 08 추가이용 판단기준 -->
${
  S.addUsage === "yes"
    ? `
${sec("adduse", "추가적인 이용·제공 판단 기준", true)}
<p>${alias}는 「개인정보 보호법」 제15조제3항 또는 제17조제4항에 따라 정보주체의 동의 없이 개인정보를 추가적으로 이용·제공할 수 있습니다.</p>
<p>${S.addUsageText || "판단 기준을 입력해 주세요."}</p>
`
    : ""
}

<!-- 09 민감정보 -->
${
  S.sensitive === "yes"
    ? `
${sec("sensitive", "민감정보의 공개 가능성 및 비공개 선택 방법", true)}
<p>${S.sensitiveText || "내용을 입력해 주세요."}</p>
`
    : ""
}

<!-- 10 가명정보 -->
${
  S.pseudonym === "yes"
    ? `
${sec("pseudo", "가명정보 처리에 관한 사항", true)}
<p>${alias}는 수집한 개인정보를 「개인정보 보호법」 제28조의2에 따라 다음과 같이 가명처리하여 활용하고 있습니다.</p>
<p>${S.pseudonymText || "내용을 입력해 주세요."}</p>
`
    : ""
}

<!-- 11 쿠키 -->
${
  S.cookie === "yes"
    ? `
${sec("cookie", "개인정보 자동수집 장치의 설치·운영 및 거부", true)}
<ul class="pp-list">
  <li>① ${alias}는 정보주체에게 개별적인 서비스와 편의를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
  <li>② 쿠키는 웹사이트 운영에 이용되는 서버(http)가 정보주체의 브라우저에 보내는 소량의 정보로서 정보주체의 컴퓨터 또는 모바일에 저장되며, 웹사이트 접속 시 정보주체의 브라우저에서 서버로 자동 전송됩니다.</li>
  <li>③ 정보주체는 브라우저 옵션 설정을 통해 쿠키 허용, 차단 등의 설정을 할 수 있습니다.${
    webBrowsers.length > 0 || mobileBrowsers.length > 0 ? `
<ul style="margin-top:8px; padding-left:16px;">
  ${webBrowsers.length > 0 ? `<li style="margin-bottom:6px;">웹 브라우저에서 쿠키 허용/차단
<table class="pp-table" style="margin-top:6px;">
  <thead><tr><th style="width:35%">브라우저</th><th>설정 방법</th></tr></thead>
  <tbody>${webBrowsers.map((k) => `<tr><td class="c">${bMap[k].n}</td><td>${bMap[k].p}</td></tr>`).join("")}</tbody>
</table></li>` : ""}
  ${mobileBrowsers.length > 0 ? `<li style="margin-top:6px;">모바일 브라우저에서 쿠키 허용/차단
<table class="pp-table" style="margin-top:6px;">
  <thead><tr><th style="width:35%">브라우저</th><th>설정 방법</th></tr></thead>
  <tbody>${mobileBrowsers.map((k) => `<tr><td class="c">${bMap[k].n}</td><td>${bMap[k].p}</td></tr>`).join("")}</tbody>
</table></li>` : ""}
</ul>` : ""
  }</li>
</ul>
`
    : ""
}

<!-- 12 행태정보 -->
${
  S.behavioral === "yes"
    ? `
${sec("behavior", "행태정보의 수집·이용·제공 및 거부", true)}
<p>${alias}는 서비스 이용과정에서 정보주체에게 최적화된 맞춤형 서비스 및 온라인 맞춤형 광고 등을 제공하기 위하여 행태정보를 처리하고 있습니다.</p>
${
  S.bhItems.length > 0 && S.bhItems.some((r) => r.items)
    ? `
${buildMergedTable(S.bhItems, [
  {key:"items",    label:"수집 항목"},
  {key:"purpose",  label:"수집 목적"},
  {key:"method",   label:"수집 방법"},
  {key:"retention",label:"보유·이용기간", cls:"c"},
])}`
    : '<p style="color:#aaa;font-style:italic;font-size:12px;">행태정보 항목을 추가해 주세요.</p>'
}
`
    : ""
}

<!-- 13 자동화된 결정 -->
${
  S.autoDecision === "yes"
    ? `
${sec("autodec", "자동화된 결정에 관한 사항", true)}
<p>${S.autoDecisionText || "내용을 입력해 주세요."}</p>
`
    : ""
}

${sec("rights", "정보주체와 법정대리인의 권리·의무 및 행사방법")}
<ul class="pp-list">
  <li>① 정보주체는 언제든지 개인정보 열람·전송·정정·삭제·처리정지 및 동의 철회 등을 요구할 수 있습니다.</li>
  <li>② 권리 행사는 「개인정보 보호법 시행령」 제41조제1항에 따라 ${activeMethods || "서면, 전화, 전자우편 등"}을 통하여 하실 수 있으며, ${alias}는 이에 대해 지체 없이 조치하겠습니다.</li>
  ${S.rightsPath ? `<li>③ 앱/웹 내 권리행사 경로: ${S.rightsPath}</li>` : ""}
  <li>④ 권리 행사는 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수도 있습니다. 이 경우 위임장을 제출하셔야 합니다.</li>
  <li>⑤ ${alias}는 권리 행사를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.</li>
  <li>⑥ 정보주체가 개인정보 열람 및 처리정지를 요구할 권리는 「개인정보 보호법」 제35조제4항 및 제37조제2항에 의하여 제한될 수 있습니다.</li>
  ${S.mydata === "yes" ? `<li>⑦ <strong>개인정보 전송요구(마이데이터):</strong> 정보주체는 홈페이지 '내정보 &gt; 본인전송요구'를 통해 개인정보 전송을 요구할 수 있으며, 제3자 전송요구는 개인정보전송지원플랫폼(OnMydata.go.kr)에서 확인할 수 있습니다.</li>` : ""}
  <li>⑧ 권리 행사 청구 접수·처리 부서는 아래 '개인정보 보호책임자 및 고충처리 부서' 항목을 참고하여 주시기 바랍니다. ${alias}는 청구받은 날로부터 10일 이내 회신하겠습니다.</li>
</ul>

${sec("cpo", "개인정보 보호책임자 및 고충처리 부서")}
<p>① ${alias}는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
<div class="pp-contact-box">
  <div class="pp-contact-title">▶ 개인정보 보호책임자(CPO)</div>
  <div class="pp-contact-info">
    성명: ${S.cpoName || '<span class="pp-placeholder">미입력</span>'}${S.cpoTitle ? " / 직책: " + S.cpoTitle : ""}<br>
    ${S.cpoPhone ? "전화: " + S.cpoPhone : ""}${S.cpoPhone && S.cpoEmail ? " &nbsp;|&nbsp; " : ""}${S.cpoEmail ? "이메일: " + S.cpoEmail : ""}
  </div>
</div>
<p style="margin-top:8px;">② 정보주체는 ${alias}의 서비스를 이용하시면서 발생한 모든 개인정보보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다.</p>
<div class="pp-contact-box">
  <div class="pp-contact-title">▶ 개인정보 업무 담당부서</div>
  <div class="pp-contact-info">
    ${
      S.depts
        .filter((d) => d.name || d.email || d.phone)
        .map(
          (d) => `
      ${d.name ? "부서: " + d.name : ""} ${d.phone ? "&nbsp;|&nbsp; 전화: " + d.phone : ""} ${d.email ? "&nbsp;|&nbsp; 이메일: " + d.email : ""}
    `,
        )
        .join("<br>") ||
      '<span class="pp-placeholder">부서 정보를 입력해 주세요</span>'
    }
  </div>
</div>

<!-- 16 구제방법 -->
${
  activeAgencies.length > 0
    ? `
${sec("remedy", "정보주체의 권익침해에 대한 구제방법", true)}
<p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 아래의 기관에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
<table class="pp-table"><thead><tr><th>기관명</th><th>기관 URL</th><th>연락처</th></tr></thead>
<tbody>${activeAgencies.map((k) => `<tr><td>${agMap[k].n}</td><td><a href="https://${agMap[k].u}" target="_blank">${agMap[k].u}</a></td><td class="c">${agMap[k].t}</td></tr>`).join("")}</tbody></table>
`
    : ""
}

<!-- 17 국내대리인 -->
${
  S.domAgent === "yes"
    ? `
${sec("agent", "국내대리인 지정", true)}
<p>${alias}는 「개인정보 보호법」 제31조의2에 따라 국내대리인을 지정하였습니다.</p>
<div class="pp-contact-box">
  <div class="pp-contact-info">
    성명(법인명): ${S.daName || "-"}<br>
    주소: ${S.daAddr || "-"}<br>
    전화번호: ${S.daPhone || "-"}<br>
    이메일: ${S.daEmail || "-"}
  </div>
</div>
`
    : ""
}

${sec("change", "개인정보 처리방침의 변경")}
<p class="pp-eff-date">① 이 개인정보 처리방침은 <strong>${eff}</strong>부터 적용됩니다.</p>
<p style="margin-top:6px;font-size:12px;">② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다. (시행일자별 링크 제공)</p>
`;
}

// ════════════════════════════════════════
//  EXPORT
// ════════════════════════════════════════
function generateFinalHTML() {
  const content = document.getElementById("previewContent").innerHTML;
  const co = S.companyName || "회사";
  const eff = S.effectiveDate || "";
  const scriptTag = "<scr" + "ipt>";
  const scriptCloseTag = "</" + "script>";
  const css = `*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#f5f5f7;color:#333;}
.wrapper{max-width:780px;margin:0 auto;padding:36px 20px 80px;}
.pp-doc{background:#fff;border-radius:10px;padding:48px 56px;box-shadow:0 2px 20px rgba(0,0,0,.07);}
@media(max-width:600px){.pp-doc{padding:28px 20px;}}
.pp-h2{font-size:26px;font-weight:700;color:#111;text-align:center;margin-bottom:6px;letter-spacing:-.5px;}
.pp-date-row{display:flex;justify-content:flex-end;margin:36px 0 20px;}
.pp-date-badge{background:#f4f5f7;border-radius:7px;padding:5px 14px;font-size:12px;font-weight:600;color:#555;border:1px solid #e0e0e0;}
.pp-intro{color:#555;font-size:13px;line-height:1.85;margin-bottom:8px;}
.pp-icon-nav{border:1px solid #e2e2e5;border-radius:10px;padding:16px 24px;display:flex;flex-wrap:wrap;margin:12px 0;}
.pp-icon-item{width:33.33%;display:flex;flex-direction:column;align-items:center;padding:12px 6px;text-align:center;}
.pp-icon-circle{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:6px;}
.pp-icon-label{font-size:11px;font-weight:700;color:#333;word-break:keep-all;}
.pp-toc-box{background:#f4f5f7;border-radius:7px;padding:10px 16px;margin:12px 0;}
.pp-toc-box ul{list-style:none;}
.pp-toc-box ul li{padding:2px 0;}
.pp-toc-link{display:flex;align-items:baseline;gap:7px;color:#444;text-decoration:none;padding:4px 7px;border-radius:5px;transition:background .15s,color .15s;font-size:12px;}
.pp-toc-link:hover{background:#e4e8ff;color:#4f6ef7;}
.pp-toc-num{font-family:'Courier New',monospace;font-size:10px;font-weight:700;color:#4f6ef7;min-width:20px;flex-shrink:0;}
.pp-toc-opt{font-size:9px;color:#aaa;margin-left:2px;}
.pp-sec{font-size:14px;font-weight:700;color:#343434;margin-top:28px;margin-bottom:10px;padding-bottom:7px;border-bottom:2px solid #f0f0f0;display:flex;align-items:center;gap:7px;scroll-margin-top:20px;}
.pp-sec-num{width:22px;height:22px;border-radius:5px;background:linear-gradient(135deg,#4f6ef7,#7c5ce7);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;}
p{font-size:13px;color:#666;margin-bottom:7px;line-height:1.8;}
.pp-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;}
.pp-table th{background:#f2f2f2;padding:7px 9px;text-align:center;border:1px solid #ddd;font-weight:700;color:#333;}
.pp-table td{padding:7px 9px;border:1px solid #ddd;color:#555;vertical-align:top;}
.pp-table td.c{text-align:center;vertical-align:middle;}
ul.pp-list{padding-left:0;margin:6px 0;list-style:none;}
ul.pp-list li{font-size:13px;color:#666;padding:2px 0 2px 16px;position:relative;line-height:1.7;}
ul.pp-list li::before{content:'·';position:absolute;left:5px;color:#aaa;}
.pp-contact-box{background:#f8f9fa;border-radius:7px;padding:14px 18px;margin:10px 0;}
.pp-contact-title{font-weight:700;font-size:13px;color:#333;margin-bottom:5px;}
.pp-contact-info{font-size:12px;color:#555;line-height:1.8;}
.pp-eff-date{font-size:13px;color:#555;margin-top:20px;padding-top:14px;border-top:1px solid #eee;}
.pp-sub-title{font-size:13px;font-weight:700;color:#444;margin:14px 0 6px;}
.pp-placeholder{color:#bbb;font-style:italic;}
a{color:#4f6ef7;}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${svc ? svc + " " : co + " "}개인정보 처리방침${eff ? " (" + eff + ")" : ""}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>${css}</style>
${scriptTag}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.pp-toc-link').forEach(function(a){
    a.addEventListener('click',function(e){
      var h=a.getAttribute('href');
      if(h&&h.startsWith('#')){e.preventDefault();var t=document.querySelector(h);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}
    });
  });
});
${scriptCloseTag}
</head>
<body>
<div class="wrapper"><div class="pp-doc">${content}</div></div>
</body>
</html>`;
}

function downloadHTML() {
  const html = generateFinalHTML();
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const name = (S.companyName || "company").replace(/[^a-zA-Z0-9가-힣]/g, "");
  a.download = "개인정보처리방침_" + name + ".html";
  a.click();
  showToast("✅ HTML 파일이 다운로드되었습니다!", "success");
}

function copyHTML() {
  navigator.clipboard
    .writeText(generateFinalHTML())
    .then(() => showToast("📋 HTML 코드가 복사되었습니다!", "success"));
}

function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast " + (type || "") + " show";
  setTimeout(() => t.classList.remove("show"), 3000);
}

// INIT
window.onload = function () {
  addCollect("noConsent");
  addCollect("consent");
  updatePreview();
};

// SIDEBAR RESIZE
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
