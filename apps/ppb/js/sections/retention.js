// ════════════════════════════════════════
//  법령 보존항목 — 통합 목록(기본 preset + 직접 추가 custom)
//  S.retentionLegal 배열 하나에서 자유 정렬. 미리보기 표도 이 순서를 따른다.
// ════════════════════════════════════════

// 기본(법정) 보존항목 정의 — preview.js의 표 렌더도 이 값을 사용
const RETENTION_PRESETS = {
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
const RETENTION_PRESET_ORDER = ["contract", "dispute", "ad", "log"];

function _escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

// 구버전 파일(통합 목록 없음) → 레거시(retention 토글 + customRetentionLegal)에서 마이그레이션
function migrateRetentionLegal(retention, custom) {
  const out = RETENTION_PRESET_ORDER.map((key) => ({
    kind: "preset",
    key,
    on: retention ? retention[key] !== false : true,
  }));
  (custom || []).forEach((r) =>
    out.push({
      kind: "custom",
      label: r.label || "",
      basis: r.basis || "",
      period: r.period || "",
    }),
  );
  return out;
}

// 통합 목록을 폼 카드로 렌더
function renderRetentionLegal() {
  const c = document.getElementById("retentionLegalList");
  if (!c) return;
  if (!Array.isArray(S.retentionLegal)) S.retentionLegal = [];
  const list = S.retentionLegal;
  const handle = `<span class="drag-handle" title="끌어서 순서 변경" data-reorder-array="retentionLegal" data-reorder-render="renderRetentionLegal()">⠿</span>`;
  c.innerHTML = list
    .map((it, i) => {
      if (it.kind === "preset") {
        const p = RETENTION_PRESETS[it.key] || {};
        return `<div class="card-item retlegal-preset${it.on ? "" : " off"}" data-idx="${i}">
          <div class="card-header">
            ${handle}<span class="card-title">법령 (기본)</span>
            <span class="card-tools"><div class="retlegal-sw${it.on ? " on" : ""}" title="포함/제외" onclick="toggleRetentionLegal(${i})"></div></span>
          </div>
          <div class="retlegal-readonly"><b>${p.label}</b><br><span class="retlegal-meta">${p.basis} · ${p.period}</span></div>
        </div>`;
      }
      return `<div class="card-item" data-idx="${i}">
        <div class="card-header">${handle}<span class="card-title">직접 추가</span><span class="card-tools"><button class="btn-icon" onclick="removeRetentionLegal(${i})">✕</button></span></div>
        <div class="field-group"><label class="field-label">보존 항목명</label><input type="text" value="${_escAttr(it.label)}" placeholder="예: 전자금융거래 기록" oninput="setRetentionLegal(${i},'label',this.value)"></div>
        <div class="field-row">
          <div class="field-group"><label class="field-label">근거 법령</label><input type="text" value="${_escAttr(it.basis)}" placeholder="예: 전자금융거래법 제22조" oninput="setRetentionLegal(${i},'basis',this.value)"></div>
          <div class="field-group"><label class="field-label">보존 기간</label><input type="text" value="${_escAttr(it.period)}" placeholder="예: 5년" oninput="setRetentionLegal(${i},'period',this.value)"></div>
        </div>
      </div>`;
    })
    .join("");
}

// 기본 항목 포함/제외 토글
function toggleRetentionLegal(i) {
  const it = S.retentionLegal && S.retentionLegal[i];
  if (!it) return;
  it.on = !it.on;
  renderRetentionLegal();
  updatePreview();
}

// 직접 추가 항목 필드 수정 — 포커스 유지 위해 재렌더 없이 값만 갱신
function setRetentionLegal(i, field, val) {
  const it = S.retentionLegal && S.retentionLegal[i];
  if (!it) return;
  it[field] = val;
  updatePreview();
}

function addRetentionLegalCustom() {
  if (!Array.isArray(S.retentionLegal)) S.retentionLegal = [];
  S.retentionLegal.push({ kind: "custom", label: "", basis: "", period: "" });
  renderRetentionLegal();
  updatePreview();
}

function removeRetentionLegal(i) {
  if (!Array.isArray(S.retentionLegal)) return;
  S.retentionLegal.splice(i, 1);
  renderRetentionLegal();
  updatePreview();
}

function addCustomRetentionOther() {
  const id = "cro_" + Date.now(),
    c = document.getElementById("customRetentionOther");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="drag-handle" title="끌어서 순서 변경" data-reorder="syncCRO">⠿</span><span class="card-title">그외 보존항목</span><span class="card-tools"><button class="btn-icon" onclick="removeAndSyncCRO('${id}')">✕</button></span></div>
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
