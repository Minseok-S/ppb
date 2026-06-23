// ════════════════════════════════════════
//  PERSISTENCE — 저장 / 불러오기 / 폼 복원
//  - 프로젝트 파일(.json) 저장·불러오기
//  - 자동 저장(localStorage) + 재방문 시 복원
//  - 내보낸 HTML 안에 상태 내장 → HTML 파일로도 불러오기
//  - 불러오기 후 사이드바 폼 전체 복원
// ════════════════════════════════════════

const PPB_STORAGE_KEY = "ppb_autosave_v1";
const PPB_STATE_TAG_ID = "ppb-state";

// ── 직렬화 ──────────────────────────────
function serializeState() {
  const clone = JSON.parse(JSON.stringify(S));
  // 편집모드 관련 휘발성 값은 저장하지 않는다
  delete clone.editMode;
  delete clone.editBase;
  delete clone.editView;
  return {
    app: "ppb",
    version: 1,
    savedAt: new Date().toISOString(),
    state: clone,
    extras: {
      // S에 들어가지 않는 모듈 로컬 상태
      childCustomItems:
        typeof childCustomItems !== "undefined" ? childCustomItems.slice() : [],
    },
  };
}

// HTML 내보내기에 끼워넣을 <script type="application/json"> 블록
function buildStateScriptTag() {
  const json = JSON.stringify(serializeState()).replace(/</g, "\\u003c");
  return (
    '<scr' +
    'ipt type="application/json" id="' +
    PPB_STATE_TAG_ID +
    '">' +
    json +
    "</scr" +
    "ipt>"
  );
}

// ── 자동 저장 ───────────────────────────
let _ppbAutosaveTimer = null;
function scheduleAutosave() {
  if (_ppbAutosaveTimer) clearTimeout(_ppbAutosaveTimer);
  _ppbAutosaveTimer = setTimeout(doAutosave, 800);
}
function doAutosave() {
  try {
    localStorage.setItem(PPB_STORAGE_KEY, JSON.stringify(serializeState()));
  } catch (e) {
    /* 용량 초과 등은 무시 */
  }
}
function clearAutosave() {
  try {
    localStorage.removeItem(PPB_STORAGE_KEY);
  } catch (e) {}
}

// updatePreview를 감싸 매 변경마다 자동 저장 (디바운스)
(function wrapUpdatePreview() {
  if (typeof updatePreview === "function") {
    const orig = updatePreview;
    window.updatePreview = function () {
      const r = orig.apply(this, arguments);
      scheduleAutosave();
      return r;
    };
  }
})();

// ── 저장(파일 다운로드) ─────────────────
function saveProjectFile() {
  const data = serializeState();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const name = (S.companyName || "project").replace(/[^a-zA-Z0-9가-힣]/g, "");
  a.download = "개인정보처리방침_" + name + ".ppb.json";
  a.click();
  if (typeof showToast === "function") showToast("💾 프로젝트가 저장되었습니다.", "success");
}

// ── 불러오기(파일 선택) ─────────────────
function loadProjectFromFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    let payload = null;
    try {
      const text = e.target.result;
      if (/\.json$/i.test(file.name)) payload = JSON.parse(text);
      else payload = extractStateFromHTML(text);
    } catch (err) {
      payload = null;
    }
    if (!payload || !payload.state) {
      if (typeof showToast === "function")
        showToast("⚠️ 불러올 수 있는 데이터를 찾지 못했습니다.", "error");
    } else {
      applyState(payload);
      if (typeof showToast === "function")
        showToast("✅ 불러오기가 완료되었습니다.", "success");
    }
    input.value = "";
  };
  reader.readAsText(file);
}

function extractStateFromHTML(html) {
  const re = new RegExp(
    '<script[^>]*id=["\']' + PPB_STATE_TAG_ID + '["\'][^>]*>([\\s\\S]*?)</script>',
    "i"
  );
  const m = html.match(re);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch (e) {
    return null;
  }
}

// 페이지 진입 시 자동 저장본 복원 여부 확인
function tryRestoreAutosave() {
  let raw = null;
  try {
    raw = localStorage.getItem(PPB_STORAGE_KEY);
  } catch (e) {
    return false;
  }
  if (!raw) return false;
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    return false;
  }
  if (!payload || !payload.state) return false;
  const when = payload.savedAt
    ? new Date(payload.savedAt).toLocaleString("ko-KR")
    : "";
  const ok = window.confirm(
    "이전에 작업하던 내용이 있습니다" +
      (when ? " (" + when + ")" : "") +
      ".\n이어서 작업하시겠습니까?\n\n[취소]를 누르면 새로 시작합니다."
  );
  if (!ok) return false;
  applyState(payload);
  return true;
}

