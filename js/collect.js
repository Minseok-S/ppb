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

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
