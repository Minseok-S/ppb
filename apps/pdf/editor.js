(function () {
  "use strict";

  /* ── pdf.js 워커 ── */
  if (window.pdfjsLib) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    } catch (e) {}
  }

  /* ── 렌더 해상도(픽셀 밀도). 화면엔 1배 크기로 표시하되 SCALE배로 그려 선명하게 ── */
  var SCALE = 2;

  /* ── DOM refs ── */
  var openBtn      = document.getElementById("openBtn");
  var fileInput    = document.getElementById("fileInput");
  var fileNameEl   = document.getElementById("fileName");
  var workspace    = document.getElementById("workspace");
  var pagesEl      = document.getElementById("pages");
  var placeholder  = document.getElementById("placeholder");
  var loading      = document.getElementById("loading");
  var loadingText  = document.getElementById("loadingText");
  var errorBanner  = document.getElementById("errorBanner");
  var statusText   = document.getElementById("statusText");
  var pageInfo     = document.getElementById("pageInfo");
  var editedCount  = document.getElementById("editedCount");
  var editTools    = document.getElementById("editTools");
  var zoomLabel    = document.getElementById("zoomLabel");

  var hasDoc = false;

  /* 원본 PDF 바이트 — pdf-lib로 수정 사항을 원본에 직접 기록할 때 사용
     (pdf.js가 ArrayBuffer를 워커로 가져가 비워버리므로 반드시 복사본을 보관) */
  var origPdfBytes = null;
  var origFileName = "문서";

  /* 한글 폰트 바이트 캐시 (PDF 저장 시 1회만 다운로드) */
  var koreanFontBytes = null;
  var FONT_URLS = [
    "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf",
    "https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-sans-kr@0.2.3/NotoSansKR_400Regular.ttf"
  ];

  /* 원본 복원용 — 런별 최초 innerHTML 보관 (export 결과를 불리지 않도록 DOM 속성 대신 맵 사용) */
  var origHtmlMap = typeof WeakMap !== "undefined" ? new WeakMap() : null;

  /* ════════════════════════════════
     파일 열기
  ════════════════════════════════ */
  openBtn.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    if (fileInput.files[0]) loadPdf(fileInput.files[0]);
  });

  function loadPdf(file) {
    if (!/\.pdf$/i.test(file.name)) { showError("PDF(.pdf) 파일만 열 수 있습니다."); return; }
    if (!window.pdfjsLib) {
      showError("PDF 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침하세요.");
      return;
    }
    fileNameEl.textContent = file.name;
    fileNameEl.classList.add("has-file");
    errorBanner.classList.remove("active");
    placeholder.classList.add("hidden");
    pagesEl.innerHTML = "";
    loading.classList.add("active");
    setStatus("PDF 변환 중…");

    var reader = new FileReader();
    reader.onload = function (e) {
      var buf = e.target.result;
      origPdfBytes = buf.slice(0);
      origFileName = file.name.replace(/\.pdf$/i, "");
      pdfjsLib.getDocument({ data: buf }).promise
        .then(function (pdf) {
          var total = pdf.numPages;
          var chain = Promise.resolve();
          for (var p = 1; p <= total; p++) {
            (function (num) {
              chain = chain.then(function () {
                loadingText.textContent = "페이지 렌더링 중… (" + num + "/" + total + ")";
                return renderPage(pdf, num);
              });
            })(p);
          }
          return chain.then(function () { return total; });
        })
        .then(function (total) {
          hasDoc = true;
          loading.classList.remove("active");
          editTools.style.opacity = "";
          editTools.style.pointerEvents = "";
          pageInfo.textContent = total + "페이지";
          setStatus("변환 완료 — " + file.name);
          updateEditedCount();
        })
        .catch(function (err) {
          loading.classList.remove("active");
          showError("PDF 변환 실패: " + (err && err.message ? err.message : err));
        });
    };
    reader.onerror = function () {
      loading.classList.remove("active");
      showError("파일 읽기 오류가 발생했습니다.");
    };
    reader.readAsArrayBuffer(file);
  }

  /* ════════════════════════════════
     한 페이지 렌더 — canvas 배경 + 텍스트 오버레이
  ════════════════════════════════ */
  function renderPage(pdf, pageNum) {
    return pdf.getPage(pageNum).then(function (page) {
      var baseVp   = page.getViewport({ scale: 1 });
      var renderVp = page.getViewport({ scale: SCALE });

      var pageDiv = document.createElement("div");
      pageDiv.className = "pdf-page";
      pageDiv.dataset.pageIndex = pageNum - 1;
      pageDiv.style.width  = pdfNum(baseVp.width) + "px";
      pageDiv.style.height = pdfNum(baseVp.height) + "px";

      var canvas = document.createElement("canvas");
      canvas.width  = Math.round(renderVp.width);
      canvas.height = Math.round(renderVp.height);
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      pageDiv.appendChild(canvas);

      var textLayer = document.createElement("div");
      textLayer.className = "text-layer";
      pageDiv.appendChild(textLayer);
      pagesEl.appendChild(pageDiv);

      return page.render({ canvasContext: ctx, viewport: renderVp }).promise
        .then(function () { return page.getTextContent(); })
        .then(function (tc) {
          var imgData = null;
          try { imgData = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch (e) {}
          var styles = tc.styles || {};

          /* 1) 아이템 수집 — pdf.js는 텍스트를 잘게 쪼개서 주므로 좌표·서식만 모은다.
                공백 전용 아이템은 건너뛰고 간격(gap)으로 복원한다. */
          var items = [];
          tc.items.forEach(function (it) {
            if (typeof it.str !== "string" || !it.str.trim()) return;
            var tx = pdfjsLib.Util.transform(baseVp.transform, it.transform);
            var fontSize = Math.hypot(tx[2], tx[3]);
            if (!fontSize) return;
            var st = styles[it.fontName] || {};
            items.push({
              str: it.str,
              left: tx[4],
              baseline: tx[5],
              fontSize: fontSize,
              width: it.width || it.str.length * fontSize * 0.55,
              fontFamily: (st.fontFamily || "sans-serif").replace(/"/g, "'"),
              bold: /bold/i.test(it.fontName || ""),
              italic: /italic|oblique/i.test(it.fontName || ""),
              spaceBefore: false
            });
          });

          /* 2) 같은 줄(baseline이 비슷한 아이템) 묶기 */
          items.sort(function (a, b) { return (a.baseline - b.baseline) || (a.left - b.left); });
          var lines = [];
          items.forEach(function (m) {
            var last = lines[lines.length - 1];
            if (last && Math.abs(last.baseline - m.baseline) <= Math.max(2, m.fontSize * 0.35)) {
              last.items.push(m);
            } else {
              lines.push({ baseline: m.baseline, items: [m] });
            }
          });

          /* 3) 줄 안에서 가까운 조각을 한 덩어리(segment)로 병합.
                넓은 간격(표 칸·다단 등)은 별도 덩어리로 남겨 레이아웃을 유지하고,
                좁은 간격은 공백으로 복원해 문장 단위로 자연스럽게 편집되게 한다. */
          var segs = [];
          lines.forEach(function (line) {
            line.items.sort(function (a, b) { return a.left - b.left; });
            var seg = null;
            line.items.forEach(function (m) {
              var gap = seg ? m.left - seg.right : 0;
              var ref = seg ? Math.min(seg.fontSize, m.fontSize) : m.fontSize;
              if (!seg || gap > ref * 1.1) {
                seg = { items: [m], left: m.left, right: m.left + m.width,
                        baseline: line.baseline, fontSize: m.fontSize };
                segs.push(seg);
              } else {
                m.spaceBefore = gap > ref * 0.18;
                seg.items.push(m);
                seg.right = Math.max(seg.right, m.left + m.width);
                seg.fontSize = Math.max(seg.fontSize, m.fontSize);
              }
            });
          });

          /* 4) segment → 하나의 편집 가능한 런 (내부는 자연스러운 인라인 흐름) */
          segs.forEach(function (seg) {
            var top = seg.baseline - seg.fontSize;
            var baseFf = seg.items[0].fontFamily;

            var run = document.createElement("span");
            run.className = "tl-run";
            run.setAttribute("contenteditable", "true");
            run.setAttribute("spellcheck", "false");
            run.style.left       = pdfNum(seg.left) + "px";
            run.style.top        = pdfNum(top) + "px";
            run.style.fontSize   = pdfNum(seg.fontSize) + "px";
            run.style.fontFamily = baseFf;
            /* 마스크가 원본 글자 폭을 확실히 덮도록 최소 너비를 원본 폭으로 */
            run.style.minWidth   = pdfNum(seg.right - seg.left) + "px";

            seg.items.forEach(function (m, idx) {
              if (idx > 0 && m.spaceBefore) run.appendChild(document.createTextNode(" "));
              var plain = !m.bold && !m.italic &&
                          m.fontFamily === baseFf &&
                          Math.abs(m.fontSize - seg.fontSize) < 0.5;
              if (plain) {
                run.appendChild(document.createTextNode(m.str));
              } else {
                var sp = document.createElement("span");
                sp.textContent = m.str;
                if (Math.abs(m.fontSize - seg.fontSize) >= 0.5) sp.style.fontSize = pdfNum(m.fontSize) + "px";
                if (m.fontFamily !== baseFf) sp.style.fontFamily = m.fontFamily;
                if (m.bold)   sp.style.fontWeight = "bold";
                if (m.italic) sp.style.fontStyle  = "italic";
                run.appendChild(sp);
              }
            });

            run.dataset.orig = run.textContent;
            if (origHtmlMap) origHtmlMap.set(run, run.innerHTML);

            /* PDF 저장 시 원본 좌표계에 그대로 기록하기 위한 기하 정보 */
            run.dataset.x  = pdfNum(seg.left);
            run.dataset.bl = pdfNum(seg.baseline);
            run.dataset.fs = pdfNum(seg.fontSize);
            run.dataset.w  = pdfNum(seg.right - seg.left);

            /* 편집 시 원본 글자를 덮을 마스크 배경색·글자색을 미리 샘플링 */
            run.dataset.bg = imgData
              ? sampleBg(imgData, canvas.width, canvas.height, seg.left, top, seg.right - seg.left, seg.fontSize, SCALE)
              : "#fff";
            run.dataset.fg = imgData
              ? sampleFg(imgData, canvas.width, canvas.height, seg.left, top, seg.right - seg.left, seg.fontSize * 1.2, SCALE)
              : "#000";

            textLayer.appendChild(run);
          });
        });
    });
  }

  /* 런 위쪽(줄 간격)에서 배경색을 샘플링 — 가장 밝은 점을 배경으로 채택 */
  function sampleBg(imgData, W, H, leftPx, topPx, wPx, fontSizePx, scale) {
    var data = imgData.data;
    var ys = [topPx - fontSizePx * 0.45, topPx - fontSizePx * 0.25];
    var best = null, bestLum = -1;
    for (var yi = 0; yi < ys.length; yi++) {
      for (var f = 0.15; f <= 0.85; f += 0.35) {
        var cx = Math.round((leftPx + wPx * f) * scale);
        var cy = Math.round(ys[yi] * scale);
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
        var i = (cy * W + cx) * 4;
        var r = data[i], g = data[i + 1], b = data[i + 2];
        var lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > bestLum) { bestLum = lum; best = [r, g, b]; }
      }
    }
    if (!best) return "#fff";
    return "rgb(" + best[0] + "," + best[1] + "," + best[2] + ")";
  }

  /* 런 영역 안에서 가장 어두운 픽셀을 글자색으로 채택 (제목·강조색 보존) */
  function sampleFg(imgData, W, H, leftPx, topPx, wPx, hPx, scale) {
    var data = imgData.data;
    var best = null, bestLum = 256;
    var XS = 14, YS = 5;
    for (var yi = 1; yi <= YS; yi++) {
      var cy = Math.round((topPx + hPx * yi / (YS + 1)) * scale);
      for (var xi = 0; xi <= XS; xi++) {
        var cx = Math.round((leftPx + wPx * xi / XS) * scale);
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
        var i = (cy * W + cx) * 4;
        var r = data[i], g = data[i + 1], b = data[i + 2];
        var lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < bestLum) { bestLum = lum; best = [r, g, b]; }
      }
    }
    /* 글자 픽셀을 못 찾았으면(전부 밝음) 검정으로 */
    if (!best || bestLum > 170) return "#000";
    return "rgb(" + best[0] + "," + best[1] + "," + best[2] + ")";
  }

  /* ════════════════════════════════
     편집 감지 → 마스크 토글
  ════════════════════════════════ */
  pagesEl.addEventListener("input", function (e) {
    var run = e.target.closest && e.target.closest(".tl-run");
    if (!run) return;
    syncRunState(run);
    updateEditedCount();
  });

  /* 런은 한 줄 — Enter 줄바꿈 방지 */
  pagesEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.closest && e.target.closest(".tl-run")) {
      e.preventDefault();
    }
  });

  /* 서식 깨짐 방지 — 항상 일반 텍스트로 붙여넣기 */
  pagesEl.addEventListener("paste", function (e) {
    if (!(e.target.closest && e.target.closest(".tl-run"))) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text");
    document.execCommand("insertText", false, text.replace(/[\r\n]+/g, " "));
  });

  function syncRunState(run) {
    var changed = run.textContent !== run.dataset.orig;
    if (changed) {
      run.classList.add("edited");
      run.style.background = run.dataset.bg || "#fff";
      run.style.color = run.dataset.fg || "";
    } else {
      run.classList.remove("edited");
      run.style.background = "";
      run.style.color = "";
    }
  }

  function updateEditedCount() {
    if (!hasDoc) { editedCount.textContent = ""; return; }
    var n = pagesEl.querySelectorAll(".tl-run.edited").length;
    editedCount.textContent = n ? n + "곳 수정됨" : "";
  }

  /* ════════════════════════════════
     서식 도구 (execCommand)
  ════════════════════════════════ */
  function fmt(cmd, val) {
    try { document.execCommand(cmd, false, val !== undefined ? val : null); } catch (e) {}
    var sel = document.getSelection();
    var node = sel && sel.anchorNode;
    var run = node && (node.nodeType === 1 ? node : node.parentElement);
    run = run && run.closest && run.closest(".tl-run");
    if (run) { syncRunState(run); updateEditedCount(); }
  }

  document.querySelectorAll(".tb-btn[data-cmd]").forEach(function (btn) {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
      fmt(btn.getAttribute("data-cmd"));
    });
  });

  document.getElementById("colorPick").addEventListener("input", function () {
    fmt("foreColor", this.value);
  });
  document.getElementById("sizeSelect").addEventListener("change", function () {
    if (!this.value) return;
    fmt("fontSize", this.value);
    this.value = "";
  });

  /* ════════════════════════════════
     줌
  ════════════════════════════════ */
  var zoom = 1;
  var ZMIN = 0.3, ZMAX = 2.5, ZSTEP = 0.1;

  function applyZoom() {
    pagesEl.style.transform = "scale(" + zoom + ")";
    zoomLabel.value = Math.round(zoom * 100) + "%";
  }
  document.getElementById("zoomIn").addEventListener("click", function () {
    zoom = Math.min(ZMAX, Math.round((zoom + ZSTEP) * 10) / 10); applyZoom();
  });
  document.getElementById("zoomOut").addEventListener("click", function () {
    zoom = Math.max(ZMIN, Math.round((zoom - ZSTEP) * 10) / 10); applyZoom();
  });
  zoomLabel.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var n = parseFloat(String(this.value).replace("%", "").trim());
      if (!isNaN(n) && n > 0) { zoom = Math.min(ZMAX, Math.max(ZMIN, n > 3 ? n / 100 : n)); applyZoom(); }
      this.blur();
    }
  });

  /* ════════════════════════════════
     원본 복원
  ════════════════════════════════ */
  document.getElementById("resetBtn").addEventListener("click", function () {
    if (!hasDoc) return;
    if (!pagesEl.querySelector(".tl-run.edited")) { setStatus("수정된 내용이 없습니다"); return; }
    if (!confirm("모든 편집을 되돌리고 원본 상태로 복원하시겠습니까?")) return;
    var runs = pagesEl.querySelectorAll(".tl-run");
    for (var i = 0; i < runs.length; i++) {
      if (origHtmlMap && origHtmlMap.has(runs[i])) runs[i].innerHTML = origHtmlMap.get(runs[i]);
      else runs[i].textContent = runs[i].dataset.orig;
      runs[i].classList.remove("edited");
      runs[i].style.background = "";
      runs[i].style.color = "";
    }
    updateEditedCount();
    setStatus("원본 상태로 복원되었습니다");
  });

  /* ════════════════════════════════
     인쇄 (이미지 기반 — 브라우저 인쇄 다이얼로그)
  ════════════════════════════════ */
  document.getElementById("printBtn").addEventListener("click", function () {
    if (!hasDoc) { setStatus("먼저 PDF를 열어주세요"); return; }
    var z = zoom; zoom = 1; applyZoom();
    setTimeout(function () {
      window.print();
      zoom = z; applyZoom();
    }, 60);
  });

  /* ════════════════════════════════
     PDF 저장 — pdf-lib로 원본 PDF 파일에 수정 사항을 직접 기록.
     수정 안 한 부분은 원본 그대로(벡터·텍스트·링크 보존),
     수정한 런만 마스크 사각형 + 새 텍스트 객체로 교체된다.
  ════════════════════════════════ */
  function collectEdits() {
    var out = [];
    var runs = pagesEl.querySelectorAll(".tl-run.edited");
    for (var i = 0; i < runs.length; i++) {
      var run = runs[i];
      var pageDiv = run.closest(".pdf-page");
      if (!pageDiv) continue;
      var text = (run.textContent || "")
        .replace(/\u00A0/g, " ")
        .replace(/[\r\n]+/g, " ");
      out.push({
        pageIdx: parseInt(pageDiv.dataset.pageIndex, 10),
        x: parseFloat(run.dataset.x),
        baseline: parseFloat(run.dataset.bl),
        fs: parseFloat(run.dataset.fs),
        width: parseFloat(run.dataset.w),
        text: text,
        bg: run.dataset.bg || "#fff",
        fg: run.dataset.fg || "#000"
      });
    }
    return out;
  }

  function toPdfColor(c) {
    var m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(c || "");
    if (m) return PDFLib.rgb(m[1] / 255, m[2] / 255, m[3] / 255);
    if (c === "#000") return PDFLib.rgb(0, 0, 0);
    return PDFLib.rgb(1, 1, 1);
  }

  function fetchKoreanFont() {
    if (koreanFontBytes) return Promise.resolve(koreanFontBytes);
    var i = 0;
    function tryNext() {
      if (i >= FONT_URLS.length) return Promise.reject(new Error("한글 폰트를 다운로드하지 못했습니다"));
      return fetch(FONT_URLS[i++])
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.arrayBuffer();
        })
        .then(function (b) { koreanFontBytes = b; return b; })
        .catch(function () { return tryNext(); });
    }
    return tryNext();
  }

  function buildEditedPdf(edits) {
    return PDFLib.PDFDocument.load(origPdfBytes.slice(0), { ignoreEncryption: true })
      .then(function (doc) {
        var needKo = edits.some(function (e) { return /[^\u0000-\u00FF]/.test(e.text); });
        var fontPromise;
        if (needKo) {
          if (!window.fontkit) throw new Error("fontkit 라이브러리를 불러오지 못했습니다");
          doc.registerFontkit(window.fontkit);
          loadingText.textContent = "한글 폰트 다운로드 중… (최초 1회)";
          fontPromise = fetchKoreanFont().then(function (bytes) {
            loadingText.textContent = "PDF 생성 중…";
            return doc.embedFont(bytes, { subset: true });
          });
        } else {
          fontPromise = doc.embedFont(PDFLib.StandardFonts.Helvetica);
        }
        return fontPromise.then(function (font) {
          var pages = doc.getPages();
          var fail = 0;
          edits.forEach(function (e) {
            var page = pages[e.pageIdx];
            if (!page) { fail++; return; }
            /* 회전된 페이지는 좌표계가 달라 정확히 기록할 수 없음 */
            if (page.getRotation && page.getRotation().angle % 360 !== 0) { fail++; return; }
            var pageH = page.getHeight();
            var textW = 0;
            try { textW = font.widthOfTextAtSize(e.text, e.fs); } catch (ex) {}
            var maskTop = e.baseline - e.fs;
            var maskBottom = e.baseline + e.fs * 0.22;
            try {
              page.drawRectangle({
                x: e.x - 0.5,
                y: pageH - maskBottom,
                width: Math.max(e.width, textW) + 1,
                height: maskBottom - maskTop,
                color: toPdfColor(e.bg)
              });
              if (e.text.trim()) {
                page.drawText(e.text, {
                  x: e.x,
                  y: pageH - e.baseline,
                  size: e.fs,
                  font: font,
                  color: toPdfColor(e.fg)
                });
              }
            } catch (ex) { fail++; }
          });
          return doc.save().then(function (bytes) {
            return { bytes: bytes, fail: fail };
          });
        });
      });
  }

  function downloadBlob(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  document.getElementById("exportPdfBtn").addEventListener("click", function () {
    if (!hasDoc || !origPdfBytes) { setStatus("먼저 PDF를 열어주세요"); return; }
    var saveName = origFileName + "_편집.pdf";
    var edits = collectEdits();
    if (!edits.length) {
      downloadBlob(new Blob([origPdfBytes], { type: "application/pdf" }), saveName);
      setStatus("수정 내용이 없어 원본 그대로 저장했습니다");
      return;
    }
    if (!window.PDFLib) {
      showError("pdf-lib 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침하세요.");
      return;
    }
    loading.classList.add("active");
    loadingText.textContent = "PDF 생성 중…";
    buildEditedPdf(edits)
      .then(function (res) {
        loading.classList.remove("active");
        downloadBlob(new Blob([res.bytes], { type: "application/pdf" }), saveName);
        var msg = edits.length - res.fail + "곳 수정이 반영된 PDF를 저장했습니다";
        if (res.fail) msg += " (" + res.fail + "곳은 회전/폰트 문제로 반영 못 함)";
        setStatus(msg);
      })
      .catch(function (err) {
        loading.classList.remove("active");
        showError(
          "PDF 저장 실패: " + (err && err.message ? err.message : err) +
          " — ‘🖨 인쇄’ 버튼으로 PDF 저장을 대신할 수 있습니다."
        );
      });
  });

  /* ════════════════════════════════
     HTML 내보내기
  ════════════════════════════════ */
  document.getElementById("exportHtmlBtn").addEventListener("click", function () {
    if (!hasDoc) { setStatus("먼저 PDF를 열어주세요"); return; }
    var clone = pagesEl.cloneNode(true);
    clone.style.transform = "";

    /* canvas → img(dataURL) 치환 */
    var srcCanvases = pagesEl.querySelectorAll("canvas");
    var dstCanvases = clone.querySelectorAll("canvas");
    for (var i = 0; i < dstCanvases.length; i++) {
      var img = document.createElement("img");
      try { img.src = srcCanvases[i].toDataURL("image/png"); } catch (e) {}
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
      dstCanvases[i].parentNode.replaceChild(img, dstCanvases[i]);
    }
    /* 편집 마커(box-shadow 등) 제거, 마스크 배경은 유지 */
    var runs = clone.querySelectorAll(".tl-run");
    for (var j = 0; j < runs.length; j++) {
      runs[j].removeAttribute("contenteditable");
      runs[j].classList.remove("edited");
    }

    var css =
      "*{box-sizing:border-box;margin:0;padding:0;}" +
      "body{background:#525659;padding:24px 0;" +
      "font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif;}" +
      ".pdf-page{position:relative;background:#fff;margin:0 auto 20px;overflow:hidden;" +
      "box-shadow:0 3px 14px rgba(0,0,0,.45);}" +
      ".text-layer{position:absolute;inset:0;}" +
      ".tl-run{position:absolute;white-space:pre;line-height:1;color:transparent;}" +
      "@media print{body{background:#fff;padding:0;}.pdf-page{margin:0;box-shadow:none;" +
      "page-break-after:always;}.pdf-page:last-child{page-break-after:auto;}}@page{margin:0;}";

    var html =
      "<!DOCTYPE html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"UTF-8\"/>\n" +
      "<title>편집된 PDF</title>\n<style>" + css + "</style>\n</head>\n<body>\n" +
      clone.outerHTML + "\n</body>\n</html>";

    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "편집된_PDF_" + new Date().toISOString().slice(0, 10) + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    setStatus("HTML 파일로 내보냈습니다");
  });

  /* ════════════════════════════════
     드래그 앤 드롭
  ════════════════════════════════ */
  workspace.addEventListener("dragover", function (e) {
    e.preventDefault();
    workspace.classList.add("drag-over");
  });
  workspace.addEventListener("dragleave", function (e) {
    if (!workspace.contains(e.relatedTarget)) workspace.classList.remove("drag-over");
  });
  workspace.addEventListener("drop", function (e) {
    e.preventDefault();
    workspace.classList.remove("drag-over");
    var file = e.dataTransfer.files[0];
    if (file) loadPdf(file);
  });

  /* ════════════════════════════════
     도움말
  ════════════════════════════════ */
  document.getElementById("helpBtn").addEventListener("click", function () {
    alert(
      "📄 PDF 편집기 사용법\n\n" +
      "1) ‘PDF 열기’ 또는 화면에 드래그해서 PDF를 불러옵니다.\n" +
      "2) 화면은 원본 PDF와 픽셀 단위로 동일하게 표시됩니다.\n" +
      "3) 고치고 싶은 문장을 클릭하면 그 자리에서 바로 수정됩니다.\n" +
      "4) 수정한 부분만 빨간 테두리로 강조되고, 원본 글자는 가려집니다.\n" +
      "5) ‘PDF 저장’ — 수정 사항을 원본 PDF 파일에 직접 기록합니다.\n" +
      "   수정 안 한 부분은 원본 그대로(벡터·텍스트 선택·링크 보존)이고,\n" +
      "   수정한 곳만 새 텍스트로 교체됩니다. 한글은 폰트가 자동 임베드됩니다.\n" +
      "   (한글 수정 시 최초 1회 폰트 다운로드 — 인터넷 필요)\n" +
      "6) ‘🖨 인쇄’는 화면 그대로 이미지 기반 인쇄, ‘HTML’은 웹문서로 내보냅니다.\n\n" +
      "※ 흰 배경 문서는 거의 완벽하지만, 색·음영 배경 위 글자를 고치면\n" +
      "   가림 영역이 약간 어색할 수 있습니다. 수정한 글자의 폰트는\n" +
      "   원본 임베드 폰트가 아닌 Noto Sans KR로 기록됩니다."
    );
  });

  /* ════════════════════════════════
     유틸
  ════════════════════════════════ */
  function pdfNum(n) { return Math.round(n * 100) / 100; }
  function setStatus(msg) { statusText.textContent = msg; }
  function showError(msg) {
    errorBanner.textContent = "⚠ " + msg;
    errorBanner.classList.add("active");
    if (!hasDoc) placeholder.classList.remove("hidden");
  }
})();
