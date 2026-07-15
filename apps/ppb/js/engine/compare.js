// ════════════════════════════════════════
//  COMPARE — 신구대조표 (현행 원본 ↔ PPB 개정안)
//  · DCT(apps/dct) 엔진을 PPB용으로 포팅한 자립 모듈.
//  · 현행(old)  = 사용자가 올린 고객사 기존 처리방침 파일(.docx/.hwp/.hwpx/.md)
//  · 개정안(new) = PPB 미리보기(#previewContent)에서 바로 추출한 문서
//  · 파서 라이브러리(mammoth/fflate/exceljs/hwp)는 ../dct/lib 를 그대로 참조한다.
//  전역 노출: openCompare()  (툴바 버튼에서 호출)
// ════════════════════════════════════════
(function () {
  "use strict";

  // ── 유틸 ──────────────────────────────
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const escBr = (s) => esc(s).replace(/\n/g, "<br>");
  const clean = (s) => s.replace(/\s+/g, " ").trim();
  const fmtSize = (n) => (n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(0) + " KB" : (n / 1048576).toFixed(1) + " MB");

  // ── 비교 로직 (DCT 포팅) ────────────────
  function bigrams(s) {
    const t = s.replace(/\s+/g, "");
    if (t.length === 0) return [];
    if (t.length === 1) return [t];
    const out = [];
    for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
    return out;
  }
  function diceSim(a, b) {
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;
    const A = bigrams(a), B = bigrams(b);
    if (!A.length || !B.length) return a === b ? 1 : 0;
    const m = new Map();
    for (const g of A) m.set(g, (m.get(g) || 0) + 1);
    let inter = 0;
    for (const g of B) { const c = m.get(g) || 0; if (c > 0) { inter++; m.set(g, c - 1); } }
    return (2 * inter) / (A.length + B.length);
  }
  function alignIndices(a, b) {
    const ops = []; let p = 0;
    const n0 = a.length, m0 = b.length;
    while (p < n0 && p < m0 && a[p] === b[p]) p++;
    let sA = n0, sB = m0;
    while (sA > p && sB > p && a[sA - 1] === b[sB - 1]) { sA--; sB--; }
    for (let i = 0; i < p; i++) ops.push({ type: "equal", ai: i, bi: i });
    const aS = a.slice(p, sA), bS = b.slice(p, sB);
    const n = aS.length, m = bS.length, T = 0.34;
    if (n && m) {
      const score = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
      const dir = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
      for (let i = 1; i <= n; i++) dir[i][0] = 2;
      for (let j = 1; j <= m; j++) dir[0][j] = 3;
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          const diag = score[i - 1][j - 1] + (diceSim(aS[i - 1], bS[j - 1]) - T);
          const up = score[i - 1][j], left = score[i][j - 1];
          let best = diag, d = 1;
          if (up > best) { best = up; d = 2; }
          if (left > best) { best = left; d = 3; }
          score[i][j] = best; dir[i][j] = d;
        }
      }
      const mid = []; let i = n, j = m;
      while (i > 0 || j > 0) {
        const d = i === 0 ? 3 : j === 0 ? 2 : dir[i][j];
        if (d === 1) { const s = diceSim(aS[i - 1], bS[j - 1]); mid.push({ type: s >= 0.999 ? "equal" : "modify", ai: p + i - 1, bi: p + j - 1 }); i--; j--; }
        else if (d === 2) { mid.push({ type: "delete", ai: p + i - 1, bi: null }); i--; }
        else { mid.push({ type: "insert", ai: null, bi: p + j - 1 }); j--; }
      }
      mid.reverse(); for (const o of mid) ops.push(o);
    } else if (n) { for (let i = 0; i < n; i++) ops.push({ type: "delete", ai: p + i, bi: null }); }
    else if (m) { for (let j = 0; j < m; j++) ops.push({ type: "insert", ai: null, bi: p + j }); }
    for (let i = sA; i < n0; i++) ops.push({ type: "equal", ai: i, bi: i - sA + sB });
    return ops;
  }
  function lcsTokens(a, b) {
    const n = a.length, m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const res = []; let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { res.push(["=", a[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { res.push(["-", a[i]]); i++; }
      else { res.push(["+", b[j]]); j++; }
    }
    while (i < n) res.push(["-", a[i++]]);
    while (j < m) res.push(["+", b[j++]]);
    return res;
  }
  const wordTok = (s) => s.split(/(\s+)/).filter((t) => t !== "");
  function buildParts(oldText, newText, unit) {
    let a, b;
    if (unit === "char") { a = Array.from(oldText); b = Array.from(newText); if (a.length * b.length > 1200000) { a = wordTok(oldText); b = wordTok(newText); } }
    else { a = wordTok(oldText); b = wordTok(newText); }
    const ops = lcsTokens(a, b); const oldParts = [], newParts = [];
    const push = (arr, type, v) => { const last = arr[arr.length - 1]; if (last && last.type === type) last.text += v; else arr.push({ type, text: v }); };
    for (const o of ops) {
      if (o[0] === "=") { push(oldParts, "eq", o[1]); push(newParts, "eq", o[1]); }
      else if (o[0] === "-") push(oldParts, "del", o[1]);
      else push(newParts, "ins", o[1]);
    }
    return { oldParts, newParts };
  }

  // ── 조 단위 묶음 (DCT 포팅) ──────────────
  const NUM = "[0-9\\uFF10-\\uFF19]";
  const HEAD_RE = new RegExp("^\\s*제\\s*" + NUM + "+\\s*(편|장|절|관)");
  const ARTICLE_RE = new RegExp("^\\s*제\\s*" + NUM + "+\\s*조(\\s*의\\s*" + NUM + "+)?");
  function headMatch(re, text) {
    const m = re.exec(text); if (!m) return false;
    const next = text.charAt(m[0].length);
    return !(next >= "가" && next <= "힣");
  }
  function groupByArticle(items) {
    const groups = []; let cur = null, inArticle = false, label = "";
    for (const it of items) {
      if (it.type === "table") { groups.push(inArticle ? { type: "table", rows: it.rows, cols: it.cols, grid: it.grid, article: label } : it); cur = null; }
      else if (headMatch(HEAD_RE, it.text)) { groups.push({ type: "para", text: it.text }); cur = null; inArticle = false; label = ""; }
      else if (headMatch(ARTICLE_RE, it.text)) { label = ARTICLE_RE.exec(it.text)[0].trim(); cur = { type: "para", text: it.text }; groups.push(cur); inArticle = true; }
      else if (cur) { cur.text += "\n" + it.text; }
      else if (inArticle) { cur = { type: "para", text: label + "\n" + it.text }; groups.push(cur); }
      else groups.push({ type: "para", text: it.text });
    }
    return groups;
  }
  function itemKey(it) { return it.type === "table" ? "\x02TBL\x02" + it.rows.map((r) => r.join("\x01")).join("\x01") : it.text; }

  // ── 표 셀 그리드 (병합 셀 지원) ──────────
  //  colspan/rowspan 을 반영한 2차원 그리드로 표를 표현한다.
  //    grid[r][c] = { text, cs, rs }  ← 병합의 시작(앵커) 칸
  //               | { cover:true }    ← 다른 칸의 병합에 가려진 자리
  //    rows        = 가려진 칸을 ""로 채운 정규 텍스트 행렬(행 정렬·키 비교용)
  //  → 모든 행의 열 수가 일정해져 열 단위 비교가 어긋나지 않고,
  //    렌더 시 cs/rs 로 colspan/rowspan 을 복원해 병합을 그대로 보여준다.
  function layoutGrid(tdRows) {
    const grid = [], occ = [];
    const isOcc = (r, c) => occ[r] && occ[r].has(c);
    const setOcc = (r, c) => (occ[r] = occ[r] || new Set()).add(c);
    for (let r = 0; r < tdRows.length; r++) {
      grid[r] = grid[r] || [];
      let c = 0;
      for (const cell of tdRows[r]) {
        while (isOcc(r, c) || grid[r][c]) c++;
        grid[r][c] = { text: cell.text, cs: cell.cs, rs: cell.rs };
        for (let dr = 0; dr < cell.rs; dr++)
          for (let dc = 0; dc < cell.cs; dc++) {
            if (dr === 0 && dc === 0) continue;
            const rr = r + dr, cc = c + dc;
            (grid[rr] = grid[rr] || [])[cc] = { cover: true };
            setOcc(rr, cc);
          }
        c += cell.cs;
      }
    }
    return grid;
  }
  function tableItemFromGrid(grid) {
    const cols = grid.reduce((m, row) => Math.max(m, row.length), 0);
    for (const row of grid) for (let c = 0; c < cols; c++) if (!row[c]) row[c] = { text: "", cs: 1, rs: 1 };
    const rows = grid.map((row) => row.map((cell) => (cell.cover ? "" : cell.text)));
    return { type: "table", grid, rows, cols };
  }
  // 병합 정보가 없는 파서(hwpx/md)용 — 각 칸을 1×1 앵커로 감싼다.
  function tableItemFromRows(rows) {
    return tableItemFromGrid(rows.map((r) => r.map((t) => ({ text: t == null ? "" : t, cs: 1, rs: 1 }))));
  }
  const spanAttr = (cell) => (cell.cs > 1 ? ' colspan="' + cell.cs + '"' : "") + (cell.rs > 1 ? ' rowspan="' + cell.rs + '"' : "");

  const TAGKEY = { 신설: "sin", 삭제: "del", 개정: "mod", 유지: "keep" };

  function computeRows(ops, unit) {
    return ops.map((o, idx) => {
      const base = { idx: idx + 1 };
      if ((o.old && o.old.type === "table") || (o.neu && o.neu.type === "table"))
        return Object.assign(base, computeTableRow(o, unit), { articleLabel: (o.old && o.old.article) || (o.neu && o.neu.article) || "" });
      const oldT = o.old ? o.old.text : null, newT = o.neu ? o.neu.text : null;
      if (o.type === "equal") return Object.assign(base, { tag: "유지", type: "equal", kind: "para", oldParts: [{ type: "eq", text: oldT }], newParts: [{ type: "eq", text: newT }] });
      if (o.type === "delete") return Object.assign(base, { tag: "삭제", type: "delete", kind: "para", oldParts: [{ type: "del", text: oldT }], newParts: null });
      if (o.type === "insert") return Object.assign(base, { tag: "신설", type: "insert", kind: "para", oldParts: null, newParts: [{ type: "ins", text: newT }] });
      if (unit === "para") return Object.assign(base, { tag: "개정", type: "modify", kind: "para", oldParts: [{ type: "del", text: oldT }], newParts: [{ type: "ins", text: newT }] });
      const r = buildParts(oldT, newT, unit);
      return Object.assign(base, { tag: "개정", type: "modify", kind: "para", oldParts: r.oldParts, newParts: r.newParts });
    });
  }
  // 렌더용 셀: 병합 앵커 { parts, cs, rs } | 가려진 자리 { cover:true }
  function rowFromGrid(gridRow, partType) {
    const rt = partType === "ins" ? "insert" : partType === "del" ? "delete" : "equal";
    return {
      rowType: rt,
      cells: gridRow.map((cell) =>
        cell.cover ? { cover: true } : { parts: [{ type: partType, text: cell.text }], cs: cell.cs, rs: cell.rs }),
    };
  }
  function gridPlain(tab, partType) {
    return tab.grid.map((row) => rowFromGrid(row, partType));
  }
  function gridFromText(text, partType) {
    const rt = partType === "ins" ? "insert" : "delete";
    return [{ rowType: rt, cells: [{ parts: [{ type: partType, text: text }], cs: 1, rs: 1 }] }];
  }
  // 한 셀의 old/new 텍스트를 비교해 해당 side 의 parts 를 만든다
  function diffCellParts(ot, nt, unit, side) {
    if (ot === nt) return [{ type: "eq", text: ot }];
    if (unit === "para") return side === "old" ? [{ type: "del", text: ot }] : [{ type: "ins", text: nt }];
    const pr = buildParts(ot, nt, unit);
    const parts = side === "old" ? pr.oldParts : pr.newParts;
    return parts.length ? parts : [{ type: "eq", text: "" }];
  }
  function diffTable(oldT, newT, unit) {
    const rowOps = alignIndices(oldT.rows.map((r) => r.join("\x01")), newT.rows.map((r) => r.join("\x01")));
    const oldGrid = [], newGrid = [];
    for (const op of rowOps) {
      if (op.type === "equal") {
        oldGrid.push(rowFromGrid(oldT.grid[op.ai], "eq"));
        newGrid.push(rowFromGrid(newT.grid[op.bi], "eq"));
      } else if (op.type === "delete") {
        oldGrid.push(rowFromGrid(oldT.grid[op.ai], "del"));
      } else if (op.type === "insert") {
        newGrid.push(rowFromGrid(newT.grid[op.bi], "ins"));
      } else {
        const orow = oldT.grid[op.ai], nrow = newT.grid[op.bi];
        const cols = Math.max(orow.length, nrow.length), oCells = [], nCells = [];
        for (let c = 0; c < cols; c++) {
          const oc = orow[c], nc = nrow[c];
          const ot = oc && !oc.cover ? oc.text : "", nt = nc && !nc.cover ? nc.text : "";
          if (oc) oCells.push(oc.cover ? { cover: true } : { parts: diffCellParts(ot, nt, unit, "old"), cs: oc.cs, rs: oc.rs });
          if (nc) nCells.push(nc.cover ? { cover: true } : { parts: diffCellParts(ot, nt, unit, "new"), cs: nc.cs, rs: nc.rs });
        }
        oldGrid.push({ rowType: "modify", cells: oCells });
        newGrid.push({ rowType: "modify", cells: nCells });
      }
    }
    return { oldGrid, newGrid };
  }
  function computeTableRow(o, unit) {
    const oTab = o.old && o.old.type === "table" ? o.old : null;
    const nTab = o.neu && o.neu.type === "table" ? o.neu : null;
    if (o.type === "equal") return { tag: "유지", type: "equal", kind: "table", oldGrid: gridPlain(oTab, "eq"), newGrid: gridPlain(nTab, "eq") };
    if (o.type === "insert") return { tag: "신설", type: "insert", kind: "table", oldGrid: null, newGrid: nTab ? gridPlain(nTab, "ins") : gridFromText(o.neu.text, "ins") };
    if (o.type === "delete") return { tag: "삭제", type: "delete", kind: "table", oldGrid: oTab ? gridPlain(oTab, "del") : gridFromText(o.old.text, "del"), newGrid: null };
    if (oTab && nTab) { const d = diffTable(oTab, nTab, unit); return { tag: "개정", type: "modify", kind: "table", oldGrid: d.oldGrid, newGrid: d.newGrid }; }
    return {
      tag: "개정", type: "modify", kind: "table",
      oldGrid: oTab ? gridPlain(oTab, "del") : gridFromText(o.old.text, "del"),
      newGrid: nTab ? gridPlain(nTab, "ins") : gridFromText(o.neu.text, "ins"),
    };
  }

  // ── 파싱: 현행 원본 파일 (DCT 포팅) ──────
  function docxTable(tableEl) {
    const trs = [...tableEl.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr, :scope > tr")];
    const tdRows = [];
    for (const tr of trs) {
      const cells = [...tr.children].filter((c) => /^(td|th)$/i.test(c.tagName)).map((td) => ({
        text: clean(td.textContent),
        cs: Math.max(1, parseInt(td.getAttribute("colspan"), 10) || 1),
        rs: Math.max(1, parseInt(td.getAttribute("rowspan"), 10) || 1),
      }));
      if (cells.length) tdRows.push(cells);
    }
    if (!tdRows.length) return null;
    return tableItemFromGrid(layoutGrid(tdRows));
  }
  async function parseDocx(file) {
    if (typeof mammoth === "undefined") throw new Error("docx 모듈 로딩 실패");
    const arrayBuffer = await file.arrayBuffer();
    const items = [];
    try {
      const r = await mammoth.convertToHtml({ arrayBuffer }, { convertImage: () => ({}) });
      const doc = new DOMParser().parseFromString(r.value, "text/html");
      const walk = (node) => {
        for (const el of node.children) {
          const tag = el.tagName.toLowerCase();
          if (tag === "table") { const t = docxTable(el); if (t) items.push(t); }
          else if (/^(ul|ol|div|section|article|header|footer|main)$/.test(tag)) { walk(el); }
          else { const t = clean(el.textContent); if (t) items.push({ type: "para", text: t }); }
        }
      };
      walk(doc.body);
    } catch (e) { /* raw 폴백 */ }
    if (items.length === 0) {
      const r = await mammoth.extractRawText({ arrayBuffer });
      for (const line of r.value.split(/\r?\n/)) { const t = clean(line); if (t) items.push({ type: "para", text: t }); }
    }
    return items;
  }
  function hwpxNearestTbl(el) { let p = el.parentNode; while (p) { if (p.localName === "tbl") return p; p = p.parentNode; } return null; }
  function hwpxCellText(tc) { return clean([...tc.getElementsByTagNameNS("*", "t")].map((t) => t.textContent).join("")); }
  function hwpxTable(tbl) {
    const rows = [];
    for (const tr of [...tbl.getElementsByTagNameNS("*", "tr")]) {
      if (hwpxNearestTbl(tr) !== tbl) continue;
      const cells = [];
      for (const tc of [...tr.getElementsByTagNameNS("*", "tc")]) {
        if (hwpxNearestTbl(tc) !== tbl) continue;
        cells.push(hwpxCellText(tc));
      }
      if (cells.length) rows.push(cells);
    }
    if (!rows.length) return null;
    return tableItemFromRows(rows);
  }
  function hwpxWalk(node, items) {
    for (const child of node.childNodes) {
      if (child.nodeType !== 1) continue;
      const ln = child.localName;
      if (ln === "tbl") { const t = hwpxTable(child); if (t) items.push(t); }
      else if (ln === "p") {
        if (child.getElementsByTagNameNS("*", "tbl").length) { hwpxWalk(child, items); }
        else { const text = hwpxCellText(child); if (text) items.push({ type: "para", text }); }
      } else { hwpxWalk(child, items); }
    }
  }
  async function parseHwpx(file) {
    if (typeof fflate === "undefined") throw new Error("한글(.hwpx) 모듈 로딩 실패");
    const buf = new Uint8Array(await file.arrayBuffer());
    const files = fflate.unzipSync(buf);
    const names = Object.keys(files)
      .filter((n) => /Contents\/section\d+\.xml$/i.test(n))
      .sort((a, b) => +a.match(/section(\d+)/i)[1] - +b.match(/section(\d+)/i)[1]);
    const items = [];
    for (const name of names) {
      const xml = fflate.strFromU8(files[name]);
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      hwpxWalk(doc.documentElement, items);
    }
    return items;
  }
  // .hwp — 한글 바이너리. ../dct/lib 에서 지연 로딩(전역 window.__hwpjs).
  let _hwpLib = null, _hwpLoading = null;
  function loadHwpLib() {
    if (_hwpLib) return Promise.resolve(_hwpLib);
    if (window.__hwpjs) { _hwpLib = window.__hwpjs; return Promise.resolve(_hwpLib); }
    if (_hwpLoading) return _hwpLoading;
    _hwpLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "../dct/lib/hwp.global.js"; s.async = true;
      s.onload = () => { if (window.__hwpjs) { _hwpLib = window.__hwpjs; resolve(_hwpLib); } else reject(new Error("한글(.hwp) 모듈 초기화 실패")); };
      s.onerror = () => reject(new Error("한글(.hwp) 모듈 로딩 실패"));
      document.head.appendChild(s);
    });
    return _hwpLoading;
  }
  async function parseHwp(file) {
    let mod;
    try { mod = await loadHwpLib(); } catch (e) { throw new Error("한글(.hwp) 모듈 로딩 실패"); }
    const parse = mod.parse || (mod.default && mod.default.parse) || mod.default;
    if (typeof parse !== "function") throw new Error("한글(.hwp) 파서를 찾지 못했어요");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const docu = parse(bytes, { type: "array" });
    const blocks = [];
    for (const section of docu.sections || []) {
      for (const para of section.content || []) {
        let s = "";
        for (const ch of para.content || []) {
          if (ch && ch.type === 0 && typeof ch.value === "string") s += ch.value;
        }
        s = s.replace(/\s+/g, " ").trim();
        if (s) blocks.push(s);
      }
    }
    return blocks.map((t) => ({ type: "para", text: t }));
  }
  function mdInline(s) {
    return s
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/~~(.*?)~~/g, "$1");
  }
  function mdSplitRow(line) {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split(/\|/).map((c) => clean(mdInline(c.replace(/\\\|/g, "|"))));
  }
  const MD_SEP_RE = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;
  async function parseMd(file) {
    const text = await file.text();
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const items = []; let para = [];
    const flush = () => { if (para.length) { const t = clean(para.join(" ")); if (t) items.push({ type: "para", text: t }); para = []; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes("|") && i + 1 < lines.length && MD_SEP_RE.test(lines[i + 1])) {
        flush();
        const rows = [mdSplitRow(line)]; i++;
        while (i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].trim() !== "") { rows.push(mdSplitRow(lines[++i])); }
        items.push(tableItemFromRows(rows));
        continue;
      }
      if (line === "") { flush(); continue; }
      if (/^([-*_])\s*(\1\s*){2,}$/.test(line)) { flush(); continue; }
      const isBlock = /^(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/.test(line);
      if (isBlock) {
        flush();
        const t = clean(mdInline(line.replace(/^#{1,6}\s+/, "").replace(/^>\s?/, "").replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, "")));
        if (t) items.push({ type: "para", text: t });
      } else { para.push(mdInline(line)); }
    }
    flush();
    return items;
  }
  // .html·.htm — PPB 'HTML 저장' 결과물, .doc — PPB 'Word 저장'(Word용 HTML). 둘 다 HTML 문서라 DOMParser 로 읽는다.
  async function parseHtml(file) {
    const text = await file.text();
    // 옛 Word(.doc) 바이너리(CFB)는 HTML 이 아니라서 읽을 수 없다
    if (!/^\uFEFF?\s*</.test(text)) throw new Error("BINARY_DOC");
    const doc = new DOMParser().parseFromString(text.replace(/^\uFEFF/, ""), "text/html");
    // 스크립트·스타일과 PPB 장식 요소(아이콘 내비·목차 상자·숨김 조항)는 본문이 아니므로 제외
    doc.querySelectorAll("script,style,noscript,.pp-icon-nav,.pp-toc-box,.pp-sec-icons,.pp-hidden").forEach((el) => el.remove());
    doc.querySelectorAll("p").forEach((p) => { if (p.textContent.includes("목차를 클릭")) p.remove(); });
    const items = [];
    const walk = (node) => {
      for (const el of node.children) {
        const tag = el.tagName.toLowerCase();
        if (tag === "table") { const t = docxTable(el); if (t) items.push(t); }
        else if (/^(ul|ol|div|section|article|header|footer|main|nav)$/.test(tag)) { walk(el); }
        else { const t = clean(el.textContent); if (t) items.push({ type: "para", text: t }); }
      }
    };
    walk(doc.body);
    return items;
  }
  const PARSERS = { docx: parseDocx, hwpx: parseHwpx, hwp: parseHwp, md: parseMd, markdown: parseMd, html: parseHtml, htm: parseHtml, doc: parseHtml };

  // ── 개정안(new): PPB 미리보기 → items ────
  // #previewContent 를 문서 순서대로 걸어 문단/표 items 를 만든다. (docx walk 와 동일 규칙)
  function previewToItems() {
    const root = document.getElementById("previewContent");
    const items = [];
    if (!root) return items;
    const walk = (node) => {
      for (const el of node.children) {
        if (el.classList && el.classList.contains("pp-hidden")) continue;
        const tag = el.tagName.toLowerCase();
        if (tag === "table") { const t = docxTable(el); if (t) items.push(t); }
        else if (/^(ul|ol|div|section|article|header|footer|main|nav)$/.test(tag)) { walk(el); }
        else { const t = clean(el.textContent); if (t) items.push({ type: "para", text: t }); }
      }
    };
    walk(root);
    return items;
  }

  // ── 상태 ──────────────────────────────
  //  baseline = 불러온 시점의 문서 스냅샷(현행 기준). 파일을 불러오면 채워진다.
  const C = { old: null, new: null, baseline: null, ops: null, view: "changed", unit: "word", group: "article", title: "신구대조표", remarks: {}, edits: {}, deleted: {} };
  const visibleRows = (rows) => rows.filter((r) => !C.deleted[r.idx]);

  // 불러오기 완료 시 호출 — 현재 미리보기를 '현행 기준'으로 고정한다.
  function captureBaseline(name) {
    const items = previewToItems();
    C.baseline = { name: name || "불러온 원본", items: items, savedAt: Date.now() };
  }
  // 스냅샷 items 로 old/new 메타 객체 만들기
  function metaFromItems(name, items) {
    return { name: name, size: "-", items: items, paraN: items.filter((x) => x.type === "para").length, tableN: items.filter((x) => x.type === "table").length, kind: "ppb" };
  }

  function buildOps() {
    let O = C.old.items, N = C.new.items;
    if (C.group === "article") { O = groupByArticle(O); N = groupByArticle(N); }
    const idxOps = alignIndices(O.map(itemKey), N.map(itemKey));
    C.ops = idxOps.map((o) => ({ type: o.type, old: o.ai == null ? null : O[o.ai], neu: o.bi == null ? null : N[o.bi] }));
  }

  // ── 화면 렌더 ──────────────────────────
  function cellHtml(parts, side) {
    if (!parts) return '<span class="cmp-empty">' + (side === "old" ? "〈신설〉" : "〈삭제〉") + "</span>";
    return parts.map((p) => {
      if (p.type === "del") return '<span class="cmp-del">' + escBr(p.text) + "</span>";
      if (p.type === "ins") return '<span class="cmp-ins">' + escBr(p.text) + "</span>";
      return escBr(p.text);
    }).join("");
  }
  function gridHtml(grid, side) {
    if (!grid) return '<span class="cmp-empty">' + (side === "old" ? "〈신설〉" : "〈삭제〉") + "</span>";
    const tr = grid.map((row) => {
      const cls = row.rowType === "insert" ? ' class="trow-ins"' : row.rowType === "delete" ? ' class="trow-del"' : row.rowType === "modify" ? ' class="trow-mod"' : "";
      const tds = row.cells.map((c) => (c.cover ? "" : "<td" + spanAttr(c) + ">" + cellHtml(c.parts) + "</td>")).join("");
      return "<tr" + cls + ">" + tds + "</tr>";
    }).join("");
    return '<table class="cmp-subtable"><tbody>' + tr + "</tbody></table>";
  }
  function gridPlainText(grid) {
    if (!grid) return "";
    return grid.map((row) => row.cells.filter((c) => !c.cover).map((c) => c.parts.map((p) => p.text).join("")).join(" | ")).join("\n");
  }

  function renderTable() {
    const rows = computeRows(C.ops, C.unit);
    const stats = { 신설: 0, 삭제: 0, 개정: 0 };
    for (const r of rows) { if (C.deleted[r.idx]) continue; if (r.type === "insert") stats.신설++; else if (r.type === "delete") stats.삭제++; else if (r.type === "modify") stats.개정++; }
    const chips = document.getElementById("cmpChips");
    if (chips) chips.innerHTML =
      '<span class="cmp-chip add">신설 ' + stats.신설 + '</span><span class="cmp-chip del">삭제 ' + stats.삭제 + '</span><span class="cmp-chip mod">개정 ' + stats.개정 + "</span>";
    const changed = stats.신설 + stats.삭제 + stats.개정;
    const noted = document.getElementById("cmpNoted");
    if (noted) { if (changed === 0) { noted.hidden = false; noted.textContent = "두 문서의 내용이 같습니다. 변경된 부분이 없습니다."; } else noted.hidden = true; }
    const vis = visibleRows(C.view === "changed" ? rows.filter((r) => r.tag !== "유지") : rows);
    const tb = document.getElementById("cmpTbody");
    if (!tb) return;
    if (!vis.length) { tb.innerHTML = '<tr><td class="c-gut">–</td><td colspan="3" class="cmp-empty" style="text-align:center;padding:24px">표시할 행이 없습니다.</td></tr>'; return; }
    tb.innerHTML = vis.map((r, i) => {
      const remark = esc(C.remarks[r.idx] || "");
      const tlbl = r.articleLabel ? '<span class="cmp-rownum">' + esc(r.articleLabel) + "</span>" : "";
      const ed = C.edits[r.idx] || {};
      const oldHtml = ed.old != null ? escBr(ed.old) : (r.kind === "table" ? (r.oldGrid ? tlbl : "") + gridHtml(r.oldGrid, "old") : cellHtml(r.oldParts, "old"));
      const newHtml = ed.new != null ? escBr(ed.new) : (r.kind === "table" ? (r.newGrid ? tlbl : "") + gridHtml(r.newGrid, "new") : cellHtml(r.newParts, "new"));
      return '<tr class="row-' + r.type + '"><td class="c-gut"><span class="cmp-rownum">' + (i + 1) + '</span><span class="cmp-tag t-' + TAGKEY[r.tag] + '">' + r.tag + "</span>" +
        '<button class="cmp-rowdel" data-del="' + r.idx + '" title="행 삭제" aria-label="행 삭제">✕</button></td>' +
        "<td contenteditable=\"true\" data-cell=\"old\" data-idx=\"" + r.idx + "\">" + oldHtml + "</td>" +
        "<td contenteditable=\"true\" data-cell=\"new\" data-idx=\"" + r.idx + "\">" + newHtml + "</td>" +
        '<td class="c-remark" contenteditable="true" data-remark="' + r.idx + '">' + remark + "</td></tr>";
    }).join("");
  }

  // ── 내보내기 ──────────────────────────
  function partsToHtmlInline(parts, side) {
    if (!parts) return '<span style="color:#9298b0;font-style:italic">' + (side === "old" ? "〈신설〉" : "〈삭제〉") + "</span>";
    return parts.map((p) => {
      if (p.type === "del") return '<span style="color:#d94040;background:#fff0f0;text-decoration:line-through">' + escBr(p.text) + "</span>";
      if (p.type === "ins") return '<span style="color:#3d5af1;background:#eef1fe;text-decoration:underline">' + escBr(p.text) + "</span>";
      return escBr(p.text);
    }).join("");
  }
  function gridHtmlInline(grid, side) {
    if (!grid) return '<span style="color:#9298b0;font-style:italic">' + (side === "old" ? "〈신설〉" : "〈삭제〉") + "</span>";
    const tr = grid.map((row) => {
      const tds = row.cells.map((c) => (c.cover ? "" : '<td' + spanAttr(c) + ' style="border:1px solid #e0e4ef;padding:5px 8px;vertical-align:top">' + partsToHtmlInline(c.parts) + "</td>")).join("");
      return "<tr>" + tds + "</tr>";
    }).join("");
    return '<table style="border-collapse:collapse;width:100%;font-size:13px">' + tr + "</table>";
  }
  function cellExportHtml(r, side) {
    const ed = C.edits[r.idx];
    if (ed && ed[side] != null) return escBr(ed[side]);
    if (r.kind === "table") {
      const g = side === "old" ? r.oldGrid : r.newGrid;
      const elbl = g && r.articleLabel ? '<div style="font-size:11px;color:#9298b0;margin-bottom:4px">' + esc(r.articleLabel) + "</div>" : "";
      return elbl + gridHtmlInline(g, side);
    }
    return partsToHtmlInline(side === "old" ? r.oldParts : r.newParts, side);
  }
  function buildExportHtml(rows, title, oldName, newName, full) {
    const tr = rows.map((r, i) => {
      const tc = { 신설: "#3d5af1", 삭제: "#d94040", 개정: "#00b896", 유지: "#9298b0" }[r.tag];
      const remark = esc(C.remarks[r.idx] || "");
      return '<tr style="page-break-inside:avoid">' +
        '<td style="border:1px solid #e0e4ef;padding:8px 10px;text-align:center;font-size:11px;color:#9298b0;vertical-align:top;white-space:nowrap">' + (i + 1) + '<br><span style="color:' + tc + ';font-weight:700">' + r.tag + "</span></td>" +
        '<td style="border:1px solid #e0e4ef;padding:8px 12px;vertical-align:top;line-height:1.7;width:40%">' + cellExportHtml(r, "old") + "</td>" +
        '<td style="border:1px solid #e0e4ef;padding:8px 12px;vertical-align:top;line-height:1.7;width:40%">' + cellExportHtml(r, "new") + "</td>" +
        '<td style="border:1px solid #e0e4ef;padding:8px 12px;vertical-align:top;line-height:1.7;width:14%;color:#4a4e55">' + remark + "</td></tr>";
    }).join("");
    const table = '<table style="border-collapse:collapse;width:100%;font-family:-apple-system,BlinkMacSystemFont,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;font-size:14px;color:#1a1d2e">' +
      "<thead><tr>" +
      '<th style="border:1px solid #e0e4ef;background:#f1f3f8;padding:10px;font-size:13px;color:#4a5068">구분</th>' +
      '<th style="border:1px solid #e0e4ef;background:#f1f3f8;padding:10px;font-size:13px;color:#4a5068">현행</th>' +
      '<th style="border:1px solid #e0e4ef;background:#f1f3f8;padding:10px;font-size:13px;color:#4a5068">개정안</th>' +
      '<th style="border:1px solid #e0e4ef;background:#f1f3f8;padding:10px;font-size:13px;color:#4a5068">비고</th>' +
      "</tr></thead><tbody>" + tr + "</tbody></table>";
    if (!full) return table;
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>' + esc(title) + "</title></head>" +
      '<body style="margin:40px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif">' +
      '<h1 style="font-size:24px;font-weight:700;letter-spacing:-.02em;color:#1a1d2e">' + esc(title) + "</h1>" +
      '<p style="color:#9298b0;font-size:13px">현행: ' + esc(oldName) + " · 개정안: " + esc(newName) + "</p>" +
      table + "</body></html>";
  }
  function doDownload() {
    const rows = visibleRows(computeRows(C.ops, C.unit));
    const vis = C.view === "changed" ? rows.filter((r) => r.tag !== "유지") : rows; // 화면의 전체/변경만 선택을 그대로 반영
    const html = buildExportHtml(vis, C.title, C.old.name, C.new.name, true);
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a"); a.href = url; a.download = (C.title || "신구대조표") + ".html"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function doCopy() {
    const rows = visibleRows(computeRows(C.ops, C.unit));
    const html = buildExportHtml(rows, C.title, C.old.name, C.new.name, false);
    const sideText = (r, side) => {
      const ed = C.edits[r.idx];
      if (ed && ed[side] != null) return ed[side];
      if (r.kind === "table") { const g = side === "old" ? r.oldGrid : r.newGrid; if (!g) return side === "old" ? "(신설)" : "(삭제)"; return (r.articleLabel ? r.articleLabel + "\n" : "") + gridPlainText(g); }
      const parts = side === "old" ? r.oldParts : r.newParts; return parts ? parts.map((p) => p.text).join("") : side === "old" ? "(신설)" : "(삭제)";
    };
    const plain = rows.map((r) => { const rm = C.remarks[r.idx] ? " | 비고: " + C.remarks[r.idx] : ""; return "[" + r.tag + "] " + sideText(r, "old") + "  ⇒  " + sideText(r, "new") + rm; }).join("\n");
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
      if (typeof showToast === "function") showToast("📋 대조표가 복사되었습니다.", "success");
    } catch (e) {
      try { await navigator.clipboard.writeText(plain); if (typeof showToast === "function") showToast("📋 대조표가 복사되었습니다.", "success"); }
      catch (e2) { if (typeof showToast === "function") showToast("⚠️ 복사가 차단됐어요. 'HTML 저장'을 이용해 주세요.", "error"); }
    }
  }
  const XL_LINE = { style: "thin", color: { argb: "FFE0E4EF" } };
  const xlBorder = () => ({ top: XL_LINE, left: XL_LINE, bottom: XL_LINE, right: XL_LINE });
  function partsToRich(parts, side) {
    if (!parts) return { richText: [{ text: side === "old" ? "〈신설〉" : "〈삭제〉", font: { italic: true, color: { argb: "FF9298B0" } } }] };
    const runs = parts.filter((p) => p.text !== "").map((p) => {
      if (p.type === "del") return { text: p.text, font: { color: { argb: "FFD94040" }, strike: true } };
      if (p.type === "ins") return { text: p.text, font: { color: { argb: "FF3D5AF1" }, underline: true } };
      return { text: p.text, font: { color: { argb: "FF1A1D2E" } } };
    });
    return runs.length ? { richText: runs } : "";
  }
  function gridToRich(grid, side, label) {
    if (!grid) return { richText: [{ text: side === "old" ? "〈신설〉" : "〈삭제〉", font: { italic: true, color: { argb: "FF9298B0" } } }] };
    const runs = [];
    if (label) runs.push({ text: label + "\n", font: { color: { argb: "FF9298B0" } } });
    grid.forEach((row, ri) => {
      if (ri) runs.push({ text: "\n" });
      let first = true;
      row.cells.forEach((cell) => {
        if (cell.cover) return;
        if (!first) runs.push({ text: " | ", font: { color: { argb: "FF9298B0" } } });
        first = false;
        for (const p of cell.parts) {
          if (p.text === "") continue;
          if (p.type === "del") runs.push({ text: p.text, font: { color: { argb: "FFD94040" }, strike: true } });
          else if (p.type === "ins") runs.push({ text: p.text, font: { color: { argb: "FF3D5AF1" }, underline: true } });
          else runs.push({ text: p.text, font: { color: { argb: "FF1A1D2E" } } });
        }
      });
    });
    return runs.length ? { richText: runs } : "";
  }
  async function doXlsx() {
    if (typeof ExcelJS === "undefined") { if (typeof showToast === "function") showToast("⚠️ 엑셀 모듈을 불러오지 못했어요.", "error"); return; }
    const rows = visibleRows(computeRows(C.ops, C.unit));
    const vis = C.view === "changed" ? rows.filter((r) => r.tag !== "유지") : rows;
    const TAGCOLOR = { 신설: "FF3D5AF1", 삭제: "FFD94040", 개정: "FF00B896", 유지: "FF9298B0" };
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("신구대조표", { views: [{ state: "frozen", ySplit: 1 }] });
      ws.columns = [
        { header: "번호", key: "no", width: 6 }, { header: "구분", key: "tag", width: 9 },
        { header: "현행", key: "old", width: 52 }, { header: "개정안", key: "new", width: 52 },
        { header: "비고", key: "remark", width: 24 },
      ];
      ws.getRow(1).height = 22;
      ws.getRow(1).eachCell((c) => {
        c.font = { bold: true, color: { argb: "FF4A5068" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F3F8" } };
        c.alignment = { vertical: "middle", horizontal: "center" };
        c.border = xlBorder();
      });
      vis.forEach((r, i) => {
        const ed = C.edits[r.idx] || {};
        const oldVal = ed.old != null ? ed.old : r.kind === "table" ? gridToRich(r.oldGrid, "old", r.articleLabel) : partsToRich(r.oldParts, "old");
        const newVal = ed.new != null ? ed.new : r.kind === "table" ? gridToRich(r.newGrid, "new", r.articleLabel) : partsToRich(r.newParts, "new");
        const row = ws.addRow({ no: i + 1, tag: r.tag, old: oldVal, new: newVal, remark: C.remarks[r.idx] || "" });
        row.getCell("no").alignment = { vertical: "top", horizontal: "center" };
        const tc = row.getCell("tag"); tc.alignment = { vertical: "top", horizontal: "center" }; tc.font = { bold: true, color: { argb: TAGCOLOR[r.tag] } };
        row.getCell("old").alignment = { vertical: "top", wrapText: true };
        row.getCell("new").alignment = { vertical: "top", wrapText: true };
        row.getCell("remark").alignment = { vertical: "top", wrapText: true };
        row.eachCell({ includeEmpty: true }, (c) => { c.border = xlBorder(); });
      });
      ws.autoFilter = "A1:E1";
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = (C.title || "신구대조표") + ".xlsx"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { console.error(e); if (typeof showToast === "function") showToast("⚠️ 엑셀 저장에 실패했어요.", "error"); }
  }

  // ── 오버레이 진입/제어 ──────────────────
  function setStage(stage) {
    // stage: "upload" | "result"
    document.getElementById("cmpUploadStage").hidden = stage !== "upload";
    document.getElementById("cmpResultStage").hidden = stage !== "result";
  }
  function updateOldPanel() {
    const el = document.getElementById("cmpOldInfo");
    if (!el) return;
    if (C.old) {
      el.innerHTML = '<span class="cmp-file-ok">📄 ' + esc(C.old.name) + "</span>" +
        '<span class="cmp-file-sub">문단 ' + C.old.paraN + "개" + (C.old.tableN ? " · 표 " + C.old.tableN + "개" : "") + " · " + C.old.size + "</span>";
    } else {
      el.innerHTML = '<span class="cmp-file-hint">현행(고객사 기존) 처리방침 파일을 올려 주세요</span>';
    }
    const btn = document.getElementById("cmpGenBtn");
    if (btn) btn.disabled = !C.old;
  }
  async function handleOldFile(file) {
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop();
    if (!PARSERS[ext]) { if (typeof showToast === "function") showToast("⚠️ .docx · .hwp · .hwpx · .md · .html 파일만 지원합니다.", "error"); return; }
    const info = document.getElementById("cmpOldInfo");
    if (info) info.innerHTML = '<span class="cmp-file-sub">읽는 중…</span>';
    try {
      const items = await PARSERS[ext](file);
      if (!items.length) { if (typeof showToast === "function") showToast("⚠️ 문서에서 읽을 내용을 찾지 못했어요.", "error"); }
      C.old = { name: file.name, size: fmtSize(file.size), items, paraN: items.filter((x) => x.type === "para").length, tableN: items.filter((x) => x.type === "table").length, kind: ext };
    } catch (err) {
      console.error(err);
      if (typeof showToast === "function") {
        if (err && err.message === "BINARY_DOC") showToast("⚠️ 옛 Word(.doc) 바이너리 파일은 읽을 수 없어요. .docx로 저장한 뒤 올려 주세요.", "error");
        else showToast("⚠️ 문서를 읽지 못했어요. 손상되지 않은 파일인지 확인해 주세요.", "error");
      }
      C.old = null;
    }
    updateOldPanel();
  }
  function refreshNewFromPreview() {
    const items = previewToItems();
    C.new = { name: (S && S.companyName ? S.companyName + " " : "") + "개정안 (PPB)", size: "-", items, paraN: items.filter((x) => x.type === "para").length, tableN: items.filter((x) => x.type === "table").length, kind: "ppb" };
    return items.length;
  }
  function generate() {
    if (!C.old) return;
    refreshNewFromPreview();
    if (!C.new.items.length) { if (typeof showToast === "function") showToast("⚠️ 개정안(미리보기)이 비어 있습니다. 18단계를 먼저 채워 주세요.", "error"); return; }
    buildOps();
    document.getElementById("cmpSrcOld").textContent = C.old.name;
    document.getElementById("cmpSrcNew").textContent = C.new.name;
    setStage("result");
    renderTable();
  }

  function openCompare() {
    let ov = document.getElementById("cmpOverlay");
    if (!ov) ov = buildOverlay();
    ov.style.display = "flex";
    const newCount = refreshNewFromPreview();

    // 기준(현행) 스냅샷이 있으면 → 불러온 원본 ↔ 현재 편집본을 바로 대조
    if (C.baseline && C.baseline.items && C.baseline.items.length) {
      if (!newCount) {
        setStage("upload");
        updateOldPanel();
        const warn = document.getElementById("cmpNewWarn");
        if (warn) warn.hidden = false;
        return;
      }
      C.old = metaFromItems(C.baseline.name + " (불러온 원본)", C.baseline.items);
      C.remarks = {}; C.edits = {}; C.deleted = {};
      buildOps();
      document.getElementById("cmpSrcOld").textContent = C.old.name;
      document.getElementById("cmpSrcNew").textContent = "현재 편집본";
      setStage("result");
      renderTable();
      return;
    }

    // 기준 스냅샷이 없으면(신규 생성 등) → 현행 파일을 직접 업로드해 비교
    setStage("upload");
    updateOldPanel();
    const warn = document.getElementById("cmpNewWarn");
    if (warn) warn.hidden = newCount > 0;
  }
  function closeCompare() {
    const ov = document.getElementById("cmpOverlay");
    if (ov) ov.style.display = "none";
  }

  function seg(id, opts, active) {
    return '<div class="cmp-seg" id="' + id + '">' + opts.map((o) => '<button data-v="' + o.v + '"' + (o.v === active ? ' class="active"' : "") + ">" + o.label + "</button>").join("") + "</div>";
  }

  function buildOverlay() {
    injectStyle();
    const ov = document.createElement("div");
    ov.id = "cmpOverlay";
    ov.className = "cmp-overlay";
    ov.innerHTML =
      '<div class="cmp-modal">' +
      // 헤더
      '<div class="cmp-head">' +
        '<div class="cmp-head-title">🔀 신구대조표 <span class="cmp-head-sub">현행(고객사 원본) ↔ 개정안(PPB)</span></div>' +
        '<button class="cmp-x" id="cmpClose" aria-label="닫기">✕</button>' +
      "</div>" +
      // 업로드 단계
      '<div class="cmp-body" id="cmpUploadStage">' +
        '<p class="cmp-lead">불러온 원본이 없어 현행 문서를 직접 올려야 합니다. 고객사 기존 처리방침 파일을 올리면 현재 편집본과의 차이를 대조표로 보여줍니다.<br><span style="color:#9298b0">※ PPB로 만든 파일을 <b>📂 불러오기</b>로 열면, 그 문서가 자동으로 현행 기준이 되어 이 단계가 생략됩니다.</span></p>' +
        '<div class="cmp-newwarn" id="cmpNewWarn" hidden>⚠️ 지금 미리보기(개정안)가 비어 있습니다. 왼쪽 18단계를 채운 뒤 진행하세요.</div>' +
        '<div class="cmp-drop" id="cmpDrop" tabindex="0">' +
          '<div class="cmp-drop-inner">📄<div>여기로 <b>.docx · .hwp · .hwpx · .md · .html</b> 파일을 끌어다 놓거나 클릭</div></div>' +
        "</div>" +
        '<div class="cmp-oldinfo" id="cmpOldInfo"></div>' +
        '<input type="file" id="cmpFileInput" accept=".docx,.doc,.hwp,.hwpx,.md,.markdown,.html,.htm" style="display:none" />' +
        '<div class="cmp-actions">' +
          '<button class="btn cmp-primary" id="cmpGenBtn" disabled>대조표 만들기 →</button>' +
        "</div>" +
        '<p class="cmp-hint">모든 처리는 브라우저 안에서만 이루어지며 서버로 전송되지 않습니다.</p>' +
      "</div>" +
      // 결과 단계
      '<div class="cmp-body cmp-result" id="cmpResultStage" hidden>' +
        '<div class="cmp-rhead">' +
          '<input class="cmp-doctitle" id="cmpTitle" value="신구대조표" aria-label="표 제목" />' +
          '<div class="cmp-chips" id="cmpChips"></div>' +
        "</div>" +
        '<div class="cmp-srcbar"><span class="cmp-src"><i>현행</i> <b id="cmpSrcOld"></b></span> ⇄ <span class="cmp-src"><i>개정</i> <b id="cmpSrcNew"></b></span></div>' +
        '<div class="cmp-toolbar">' +
          '<div class="cmp-controls">' +
            seg("cmpSegView", [{ v: "all", label: "전체" }, { v: "changed", label: "변경만" }], "changed") +
            seg("cmpSegGroup", [{ v: "article", label: "조 단위" }, { v: "para", label: "문단 단위" }], "article") +
            seg("cmpSegUnit", [{ v: "para", label: "단락" }, { v: "word", label: "어절" }, { v: "char", label: "글자" }], "word") +
          "</div>" +
          '<div class="cmp-tools">' +
            '<button class="btn btn-ghost" id="cmpBtnBack">📄 현행 파일로 비교</button>' +
            '<button class="btn btn-ghost" id="cmpBtnPrint">🖨 인쇄</button>' +
            '<button class="btn btn-ghost" id="cmpBtnXlsx">📊 엑셀</button>' +
            '<button class="btn btn-ghost" id="cmpBtnDl">⬇ HTML</button>' +
            '<button class="btn btn-ghost" id="cmpBtnCopy">📋 복사</button>' +
          "</div>" +
        "</div>" +
        '<div class="cmp-noted" id="cmpNoted" hidden></div>' +
        '<div class="cmp-table-wrap"><table class="cmp-table"><thead><tr><th class="c-gut">구분</th><th>현행</th><th>개정안</th><th class="c-remark">비고</th></tr></thead><tbody id="cmpTbody"></tbody></table></div>' +
      "</div>" +
      "</div>";
    document.body.appendChild(ov);

    // 이벤트 배선
    const $ = (id) => document.getElementById(id);
    $("cmpClose").onclick = closeCompare;
    ov.addEventListener("click", (e) => { if (e.target === ov) closeCompare(); });
    const drop = $("cmpDrop"), input = $("cmpFileInput");
    drop.addEventListener("click", () => input.click());
    drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleOldFile(f); });
    input.addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) handleOldFile(f); e.target.value = ""; });
    $("cmpGenBtn").onclick = generate;
    $("cmpBtnBack").onclick = () => setStage("upload");
    $("cmpBtnPrint").onclick = () => window.print();
    $("cmpBtnXlsx").onclick = doXlsx;
    $("cmpBtnDl").onclick = doDownload;
    $("cmpBtnCopy").onclick = doCopy;
    $("cmpTitle").oninput = (e) => { C.title = e.target.value; };

    const setActive = (id, btn) => document.querySelectorAll("#" + id + " button").forEach((x) => x.classList.toggle("active", x === btn));
    document.querySelectorAll("#cmpSegView button").forEach((b) => (b.onclick = () => { C.view = b.dataset.v; setActive("cmpSegView", b); renderTable(); }));
    document.querySelectorAll("#cmpSegGroup button").forEach((b) => (b.onclick = () => { C.group = b.dataset.v; setActive("cmpSegGroup", b); buildOps(); renderTable(); }));
    document.querySelectorAll("#cmpSegUnit button").forEach((b) => (b.onclick = () => { C.unit = b.dataset.v; setActive("cmpSegUnit", b); renderTable(); }));

    const tb = $("cmpTbody");
    tb.addEventListener("input", (e) => {
      const remarkCell = e.target.closest("[data-remark]");
      if (remarkCell) { C.remarks[+remarkCell.getAttribute("data-remark")] = remarkCell.textContent; return; }
      const cell = e.target.closest("[data-cell]");
      if (cell) { const idx = +cell.getAttribute("data-idx"), side = cell.getAttribute("data-cell"); if (!C.edits[idx]) C.edits[idx] = {}; C.edits[idx][side] = cell.innerText; }
    });
    tb.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del]");
      if (!btn) return;
      C.deleted[+btn.getAttribute("data-del")] = true;
      renderTable();
    });
    return ov;
  }

  function injectStyle() {
    if (document.getElementById("cmpStyle")) return;
    const st = document.createElement("style");
    st.id = "cmpStyle";
    st.textContent = `
.cmp-overlay{position:fixed;inset:0;background:rgba(20,22,34,.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;font-family:'Noto Sans KR',sans-serif}
.cmp-modal{background:#fff;border-radius:14px;width:min(1180px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.34)}
.cmp-head{display:flex;align-items:center;gap:12px;padding:16px 22px;border-bottom:1px solid #eceef4;flex:0 0 auto}
.cmp-head-title{font-size:16px;font-weight:800;color:#1a1d2e}
.cmp-head-sub{font-size:12px;font-weight:500;color:#9298b0;margin-left:6px}
.cmp-x{margin-left:auto;border:none;background:#f1f3f8;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:14px;color:#555}
.cmp-x:hover{background:#e6e8f0}
.cmp-body{padding:22px;overflow:auto}
.cmp-lead{font-size:13px;color:#555;line-height:1.7;margin-bottom:14px}
.cmp-newwarn{background:#fff6e5;border:1px solid #f4d79a;color:#8a6100;font-size:12.5px;padding:10px 14px;border-radius:9px;margin-bottom:14px}
.cmp-drop{border:2px dashed #cfd3e2;border-radius:12px;padding:34px 20px;text-align:center;cursor:pointer;color:#7b8194;transition:.15s;background:#fafbff}
.cmp-drop:hover,.cmp-drop.over{border-color:#3d5af1;color:#3d5af1;background:#f2f5ff}
.cmp-drop-inner{font-size:26px;display:flex;flex-direction:column;gap:8px;align-items:center}
.cmp-drop-inner div{font-size:13px}
.cmp-oldinfo{margin-top:14px;min-height:20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cmp-file-ok{font-size:13px;font-weight:700;color:#1a1d2e}
.cmp-file-sub{font-size:12px;color:#9298b0}
.cmp-file-hint{font-size:12.5px;color:#b4b8c6}
.cmp-actions{margin-top:20px;text-align:center}
.cmp-primary{background:#3d5af1;color:#fff;padding:12px 28px;border-radius:9px;font-size:14px;font-weight:700;border:none;cursor:pointer}
.cmp-primary:hover:not(:disabled){background:#2f49d4}
.cmp-primary:disabled{opacity:.4;cursor:not-allowed}
.cmp-hint{margin-top:14px;text-align:center;font-size:11px;color:#b4b8c6}
.cmp-result{padding-top:16px}
.cmp-rhead{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:8px}
.cmp-doctitle{font-size:18px;font-weight:800;color:#1a1d2e;border:none;border-bottom:1.5px dashed transparent;padding:2px 2px;outline:none;min-width:180px}
.cmp-doctitle:hover,.cmp-doctitle:focus{border-bottom-color:#cfd3e2}
.cmp-chips{display:flex;gap:6px}
.cmp-chip{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px}
.cmp-chip.add{background:#eef1fe;color:#3d5af1}
.cmp-chip.del{background:#fff0f0;color:#d94040}
.cmp-chip.mod{background:#e6faf6;color:#00a488}
.cmp-srcbar{font-size:12px;color:#7b8194;margin-bottom:12px}
.cmp-src i{font-style:normal;color:#b4b8c6;margin-right:3px}
.cmp-toolbar{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px}
.cmp-controls,.cmp-tools{display:flex;gap:8px;flex-wrap:wrap}
.cmp-seg{display:inline-flex;border:1px solid #e0e4ef;border-radius:8px;overflow:hidden}
.cmp-seg button{border:none;background:#fff;padding:6px 12px;font-size:12px;cursor:pointer;color:#7b8194;border-left:1px solid #e0e4ef}
.cmp-seg button:first-child{border-left:none}
.cmp-seg button.active{background:#3d5af1;color:#fff}
.cmp-noted{background:#f1f3f8;color:#555;font-size:12.5px;padding:10px 14px;border-radius:9px;margin-bottom:12px}
.cmp-table-wrap{overflow:auto;border:1px solid #e8eaf2;border-radius:10px}
.cmp-table{border-collapse:collapse;width:100%;font-size:13px;color:#1a1d2e}
.cmp-table thead th{position:sticky;top:0;background:#f1f3f8;color:#4a5068;font-size:12px;font-weight:700;padding:9px 10px;border:1px solid #e0e4ef;z-index:1}
.cmp-table td{border:1px solid #e0e4ef;padding:8px 12px;vertical-align:top;line-height:1.7}
.cmp-table td.c-gut{text-align:center;white-space:nowrap;width:64px;color:#9298b0;background:#fafbff}
.cmp-table td.c-remark{width:14%}
.cmp-rownum{display:block;font-size:11px;color:#9298b0}
.cmp-tag{display:inline-block;margin-top:3px;font-size:10px;font-weight:800;padding:1px 6px;border-radius:5px}
.cmp-tag.t-sin{background:#eef1fe;color:#3d5af1}
.cmp-tag.t-del{background:#fff0f0;color:#d94040}
.cmp-tag.t-mod{background:#e6faf6;color:#00a488}
.cmp-tag.t-keep{background:#f1f3f8;color:#9298b0}
.cmp-rowdel{display:block;margin:6px auto 0;border:none;background:transparent;color:#c7ccdb;cursor:pointer;font-size:12px}
.cmp-rowdel:hover{color:#d94040}
.cmp-del{color:#d94040;background:#fff0f0;text-decoration:line-through}
.cmp-ins{color:#3d5af1;background:#eef1fe;text-decoration:underline}
.cmp-empty{color:#b4b8c6;font-style:italic}
.cmp-subtable{border-collapse:collapse;width:100%;font-size:12px}
.cmp-subtable td{border:1px solid #e8eaf2;padding:4px 7px}
@media print{body>*:not(.cmp-overlay){display:none!important}.cmp-overlay{position:static;background:#fff;padding:0;display:block!important}.cmp-modal{box-shadow:none;max-height:none;width:100%}.cmp-head,.cmp-toolbar,.cmp-srcbar,.cmp-x,.cmp-rowdel,.cmp-newwarn{display:none!important}.cmp-table thead th{position:static}}
`;
    document.head.appendChild(st);
  }

  // 전역 노출
  window.openCompare = openCompare;
  window.captureCompareBaseline = captureBaseline;
})();