// ════════════════════════════════════════
//  폼 전체 복원
// ════════════════════════════════════════
function _setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v == null ? "" : v;
}
function _setChk(id, b) {
  const el = document.getElementById(id);
  if (el) el.checked = !!b;
}
function _setPanel(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? "block" : "none";
}

// 텍스트/날짜/숨김 입력 — id가 S 키와 동일한 것들을 일괄 복원
function _restoreStaticInputs(st) {
  Object.keys(st).forEach((k) => {
    const v = st[k];
    if (typeof v !== "string" && typeof v !== "number") return;
    const el = document.getElementById(k);
    if (
      el &&
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")
    ) {
      el.value = v;
    }
  });
}

// 단순 동적 리스트 복원 (data-field 기반)
function _rebuildSimple(containerId, arr, addFn, fields) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = "";
  (arr || []).forEach((item) => {
    addFn();
    const card = c.lastElementChild;
    if (!card) return;
    fields.forEach((f) => {
      const el = card.querySelector('[data-field="' + f + '"]');
      if (el) el.value = item[f] == null ? "" : item[f];
    });
  });
}

// 수집항목: basis 셀렉트 특수 처리
function _setBasis(card, basisVal) {
  const sel = card.querySelector('select[data-field="basis"]');
  if (!sel) return;
  const hasOpt =
    basisVal !== "custom" &&
    Array.from(sel.options).some((o) => o.value === basisVal);
  if (hasOpt) {
    sel.value = basisVal;
    const ci = card.querySelector(".basis-custom");
    if (ci) ci.style.display = "none";
  } else {
    sel.value = "custom";
    const ci = card.querySelector(".basis-custom");
    if (ci) {
      ci.style.display = "";
      ci.value = basisVal || "";
    }
    if (basisVal && typeof basisMap !== "undefined") basisMap[basisVal] = basisVal;
  }
}

function _rebuildCollect(type, arr) {
  const containerId = "collect" + cap(type);
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = "";
  (arr || []).forEach((item) => {
    addCollect(type);
    const card = c.lastElementChild;
    if (!card) return;
    ["category", "purpose", "items", "retention"].forEach((f) => {
      const el = card.querySelector('[data-field="' + f + '"]');
      if (el) el.value = item[f] == null ? "" : item[f];
    });
    if (type !== "auto") _setBasis(card, item.basis);
  });
  syncCollect(type);
}

function _rebuildCollectOther(arr) {
  const c = document.getElementById("collectOther");
  if (!c) return;
  c.innerHTML = "";
  (arr || []).forEach((item) => {
    addCollectOther();
    const card = c.lastElementChild;
    if (!card) return;
    ["purpose", "items", "provider", "retention"].forEach((f) => {
      const el = card.querySelector('[data-field="' + f + '"]');
      if (el) el.value = item[f] == null ? "" : item[f];
    });
    _setBasis(card, item.basis);
  });
  syncCollectOther();
}

function _rebuildOverseas(type, arr) {
  const containerId = type === "provide" ? "otProvideItems" : "otDelegateItems";
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = "";
  (arr || []).forEach((item) => {
    addOverseas(type);
    const card = c.lastElementChild;
    if (!card) return;
    ["receiver", "country", "items", "purpose", "method", "retention"].forEach(
      (f) => {
        const el = card.querySelector('[data-field="' + f + '"]');
        if (el) el.value = item[f] == null ? "" : item[f];
      }
    );
    const chip = Array.from(card.querySelectorAll(".ot-basis-chip")).find(
      (x) => x.dataset.preview === item.basis
    );
    if (chip) chip.classList.add("selected");
  });
}

function _rebuildDepts(arr) {
  const list = arr && arr.length ? arr : [{ name: "", phone: "", email: "" }];
  _setVal("dept1Name", list[0].name);
  _setVal("dept1Phone", list[0].phone);
  _setVal("dept1Email", list[0].email);
  const c = document.getElementById("deptItems");
  if (c) c.innerHTML = "";
  for (let i = 1; i < list.length; i++) {
    addDept();
    const card = c.lastElementChild;
    if (!card) continue;
    ["name", "phone", "email"].forEach((f) => {
      const el = card.querySelector('[data-field="' + f + '"]');
      if (el) el.value = list[i][f] == null ? "" : list[i][f];
    });
  }
  syncDepts();
}

