// ════════════════════════════════════════
//  DYNAMIC ROWS — COLLECT
// ════════════════════════════════════════
const basisOpts = [
  { v: "contract", l: "제15조제1항4호 (계약 체결·이행)" },
  { v: "consent", l: "제15조제1항1호 (정보주체 동의)" },
  { v: "legal", l: "제15조제1항2호 (법률 특별 규정)" },
  { v: "public", l: "제15조제1항3호 (공공기관 소관업무)" },
  { v: "interest", l: "제15조제1항6호 (정당한 이익)" },
  { v: "di", l: "제23조제1항제1호 (민감정보)" },
  { v: "interest", l: "제24조의2제1항제1호(주민등록번호)" },
  { v: "custom", l: "직접 입력" },
];
const basisMap = Object.fromEntries(
  basisOpts
    .filter((o) => o.v !== "custom")
    .map((o) => [o.v, "「개인정보 보호법」 " + o.l]),
);

function onBasisChange(sel, syncFn) {
  const wrap = sel.closest(".field-group");
  const customInput = wrap && wrap.querySelector(".basis-custom");
  if (customInput)
    customInput.style.display = sel.value === "custom" ? "" : "none";
  syncFn();
  updatePreview();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 영역 접기/펼치기
function toggleCollectBlock(head) {
  head.parentElement.classList.toggle("collapsed");
}

// 소제목 접기/펼치기
function toggleSubgroup(btn) {
  btn.closest(".subgroup-box")?.classList.toggle("collapsed");
}

// 각 영역의 빈 상태 안내 표시/숨김 갱신
function updateCollectCounts() {
  const setEmpty = (id, n) => {
    const e = document.getElementById(id);
    if (e) e.style.display = n ? "none" : "";
  };
  setEmpty("empty-noConsent", (S.collectNoConsent || []).length);
  setEmpty("empty-consent", (S.collectConsent || []).length);
}

// 카드 한 장의 내부 마크업 (동의없이/동의받아/자동 공용, 소제목 안팎 공용)
function collectCardInner(type, cid, num) {
  const needBasis = type !== "auto";
  return `
    <div class="card-header"><span class="card-title">#${num}</span><button class="btn-icon" onclick="removeAndSync('${cid}','${type}')">✕</button></div>
    ${needBasis ? `<div class="field-group"><label class="field-label">법적 근거</label><select data-field="basis" onchange="onBasisChange(this,()=>syncCollect('${type}'))">${basisOpts.map((o) => `<option value="${o.v}">${o.l}</option>`).join("")}</select><input type="text" class="basis-custom" data-field="basisCustom" placeholder="법적 근거를 직접 입력하세요" style="display:none;margin-top:6px;" oninput="syncCollect('${type}');updatePreview()"></div>` : ""}
    <div class="field-row">
      <div class="field-group"><label class="field-label">구분</label><input type="text" data-field="category" placeholder="예: 회원 서비스 운영" oninput="syncCollect('${type}');updatePreview()"></div>
      <div class="field-group"><label class="field-label">처리 목적</label><input type="text" data-field="purpose" placeholder="예: 본인 식별, 회원 관리" oninput="syncCollect('${type}');updatePreview()"></div>
    </div>
    <div class="field-group"><label class="field-label">처리 항목</label><input type="text" data-field="items" placeholder="예: ID, 휴대전화번호, 성명" oninput="syncCollect('${type}');updatePreview()"></div>
    ${type !== "auto" ? `<div class="field-group"><label class="field-label">처리 및 보유기간</label><input type="text" data-field="retention" placeholder="예: 회원 탈퇴 시까지" oninput="syncCollect('${type}');updatePreview()"></div>` : ""}
  `;
}

// 소제목에 속하지 않은(평면) 항목 추가
function addCollect(type) {
  const cid = "ci_" + type + "_" + Date.now();
  const container = document.getElementById("collect" + cap(type));
  const num = container.children.length + 1;
  const div = document.createElement("div");
  div.className = "card-item";
  div.id = cid;
  div.innerHTML = collectCardInner(type, cid, num);
  container.appendChild(div);
  syncCollect(type);
}

// 소제목 컨테이너 추가 (noConsent / consent 만). gid·name 은 불러오기 복원 시 전달.
function addCollectGroup(type, gid, name) {
  const wrap = document.getElementById("collect" + cap(type) + "Groups");
  if (!wrap) return;
  gid = gid || "cg_" + type + "_" + Date.now();
  const num = wrap.children.length + 1;
  const box = document.createElement("div");
  box.className = "subgroup-box";
  box.id = gid;
  box.innerHTML = `
    <div class="card-header subgroup-head">
      <button class="cb-chevron sg-toggle" onclick="toggleSubgroup(this)">▾</button>
      <input type="text" class="subgroup-name" data-field="groupName" placeholder="소제목 이름 (예: 소제목 ${num})" value="${(name || "").replace(/"/g, "&quot;")}" oninput="syncCollect('${type}');updatePreview()">
      <button class="btn-icon" onclick="removeCollectGroup('${gid}','${type}')">✕</button>
    </div>
    <div class="subgroup-items" id="${gid}_items"></div>
    <button class="btn-add" onclick="addCollectInGroup('${type}','${gid}')">＋ 항목 추가</button>`;
  wrap.appendChild(box);
  syncCollect(type);
  return gid;
}

// 소제목 안에 항목 추가
function addCollectInGroup(type, gid) {
  const itemsWrap = document.getElementById(gid + "_items");
  if (!itemsWrap) return;
  const cid = "ci_" + type + "_" + Date.now();
  const num = itemsWrap.children.length + 1;
  const div = document.createElement("div");
  div.className = "card-item";
  div.id = cid;
  div.innerHTML = collectCardInner(type, cid, num);
  itemsWrap.appendChild(div);
  syncCollect(type);
}

function removeCollectGroup(gid, type) {
  document.getElementById(gid)?.remove();
  syncCollect(type);
  updatePreview();
}

// 카드 한 장을 상태 객체로 읽기
function _readCollectCard(d, gid, group) {
  const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
  const rawBasis = g("basis") || "consent";
  const basisVal = rawBasis === "custom" ? g("basisCustom") || "" : rawBasis;
  if (rawBasis === "custom" && basisVal) basisMap[basisVal] = basisVal;
  return {
    basis: basisVal,
    category: g("category"),
    purpose: g("purpose"),
    items: g("items"),
    retention: g("retention"),
    gid: gid,
    group: group,
  };
}

function syncCollect(type) {
  const Cap = cap(type);
  const arr = [];
  // 1) 평면(소제목 미지정) 항목 — #collectType 직속 카드
  const flat = document.getElementById("collect" + Cap);
  if (flat)
    flat
      .querySelectorAll(":scope > .card-item")
      .forEach((d) => arr.push(_readCollectCard(d, "", "")));
  // 2) 소제목별 항목
  const groupsWrap = document.getElementById("collect" + Cap + "Groups");
  if (groupsWrap)
    groupsWrap.querySelectorAll(":scope > .subgroup-box").forEach((box) => {
      const gname = box.querySelector('[data-field="groupName"]')?.value || "";
      box
        .querySelectorAll(".card-item")
        .forEach((d) => arr.push(_readCollectCard(d, box.id, gname)));
    });
  S["collect" + Cap] = arr;
  updateCollectCounts();
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
    <div class="field-group"><label class="field-label">법적 근거</label><select data-field="basis" onchange="onBasisChange(this,syncCollectOther)">${basisOpts.map((o) => `<option value="${o.v}">${o.l}</option>`).join("")}</select><input type="text" class="basis-custom" data-field="basisCustom" placeholder="법적 근거를 직접 입력하세요" style="display:none;margin-top:6px;" oninput="syncCollectOther();updatePreview()"></div>
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
    const rawBasis = g("basis") || "consent";
    const basisVal = rawBasis === "custom" ? g("basisCustom") || "" : rawBasis;
    if (rawBasis === "custom" && basisVal) basisMap[basisVal] = basisVal;
    S.collectOther.push({
      basis: basisVal,
      purpose: g("purpose"),
      items: g("items"),
      provider: g("provider"),
      retention: g("retention"),
    });
  });
  updateCollectCounts();
}

function removeAndSyncCollectOther(id) {
  document.getElementById(id)?.remove();
  syncCollectOther();
  updatePreview();
}
