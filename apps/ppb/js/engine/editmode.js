// ════════════════════════════════════════
//  EDIT MODE — 미리보기 직접 편집
//
//  미리보기 최상위 요소 목록을 3-way 병합(diff3)한다.
//    base  = 편집 당시의 순수 폼 렌더 (S.editBase)
//    view  = 사용자가 편집한 결과   (S.editView)
//    fresh = 이번 폼 렌더
//  사용자가 고친 요소는 편집본을 유지하고, 폼이 바꾼 요소는 새 렌더를
//  반영한다. 같은 요소를 양쪽이 모두 바꿨으면 폼(fresh)이 우선한다.
//  → 섹션 구분 없이 수동 편집과 설정 패널 변경이 함께 적용된다.
// ════════════════════════════════════════

// 마지막 순수 폼 렌더의 최상위 요소 outerHTML 목록 — 편집 비교 기준
let _lastRender = null;

function previewChildrenHTML() {
  return Array.from(
    document.getElementById("previewContent").children,
  ).map((n) => n.outerHTML);
}

// updatePreview()가 순수 렌더 직후 호출 — 편집본 덮어쓰기 전 상태를 보관
function snapshotRender() {
  _lastRender = previewChildrenHTML();
}

// LCS 기반 diff: a[as..ae)가 b[bs..be)로 바뀐 헝크 목록
function lcsDiff(a, b) {
  const n = a.length,
    m = b.length;
  const dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hunks = [];
  let i = 0,
    j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    const as = i,
      bs = j;
    while ((i < n || j < m) && !(i < n && j < m && a[i] === b[j])) {
      if (j >= m || (i < n && dp[i + 1][j] >= dp[i][j + 1])) i++;
      else j++;
    }
    hunks.push({ as, ae: i, bs, be: j });
  }
  return hunks;
}

// diff3 병합 — 충돌 시 N(폼 렌더) 우선
function merge3(O, E, N) {
  const he = lcsDiff(O, E);
  const hn = lcsDiff(O, N);
  const out = [];
  let io = 0,
    ie = 0,
    iN = 0,
    pe = 0,
    pn = 0;
  while (io < O.length || pe < he.length || pn < hn.length) {
    const nextE = pe < he.length ? he[pe].as : Infinity;
    const nextN = pn < hn.length ? hn[pn].as : Infinity;
    const start = Math.min(nextE, nextN);
    if (start === Infinity) break;
    // 세 버전이 동일한 구간 복사
    while (io < start) {
      out.push(N[iN]);
      io++;
      ie++;
      iN++;
    }
    // start에서 시작해 서로 겹치는 헝크들을 한 그룹으로 수집
    let end = start,
      eRem = 0,
      eAdd = 0,
      nRem = 0,
      nAdd = 0,
      hasE = false,
      hasN = false,
      grew = true;
    while (grew) {
      grew = false;
      while (pe < he.length && (he[pe].as === start || he[pe].as < end)) {
        hasE = true;
        end = Math.max(end, he[pe].ae);
        eRem += he[pe].ae - he[pe].as;
        eAdd += he[pe].be - he[pe].bs;
        pe++;
        grew = true;
      }
      while (pn < hn.length && (hn[pn].as === start || hn[pn].as < end)) {
        hasN = true;
        end = Math.max(end, hn[pn].ae);
        nRem += hn[pn].ae - hn[pn].as;
        nAdd += hn[pn].be - hn[pn].bs;
        pn++;
        grew = true;
      }
    }
    const oLen = end - start;
    const eLen = oLen - eRem + eAdd;
    const nLen = oLen - nRem + nAdd;
    if (hasE && !hasN) {
      for (let k = 0; k < eLen; k++) out.push(E[ie + k]);
    } else {
      for (let k = 0; k < nLen; k++) out.push(N[iN + k]);
    }
    io = end;
    ie += eLen;
    iN += nLen;
  }
  while (io < O.length) {
    out.push(N[iN]);
    io++;
    ie++;
    iN++;
  }
  return out;
}

// 편집모드 종료 시 — 현재 화면과 순수 렌더의 차이를 편집본으로 보관
function captureEdits() {
  if (!_lastRender) return;
  const view = previewChildrenHTML();
  if (view.join("") === _lastRender.join("")) {
    S.editBase = null;
    S.editView = null;
  } else {
    S.editBase = _lastRender.slice();
    S.editView = view;
  }
}

// 재렌더된 미리보기에 편집본을 병합해 반영
function applyUserEdits() {
  if (!S.editView) return;
  const root = document.getElementById("previewContent");
  const fresh = previewChildrenHTML();
  const merged = merge3(S.editBase, S.editView, fresh);
  const html = merged.join("");
  if (html !== fresh.join("")) root.innerHTML = html;
}

function toggleEditMode() {
  const content = document.getElementById("previewContent");
  if (!S.editMode) {
    S.editMode = true;
    content.contentEditable = "true";
    content.focus();
    updateEditUI();
    showToast("✏️ 편집모드 — 미리보기 내용을 직접 수정할 수 있습니다.");
  } else {
    S.editMode = false;
    content.contentEditable = "false";
    captureEdits();
    updateEditUI();
    updatePreview();
    showToast("✅ 편집 내용이 적용되었습니다. 다운로드에 그대로 반영됩니다.", "success");
  }
}

