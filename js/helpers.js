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
    cookie3rdParty: ["ck3rdDetail", "yes"],
    behavioral: ["bhDetail", "yes"],
    bhProvide: ["bhTpDetail", "yes"],
    bhExtCollect: ["bhExtDetail", "yes"],
    bhThirdOut: ["bhThirdOutDetail", "yes"],
    bhAdUse: ["bhAdUseDetail", "yes"],
    addUsage: ["addUsageDetail", "yes"],
    sensitive: ["sensitiveDetail", "yes"],
    pseudonym: ["pseudonymDetail", "yes"],
    pseudonymProvide: ["pseudonymProvideDetail", "yes"],
    autoDecision: ["autoDecisionDetail", "yes"],
    adSensitive: ["adSensitiveDetailPanel", "yes"],
    domAgent: ["domAgentDetail", "yes"],
  };
  if (map[key]) {
    const [panelId, showVal] = map[key];
    const el = document.getElementById(panelId);
    if (el) el.style.display = val === showVal ? "block" : "none";
    if (key === "child" && val === showVal) syncChildItems();
    if (key === "addUsage" && val === showVal) initAU();
  }
  if (key === "bhIdentifyMode") toggleBhLegalFields(val);
  updatePreview();
}

function toggleItem(el, group) {
  el.classList.toggle("checked");
  const key = el.dataset.key;
  const maps = {
    retention: S.retention,
    destroy: S.destroy,
    security: S.security,
    bhBrowsers: S.bhBrowsers,
    bhFlags: S.bhFlags,
    sensitiveTypes: S.sensitiveTypes,
    rights: S.rights,
    rightsActions: S.rightsActions,
    agency: S.agency,
    pseudonymSecurity: S.pseudonymSecurity,
  };
  if (maps[group]) maps[group][key] = el.classList.contains("checked");
  if (group === "rights" && key === "r_web") {
    const on = el.classList.contains("checked");
    S.rightsOnline = on ? "yes" : "no";
    const panel = document.getElementById("rightsOnlineDetail");
    if (panel) panel.style.display = on ? "block" : "none";
  }
  updatePreview();
}

function selectBrowserEnv(env) {
  ["be_web", "be_mobile", "be_both"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("selected");
  });
  const target = document.getElementById("be_" + env);
  if (target) target.classList.add("selected");
  S.browserEnv = env;
  updatePreview();
}
