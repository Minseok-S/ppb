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
