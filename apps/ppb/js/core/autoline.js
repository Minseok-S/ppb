// ════════════════════════════════════════
//  AUTOLINE — 설정 패널 줄바꿈 지원
//  - 한 줄 input(text/email/tel)을 자동 높이 textarea로 전환
//  - Shift+Enter = 줄바꿈, 일반 Enter = 줄바꿈 안 함
//  - 입력한 줄바꿈(\n)을 미리보기·내보내기 문서에 <br>로 반영
//  ※ '직접 추가'처럼 Enter로 항목을 추가하는 입력칸은 제외
// ════════════════════════════════════════

(function () {
  function isConvertible(el) {
    if (!el || el.tagName !== "INPUT") return false;
    const t = (el.getAttribute("type") || "text").toLowerCase();
    if (t !== "text" && t !== "email" && t !== "tel") return false;
    // Enter로 항목을 추가하는 입력칸(태그형)은 그대로 둔다
    if (el.hasAttribute("onkeydown")) return false;
    if (el.dataset && el.dataset.noAutoline === "1") return false;
    return true;
  }

  function autoGrow(ta) {
    if (!ta.classList.contains("autoline")) return;
    if (ta.scrollHeight === 0) return; // 숨겨진 상태면 건드리지 않음
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }

  function convert(input) {
    const ta = document.createElement("textarea");
    ta.value = input.value != null ? input.value : "";
    Array.from(input.attributes).forEach((a) => {
      if (a.name === "type" || a.name === "value") return;
      ta.setAttribute(a.name, a.value);
    });
    ta.classList.add("autoline");
    ta.setAttribute("rows", "1");
    ta.dataset.multiline = "1";
    input.parentNode.replaceChild(ta, input);
    autoGrow(ta);
    return ta;
  }

  function convertWithin(root) {
    if (!root) return;
    if (isConvertible(root)) {
      convert(root);
      return;
    }
    if (root.querySelectorAll) {
      root.querySelectorAll("input").forEach((inp) => {
        if (isConvertible(inp)) convert(inp);
      });
      // 기존 textarea도 동일한 Enter 규칙 적용 대상으로 표시
      root.querySelectorAll("textarea").forEach((ta) => {
        ta.dataset.multiline = "1";
      });
    }
  }

  window.setupAutoLine = function () {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    convertWithin(sidebar);

    // Enter 동작: 일반 Enter는 막고 Shift+Enter만 줄바꿈
    sidebar.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      const t = e.target;
      if (t && t.tagName === "TEXTAREA" && t.dataset.multiline === "1") {
        if (!e.shiftKey) e.preventDefault();
      }
    });

    // 자동 높이 조절
    sidebar.addEventListener("input", function (e) {
      const t = e.target;
      if (t && t.tagName === "TEXTAREA") autoGrow(t);
    });
    sidebar.addEventListener("focusin", function (e) {
      const t = e.target;
      if (t && t.tagName === "TEXTAREA") autoGrow(t);
    });

    // 동적으로 추가되는 행(수집 항목 등)도 자동 전환
    const obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) convertWithin(n);
        });
      });
    });
    obs.observe(sidebar, { childList: true, subtree: true });
  };

  // ── 미리보기·내보내기 문서에 줄바꿈 반영 ──────────
  // buildPreview 실행 동안만 S의 문자열 값 \n → <br> 로 치환한 사본을 사용.
  // 실제 S는 \n 그대로 유지하므로 저장/불러오기·재편집에는 영향 없음.
  (function wrapBuildPreviewForNewlines() {
    if (typeof buildPreview !== "function") return;
    const orig = buildPreview;

    function nlClone(v) {
      if (typeof v === "string")
        return v.indexOf("\n") !== -1 ? v.replace(/\n/g, "<br>") : v;
      if (Array.isArray(v)) return v.map(nlClone);
      if (v && typeof v === "object") {
        const o = {};
        for (const k in v) {
          // 편집모드 원본 HTML은 변환하지 않는다
          o[k] = k === "editBase" || k === "editView" ? v[k] : nlClone(v[k]);
        }
        return o;
      }
      return v;
    }

    buildPreview = function () {
      const real = S;
      try {
        S = nlClone(real);
        return orig();
      } finally {
        S = real;
      }
    };
  })();
})();
