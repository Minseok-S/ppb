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

function updateEditUI() {
  const btn = document.getElementById("editModeBtn");
  const revertBtn = document.getElementById("revertEditBtn");
  const banner = document.getElementById("editBanner");
  const doc = document.querySelector(".preview-doc");
  const hasEdits = !!S.editView;

  btn.textContent = S.editMode ? "✅ 편집완료" : "✏️ 편집";
  btn.classList.toggle("editing", S.editMode);
  revertBtn.style.display = S.editMode || hasEdits ? "" : "none";
  doc.classList.toggle("edit-active", S.editMode);

  if (S.editMode) {
    banner.textContent =
      "✏️ 편집모드 — 미리보기 문서를 클릭해 내용을 직접 수정하세요. [편집완료]를 누르면 수정 내용이 다운로드에 반영됩니다.";
    banner.style.display = "";
  } else if (hasEdits) {
    banner.textContent =
      "✏️ 수동 편집 내용이 적용 중입니다 — 설정 패널 변경도 함께 반영되며, 같은 부분이 겹치면 설정 패널 쪽이 우선합니다. [↺ 원본으로]를 누르면 편집을 모두 취소합니다.";
    banner.style.display = "";
  } else {
    banner.style.display = "none";
  }
}