function _restoreToggles() {
  document.querySelectorAll(".toggle-item").forEach((el) => {
    const oc = el.getAttribute("onclick") || "";
    const m = oc.match(/toggleItem\(this,'([^']+)'\)/);
    if (!m) return;
    const group = m[1];
    const key = el.dataset.key;
    if (!key) return;
    const g = S[group];
    if (!g || typeof g[key] === "undefined") {
      el.classList.remove("checked");
      return;
    }
    el.classList.toggle("checked", !!g[key]);
  });
  // 토글에 딸린 상세 패널
  if (S.vaFlags) {
    _setPanel("vaIsmsDetail", S.vaFlags.va_isms);
    _setPanel("vaAiDataDetail", S.vaFlags.va_aiData);
  }
  if (S.rights) _setPanel("rightsOnlineDetail", S.rights.r_web);
}

function _restoreRadios() {
  document.querySelectorAll('[onclick^="selectR("]').forEach((el) => {
    const m = (el.getAttribute("onclick") || "").match(
      /selectR\('([^']*)','([^']*)','([^']*)','([^']*)'\)/
    );
    if (!m) return;
    const onId = m[1],
      offId = m[2],
      key = m[3],
      val = m[4];
    if (String(S[key]) === val) {
      try {
        selectR(onId, offId, key, val);
      } catch (e) {}
    }
  });
}

function _restoreRefusePanel() {
  [
    ["web", "otRefuseWeb", "path", "otRef_web_path"],
    ["mobile", "otRefuseMobile", "path", "otRef_mobile_path"],
    ["cs", "otRefuseCS", "phone", "otRef_cs_phone"],
  ].forEach(([k, sk, field, inputId]) => {
    const obj = S[sk] || {};
    const toggle = document.getElementById("otRef_" + k + "_toggle");
    const wrap = document.getElementById("otRef_" + k + "_input");
    const inp = document.getElementById(inputId);
    if (toggle) toggle.classList.toggle("checked", !!obj.use);
    if (wrap) wrap.style.display = obj.use ? "block" : "none";
    if (inp) inp.value = obj[field] || "";
  });
  _setVal("otRefuseDisadvantage", S.otRefuseDisadvantage);
  if (typeof renderRefuseCustomChips === "function") renderRefuseCustomChips();
}

function _restoreChildMethod() {
  const cm = S.childMethod || "";
  const radios = document.querySelectorAll('input[name="childMethodOpt"]');
  let matched = false;
  radios.forEach((r) => {
    if (r.value === cm) {
      r.checked = true;
      matched = true;
    }
  });
  const ta = document.getElementById("childMethod");
  if (matched) {
    if (ta) ta.style.display = "none";
  } else {
    const cust = Array.from(radios).find((r) => r.value === "custom");
    if (cust) cust.checked = true;
    if (ta) {
      ta.style.display = "";
      ta.value = cm;
    }
  }
}

