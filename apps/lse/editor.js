(function () {
  "use strict";

  /* ── PDF.js 워커 경로 (있을 때만) ── */
  if (window.pdfjsLib) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    } catch (e) {}
  }

  /* ── DOM refs ── */
  var exportBtn      = document.getElementById("exportBtn");
  var clearBtn       = document.getElementById("clearBtn");
  var fileInput      = document.getElementById("fileInput");
  var fileName       = document.getElementById("fileName");
  var fileLoadBtn    = document.getElementById("fileLoadBtn");
  var loadingOverlay = document.getElementById("loadingOverlay");
  var placeholder    = document.getElementById("placeholder");
  var frame          = document.getElementById("originalFrame");
  var editorFrame    = document.getElementById("editorFrame");
  var errorBanner    = document.getElementById("errorBanner");
  var clickHint      = document.getElementById("clickHint");
  var statusText     = document.getElementById("statusText");
  var charCount      = document.getElementById("charCount");
  var divider        = document.getElementById("divider");
  var leftPanel      = document.getElementById("originalPanel");
  var rightPanel     = document.getElementById("editorPanel");
  var workspace      = document.getElementById("workspace");
  var toggleOrigBtn  = document.getElementById("toggleOrigBtn");

  /* ── Diff state ── */
  var editorSnapshot = null;
  var diffObserver   = null;
  var diffTimer      = null;
  var origReady      = false;
  var editReady      = false;
  var diffEnabled    = true;
  var origVisible    = true;
  var isMirrorClick  = false;

  /* ── Blob URL 추적 (메모리 누수 방지) ── */
  var _origBlobUrl = null;
  var _editBlobUrl = null;

  /* ── Link modal state ── */
  var linkSavedRange = null;

  /* ── Table operations context ── */
  var ctxCell = null;

  /* ════════════════════════════════
     파일 업로드
  ════════════════════════════════ */
  function loadFromFile() {
    var file = fileInput.files[0];
    if (!file) { alert("파일을 선택해주세요."); return; }

    if (/\.pdf$/i.test(file.name)) { loadPdfFile(file); return; }

    fileLoadBtn.disabled = true;
    fileLoadBtn.textContent = "로딩 중...";
    loadingOverlay.classList.add("active");
    errorBanner.classList.remove("active");
    placeholder.style.display = "none";
    frame.style.display = "none";
    editorFrame.style.display = "none";

    var reader = new FileReader();
    reader.onload = function (e) {
      var html = e.target.result;
      if (!html) {
        showError("파일을 읽을 수 없습니다.");
        resetFileBtn();
        return;
      }
      loadBothPanels(html, "", "파일 로드 완료 — " + file.name);
      loadingOverlay.classList.remove("active");
      resetFileBtn();
    };
    reader.onerror = function () {
      showError("파일 읽기 오류가 발생했습니다.");
      resetFileBtn();
    };
    reader.readAsText(file, "UTF-8");
  }

  /* ════════════════════════════════
     PDF 업로드 → 텍스트 추출 → 편집용 HTML
  ════════════════════════════════ */
  function loadPdfFile(file) {
    if (!window.pdfjsLib) {
      showError("PDF 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침하세요.");
      return;
    }
    fileLoadBtn.disabled = true;
    fileLoadBtn.textContent = "변환 중...";
    loadingOverlay.classList.add("active");
    errorBanner.classList.remove("active");
    placeholder.style.display = "none";
    frame.style.display = "none";
    editorFrame.style.display = "none";

    var reader = new FileReader();
    reader.onload = function (e) {
      var buf = e.target.result;
      extractPdfToHtml(buf)
        .then(function (bodyHtml) {
          if (!bodyHtml || !bodyHtml.trim()) {
            showError("PDF에서 추출할 텍스트가 없습니다. (이미지로만 된 스캔 PDF일 수 있습니다)");
            resetFileBtn();
            return;
          }
          var title = file.name.replace(/\.pdf$/i, "");
          var html = buildPdfDocHtml(bodyHtml, title);
          loadBothPanels(html, "", "PDF 변환 완료 — " + file.name);
          loadingOverlay.classList.remove("active");
          resetFileBtn();
        })
        .catch(function (err) {
          showError("PDF 변환 실패: " + (err && err.message ? err.message : err));
          resetFileBtn();
        });
    };
    reader.onerror = function () {
      showError("파일 읽기 오류가 발생했습니다.");
      resetFileBtn();
    };
    reader.readAsArrayBuffer(file);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function pdfNum(n) { return Math.round(n * 100) / 100; }

  /* pdf.js 페이지를 원본 레이아웃 그대로(글자별 절대좌표 + 벡터 그래픽) HTML로 변환 */
  function extractPdfToHtml(arrayBuffer) {
    return pdfjsLib
      .getDocument({ data: arrayBuffer })
      .promise.then(function (pdf) {
        var pages = [];
        var chain = Promise.resolve();
        for (var p = 1; p <= pdf.numPages; p++) {
          (function (num) {
            chain = chain
              .then(function () { return extractPdfPage(pdf, num); })
              .then(function (html) { pages.push(html); });
          })(p);
        }
        return chain.then(function () { return pages.join("\n"); });
      });
  }

  function extractPdfPage(pdf, pageNum) {
    return pdf.getPage(pageNum).then(function (page) {
      var viewport = page.getViewport({ scale: 1 });
      return Promise.all([
        page.getTextContent(),
        page.getOperatorList(),
      ]).then(function (res) {
        var tc = res[0];
        var ops = res[1];
        var styles = tc.styles || {};
        var parts = [];

        /* 1) 벡터 선/사각형(표 테두리 등)을 SVG로 복원 */
        var gfx = buildPdfGraphics(ops, viewport);
        if (gfx) parts.push(gfx);

        /* 2) 글자를 원본 좌표·크기 그대로 절대배치 */
        tc.items.forEach(function (it) {
          if (typeof it.str !== "string" || it.str.length === 0) return;
          var tx = pdfjsLib.Util.transform(viewport.transform, it.transform);
          var fontSize = Math.hypot(tx[2], tx[3]);
          if (!fontSize) return;
          var left = tx[4];
          var top = tx[5] - fontSize;
          var st = styles[it.fontName] || {};
          var ff = (st.fontFamily || "sans-serif").replace(/"/g, "'");
          var s =
            "left:" + pdfNum(left) + "pt;top:" + pdfNum(top) + "pt;" +
            "font-size:" + pdfNum(fontSize) + "pt;font-family:" + ff + ";";
          if (st.fontFamily && /bold/i.test(it.fontName)) s += "font-weight:bold;";
          if (/italic|oblique/i.test(it.fontName)) s += "font-style:italic;";
          parts.push('<span class="pdf-text" style="' + s + '">' + escHtml(it.str) + "</span>");
        });

        return (
          '<div class="pdf-page" style="width:' + pdfNum(viewport.width) +
          "pt;height:" + pdfNum(viewport.height) + 'pt;">' +
          parts.join("") +
          "</div>"
        );
      });
    });
  }

  /* OperatorList에서 선/사각형 채움·획만 추려 SVG로 (표 테두리·구분선 복원) */
  function buildPdfGraphics(ops, viewport) {
    var OPS = pdfjsLib.OPS;
    var fnArray = ops.fnArray, argsArray = ops.argsArray;
    var ctm = viewport.transform.slice();
    var stack = [];
    var rects = [];
    var pending = [];
    var i, j;

    function mul(a, b) {
      return [
        a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
      ];
    }
    function pt(x, y) {
      return [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]];
    }
    function flush(stroke) {
      pending.forEach(function (r) {
        var a = pt(r.x, r.y), b = pt(r.x + r.w, r.y + r.h);
        var x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
        var w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
        rects.push({ x: x0, y: y0, w: w, h: h, stroke: stroke });
      });
      pending = [];
    }

    for (i = 0; i < fnArray.length; i++) {
      var fn = fnArray[i], args = argsArray[i];
      if (fn === OPS.save) stack.push(ctm.slice());
      else if (fn === OPS.restore) { if (stack.length) ctm = stack.pop(); }
      else if (fn === OPS.transform) ctm = mul(ctm, args);
      else if (fn === OPS.constructPath) {
        var pathOps = args[0], pathArgs = args[1];
        var k = 0;
        for (j = 0; j < pathOps.length; j++) {
          if (pathOps[j] === OPS.rectangle) {
            pending.push({ x: pathArgs[k], y: pathArgs[k + 1], w: pathArgs[k + 2], h: pathArgs[k + 3] });
            k += 4;
          } else {
            /* moveTo/lineTo/curveTo 등은 인자 수만큼 소비 */
            k += pathOpArgCount(OPS, pathOps[j]);
          }
        }
      } else if (fn === OPS.fill || fn === OPS.eoFill) flush(false);
      else if (fn === OPS.stroke) flush(true);
      else if (fn === OPS.fillStroke || fn === OPS.eoFillStroke) flush(true);
      else if (fn === OPS.closePath) { /* no-op */ }
    }

    /* 가는 사각형은 선(테두리)으로 간주해 표시 */
    var draw = rects.filter(function (r) {
      return (r.w > 0.3 && r.h > 0.3) && (r.w < viewport.width && r.h < viewport.height);
    });
    if (!draw.length) return "";

    var svg =
      '<svg class="pdf-gfx" width="' + pdfNum(viewport.width) + '" height="' + pdfNum(viewport.height) +
      '" viewBox="0 0 ' + pdfNum(viewport.width) + " " + pdfNum(viewport.height) +
      '" xmlns="http://www.w3.org/2000/svg">';
    draw.forEach(function (r) {
      var thin = r.w < 2 || r.h < 2; /* 선처럼 얇으면 채움, 박스면 테두리 */
      svg += '<rect x="' + pdfNum(r.x) + '" y="' + pdfNum(r.y) + '" width="' + pdfNum(r.w) +
        '" height="' + pdfNum(r.h) + '" ' +
        (thin ? 'fill="#000"' : 'fill="none" stroke="#000" stroke-width="0.5"') + " />";
    });
    svg += "</svg>";
    return svg;
  }

  function pathOpArgCount(OPS, op) {
    if (op === OPS.moveTo || op === OPS.lineTo) return 2;
    if (op === OPS.curveTo) return 6;
    if (op === OPS.curveTo2 || op === OPS.curveTo3) return 4;
    return 0;
  }

  function buildPdfDocHtml(bodyHtml, title) {
    return (
      '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8" />\n' +
      "<title>" + escHtml(title) + "</title>\n<style>\n" +
      "*{box-sizing:border-box;}\n" +
      'body{margin:0;padding:24px 0;background:#525659;' +
      'font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;}\n' +
      ".pdf-page{position:relative;background:#fff;margin:0 auto 20px;overflow:hidden;" +
      "box-shadow:0 3px 12px rgba(0,0,0,.45);}\n" +
      ".pdf-gfx{position:absolute;left:0;top:0;pointer-events:none;}\n" +
      ".pdf-text{position:absolute;white-space:pre;line-height:1;color:#000;" +
      "transform-origin:0 0;}\n" +
      "@media print{\n" +
      "  body{background:#fff;padding:0;}\n" +
      "  .pdf-page{margin:0;box-shadow:none;page-break-after:always;}\n" +
      "  .pdf-page:last-child{page-break-after:auto;}\n" +
      "}\n" +
      "@page{margin:0;}\n" +
      "</style>\n</head>\n<body>\n" + bodyHtml + "\n</body>\n</html>"
    );
  }

  function resetFileBtn() {
    fileLoadBtn.disabled = false;
    fileLoadBtn.textContent = "불러오기";
    loadingOverlay.classList.remove("active");
  }

  function showError(msg) {
    errorBanner.textContent = "⚠ " + msg;
    errorBanner.classList.add("active");
    placeholder.style.display = "flex";
  }

  /* ════════════════════════════════
     양쪽 패널 공통 로드
  ════════════════════════════════ */
  function loadBothPanels(html, baseUrl, statusMsg) {
    origReady = false;
    editReady = false;
    editorSnapshot = null;
    if (diffObserver) { diffObserver.disconnect(); diffObserver = null; }

    frame.onload = function () {
      frame.onload = null;
      try { injectDiffCSS(frame.contentDocument, false); } catch (e) {}
      origReady = true;
      tryInitDiff();
    };
    setOrigBlobSrc(injectScrollSync(html, baseUrl));
    frame.style.display = "block";
    clickHint.classList.add("active");

    setupEditorFrame(html, baseUrl);
    setStatus(statusMsg);
  }

  /* ════════════════════════════════
     왼쪽 iframe: 스크롤·클릭 동기화 주입
  ════════════════════════════════ */
  function injectScrollSync(html, baseUrl) {
    var base = baseUrl ? '<base href="' + baseUrl.replace(/"/g, "&quot;") + '">' : "";
    var script =
      "<" + "script>(function(){" +
      'window.addEventListener("scroll",function(){' +
      '  try{window.parent.postMessage({type:"orig-scroll",x:window.scrollX,y:window.scrollY},"*");}catch(ex){}' +
      '});' +
      'document.addEventListener("scroll",function(e){' +
      '  var t=e.target;' +
      '  if(t&&t!==document&&t!==document.documentElement){' +
      '    try{window.parent.postMessage({type:"orig-scroll-el",path:__gp(t),x:t.scrollLeft,y:t.scrollTop},"*");}catch(ex){}' +
      '  }' +
      '},true);' +
      'document.addEventListener("click",function(e){' +
      '  var a=e.target.closest&&e.target.closest("a");' +
      '  if(a){e.preventDefault();}' +
      '  try{window.parent.postMessage({type:"orig-click",path:__gp(e.target)},"*");}catch(ex){}' +
      '},true);' +
      /* 텍스트 선택 감지 → 플로팅 툴바 */
      'document.addEventListener("mouseup",function(){' +
      '  var sel=window.getSelection();' +
      '  if(sel&&!sel.isCollapsed&&sel.toString().trim().length>0){' +
      '    var rng=sel.getRangeAt(0).getBoundingClientRect();' +
      '    try{window.parent.postMessage({type:"sel-show",rect:{top:rng.top,left:rng.left,right:rng.right,bottom:rng.bottom,width:rng.width,height:rng.height}},"*");}catch(ex){}' +
      '  } else {' +
      '    try{window.parent.postMessage({type:"sel-hide"},"*");}catch(ex){}' +
      '  }' +
      '});' +
      'document.addEventListener("mousedown",function(){' +
      '  try{window.parent.postMessage({type:"sel-hide"},"*");}catch(ex){}' +
      '});' +
      'function __gp(el){' +
      '  var p=[];' +
      '  while(el&&el!==document.body&&el.parentElement){' +
      '    p.unshift(Array.prototype.indexOf.call(el.parentElement.children,el));' +
      '    el=el.parentElement;' +
      '  }' +
      '  return p;' +
      '}' +
      '})();<' + '/script>';

    if (base) html = insertBase(html, base);
    html = insertBeforeBodyEnd(html, script);
    return html;
  }

  /* ════════════════════════════════
     오른쪽 iframe: designMode 편집기
  ════════════════════════════════ */
  function setupEditorFrame(html, baseUrl) {
    var base = baseUrl ? '<base href="' + baseUrl.replace(/"/g, "&quot;") + '">' : "";
    if (base) html = insertBase(html, base);

    editorFrame.onload = function () {
      editorFrame.onload = null;
      try {
        var editDoc = editorFrame.contentDocument;
        injectDiffCSS(editDoc, true);
        restrictEditorInteractions(editDoc);
        editDoc.designMode = "on";
        editorFrame.style.display = "block";
        editDoc.addEventListener("input", updateCharCount);
        editDoc.addEventListener("keyup", updateCharCount);
        updateCharCount();
        editReady = true;
        tryInitDiff();
      } catch (e) {}
    };
    setEditBlobSrc(stripScripts(html));
  }

  /* ── Blob URL 헬퍼 ── */
  function setOrigBlobSrc(html) {
    if (_origBlobUrl) { URL.revokeObjectURL(_origBlobUrl); _origBlobUrl = null; }
    _origBlobUrl = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    frame.removeAttribute("srcdoc");
    frame.src = _origBlobUrl;
  }

  function setEditBlobSrc(html) {
    if (_editBlobUrl) { URL.revokeObjectURL(_editBlobUrl); _editBlobUrl = null; }
    _editBlobUrl = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    editorFrame.removeAttribute("srcdoc");
    editorFrame.src = _editBlobUrl;
  }

  function stripScripts(html) {
    return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
               .replace(/<script\b[^>]*\/>/gi, "");
  }

  /* ── HTML 유틸 ── */
  function insertBase(html, base) {
    if (/<head[\s>]/i.test(html))
      return html.replace(/(<head[^>]*>)/i, "$1" + base);
    return base + html;
  }

  function insertBeforeBodyEnd(html, content) {
    if (/<\/body>/i.test(html))
      return html.replace(/<\/body>/i, content + "</body>");
    return html + content;
  }

  /* ════════════════════════════════
     Diff CSS 주입
  ════════════════════════════════ */
  function injectDiffCSS(doc, isEditor) {
    if (!doc || !doc.head) return;
    var old = doc.getElementById("__diff_style__");
    if (old) old.parentNode.removeChild(old);

    var style = doc.createElement("style");
    style.id = "__diff_style__";
    style.textContent = isEditor
      ? "[data-changed]{outline:2px solid #e94560 !important;outline-offset:2px;box-shadow:inset 0 0 0 9999px rgba(233,69,96,.05) !important;}" +
        "[data-changed='added']{outline:2px solid #38a169 !important;outline-offset:2px;box-shadow:inset 0 0 0 9999px rgba(56,161,105,.07) !important;}"
      : "[data-changed]{outline:2px dashed #4299e1 !important;outline-offset:2px;box-shadow:inset 0 0 0 9999px rgba(66,153,225,.05) !important;}" +
        "[data-deleted]{outline:2px solid #c53030 !important;outline-offset:2px;background:rgba(197,48,48,0.07) !important;text-decoration:line-through !important;text-decoration-color:#c53030 !important;opacity:.7;}";
    doc.head.appendChild(style);
  }

  /* ════════════════════════════════
     편집기 상호작용 제한 + 컨텍스트 메뉴 주입
  ════════════════════════════════ */
  function restrictEditorInteractions(doc) {
    if (!doc || !doc.head) return;

    var old = doc.getElementById("__editor_restrict_style__");
    if (old) old.parentNode.removeChild(old);

    var style = doc.createElement("style");
    style.id = "__editor_restrict_style__";
    style.textContent =
      "input, textarea, button, select, label[for]," +
      "[role='button'], [role='checkbox'], [role='radio']," +
      "[role='switch'], [role='tab'], [role='menuitem']," +
      "[onclick], [data-toggle], [data-dismiss], [data-target] {" +
      "  pointer-events: none !important;" +
      "  cursor: text !important;" +
      "}" +
      "input, textarea, select, button { opacity: 0.5 !important; }";
    doc.head.appendChild(style);

    doc.addEventListener("click", function (e) {
      if (isMirrorClick) return;
      var INTERACTIVE = /^(A|BUTTON|INPUT|TEXTAREA|SELECT|LABEL|DETAILS|SUMMARY)$/;
      var cur = e.target;
      while (cur && cur !== doc.body) {
        if (INTERACTIVE.test(cur.tagName) || (cur.hasAttribute && cur.hasAttribute("onclick"))) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        cur = cur.parentElement;
      }
    }, true);

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); return; }
      var tag = doc.activeElement && doc.activeElement.tagName;
      if (e.key === "Enter" && /^(BUTTON|A)$/.test(tag)) e.preventDefault();
    }, true);

    doc.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    // 우클릭 → 커스텀 컨텍스트 메뉴
    doc.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      var iframeRect = editorFrame.getBoundingClientRect();
      var x = iframeRect.left + e.clientX;
      var y = iframeRect.top + e.clientY;
      var inTable = !!(e.target.closest && e.target.closest("td, th"));
      ctxCell = inTable ? e.target.closest("td, th") : null;
      showContextMenu(x, y, inTable);
    }, true);
  }

  /* ════════════════════════════════
     Diff 초기화
  ════════════════════════════════ */
  function tryInitDiff() {
    if (!origReady || !editReady) return;
    initDiffTracking();
  }

  function initDiffTracking() {
    var editDoc = editorFrame.contentDocument;
    if (!editDoc || !editDoc.body) return;
    editorSnapshot = buildSnapshot(editDoc.body);
    diffObserver = new MutationObserver(scheduleDiff);
    diffObserver.observe(editDoc.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["style", "class"],
    });
  }

  function buildSnapshot(body) {
    var snap = {};
    for (var i = 0; i < body.children.length; i++) {
      (function walk(el, path) {
        snap[path] = el.innerHTML;
        for (var j = 0; j < el.children.length; j++) walk(el.children[j], path + "/" + j);
      })(body.children[i], String(i));
    }
    return snap;
  }

  function scheduleDiff() {
    if (!diffEnabled) return;
    if (diffTimer) clearTimeout(diffTimer);
    diffTimer = setTimeout(runDiff, 350);
  }

  function runDiff() {
    var editDoc = editorFrame.contentDocument;
    var origDoc = frame.contentDocument;
    if (!editDoc || !origDoc || !editorSnapshot) return;
    var eb = editDoc.body, ob = origDoc.body;
    if (!eb || !ob) return;

    clearMarkers(editDoc);
    clearMarkers(origDoc);

    for (var i = 0; i < eb.children.length; i++) {
      walk(eb.children[i], ob.children[i] || null, String(i));
    }

    function walk(editEl, origEl, path) {
      if (editorSnapshot[path] === undefined) {
        var txt = (editEl.innerText || editEl.textContent || "").trim();
        if (txt) editEl.setAttribute("data-changed", "added");
        return true;
      }
      var childMarked = false;
      for (var j = 0; j < editEl.children.length; j++) {
        if (walk(editEl.children[j], origEl ? origEl.children[j] : null, path + "/" + j)) childMarked = true;
      }
      // 현재 editEl보다 origEl에 더 많은 자식이 있으면 삭제된 자식
      if (origEl) {
        for (var j = editEl.children.length; j < origEl.children.length; j++) {
          var delEl = origEl.children[j];
          if ((delEl.innerText || delEl.textContent || "").trim()) {
            delEl.setAttribute("data-deleted", "");
          }
        }
      }
      var snap = editorSnapshot[path];
      if (snap !== undefined && editEl.innerHTML !== snap && !childMarked) {
        editEl.setAttribute("data-changed", "");
        if (origEl) origEl.setAttribute("data-changed", "");
        return true;
      }
      return childMarked;
    }

    // 바디 레벨에서 삭제된 요소 (원본에만 남아있는 항목)
    for (var i = eb.children.length; i < ob.children.length; i++) {
      if (editorSnapshot[String(i)] !== undefined) {
        var delEl = ob.children[i];
        if ((delEl.innerText || delEl.textContent || "").trim()) {
          delEl.setAttribute("data-deleted", "");
        }
      }
    }
  }

  function clearMarkers(doc) {
    try {
      var els = doc.querySelectorAll("[data-changed]");
      for (var i = 0; i < els.length; i++) els[i].removeAttribute("data-changed");
      var dels = doc.querySelectorAll("[data-deleted]");
      for (var i = 0; i < dels.length; i++) dels[i].removeAttribute("data-deleted");
    } catch (e) {}
  }

  /* ════════════════════════════════
     편집기 서식 (execCommand)
  ════════════════════════════════ */
  function fmt(cmd, val) {
    if (!editReady) { setStatus("먼저 파일을 불러와 주세요"); return; }
    try {
      editorFrame.contentDocument.execCommand(cmd, false, val !== undefined ? val : null);
    } catch (e) {}
  }

  /* ════════════════════════════════
     표 삽입
  ════════════════════════════════ */
  function insertTable(rows, cols) {
    if (!editReady) { setStatus("먼저 파일을 불러와 주세요"); return; }
    var ri, ci;
    var cellStyle = "padding:8px 12px;border:1px solid #b0b8c4;vertical-align:top;";
    var thStyle   = "padding:8px 12px;border:1px solid #b0b8c4;background:#f0f4f8;font-weight:600;text-align:center;";
    var html = '<table style="border-collapse:collapse;width:100%;margin:12px 0;">';
    html += "<thead><tr>";
    for (ci = 0; ci < cols; ci++) {
      html += '<th style="' + thStyle + '">항목' + (ci + 1) + "</th>";
    }
    html += "</tr></thead><tbody>";
    for (ri = 1; ri < rows; ri++) {
      html += "<tr>";
      for (ci = 0; ci < cols; ci++) {
        html += '<td style="' + cellStyle + '">&nbsp;</td>';
      }
      html += "</tr>";
    }
    html += "</tbody></table><p></p>";
    try {
      editorFrame.contentDocument.execCommand("insertHTML", false, html);
    } catch (e) {}
    setStatus(rows + "×" + cols + " 표가 삽입되었습니다");
  }

  /* ════════════════════════════════
     표 행·열 조작
  ════════════════════════════════ */
  function getCell(target) {
    if (!target) return null;
    var el = target;
    while (el) {
      if (el.tagName === "TD" || el.tagName === "TH") return el;
      if (!el.parentElement || el === editorFrame.contentDocument.body) return null;
      el = el.parentElement;
    }
    return null;
  }

  function tableInsertRow(target, pos) {
    var cell = getCell(target);
    if (!cell) return;
    var row = cell.parentElement;
    var tbody = row.parentElement;
    var cols = row.cells.length;
    var editDoc = editorFrame.contentDocument;
    var newRow = editDoc.createElement("tr");
    for (var i = 0; i < cols; i++) {
      var td = editDoc.createElement("td");
      td.style.cssText = "padding:8px 12px;border:1px solid #b0b8c4;vertical-align:top;";
      td.innerHTML = "&nbsp;";
      newRow.appendChild(td);
    }
    if (pos === "above") tbody.insertBefore(newRow, row);
    else row.nextSibling ? tbody.insertBefore(newRow, row.nextSibling) : tbody.appendChild(newRow);
    refreshSnapshot();
    setStatus("행이 삽입되었습니다");
  }

  function tableInsertCol(target, pos) {
    var cell = getCell(target);
    if (!cell) return;
    var row = cell.parentElement;
    var table = row.closest ? row.closest("table") : null;
    if (!table) return;
    var cellIdx = Array.prototype.indexOf.call(row.cells, cell);
    var editDoc = editorFrame.contentDocument;
    var rows = table.rows;
    for (var r = 0; r < rows.length; r++) {
      var curRow = rows[r];
      var newCell = editDoc.createElement(curRow.cells[0] ? curRow.cells[0].tagName : "td");
      newCell.style.cssText = "padding:8px 12px;border:1px solid #b0b8c4;vertical-align:top;";
      newCell.innerHTML = "&nbsp;";
      var refIdx = pos === "left" ? cellIdx : cellIdx + 1;
      var ref = curRow.cells[refIdx];
      if (ref) curRow.insertBefore(newCell, ref);
      else curRow.appendChild(newCell);
    }
    refreshSnapshot();
    setStatus("열이 삽입되었습니다");
  }

  function tableDeleteRow(target) {
    var cell = getCell(target);
    if (!cell) return;
    var row = cell.parentElement;
    var tbody = row.parentElement;
    var table = tbody.closest ? tbody.closest("table") : null;
    if (table && table.rows.length <= 1) { setStatus("마지막 행은 삭제할 수 없습니다"); return; }
    tbody.removeChild(row);
    refreshSnapshot();
    setStatus("행이 삭제되었습니다");
  }

  function tableDeleteCol(target) {
    var cell = getCell(target);
    if (!cell) return;
    var row = cell.parentElement;
    var table = row.closest ? row.closest("table") : null;
    if (!table) return;
    var cellIdx = Array.prototype.indexOf.call(row.cells, cell);
    if (row.cells.length <= 1) { setStatus("마지막 열은 삭제할 수 없습니다"); return; }
    var rows = table.rows;
    for (var r = 0; r < rows.length; r++) {
      var c = rows[r].cells[cellIdx];
      if (c) c.parentNode.removeChild(c);
    }
    refreshSnapshot();
    setStatus("열이 삭제되었습니다");
  }

  function refreshSnapshot() {
    if (editReady) {
      try { editorSnapshot = buildSnapshot(editorFrame.contentDocument.body); } catch (e) {}
    }
  }

  /* ════════════════════════════════
     링크 삽입
  ════════════════════════════════ */
  function showLinkModal() {
    if (!editReady) { setStatus("먼저 파일을 불러와 주세요"); return; }
    try {
      var sel = editorFrame.contentWindow.getSelection();
      if (sel && sel.rangeCount > 0) {
        linkSavedRange = sel.getRangeAt(0).cloneRange();
        document.getElementById("linkTextInput").value = sel.toString();
      } else {
        linkSavedRange = null;
        document.getElementById("linkTextInput").value = "";
      }
    } catch (ex) { linkSavedRange = null; }
    document.getElementById("linkUrlInput").value = "";
    document.getElementById("linkModal").classList.add("active");
    setTimeout(function () { document.getElementById("linkUrlInput").focus(); }, 60);
  }

  function confirmInsertLink() {
    var text = document.getElementById("linkTextInput").value.trim();
    var url  = document.getElementById("linkUrlInput").value.trim();
    if (!url) { alert("URL을 입력해주세요."); return; }
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && url !== "#") {
      url = "https://" + url;
    }
    var escaped = url.replace(/"/g, "&quot;");
    var display = text ? text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : url;
    var html = '<a href="' + escaped + '">' + display + "</a>";
    try {
      var editDoc = editorFrame.contentDocument;
      if (linkSavedRange) {
        var sel2 = editorFrame.contentWindow.getSelection();
        sel2.removeAllRanges();
        sel2.addRange(linkSavedRange);
      }
      editDoc.execCommand("insertHTML", false, html);
    } catch (e) {}
    document.getElementById("linkModal").classList.remove("active");
    setStatus("링크가 삽입되었습니다");
  }

  /* ════════════════════════════════
     이미지 삽입
  ════════════════════════════════ */
  function triggerImageInsert() {
    if (!editReady) { setStatus("먼저 파일을 불러와 주세요"); return; }
    document.getElementById("imgFileInput").click();
  }

  document.getElementById("imgFileInput").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var html = '<img src="' + ev.target.result + '" style="max-width:100%;height:auto;" alt="" />';
      try { editorFrame.contentDocument.execCommand("insertHTML", false, html); } catch (e) {}
      setStatus("이미지가 삽입되었습니다");
    };
    reader.readAsDataURL(file);
    this.value = "";
  });

  /* ════════════════════════════════
     수평선 삽입
  ════════════════════════════════ */
  function insertHR() {
    if (!editReady) { setStatus("먼저 파일을 불러와 주세요"); return; }
    try {
      editorFrame.contentDocument.execCommand("insertHTML", false,
        '<hr style="border:none;border-top:1px solid #ccc;margin:16px 0;" /><p></p>');
    } catch (e) {}
    setStatus("수평선이 삽입되었습니다");
  }

  /* ════════════════════════════════
     컨텍스트 메뉴
  ════════════════════════════════ */
  var contextMenu = document.getElementById("contextMenu");

  function showContextMenu(x, y, inTable) {
    var tableItems = contextMenu.querySelectorAll(".ctx-table-item");
    var tableSep   = document.getElementById("ctxTableSep");
    for (var i = 0; i < tableItems.length; i++) {
      tableItems[i].style.display = inTable ? "" : "none";
    }
    tableSep.style.display = inTable ? "" : "none";

    contextMenu.style.left    = x + "px";
    contextMenu.style.top     = y + "px";
    contextMenu.style.display = "block";

    // 화면 밖으로 나가지 않도록 조정
    var rect = contextMenu.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  contextMenu.style.left = (x - rect.width)  + "px";
    if (rect.bottom > window.innerHeight) contextMenu.style.top  = (y - rect.height) + "px";
  }

  function hideContextMenu() {
    contextMenu.style.display = "none";
  }

  contextMenu.addEventListener("mousedown", function (e) {
    e.preventDefault();
    var item = e.target.closest(".ctx-item");
    if (!item) return;
    var action = item.getAttribute("data-action");
    hideContextMenu();
    switch (action) {
      case "bold":            fmt("bold");            break;
      case "italic":          fmt("italic");          break;
      case "underline":       fmt("underline");       break;
      case "link":            showLinkModal();        break;
      case "table":           document.getElementById("tableMenu").classList.toggle("active"); break;
      case "hr":              insertHR();             break;
      case "removeFormat":    fmt("removeFormat");    break;
      case "undo":            fmt("undo");            break;
      case "redo":            fmt("redo");            break;
      case "insertRowAbove":  tableInsertRow(ctxCell, "above");  break;
      case "insertRowBelow":  tableInsertRow(ctxCell, "below");  break;
      case "insertColLeft":   tableInsertCol(ctxCell, "left");   break;
      case "insertColRight":  tableInsertCol(ctxCell, "right");  break;
      case "deleteRow":       tableDeleteRow(ctxCell);           break;
      case "deleteCol":       tableDeleteCol(ctxCell);           break;
    }
  });

  /* ════════════════════════════════
     표 격자 UI 초기화
  ════════════════════════════════ */
  (function () {
    var grid      = document.getElementById("tableGrid");
    var sizeLabel = document.getElementById("tableSizeLabel");
    var MAX_R = 8, MAX_C = 8;

    for (var r = 1; r <= MAX_R; r++) {
      for (var c = 1; c <= MAX_C; c++) {
        (function (row, col) {
          var cell = document.createElement("div");
          cell.className = "tg-cell";
          cell.setAttribute("data-row", row);
          cell.setAttribute("data-col", col);

          cell.addEventListener("mouseover", function () {
            sizeLabel.textContent = row + " × " + col + " 표";
            var cells = grid.querySelectorAll(".tg-cell");
            for (var k = 0; k < cells.length; k++) {
              var cr = parseInt(cells[k].getAttribute("data-row"));
              var cc = parseInt(cells[k].getAttribute("data-col"));
              cells[k].classList.toggle("hover", cr <= row && cc <= col);
            }
          });

          cell.addEventListener("click", function () {
            insertTable(row, col);
            document.getElementById("tableMenu").classList.remove("active");
          });

          grid.appendChild(cell);
        })(r, c);
      }
    }

    grid.addEventListener("mouseleave", function () {
      sizeLabel.textContent = "표 크기 선택 (최대 8×8)";
      var cells = grid.querySelectorAll(".tg-cell");
      for (var k = 0; k < cells.length; k++) cells[k].classList.remove("hover");
    });
  })();

  /* ════════════════════════════════
     HTML 내보내기
  ════════════════════════════════ */
  /* 편집기 iframe 내용을 export용 HTML 문자열로 추출 (주입 스타일 제거) */
  function getEditorExportHtml() {
    var content;
    try {
      var editDoc = editorFrame.contentDocument;
      // 주입 스타일(id "__"로 시작) 임시 제거
      var injected = editDoc.querySelectorAll('[id^="__"]');
      var stash = [];
      for (var ii = 0; ii < injected.length; ii++) {
        var el = injected[ii];
        stash.push({ el: el, parent: el.parentNode, next: el.nextSibling });
        el.parentNode.removeChild(el);
      }
      // diff 마커 속성 임시 제거
      var changedEls = editDoc.querySelectorAll("[data-changed]");
      for (var ci = 0; ci < changedEls.length; ci++) changedEls[ci].removeAttribute("data-changed");
      var deletedEls = editDoc.querySelectorAll("[data-deleted]");
      for (var di = 0; di < deletedEls.length; di++) deletedEls[di].removeAttribute("data-deleted");

      content = "<!DOCTYPE html>\n" + editDoc.documentElement.outerHTML;

      // 주입 스타일 복원 (역순: nextSibling이 다른 stash 요소일 수 있으므로 뒤부터)
      for (var jj = stash.length - 1; jj >= 0; jj--) {
        var s = stash[jj];
        if (s.next && s.next.parentNode === s.parent) s.parent.insertBefore(s.el, s.next);
        else s.parent.appendChild(s.el);
      }
    } catch (e) { alert("내보낼 내용이 없습니다."); return null; }
    if (!content) { alert("내보낼 내용이 없습니다."); return null; }
    // diff 마커 복원 (try 밖에서 실행)
    try { runDiff(); } catch (e) {}
    return content;
  }

  function exportHTML() {
    var content = getEditorExportHtml();
    if (!content) return;

    var blob = new Blob([content], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "개인정보처리방침_" + new Date().toISOString().slice(0, 10) + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus("HTML 파일로 내보냈습니다");
  }


  /* ════════════════════════════════
     전체 지우기
  ════════════════════════════════ */
  function clearEditor() {
    var body;
    try { body = editorFrame.contentDocument.body; } catch (e) { return; }
    if (!body || !body.innerHTML) return;
    if (confirm("편집 내용을 모두 삭제하시겠습니까?")) {
      try { body.innerHTML = ""; } catch (e) {}
      setStatus("편집 내용이 삭제되었습니다");
      updateCharCount();
    }
  }

  /* ════════════════════════════════
     원본 패널 토글
  ════════════════════════════════ */
  toggleOrigBtn.addEventListener("click", function () {
    origVisible = !origVisible;
    leftPanel.style.display = origVisible ? "" : "none";
    divider.style.display   = origVisible ? "" : "none";
    this.textContent = origVisible ? "원본 숨기기" : "원본 보기";
    this.classList.toggle("hidden-mode", !origVisible);
    if (!origVisible) {
      // 너비 리셋
      rightPanel.style.flex  = "1";
      rightPanel.style.width = "";
    } else {
      leftPanel.style.flex  = "";
      leftPanel.style.width = "";
      rightPanel.style.flex  = "";
      rightPanel.style.width = "";
    }
  });

  /* ════════════════════════════════
     분할선 드래그
  ════════════════════════════════ */
  var dragging = false;

  divider.addEventListener("mousedown", function () {
    dragging = true;
    divider.classList.add("dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    frame.style.pointerEvents = "none";
    editorFrame.style.pointerEvents = "none";
  });

  document.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    var r = workspace.getBoundingClientRect();
    var available = r.width - 5;
    var leftW = Math.min(Math.max(e.clientX - r.left, 200), available - 200);
    leftPanel.style.flex  = "none";
    leftPanel.style.width = leftW + "px";
    rightPanel.style.flex  = "none";
    rightPanel.style.width = (available - leftW) + "px";
  });

  document.addEventListener("mouseup", function () {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove("dragging");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    frame.style.pointerEvents = "";
    editorFrame.style.pointerEvents = "";
  });

  /* ════════════════════════════════
     패널 줌
  ════════════════════════════════ */
  var origZoom = 1, editZoom = 1;
  var ZOOM_STEP = 0.1, ZOOM_MIN = 0.3, ZOOM_MAX = 2.0;
  var origZoomInput = document.getElementById("origZoomLabel");
  var editZoomInput = document.getElementById("editZoomLabel");

  function applyOrigZoom() {
    frame.style.transform = "scale(" + origZoom + ")";
    frame.style.width  = (100 / origZoom) + "%";
    frame.style.height = (100 / origZoom) + "%";
    origZoomInput.value = Math.round(origZoom * 100) + "%";
  }

  function applyEditZoom() {
    editorFrame.style.transform = "scale(" + editZoom + ")";
    editorFrame.style.width  = (100 / editZoom) + "%";
    editorFrame.style.height = (100 / editZoom) + "%";
    editZoomInput.value = Math.round(editZoom * 100) + "%";
  }

  function parseZoomInput(val) {
    var n = parseFloat(String(val).replace("%", "").trim());
    if (isNaN(n) || n <= 0) return null;
    return n <= 2 ? n : n / 100;
  }

  document.getElementById("origZoomIn").addEventListener("click",  function () { origZoom = Math.min(ZOOM_MAX, Math.round((origZoom + ZOOM_STEP) * 10) / 10); applyOrigZoom(); });
  document.getElementById("origZoomOut").addEventListener("click", function () { origZoom = Math.max(ZOOM_MIN, Math.round((origZoom - ZOOM_STEP) * 10) / 10); applyOrigZoom(); });
  document.getElementById("editZoomIn").addEventListener("click",  function () { editZoom = Math.min(ZOOM_MAX, Math.round((editZoom + ZOOM_STEP) * 10) / 10); applyEditZoom(); });
  document.getElementById("editZoomOut").addEventListener("click", function () { editZoom = Math.max(ZOOM_MIN, Math.round((editZoom - ZOOM_STEP) * 10) / 10); applyEditZoom(); });

  origZoomInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { var z = parseZoomInput(this.value); if (z) origZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)); applyOrigZoom(); this.blur(); }
    else if (e.key === "Escape") { applyOrigZoom(); this.blur(); }
  });
  origZoomInput.addEventListener("focus", function () { this.value = Math.round(origZoom * 100) + ""; this.select(); });
  origZoomInput.addEventListener("blur",  function () { applyOrigZoom(); });

  editZoomInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { var z = parseZoomInput(this.value); if (z) editZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)); applyEditZoom(); this.blur(); }
    else if (e.key === "Escape") { applyEditZoom(); this.blur(); }
  });
  editZoomInput.addEventListener("focus", function () { this.value = Math.round(editZoom * 100) + ""; this.select(); });
  editZoomInput.addEventListener("blur",  function () { applyEditZoom(); });

  /* ════════════════════════════════
     유틸
  ════════════════════════════════ */
  function setStatus(msg) { statusText.textContent = msg; }

  function updateCharCount() {
    var n = 0;
    try { n = (editorFrame.contentDocument.body.innerText || "").trim().length; } catch (e) {}
    charCount.textContent = n.toLocaleString() + "자";
  }

  /* ════════════════════════════════
     원본 → 편집기 미러링 (scroll + click)
  ════════════════════════════════ */
  function elByPath(doc, path) {
    if (!doc || !doc.body || !path || !path.length) return null;
    var el = doc.body;
    for (var i = 0; i < path.length; i++) {
      el = el && el.children[path[i]];
      if (!el) return null;
    }
    return el;
  }

  var floatBar = document.getElementById("floatBar");

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || !d.type) return;

    if (d.type === "sel-show" && editReady) {
      var iframeRect = editorFrame.getBoundingClientRect();
      var r = d.rect;
      var barW = floatBar.offsetWidth || 220;
      var x = iframeRect.left + r.left + r.width / 2 - barW / 2;
      var y = iframeRect.top + r.top - 46;
      x = Math.max(8, Math.min(x, window.innerWidth - barW - 8));
      y = Math.max(8, y);
      floatBar.style.left = x + "px";
      floatBar.style.top  = y + "px";
      floatBar.style.display = "flex";
      return;
    }
    if (d.type === "sel-hide") {
      floatBar.style.display = "none";
      return;
    }

    if (d.type === "orig-scroll") {
      try { editorFrame.contentWindow.scrollTo(d.x, d.y); } catch (ex) {}
    }
    if (d.type === "orig-scroll-el") {
      try {
        var se = elByPath(editorFrame.contentDocument, d.path);
        if (se) { se.scrollLeft = d.x; se.scrollTop = d.y; }
      } catch (ex) {}
    }
    if (d.type === "orig-click") {
      try {
        var doc = editorFrame.contentDocument;
        if (!doc) return;
        var el = elByPath(doc, d.path);
        if (!el) return;
        var tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        isMirrorClick = true;
        doc.designMode = "off";
        el.click();
        setTimeout(function () {
          try {
            isMirrorClick = false;
            doc.designMode = "on";
            if (editReady) editorSnapshot = buildSnapshot(doc.body);
          } catch (ex) { isMirrorClick = false; }
        }, 120);
      } catch (ex) {}
    }
  });

  /* ════════════════════════════════
     이벤트 연결
  ════════════════════════════════ */

  // 툴바 data-cmd 버튼
  document.querySelectorAll(".tb-btn[data-cmd]").forEach(function (btn) {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
      fmt(btn.getAttribute("data-cmd"));
    });
  });

  // 선택박스
  document.getElementById("sizeSelect").addEventListener("change", function () {
    if (!this.value) return; fmt("fontSize", this.value); this.value = "";
  });
  document.getElementById("fontSelect").addEventListener("change", function () {
    if (!this.value) return; fmt("fontName", this.value); this.value = "";
  });
  document.getElementById("blockSelect").addEventListener("change", function () {
    if (!this.value) return; fmt("formatBlock", this.value); this.value = "";
  });

  /* ════════════════════════════════
     색상 팔레트 초기화
  ════════════════════════════════ */
  var TEXT_COLORS = [
    "#000000","#3d3d3d","#545454","#6b6b6b","#828282",
    "#9a9a9a","#b1b1b1","#c9c9c9","#e0e0e0","#ffffff",
    "#c0392b","#e74c3c","#e67e22","#f1c40f","#27ae60",
    "#1abc9c","#2980b9","#3498db","#8e44ad","#e91e8c"
  ];
  var BG_COLORS = [
    "#ffff00","#ffd700","#ffa07a","#ff69b4","#98fb98",
    "#87ceeb","#dda0dd","#ffa500","#40e0d0","#b0e0e6",
    "#fff9c4","#fce4ec","#e8f5e9","#e3f2fd","#f3e5f5",
    "#fffde7","#e0f7fa","#fff3e0","#f5f5f5","#e8eaf6"
  ];

  function buildSwatches(containerId, colors, cmd, indicatorId) {
    var container = document.getElementById(containerId);
    var indicator = document.getElementById(indicatorId);
    colors.forEach(function (color) {
      var sw = document.createElement("div");
      sw.className = "p-swatch" + (color === "#ffffff" ? " p-white" : "");
      sw.style.background = color;
      sw.title = color;
      sw.addEventListener("mousedown", function (e) {
        e.preventDefault();
        fmt(cmd, color);
        if (indicator) indicator.style.background = color;
        closePalettes();
      });
      container.appendChild(sw);
    });
  }

  function closePalettes() {
    var palettes = document.querySelectorAll(".color-palette");
    for (var i = 0; i < palettes.length; i++) palettes[i].classList.remove("active");
  }

  buildSwatches("textSwatches", TEXT_COLORS, "foreColor",  "textColorIndicator");
  buildSwatches("bgSwatches",   BG_COLORS,   "hiliteColor","bgColorIndicator");
  buildSwatches("fbTextSwatches", TEXT_COLORS, "foreColor", "fbTextColorBar");

  function togglePalette(paletteId) {
    var palette = document.getElementById(paletteId);
    var wasActive = palette.classList.contains("active");
    closePalettes();
    if (!wasActive) palette.classList.add("active");
  }

  document.getElementById("textColorBtn").addEventListener("mousedown", function (e) { e.preventDefault(); togglePalette("textColorPalette"); });
  document.getElementById("bgColorBtn").addEventListener("mousedown",   function (e) { e.preventDefault(); togglePalette("bgColorPalette"); });
  document.getElementById("fbTextColorBtn").addEventListener("mousedown", function (e) { e.preventDefault(); togglePalette("fbTextColorPalette"); });

  document.getElementById("textColorCustom").addEventListener("input", function () {
    fmt("foreColor", this.value);
    document.getElementById("textColorIndicator").style.background = this.value;
  });
  document.getElementById("bgColorCustom").addEventListener("input", function () {
    fmt("hiliteColor", this.value);
    document.getElementById("bgColorIndicator").style.background = this.value;
  });
  document.getElementById("fbTextColorCustom").addEventListener("input", function () {
    fmt("foreColor", this.value);
    document.getElementById("fbTextColorBar").style.background = this.value;
  });

  // 표 드롭다운 토글
  document.getElementById("tableBtn").addEventListener("mousedown", function (e) {
    e.preventDefault();
    document.getElementById("tableMenu").classList.toggle("active");
  });

  // 링크
  document.getElementById("linkBtn").addEventListener("mousedown", function (e) {
    e.preventDefault();
    showLinkModal();
  });

  // 이미지
  document.getElementById("imgInsertBtn").addEventListener("mousedown", function (e) { e.preventDefault(); });
  document.getElementById("imgInsertBtn").addEventListener("click", triggerImageInsert);

  // 수평선
  document.getElementById("hrBtn").addEventListener("mousedown", function (e) { e.preventDefault(); });
  document.getElementById("hrBtn").addEventListener("click", insertHR);

  // 수정 표시 토글
  document.getElementById("diffToggleBtn").addEventListener("click", function () {
    diffEnabled = !diffEnabled;
    this.textContent = diffEnabled ? "수정 표시 ON" : "수정 표시 OFF";
    this.classList.toggle("active", diffEnabled);
    if (diffEnabled) { runDiff(); }
    else {
      try { clearMarkers(editorFrame.contentDocument); } catch (e) {}
      try { clearMarkers(frame.contentDocument); } catch (e) {}
    }
  });

  exportBtn.addEventListener("click", exportHTML);

  clearBtn.addEventListener("click", clearEditor);
  fileLoadBtn.addEventListener("click", loadFromFile);

  // 파일 선택 즉시 불러오기
  fileInput.addEventListener("change", function () {
    if (fileInput.files[0]) {
      fileName.textContent = fileInput.files[0].name;
      fileName.classList.add("has-file");
      loadFromFile();
    } else {
      fileName.textContent = "HTML 파일을 선택하거나 왼쪽 화면에 드래그하세요";
      fileName.classList.remove("has-file");
    }
  });

  // 링크 모달
  document.getElementById("linkConfirm").addEventListener("click", confirmInsertLink);
  document.getElementById("linkCancel").addEventListener("click",  function () { document.getElementById("linkModal").classList.remove("active"); });
  document.getElementById("linkClose").addEventListener("click",   function () { document.getElementById("linkModal").classList.remove("active"); });
  document.getElementById("linkUrlInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") confirmInsertLink();
    if (e.key === "Escape") document.getElementById("linkModal").classList.remove("active");
  });
  document.getElementById("linkModal").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("active");
  });

  // 사용방법 모달
  document.getElementById("helpBtn").addEventListener("click",  function () { document.getElementById("helpModal").classList.add("active"); });
  document.getElementById("helpClose").addEventListener("click", function () { document.getElementById("helpModal").classList.remove("active"); });
  document.getElementById("helpOk").addEventListener("click",   function () { document.getElementById("helpModal").classList.remove("active"); });
  document.getElementById("helpModal").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("active");
  });

  // 플로팅 바 버튼 핸들러
  document.querySelectorAll(".fb-btn[data-cmd]").forEach(function (btn) {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
      fmt(btn.getAttribute("data-cmd"));
    });
  });

  document.getElementById("fbLinkBtn").addEventListener("mousedown", function (e) {
    e.preventDefault();
    floatBar.style.display = "none";
    showLinkModal();
  });

  // 드롭다운·컨텍스트 메뉴·플로팅 바·색상 팔레트 외부 클릭 시 닫기
  document.addEventListener("mousedown", function (e) {
    if (!e.target.closest("#tableDropdownWrap")) {
      document.getElementById("tableMenu").classList.remove("active");
    }
    if (!e.target.closest("#contextMenu")) {
      hideContextMenu();
    }
    if (!e.target.closest(".color-picker-wrap")) {
      closePalettes();
    }
    if (!e.target.closest("#floatBar")) {
      floatBar.style.display = "none";
    }
  });

  /* ════════════════════════════════
     신구 대조표
  ════════════════════════════════ */

  function escHtml(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function tokenizeWords(str) {
    return (str || "").match(/\S+|\s+/g) || [];
  }

  function wordDiff(oldStr, newStr) {
    oldStr = (oldStr || "").replace(/\s+/g, " ").trim();
    newStr = (newStr || "").replace(/\s+/g, " ").trim();
    if (oldStr === newStr) return { oldHtml: escHtml(oldStr), newHtml: escHtml(newStr) };

    var ow = tokenizeWords(oldStr);
    var nw = tokenizeWords(newStr);
    var m = ow.length, n = nw.length;

    // LCS 테이블
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = [];
      for (var j = 0; j <= n; j++) dp[i][j] = 0;
    }
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        dp[i][j] = ow[i-1] === nw[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }

    // 역추적
    var oldParts = [], newParts = [];
    var pi = m, pj = n;
    while (pi > 0 || pj > 0) {
      if (pi > 0 && pj > 0 && ow[pi-1] === nw[pj-1]) {
        oldParts.unshift({ t: "same", s: ow[pi-1] });
        newParts.unshift({ t: "same", s: nw[pj-1] });
        pi--; pj--;
      } else if (pj > 0 && (pi === 0 || dp[pi][pj-1] >= dp[pi-1][pj])) {
        newParts.unshift({ t: "ins", s: nw[pj-1] });
        pj--;
      } else {
        oldParts.unshift({ t: "del", s: ow[pi-1] });
        pi--;
      }
    }

    function toHtml(parts, markType, cls) {
      return parts.map(function (p) {
        if (p.t === markType) return '<mark class="' + cls + '">' + escHtml(p.s) + "</mark>";
        if (p.t === "same")   return escHtml(p.s);
        return "";
      }).join("");
    }

    return {
      oldHtml: toHtml(oldParts, "del", "cdiff-del"),
      newHtml: toHtml(newParts, "ins", "cdiff-ins")
    };
  }

  function hasTable(el) {
    return el && (el.tagName === "TABLE" || !!el.querySelector("table"));
  }

  function sanitizeHtmlForComp(el) {
    var clone = el.cloneNode(true);
    var injected = clone.querySelectorAll('[id^="__"]');
    for (var k = 0; k < injected.length; k++) injected[k].parentNode.removeChild(injected[k]);
    return clone.outerHTML;
  }

  function collectDiffPairs() {
    if (!editReady || !origReady || !editorSnapshot) return null;
    var editDoc = editorFrame.contentDocument;
    var origDoc = frame.contentDocument;
    var eb = editDoc.body, ob = origDoc.body;
    if (!eb || !ob) return null;

    var pairs = [];

    function walk(editEl, origEl, path) {
      // 스냅샷에 없는 경로 = 사용자가 새로 추가한 요소
      if (editorSnapshot[path] === undefined) {
        var newText = (editEl.innerText || editEl.textContent || "").trim();
        if (newText) {
          var newHtml = hasTable(editEl)
            ? '<div class="comp-html-render">' + sanitizeHtmlForComp(editEl) + '</div>'
            : '<mark class="cdiff-ins">' + escHtml(newText) + '</mark>';
          pairs.push({
            num: pairs.length + 1,
            oldHtml: '<span class="cdiff-empty">（신규 추가）</span>',
            newHtml: newHtml
          });
        }
        return true;
      }

      var childChanged = false;
      for (var j = 0; j < editEl.children.length; j++) {
        if (walk(editEl.children[j], origEl ? origEl.children[j] : null, path + "/" + j)) {
          childChanged = true;
        }
      }

      // 자식 수준에서 삭제된 요소
      if (origEl) {
        for (var j = editEl.children.length; j < origEl.children.length; j++) {
          var delEl = origEl.children[j];
          var delText = (delEl.innerText || delEl.textContent || "").trim();
          if (delText) {
            var delOldHtml = hasTable(delEl)
              ? '<div class="comp-html-render">' + sanitizeHtmlForComp(delEl) + '</div>'
              : '<mark class="cdiff-del">' + escHtml(delText) + '</mark>';
            pairs.push({
              num: pairs.length + 1,
              oldHtml: delOldHtml,
              newHtml: '<span class="cdiff-empty">（삭제됨）</span>'
            });
            childChanged = true;
          }
        }
      }

      var snap = editorSnapshot[path];
      if (snap !== undefined && editEl.innerHTML !== snap && !childChanged) {
        var oldText = origEl ? (origEl.innerText || origEl.textContent || "") : "";
        var newText = editEl.innerText || editEl.textContent || "";
        if (oldText.trim() !== newText.trim()) {
          var oldHtml, newHtml;
          if (hasTable(editEl) || hasTable(origEl)) {
            oldHtml = origEl
              ? '<div class="comp-html-render">' + sanitizeHtmlForComp(origEl) + '</div>'
              : '<span class="cdiff-empty">—</span>';
            newHtml = '<div class="comp-html-render">' + sanitizeHtmlForComp(editEl) + '</div>';
          } else {
            var diff = wordDiff(oldText, newText);
            oldHtml = diff.oldHtml;
            newHtml = diff.newHtml;
          }
          pairs.push({ num: pairs.length + 1, oldHtml: oldHtml, newHtml: newHtml });
        }
        return true;
      }
      return childChanged;
    }

    for (var i = 0; i < eb.children.length; i++) {
      walk(eb.children[i], ob.children[i] || null, String(i));
    }

    // 바디 레벨에서 삭제된 요소 (원본에만 남아있는 항목)
    for (var i = eb.children.length; i < ob.children.length; i++) {
      if (editorSnapshot[String(i)] !== undefined) {
        var delEl = ob.children[i];
        var delText = (delEl.innerText || delEl.textContent || "").trim();
        if (delText) {
          var delOldHtml = hasTable(delEl)
            ? '<div class="comp-html-render">' + sanitizeHtmlForComp(delEl) + '</div>'
            : '<mark class="cdiff-del">' + escHtml(delText) + '</mark>';
          pairs.push({
            num: pairs.length + 1,
            oldHtml: delOldHtml,
            newHtml: '<span class="cdiff-empty">（삭제됨）</span>'
          });
        }
      }
    }

    return pairs;
  }

  var compRemarks = {};

  function showCompModal() {
    if (!editReady || !origReady) { setStatus("먼저 파일을 불러와 주세요"); return; }
    var pairs = collectDiffPairs();
    var content = document.getElementById("compContent");
    var empty   = document.getElementById("compEmpty");
    var counter = document.getElementById("compChangeCount");
    var tableWrap = document.getElementById("compTableWrap");

    if (!tableWrap) {
      tableWrap = document.createElement("div");
      tableWrap.id = "compTableWrap";
      content.appendChild(tableWrap);
    }

    if (!pairs || pairs.length === 0) {
      tableWrap.style.display = "none";
      if (empty) empty.style.display = "";
      counter.textContent = "";
      document.getElementById("compModal").classList.add("active");
      return;
    }

    if (empty) empty.style.display = "none";
    counter.textContent = "총 " + pairs.length + "건 수정";

    var rows = pairs.map(function (p) {
      var remark = escHtml(compRemarks[p.num] || "");
      return "<tr>" +
        "<td>" + p.num + "</td>" +
        '<td class="comp-col-old">' + p.oldHtml + "</td>" +
        '<td class="comp-col-new">' + p.newHtml + "</td>" +
        '<td class="comp-col-remark" contenteditable="true" data-row="' + p.num + '" spellcheck="false">' + remark + "</td>" +
        "</tr>";
    }).join("");

    tableWrap.innerHTML =
      '<table class="comp-table">' +
        "<thead><tr>" +
          "<th>번호</th>" +
          "<th>현 행</th>" +
          "<th>개 정</th>" +
          "<th>비고</th>" +
        "</tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table>";
    tableWrap.style.display = "";

    // 비고 셀 입력 시 저장
    var remarkCells = tableWrap.querySelectorAll(".comp-col-remark");
    for (var i = 0; i < remarkCells.length; i++) {
      remarkCells[i].addEventListener("input", function () {
        compRemarks[parseInt(this.dataset.row)] = this.innerText;
      });
    }

    document.getElementById("compModal").classList.add("active");
  }

  document.getElementById("compBtn").addEventListener("click", showCompModal);

  document.getElementById("compClose").addEventListener("click", function () {
    document.getElementById("compModal").classList.remove("active");
  });
  document.getElementById("compOk").addEventListener("click", function () {
    document.getElementById("compModal").classList.remove("active");
  });
  document.getElementById("compModal").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("active");
  });

  document.getElementById("compPrintBtn").addEventListener("click", function () {
    window.print();
  });

  // 원본 패널 드래그앤드롭
  var origBody = document.querySelector(".original-panel .body");

  origBody.addEventListener("dragover", function (e) {
    e.preventDefault();
    origBody.classList.add("drag-over");
  });
  origBody.addEventListener("dragleave", function (e) {
    if (!origBody.contains(e.relatedTarget)) origBody.classList.remove("drag-over");
  });
  origBody.addEventListener("drop", function (e) {
    e.preventDefault();
    origBody.classList.remove("drag-over");
    var file = e.dataTransfer.files[0];
    if (!file) return;
    if (/\.pdf$/i.test(file.name)) { loadPdfFile(file); return; }
    if (!/\.html?$/i.test(file.name)) { alert("HTML(.html, .htm) 또는 PDF(.pdf) 파일만 업로드할 수 있습니다."); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var html = ev.target.result;
      if (!html) return;
      loadingOverlay.classList.add("active");
      loadBothPanels(html, "", "파일 로드 완료 — " + file.name);
    };
    reader.readAsText(file, "UTF-8");
  });

  window.addEventListener("beforeunload", function () {
    if (_origBlobUrl) URL.revokeObjectURL(_origBlobUrl);
    if (_editBlobUrl) URL.revokeObjectURL(_editBlobUrl);
  });

})();
