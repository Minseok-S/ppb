// ════════════════════════════════════════
//  DYNAMIC — OVERSEAS
// ════════════════════════════════════════
const OT_BASIS_OPTIONS = [
  {
    value: "동의",
    label: "「개인정보 보호법」 제18조제2항제1호",
    sub: "제28조의8제1항제1호 (동의)",
    preview: "「개인정보 보호법」 제18조제2항제1호, 제28조의8제1항제1호(동의)",
  },
  {
    value: "위탁",
    label: "「개인정보 보호법」 제26조 (처리위탁)",
    sub: "제28조의8제1항제3호 (처리위탁·보관)",
    preview: "「개인정보 보호법」 제26조(처리위탁), 제28조의8제1항제3호(처리위탁·보관)",
  },
];

function buildOTCard(id) {
  const basisChips = OT_BASIS_OPTIONS.map(
    (o) => `
    <div class="radio-item ot-basis-chip" data-value="${o.value}" data-preview="${o.preview}" onclick="selectOTBasis(this)">
      <div class="radio-dot"></div>
      <div>
        <div class="radio-text">${o.label}</div>
        <div class="radio-desc">${o.sub}</div>
      </div>
    </div>`
  ).join("");

  return `
    <div class="card-header"><span class="card-title">이전 대상</span><button class="btn-icon" onclick="removeAndSyncOT('${id}')">✕</button></div>
    <div class="field-group">
      <label class="field-label">관련 근거</label>
      <div class="radio-group ot-basis-group">${basisChips}</div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">이전받는 자</label><input type="text" data-field="receiver" placeholder="업체명·연락처" oninput="syncOT();updatePreview()"></div>
      <div class="field-group"><label class="field-label">이전 국가</label><input type="text" data-field="country" placeholder="예: 미국" oninput="syncOT();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">이전하는 개인정보 항목</label><input type="text" data-field="items" placeholder="항목" oninput="syncOT();updatePreview()"></div>
      <div class="field-group"><label class="field-label">이용 목적</label><input type="text" data-field="purpose" placeholder="목적" oninput="syncOT();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">이전 시기 및 방법</label><input type="text" data-field="method" placeholder="예: 서비스 이용 시점, VPN 전송" oninput="syncOT();updatePreview()"></div>
      <div class="field-group"><label class="field-label">개인정보 보유 및 이용기간</label><input type="text" data-field="retention" placeholder="기간" oninput="syncOT();updatePreview()"></div>
    </div>
  `;
}

function addOverseas(type) {
  const id = "ot_" + Date.now();
  const containerId = type === "provide" ? "otProvideItems" : "otDelegateItems";
  const c = document.getElementById(containerId);
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.dataset.otType = type;
  d.innerHTML = buildOTCard(id);
  c.appendChild(d);
}

function selectOTType(type, val) {
  const noId = type === "provide" ? "otP_no" : "otD_no";
  const yesId = type === "provide" ? "otP_yes" : "otD_yes";
  const detailId = type === "provide" ? "otProvideDetail" : "otDelegateDetail";

  document.getElementById(noId).classList.toggle("selected", val === "no");
  document.getElementById(yesId).classList.toggle("selected", val === "yes");
  document.getElementById(detailId).style.display = val === "yes" ? "block" : "none";

  if (type === "provide") S.otProvide = val;
  else S.otDelegate = val;

  S.overseas = (S.otProvide === "yes" || S.otDelegate === "yes") ? "yes" : "no";
  document.getElementById("otRefuseSection").style.display =
    S.overseas === "yes" ? "block" : "none";

  syncOT();
  updatePreview();
}

function selectOTBasis(el) {
  const group = el.closest(".ot-basis-group");
  group.querySelectorAll(".ot-basis-chip").forEach((c) => c.classList.remove("selected"));
  el.classList.add("selected");
  syncOT();
  updatePreview();
}

function toggleRefuseChannel(key) {
  const toggle = document.getElementById("otRef_" + key + "_toggle");
  const inputWrap = document.getElementById("otRef_" + key + "_input");
  const isOn = toggle.classList.toggle("checked");
  inputWrap.style.display = isOn ? "block" : "none";
  syncOT();
  updatePreview();
}

function removeAndSyncOT(id) {
  document.getElementById(id)?.remove();
  syncOT();
  updatePreview();
}

function readOTItems(containerId) {
  const items = [];
  document.querySelectorAll("#" + containerId + " .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    const basisEl = d.querySelector(".ot-basis-chip.selected");
    items.push({
      basis: basisEl ? basisEl.dataset.preview : "",
      receiver: g("receiver"),
      country: g("country"),
      items: g("items"),
      purpose: g("purpose"),
      method: g("method"),
      retention: g("retention"),
    });
  });
  return items;
}

function syncOT() {
  S.otProvideItems = readOTItems("otProvideItems");
  S.otDelegateItems = readOTItems("otDelegateItems");
  S.otRefuseDisadvantage = document.getElementById("otRefuseDisadvantage")?.value || "";

  const webOn = document.getElementById("otRef_web_toggle")?.classList.contains("checked");
  const webPath = document.getElementById("otRef_web_path")?.value || "";
  const mobileOn = document.getElementById("otRef_mobile_toggle")?.classList.contains("checked");
  const mobilePath = document.getElementById("otRef_mobile_path")?.value || "";
  const csOn = document.getElementById("otRef_cs_toggle")?.classList.contains("checked");
  const csPhone = document.getElementById("otRef_cs_phone")?.value || "";

  S.otRefuseWeb = { use: !!webOn, path: webPath };
  S.otRefuseMobile = { use: !!mobileOn, path: mobilePath };
  S.otRefuseCS = { use: !!csOn, phone: csPhone };

  const siteParts = [];
  if (webOn && webPath) siteParts.push(`홈페이지(${webPath})`);
  if (mobileOn && mobilePath) siteParts.push(`모바일(${mobilePath})`);

  const viaParts = [];
  if (csOn && csPhone) viaParts.push(`고객센터(☎${csPhone})`);
  S.otRefuseCustom.forEach((c) => viaParts.push(c));

  let sentence = "";
  if (siteParts.length > 0) sentence += siteParts.join(" 및 ") + "에서 회원 탈퇴를 진행하거나 ";
  if (viaParts.length > 0) sentence += viaParts.join(" 및 ") + "를 통하여 ";
  S.otRefuseMethod = sentence ? `국외 이전을 원치 않을 경우 ${sentence}회원 탈퇴를 요청할 수 있습니다.` : "";
}

function addRefuseCustom() {
  const nameEl = document.getElementById("otRef_custom_name");
  const detailEl = document.getElementById("otRef_custom_detail");
  const name = nameEl.value.trim();
  const detail = detailEl.value.trim();
  if (!name) return;
  const label = detail ? `${name}(${detail})` : name;
  S.otRefuseCustom.push(label);
  nameEl.value = "";
  detailEl.value = "";
  renderRefuseCustomChips();
  syncOT();
  updatePreview();
}

function removeRefuseCustom(idx) {
  S.otRefuseCustom.splice(idx, 1);
  renderRefuseCustomChips();
  syncOT();
  updatePreview();
}

function renderRefuseCustomChips() {
  const wrap = document.getElementById("otRef_custom_chips");
  if (!wrap) return;
  wrap.innerHTML = S.otRefuseCustom
    .map(
      (label, i) =>
        `<span class="sec-chip">${label}<button onclick="removeRefuseCustom(${i})">✕</button></span>`
    )
    .join("");
}
