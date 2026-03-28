// ════════════════════════════════════════
//  DYNAMIC — ADD USAGE (Step 13)
// ════════════════════════════════════════
function addAU() {
  const id = "au_" + Date.now();
  const c = document.getElementById("addUsageRows");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">이용·제공 항목</span><button class="btn-icon" onclick="removeAU('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">제공받는 자</label><input type="text" data-field="recipient" placeholder="기관·업체명" oninput="syncAU();updatePreview()"></div>
      <div class="field-group"><label class="field-label">항목</label><input type="text" data-field="items" placeholder="휴대전화번호, 위치정보" oninput="syncAU();updatePreview()"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">이용·제공 목적</label><input type="text" data-field="purpose" placeholder="예: 서비스 중개 제공" oninput="syncAU();updatePreview()"></div>
      <div class="field-group"><label class="field-label">보유 및 이용기간</label><input type="text" data-field="retention" placeholder="예: 서비스 이용 종료 시까지" oninput="syncAU();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAU(id) {
  document.getElementById(id)?.remove();
  syncAU();
  updatePreview();
}

function syncAU() {
  S.addUsageRows = [];
  document.querySelectorAll("#addUsageRows .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.addUsageRows.push({
      recipient: g("recipient"),
      items: g("items"),
      purpose: g("purpose"),
      retention: g("retention"),
    });
  });
  S.addUsageCriteria = {
    c1Var: document.getElementById("auC1Var")?.value || "",
    c4Var: document.getElementById("auC4Var")?.value || "",
  };
}

// 패널이 열릴 때 기본값으로 채워줌
function initAU() {
  const defaults = S.addUsageCriteria;
  const el1 = document.getElementById("auC1Var");
  const el4 = document.getElementById("auC4Var");
  if (el1 && !el1.value) el1.value = defaults.c1Var || "서비스 제공";
  if (el4 && !el4.value) el4.value = defaults.c4Var || "안심번호 사용";
  syncAU();
  updatePreview();
}

// 연속된 행에서 동일한 셀 값을 rowspan으로 병합
function buildAUTableRows(rows) {
  const fields = ["recipient", "items", "purpose", "retention"];
  const n = rows.length;
  const spans = Array.from({ length: n }, () => fields.map(() => 1));
  const skip = Array.from({ length: n }, () => fields.map(() => false));

  for (let col = 0; col < fields.length; col++) {
    for (let row = n - 2; row >= 0; row--) {
      const val = rows[row][fields[col]];
      if (val && val === rows[row + 1][fields[col]] && !skip[row + 1][col]) {
        spans[row][col] += spans[row + 1][col];
        skip[row + 1][col] = true;
      }
    }
  }

  return rows
    .map(
      (r, i) =>
        `<tr>${fields
          .map((f, j) => {
            if (skip[i][j]) return "";
            const rs = spans[i][j] > 1 ? ` rowspan="${spans[i][j]}"` : "";
            return `<td${rs}>${r[f] || "-"}</td>`;
          })
          .join("")}</tr>`
    )
    .join("\n    ");
}
