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
//  PSEUDONYM SECURITY — CUSTOM ITEMS
// ════════════════════════════════════════
const PS_CAT_MAP = { mgmt: "ps_mgmt_extra", tech: "ps_tech_extra", phys: "ps_phys_extra" };

function addPsSecItem(cat) {
  const inp = document.getElementById("ps_sec_" + cat + "_input");
  const val = inp.value.trim();
  if (!val) return;
  S.pseudonymSecurity[PS_CAT_MAP[cat]].push(val);
  inp.value = "";
  renderPsSecChips(cat);
  updatePreview();
}

function removePsSecItem(cat, idx) {
  S.pseudonymSecurity[PS_CAT_MAP[cat]].splice(idx, 1);
  renderPsSecChips(cat);
  updatePreview();
}

function renderPsSecChips(cat) {
  const container = document.getElementById("ps_sec_" + cat + "_chips");
  if (!container) return;
  const items = S.pseudonymSecurity[PS_CAT_MAP[cat]] || [];
  container.innerHTML = items
    .map(
      (v, i) =>
        `<span class="sec-chip">${v}<button onclick="removePsSecItem('${cat}',${i})">×</button></span>`
    )
    .join("");
}
