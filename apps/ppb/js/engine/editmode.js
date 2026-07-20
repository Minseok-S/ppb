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
    _resetUndo();
    content.contentEditable = "true";
    content.focus();
    updateEditUI();
    showToast("✏️ 편집모드 — 미리보기 내용을 직접 수정할 수 있습니다.");
  } else {
    S.editMode = false;
    _resetUndo();
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
  _resetUndo();
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

let _activeFormat = "highlight"; // 상단 선택기에서 고른 서식 (기본: 형광펜)

// 선택 범위와 실제로 겹치는 서식 span을 모두 반환한다.
// (양끝이 같은 span 안에 있는지가 아니라 "영역이 걸치는지"로 판정 →
//  경계가 요소 레벨에 잡히거나, 일부만 걸치거나, 여러 span에 걸쳐도 잡힌다.)
// 단순히 경계만 맞닿은 이웃 span은 제외해, 새로 칠할 때 오탐하지 않는다.
function _overlappingFormats(range, root, cls) {
  const hits = [];
  root.querySelectorAll("span." + cls).forEach((span) => {
    const nr = document.createRange();
    nr.selectNodeContents(span);
    const overlaps =
      range.compareBoundaryPoints(Range.END_TO_START, nr) < 0 && // 선택 시작 < span 끝
      range.compareBoundaryPoints(Range.START_TO_END, nr) > 0; //   선택 끝  > span 시작
    if (overlaps) hits.push(span);
  });
  return hits;
}

// span을 풀어 내용만 남긴다
function _unwrapFormat(span) {
  const parent = span.parentNode;
  while (span.firstChild) parent.insertBefore(span.firstChild, span);
  parent.removeChild(span);
  parent.normalize();
}

// 선택 범위 안의 텍스트 노드를 하나씩 span으로 감싼다.
// surroundContents/extractContents는 선택이 표 셀(td/tr) 같은 요소 경계를
// 가로지르면 태그를 span 안으로 끌고 들어가 표 구조를 부수므로,
// 요소 트리는 그대로 두고 텍스트 노드 단위로만 감싸 구조를 보존한다.
function _wrapRangeTextNodes(range, fmt) {
  let startNode = range.startContainer;
  let endNode = range.endContainer;
  // 경계가 텍스트 노드 중간이면 잘라서 선택된 부분만 분리
  if (endNode.nodeType === Node.TEXT_NODE && range.endOffset < endNode.length) {
    endNode.splitText(range.endOffset);
  }
  if (startNode.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
    const tail = startNode.splitText(range.startOffset);
    if (endNode === startNode) endNode = tail;
    startNode = tail;
  }
  if (startNode.nodeType === Node.TEXT_NODE) range.setStart(startNode, 0);
  if (endNode.nodeType === Node.TEXT_NODE) range.setEnd(endNode, endNode.length);

  let root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) root = root.parentNode;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    // 셀 사이 공백 노드(tr 직속 등)는 감싸면 표가 다시 깨진다 — 건너뜀
    if (!n.data.trim()) continue;
    const nr = document.createRange();
    nr.selectNodeContents(n);
    const inside =
      range.compareBoundaryPoints(Range.START_TO_START, nr) <= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, nr) >= 0;
    if (inside) targets.push(n);
  }
  targets.forEach((n) => {
    const span = document.createElement("span");
    span.className = fmt.cls;
    fmt.style(span);
    n.parentNode.insertBefore(span, n);
    span.appendChild(n);
  });
  return targets.length > 0;
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

  const snap = root.innerHTML;
  const pushed = _pushUndo();
  const existing = _overlappingFormats(range, root, fmt.cls);
  if (existing.length) {
    // 선택 영역에 걸친 서식은 모두 해제(토글 OFF)
    existing.forEach(_unwrapFormat);
    root.normalize();
  } else {
    _wrapRangeTextNodes(range, fmt);
  }
  // 실제 변화가 없었으면 스냅샷 취소 (되돌리기 스택에 빈 단계 방지)
  if (pushed && root.innerHTML === snap) _undoStack.pop();
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

