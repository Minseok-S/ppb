// ════════════════════════════════════════
//  SORTABLE — 카드 드래그로 순서 변경 (공용)
//
//  카드(.card-item) 안의 .drag-handle 을 잡고 끌어 같은 컨테이너 안에서 재정렬한다.
//  드롭되면 그 카드의 .drag-handle data-* 에 따라 순서를 상태에 반영한다.
//    · DOM 목록  : data-reorder="<동기화 호출>"   예) syncCollect('consent')
//                  → DOM 순서대로 동기화 함수가 S 배열을 다시 읽는다.
//    · 배열 목록 : data-reorder-array="<S의 배열명>" data-reorder-render="<렌더 호출>"
//                  → 카드 data-idx 의 새 순서로 S 배열을 재배열한 뒤 다시 렌더한다.
//
//  핸들을 누르는 동안만 카드를 draggable 로 만들어, 입력칸 텍스트 선택을 방해하지 않는다.
// ════════════════════════════════════════
(function () {
  // 정렬 단위 — 카드(.card-item) 또는 소제목 그룹(.subgroup-box).
  // 핸들에서 가장 가까운 단위를 잡으므로, 소제목 안의 카드는 카드가, 소제목 헤더는 그룹이 선택된다.
  const ITEM = ".card-item, .subgroup-box";
  let dragEl = null;

  function run(code) {
    if (!code) return;
    try {
      new Function(code)();
    } catch (e) {
      console.error("[sortable]", code, e);
    }
  }

  document.addEventListener("mousedown", (e) => {
    const h = e.target.closest && e.target.closest(".drag-handle");
    if (!h) return;
    const card = h.closest(ITEM);
    if (card) card.setAttribute("draggable", "true");
  });

  document.addEventListener("mouseup", () => {
    document
      .querySelectorAll(
        '.card-item[draggable="true"],.subgroup-box[draggable="true"]',
      )
      .forEach((c) => c.removeAttribute("draggable"));
  });

  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest && e.target.closest(ITEM);
    if (!card || card.getAttribute("draggable") !== "true") return;
    dragEl = card;
    card.classList.add("dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", "");
      } catch (_) {}
    }
  });

  document.addEventListener("dragover", (e) => {
    if (!dragEl) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    const container = dragEl.parentElement;
    const after = afterElement(container, e.clientY);
    if (after == null) container.appendChild(dragEl);
    else container.insertBefore(dragEl, after);
  });

  document.addEventListener("dragend", () => {
    if (!dragEl) return;
    const card = dragEl;
    dragEl = null;
    card.classList.remove("dragging");
    card.removeAttribute("draggable");

    // 잡은 단위에 직접 붙은 핸들만 — 소제목 그룹을 옮길 때 안쪽 카드 핸들을 잘못 집지 않도록
    const handle =
      Array.from(card.querySelectorAll(".drag-handle")).find(
        (h) => h.closest(ITEM) === card,
      ) || null;
    const container = card.parentElement;
    if (handle && container) {
      const arrName = handle.dataset.reorderArray;
      if (arrName) {
        const order = Array.from(
          container.querySelectorAll(":scope > .card-item"),
        ).map((el) => +el.dataset.idx);
        const old = S[arrName] || [];
        S[arrName] = order.map((i) => old[i]).filter((x) => x !== undefined);
        run(handle.dataset.reorderRender);
      } else if (handle.dataset.reorder) {
        run(handle.dataset.reorder);
        if (typeof renumberCards === "function") renumberCards(container);
      }
    }
    if (typeof updatePreview === "function") updatePreview();
  });

  // 끌고 있는 카드를 뺀 나머지 중, 커서(y) 바로 아래에 올 카드를 찾는다
  function afterElement(container, y) {
    const els = Array.from(
      container.querySelectorAll(
        ":scope > :is(.card-item, .subgroup-box):not(.dragging)",
      ),
    );
    let closest = { offset: -Infinity, el: null };
    for (const el of els) {
      const box = el.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) closest = { offset, el };
    }
    return closest.el;
  }
})();