function revertEdits() {
  if (
    !confirm(
      "수동으로 편집한 내용을 모두 버리고 폼 입력값으로 다시 생성합니다.\n계속할까요?",
    )
  )
    return;
  S.editMode = false;
  S.editBase = null;
  S.editView = null;
  document.getElementById("previewContent").contentEditable = "false";
  updateEditUI();
  updatePreview();
  showToast("↺ 편집 전 원본으로 되돌렸습니다.");
}

// ────────────────────────────────────────
//  글자 서식 — 편집모드에서 선택 글자에 볼드 또는 노란 배경 (단축키 Ctrl+B)
//  상단 선택기로 적용할 서식을 고르고, Ctrl+B 또는 버튼으로 선택영역에 적용.
//  이미 같은 서식이 걸린 영역이면 해제(토글).
// ────────────────────────────────────────
const HILITE_COLOR = "#fff3a0"; // 노란색 하이라이트 배경

// 서식 종류별 정의: 식별 class와 적용 스타일
const EDIT_FORMATS = {
  bold: { cls: "ppb-bold", style: (el) => (el.style.fontWeight = "bold") },
  highlight: {
    cls: "ppb-hl",
    style: (el) => (el.style.backgroundColor = HILITE_COLOR),
  },
};

let _activeFormat = "bold"; // 상단 선택기에서 고른 서식

// node에서 위로 올라가며 해당 class의 span을 찾는다 (없으면 null)
function _closestFormat(node, root, cls) {
  while (node && node !== root) {
    if (node.nodeType === 1 && node.classList?.contains(cls)) return node;
    node = node.parentNode;
  }
  return null;
}

// 선택 양끝이 같은 서식 span 안이면 그 span을 반환
function _enclosingFormat(range, root, cls) {
  const a = _closestFormat(range.startContainer, root, cls);
  const b = _closestFormat(range.endContainer, root, cls);
  return a && a === b ? a : null;
}

// span을 풀어 내용만 남긴다
function _unwrapFormat(span) {
  const parent = span.parentNode;
  while (span.firstChild) parent.insertBefore(span.firstChild, span);
  parent.removeChild(span);
  parent.normalize();
}

// 선택영역에 서식 적용/해제 (type: 'bold' | 'highlight')
function applyEditFormat(type) {
  if (!S.editMode) return;
  const fmt = EDIT_FORMATS[type];
  if (!fmt) return;
  const root = document.getElementById("previewContent");
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return;

  const existing = _enclosingFormat(range, root, fmt.cls);
  if (existing) {
    _unwrapFormat(existing);
  } else {
    const span = document.createElement("span");
    span.className = fmt.cls;
    fmt.style(span);
    try {
      range.surroundContents(span);
    } catch (e) {
      // 선택이 여러 요소 경계를 가로지르면 추출 후 감싼다
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
  }
  sel.removeAllRanges();
}

// 상단 선택기 — 적용할 서식을 고르고, 선택영역이 있으면 바로 적용
function setEditFormat(type) {
  if (!EDIT_FORMATS[type]) return;
  _activeFormat = type;
  updateFormatPickerUI();
  applyEditFormat(type);
}

function updateFormatPickerUI() {
  const boldBtn = document.getElementById("fmtBoldBtn");
  const hlBtn = document.getElementById("fmtHlBtn");
  if (boldBtn) boldBtn.classList.toggle("active", _activeFormat === "bold");
  if (hlBtn) hlBtn.classList.toggle("active", _activeFormat === "highlight");
}

// 단축키 Ctrl+B (Mac은 Cmd+B) — 편집모드에서 현재 선택된 서식을 적용.
// metaKey도 가로채야 브라우저 기본 볼드(Cmd+B)가 활성 서식을 덮어쓰지 않는다.
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "b" || e.key === "B")) {
    if (!S.editMode) return;
    e.preventDefault();
    applyEditFormat(_activeFormat);
  }
});

function updateEditUI() {
  const btn = document.getElementById("editModeBtn");
  const revertBtn = document.getElementById("revertEditBtn");
  const picker = document.getElementById("formatPicker");
  const banner = document.getElementById("editBanner");
  const doc = document.querySelector(".preview-doc");
  const hasEdits = !!S.editView;

  btn.textContent = S.editMode ? "✅ 편집완료" : "✏️ 편집";
  btn.classList.toggle("editing", S.editMode);
  revertBtn.style.display = S.editMode || hasEdits ? "" : "none";
  if (picker) picker.style.display = S.editMode ? "inline-flex" : "none";
  updateFormatPickerUI();
  doc.classList.toggle("edit-active", S.editMode);

  if (S.editMode) {
    banner.textContent =
      "✏️ 편집모드 — 미리보기 문서를 클릭해 내용을 직접 수정하세요. 상단에서 [볼드] 또는 [배경색]을 고른 뒤 글자를 선택하고 Ctrl+B(또는 버튼)로 적용하세요. [편집완료]를 누르면 수정 내용이 다운로드에 반영됩니다.";
    banner.style.display = "";
  } else if (hasEdits) {
    banner.textContent =
      "✏️ 수동 편집 내용이 적용 중입니다 — 설정 패널 변경도 함께 반영되며, 같은 부분이 겹치면 설정 패널 쪽이 우선합니다. [↺ 원본으로]를 누르면 편집을 모두 취소합니다.";
    banner.style.display = "";
  } else {
    banner.style.display = "none";
  }
}