function applyState(payload) {
  const st = payload.state || {};

  // 1) 상태 객체 갱신 (존재하는 키만 — 구버전 호환)
  Object.keys(st).forEach((k) => {
    S[k] = st[k];
  });
  S.editMode = false;
  S.editBase = null;
  S.editView = null;

  // 모듈 로컬 상태 복원
  if (
    payload.extras &&
    Array.isArray(payload.extras.childCustomItems) &&
    typeof childCustomItems !== "undefined"
  ) {
    childCustomItems.length = 0;
    payload.extras.childCustomItems.forEach((x) => childCustomItems.push(x));
  }

  // 2) 정적 입력 복원
  _restoreStaticInputs(st);
  if (S.addUsageCriteria) {
    _setVal("auC1Var", S.addUsageCriteria.c1Var);
    _setVal("auC4Var", S.addUsageCriteria.c4Var);
  }
  // 아동 항목 체크박스 (근사 복원) + 숨김 입력
  const ci = S.childItems || "";
  _setChk("childItemName", ci.indexOf("성명") !== -1);
  _setChk("childItemPhone", ci.indexOf("전화번호") !== -1);
  _setChk("childItemEmail", ci.indexOf("이메일") !== -1);
  _setVal("childItems", ci);

  // 3) 동적 리스트 복원
  _rebuildCollect("noConsent", S.collectNoConsent);
  _rebuildCollect("consent", S.collectConsent);
  _rebuildCollect("auto", S.collectAuto);
  _rebuildCollectOther(S.collectOther);
  _rebuildSimple("customRetentionLegal", S.customRetentionLegal, addCustomRetentionLegal, ["label", "basis", "period"]);
  _rebuildSimple("customRetentionOther", S.customRetentionOther, addCustomRetentionOther, ["label", "basis", "period"]);
  _rebuildSimple("tpConsent", S.tpConsent, () => addTP("consent"), ["receiver", "purpose", "items", "retention"]);
  _rebuildSimple("tpLegal", S.tpLegal, () => addTP("legal"), ["basis", "receiver", "purpose", "items", "retention"]);
  _rebuildSimple("dlItems", S.dlItems, addDelegate, ["company", "task"]);
  _rebuildSimple("dlSubItems", S.dlSubItems, addSubDelegate, ["company", "task"]);
  _rebuildOverseas("provide", S.otProvideItems);
  _rebuildOverseas("delegate", S.otDelegateItems);
  _rebuildSimple("bhOwnDeviceItems", S.bhOwnDevices, addBhOwnDevice, ["name", "type", "purpose"]);
  _rebuildSimple("bhItems", S.bhItems, addBehavioral, ["legal", "items", "method", "purpose", "retention"]);
  _rebuildSimple("tpBhItems", S.bhTpItems, addTpItem, ["legal", "recipient", "items", "purpose", "retention"]);
  _rebuildSimple("bhThirdOutItems", S.bhThirdOutItems, addBhThirdOutItem, ["device", "type", "company", "items", "purpose"]);
  _rebuildSimple("adItems", S.bhAutoDevices, addAutoDevice, ["legal", "items", "method", "purpose", "retention"]);
  _rebuildSimple("cedItems", S.cookieExtDevices, addCookieExtDevice, ["device", "type", "company", "items", "purpose"]);
  _rebuildSimple("addUsageRows", S.addUsageRows, addAU, ["recipient", "items", "purpose", "retention"]);
  _rebuildSimple("sensitiveRows", S.sensitiveRows, addSensitive, ["service", "types", "exposure", "optout"]);
  _rebuildSimple("pseudonymRows", S.pseudonymRows, addPseudo, ["category", "purpose", "items", "retention"]);
  _rebuildSimple("pseudonymProvideRows", S.pseudonymProvideRows, addPseudoProvide, ["recipient", "items", "purpose", "retention"]);
  _rebuildSimple("adInfoRows", S.adInfoRows, addAdInfo, ["stage", "infoType", "weight"]);
  _rebuildSimple("prevPolicyItems", S.prevPolicies, addPrevPolicy, ["date", "url"]);
  _rebuildDepts(S.depts);

  // 4) CCTV (상태 기반 렌더)
  if (typeof renderCCTVLocations === "function") {
    renderCCTVLocations("fixed");
    renderCCTVLocations("mobile");
  }
  if (typeof renderCCTVDelegates === "function") {
    renderCCTVDelegates("fixed");
    renderCCTVDelegates("mobile");
  }

  // 5) 칩 목록 (상태 기반 렌더)
  if (typeof renderSecChips === "function")
    ["mgmt", "tech", "phys", "cert"].forEach((c) => renderSecChips(c));
  if (typeof renderVaChips === "function")
    ["effort", "reg", "trans", "right"].forEach((c) => renderVaChips(c));
  if (typeof renderPsSecChips === "function")
    ["mgmt", "tech", "phys"].forEach((c) => renderPsSecChips(c));
  if (typeof renderChildCustomTags === "function") renderChildCustomTags();

  // 6) 토글 / 국외이전 거부채널
  _restoreToggles();
  _restoreRefusePanel();

  // 7) 특수 선택자
  if (typeof selectBrowserEnv === "function") selectBrowserEnv(S.browserEnv);
  if (typeof selectOTType === "function") {
    selectOTType("provide", S.otProvide);
    selectOTType("delegate", S.otDelegate);
  }
  if (typeof selectCCTV === "function") {
    selectCCTV("fixed", S.cctvFixed);
    selectCCTV("mobile", S.cctvMobile);
  }
  if (typeof selectCCTVDelegate === "function") {
    selectCCTVDelegate("fixed", S.cctvFixedDelegate);
    selectCCTVDelegate("mobile", S.cctvMobileDelegate);
  }
  _restoreChildMethod();
  if (typeof toggleBhLegalFields === "function")
    toggleBhLegalFields(S.bhIdentifyMode);

  // 8) 라디오(selectR) — 상세 패널까지 함께 복원
  _restoreRadios();

  // 9) 최종 렌더
  updatePreview();
}