// ────────────────────────────────────────
//  되돌리기 (Ctrl+Z) / 다시실행 (Ctrl+Shift+Z, Ctrl+Y)
//  서식 적용·해제는 DOM 직접 조작이라 브라우저 기본 undo 스택에 잡히지
//  않는다. 편집모드 동안 미리보기 innerHTML 스냅샷 스택을 직접 관리한다.
//  타이핑도 beforeinput 시점에 스냅샷을 쌓아 같은 스택으로 되돌린다.
// ────────────────────────────────────────
const UNDO_LIMIT = 100; // 스냅샷 최대 보관 수
const TYPE_SNAP_GAP = 600; // ms — 연속 타이핑은 한 단계로 묶는다
let _undoStack = [];
let _redoStack = [];
let _lastTypeSnap = 0;

function _previewHTML() {
  return document.getElementById("previewContent").innerHTML;
}

// 현재 상태를 스택에 쌓는다. 실제로 쌓였으면 true.
function _pushUndo() {
  const html = _previewHTML();
  if (_undoStack.length && _undoStack[_undoStack.length - 1] === html)
    return false;
  _undoStack.push(html);
  if (_undoStack.length > UNDO_LIMIT) _undoStack.shift();
  _redoStack = [];
  return true;
}

function _resetUndo() {
  _undoStack = [];
  _redoStack = [];
  _lastTypeSnap = 0;
}

function editUndo() {
  if (!S.editMode || !_undoStack.length) return;
  const cur = _previewHTML();
  let html = _undoStack.pop();
  // 스냅샷이 현재와 같으면(변화 직전 중복) 한 단계 더 내려간다
  if (html === cur && _undoStack.length) html = _undoStack.pop();
  if (html === cur) return;
  _redoStack.push(cur);
  document.getElementById("previewContent").innerHTML = html;
}

function editRedo() {
  if (!S.editMode || !_redoStack.length) return;
  _undoStack.push(_previewHTML());
  document.getElementById("previewContent").innerHTML = _redoStack.pop();
}

// 타이핑 스냅샷 — 입력이 반영되기 직전 상태를 묶음 단위로 보관
document.addEventListener("beforeinput", function (e) {
  if (!S.editMode) return;
  const root = document.getElementById("previewContent");
  if (!root || !root.contains(e.target)) return;
  const now = Date.now();
  if (now - _lastTypeSnap > TYPE_SNAP_GAP) _pushUndo();
  _lastTypeSnap = now;
});

// 단축키 — 편집모드에서만 동작한다.
//  Ctrl+B (Cmd+B): 선택 글자에 형광펜 칠하기/제거(토글). 볼드는 상단 버튼.
//  Ctrl+Z (Cmd+Z): 되돌리기 / +Shift 또는 Ctrl+Y: 다시실행.
//  metaKey도 가로채야 브라우저 기본 동작(볼드·네이티브 undo)이 스냅샷
//  스택과 어긋난 상태를 만들지 않는다.
document.addEventListener("keydown", function (e) {
  if (!S.editMode) return;
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "b") {
    e.preventDefault();
    applyEditFormat("highlight");
  } else if (k === "z") {
    e.preventDefault();
    if (e.shiftKey) editRedo();
    else editUndo();
  } else if (k === "y") {
    e.preventDefault();
    editRedo();
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
      "✏️ 편집모드 — 미리보기 문서를 클릭해 내용을 직접 수정하세요. 글자를 선택하고 Ctrl+B로 형광펜을 칠하거나 다시 눌러 제거할 수 있습니다(볼드는 상단 [볼드] 버튼). 실수했다면 Ctrl+Z로 되돌리고 Ctrl+Shift+Z로 다시 실행합니다. [편집완료]를 누르면 수정 내용이 다운로드에 반영됩니다.";
    banner.style.display = "";
  } else if (hasEdits) {
    banner.textContent =
      "✏️ 수동 편집 내용이 적용 중입니다 — 설정 패널 변경도 함께 반영되며, 같은 부분이 겹치면 설정 패널 쪽이 우선합니다. [↺ 원본으로]를 누르면 편집을 모두 취소합니다.";
    banner.style.display = "";
  } else {
    banner.style.display = "none";
  }
}
