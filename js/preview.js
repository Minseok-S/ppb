// ════════════════════════════════════════
//  PREVIEW UPDATE
// ════════════════════════════════════════
function updatePreview() {
  readFields();
  document.getElementById("previewContent").innerHTML = buildPreview();
  // bind TOC scroll
  const panel = document.getElementById("previewPanel");
  document.querySelectorAll("#previewContent .pp-toc-link").forEach((a) => {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      const tid = this.getAttribute("href").replace("#", "");
      const target = document
        .getElementById("previewContent")
        .querySelector("#" + tid);
      if (target && panel) {
        const pr = panel.getBoundingClientRect(),
          tr = target.getBoundingClientRect();
        panel.scrollTo({
          top: panel.scrollTop + (tr.top - pr.top) - 20,
          behavior: "smooth",
        });
      }
    });
  });
}

// ════════════════════════════════════════
//  CELL MERGE HELPER
// ════════════════════════════════════════
function computeSpans(arr, keyFn) {
  const n = arr.length,
    span = new Array(n).fill(1),
    skip = new Array(n).fill(false);
  let i = 0;
  while (i < n) {
    const val = keyFn(i);
    if (!val) {
      i++;
      continue;
    }
    let s = 1;
    while (i + s < n && keyFn(i + s) === val) s++;
    span[i] = s;
    for (let k = 1; k < s; k++) skip[i + k] = true;
    i += s;
  }
  return { span, skip };
}

function buildCollectTable(arr, showBasis) {
  if (!arr.length || !arr.some((r) => r.category || r.purpose || r.items))
    return '<p style="color:#aaa;font-style:italic;font-size:12px;">← 항목을 추가해 주세요</p>';
  const bs = showBasis
    ? computeSpans(arr, (i) => arr[i].basis || "")
    : { span: [], skip: [] };
  const cs = computeSpans(arr, (i) => arr[i].category || "");
  const is = computeSpans(arr, (i) => arr[i].items || "");
  const rs = computeSpans(arr, (i) => arr[i].retention || "");
  let rows = arr
    .map((r, i) => {
      const bCell = showBasis
        ? bs.skip[i]
          ? ""
          : `<td class="c" style="vertical-align:middle;font-size:11px;" rowspan="${bs.span[i]}">${basisMap[r.basis] || r.basis || "-"}</td>`
        : "";
      const cCell = cs.skip[i]
        ? ""
        : `<td class="c" style="vertical-align:middle;" rowspan="${cs.span[i]}">${r.category || "-"}</td>`;
      const iCell = is.skip[i]
        ? ""
        : `<td class="c" style="vertical-align:middle;" rowspan="${is.span[i]}">${r.items || "-"}</td>`;
      const rCell =
        showBasis && !rs.skip[i]
          ? `<td class="c" style="vertical-align:middle;" rowspan="${rs.span[i]}">${r.retention || "-"}</td>`
          : !showBasis
            ? ""
            : rs.skip[i]
              ? ""
              : "";
      return `<tr>${bCell}${cCell}<td>${r.purpose || "-"}</td>${iCell}${showBasis ? rCell : ""}</tr>`;
    })
    .join("");
  const headers = showBasis
    ? '<th style="width:22%">법적 근거</th><th style="width:12%">구분</th><th style="width:28%">처리 목적</th><th style="width:24%">처리 항목</th><th style="width:14%">보유기간</th>'
    : '<th style="width:18%">구분</th><th style="width:40%">처리 목적</th><th style="width:42%">처리 항목</th>';
  return `<table class="pp-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildCollectOtherTable(arr) {
  if (!arr.length || !arr.some((r) => r.purpose || r.items))
    return '<p style="color:#aaa;font-style:italic;font-size:12px;">← 항목을 추가해 주세요</p>';
  return `<table class="pp-table">
  <thead><tr>
    <th style="width:22%">법적 근거</th>
    <th style="width:20%">수집 목적</th>
    <th style="width:28%">수집 항목</th>
    <th style="width:16%">제공하는 자 (선택)</th>
    <th style="width:14%">보유기간</th>
  </tr></thead>
  <tbody>${arr
    .map(
      (r) => `<tr>
    <td class="c" style="font-size:11px;vertical-align:middle;">${basisMap[r.basis] || r.basis || "-"}</td>
    <td>${r.purpose || "-"}</td>
    <td>${r.items || "-"}</td>
    <td class="c">${r.provider || "-"}</td>
    <td class="c">${r.retention || "-"}</td>
  </tr>`,
    )
    .join("")}</tbody>
</table>`;
}

// ════════════════════════════════════════
//  HELPER — table with rowspan merge on all columns independently
// ════════════════════════════════════════
function buildMergedTable(rows, cols) {
  if (!rows.length) return "";
  const n = rows.length, m = cols.length;
  const rsVal = Array.from({length: n}, () => Array(m).fill(1));
  const skip  = Array.from({length: n}, () => Array(m).fill(false));
  for (let c = 0; c < m; c++) {
    let r = 0;
    while (r < n) {
      const val = rows[r][cols[c].key] || "-";
      let span = 1;
      while (r + span < n && (rows[r + span][cols[c].key] || "-") === val) span++;
      rsVal[r][c] = span;
      for (let k = 1; k < span; k++) skip[r + k][c] = true;
      r += span;
    }
  }
  const thead = `<tr>${cols.map(col => `<th>${col.label}</th>`).join("")}</tr>`;
  const tbody = rows.map((row, r) =>
    `<tr>${cols.map((col, c) => {
      if (skip[r][c]) return "";
      const rs = rsVal[r][c] > 1 ? ` rowspan="${rsVal[r][c]}"` : "";
      const cls = col.cls ? ` class="${col.cls}"` : "";
      return `<td${rs}${cls}>${row[col.key] || "-"}</td>`;
    }).join("")}</tr>`
  ).join("");
  return `<table class="pp-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

// policy_cnt > policy_table scroll > table 구조 (행태정보용)
function buildPolicyTable(rows, cols, caption, wrapCnt) {
  if (!rows.length || !rows.some(r => Object.values(r).some(v => v))) return "";
  const n = rows.length, m = cols.length;
  const rsVal = Array.from({length: n}, () => Array(m).fill(1));
  const skip  = Array.from({length: n}, () => Array(m).fill(false));
  for (let c = 0; c < m; c++) {
    let r = 0;
    while (r < n) {
      const val = rows[r][cols[c].key] || "-";
      let span = 1;
      while (r + span < n && (rows[r + span][cols[c].key] || "-") === val) span++;
      rsVal[r][c] = span;
      for (let k = 1; k < span; k++) skip[r + k][c] = true;
      r += span;
    }
  }
  const colgroup = `<colgroup>${cols.map(() => "<col>").join("")}</colgroup>`;
  const thead = `<thead><tr>${cols.map(col => `<th>${col.label}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows.map((row, r) =>
    `<tr>${cols.map((col, c) => {
      if (skip[r][c]) return "";
      const rs = rsVal[r][c] > 1 ? ` rowspan="${rsVal[r][c]}"` : "";
      const cls = col.cls ? ` class="${col.cls}"` : "";
      return `<td${rs}${cls}>${row[col.key] || "-"}</td>`;
    }).join("")}</tr>`
  ).join("")}</tbody>`;
  const cap = caption ? `<caption>${caption}</caption>` : "";
  const table = `<table>${cap}${colgroup}${thead}${tbody}</table>`;
  const scroll = `<div class="policy_table scroll">${table}</div>`;
  return wrapCnt ? `<div class="policy_cnt">${scroll}</div>` : scroll;
}

// ════════════════════════════════════════
//  BUILD PREVIEW HTML
// ════════════════════════════════════════
function buildPreview() {
  const co = S.companyName || "개인정보처리자명";
  const svc = S.serviceName || "";
  const eff = S.effectiveDate || "YYYY. MM. DD";
  const alias = "회사";

  // Retention table
  const retMap = {
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
  const activeRet = Object.keys(S.retention)
    .filter((k) => S.retention[k])
    .map((k) => retMap[k]);
  const legalRet = [
    ...activeRet,
    ...(S.customRetentionLegal || []).filter((r) => r.label),
  ];
  const otherRet = (S.customRetentionOther || []).filter((r) => r.label);

  // Security
  const secMap = {
    s_plan: "내부 관리계획 수립·시행",
    s_edu: "정기적 직원 교육",
    s_org: "전담 조직 운영",
    s_access: "개인정보처리시스템 접근 권한의 관리 및 접근통제시스템 설치",
    s_encrypt: "개인정보의 암호화",
    s_sec: "보안프로그램 설치 및 갱신",
    s_log: "접속기록의 보관 및 점검",
    s_vuln: "개인정보처리시스템 취약점 점검 및 보완",
    s_phys: "전산실, 자료보관실 등의 접근통제",
    s_media: "보조저장매체 반출·입 통제",
    s_isms: "국내 정보보호 관리체계(ISMS-P) 인증 취득",
    s_isms_cert: "국내 정보보호 관리체계(ISMS) 인증 취득",
  };
  const secMgmt = ["s_plan", "s_edu", "s_org"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_mgmt_extra || []);
  const secTech = ["s_access", "s_encrypt", "s_sec", "s_log", "s_vuln"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_tech_extra || []);
  const secPhys = ["s_phys", "s_media"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_phys_extra || []);
  const secExtra = ["s_isms", "s_isms_cert"]
    .filter((k) => S.security[k])
    .map((k) => secMap[k])
    .concat(S.security.s_cert_extra || []);

  // Rights methods
  const rMap = {
    r_written: "서면",
    r_phone: "전화",
    r_email: "전자우편",
    r_fax: "팩스(FAX)",
    r_web: "인터넷",
  };
  const activeMethods = Object.keys(S.rights)
    .filter((k) => S.rights[k])
    .map((k) => rMap[k])
    .join(", ");

  // Browsers
  const bMap = {
    b_chrome: {
      n: "크롬(Chrome)",
      p: "웹브라우저 오른쪽 상단 '⋮' > 새 시크릿 창 (Ctrl+Shift+N)",
    },
    b_edge: {
      n: "엣지(Edge)",
      p: "웹브라우저 오른쪽 상단 '…' > 새 InPrivate 창 (Ctrl+Shift+N)",
    },
    b_chrome_m: {
      n: "크롬(Chrome)",
      p: "모바일 브라우저 오른쪽 상단 '⋮' > 새 시크릿 탭",
    },
    b_safari: {
      n: "사파리(Safari)",
      p: "모바일 기기 설정 > 사파리(Safari) > 고급 > 모든 쿠키 차단",
    },
    b_samsung: {
      n: "삼성 인터넷",
      p: "모바일 브라우저 아래쪽 '탭' 아이콘 > 비밀 모드 켜기 > 시작",
    },
  };
  const webBrowsers = ["b_chrome", "b_edge"].filter((k) => S.browser[k]);
  const mobileBrowsers = ["b_chrome_m", "b_safari", "b_samsung"].filter((k) => S.browser[k]);

  // Agencies
  const agMap = {
    ag_kopico: {
      n: "개인정보 분쟁조정위원회",
      u: "www.kopico.go.kr",
      t: "(국번없이) 1833-6972",
    },
    ag_kisa: {
      n: "개인정보침해 신고센터",
      u: "privacy.kisa.or.kr",
      t: "(국번없이) 118",
    },
    ag_spo: { n: "대검찰청", u: "www.spo.go.kr", t: "(국번없이) 1301" },
    ag_police: { n: "경찰청", u: "ecrm.police.go.kr", t: "(국번없이) 182" },
  };
  const activeAgencies = Object.keys(S.agency).filter((k) => S.agency[k]);

  // Icons — PIPC 공식 라벨링 스타일 (개인정보 유형=원형, 개인정보 처리=육각형, 법적의무=사각형)
  const CIRC = `circle cx="22" cy="22" r="20" fill="none" stroke="#1a56db" stroke-width="1.6"`;
  const HEX = `polygon points="22,2 38,11 38,33 22,42 6,33 6,11" fill="none" stroke="#1a56db" stroke-width="1.6" stroke-linejoin="round"`;
  const FOLDER = `path d="M12 20h5.5l2-2.5H32v12H12z" fill="#dbeafe" stroke="#1a56db" stroke-width="1.2" stroke-linejoin="round"`;
  const SQ = `rect x="2" y="2" width="40" height="40" rx="3" fill="none" stroke="#1a56db" stroke-width="1.6"`;
  const allCollected = [...(S.collectNoConsent||[]), ...(S.collectConsent||[]), ...(S.collectOther||[]), ...(S.collectAuto||[])].join(" ");
  const _유형 = [
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">👤</text></svg>`, l: "개인정보", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">📷</text></svg>`, l: "개인영상정보", show: allCollected.includes("영상") },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">🔴</text></svg>`, l: "민감정보", show: S.sensitive === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">🫁</text></svg>`, l: "생체인식정보", show: allCollected.includes("생체") || allCollected.includes("지문") || allCollected.includes("홍채") },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">📍</text></svg>`, l: "개인위치정보", show: allCollected.includes("위치") },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">🪪</text></svg>`, l: "고유식별정보", show: allCollected.includes("주민") || allCollected.includes("여권") || allCollected.includes("운전면허") || allCollected.includes("외국인등록") },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">🪪</text></svg>`, l: "주민등록번호", show: allCollected.includes("주민") },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">📘</text></svg>`, l: "여권번호", show: allCollected.includes("여권") },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">🚗</text></svg>`, l: "운전면허번호", show: allCollected.includes("운전면허") },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${CIRC}/><text x="22" y="27" text-anchor="middle" font-size="18">🌏</text></svg>`, l: "외국인등록번호", show: allCollected.includes("외국인등록") },
  ].filter(ic => ic.show);
  const _처리 = [
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><${FOLDER}/><circle cx="26" cy="23" r="2.8" fill="#f97316"/><path d="M21 31c0-2.8 2.2-5 5-5s5 2.2 5 5" fill="#f97316"/></svg>`, l: "처리항목", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><${FOLDER}/><path d="M22 23a5 5 0 0 1 4.5 3" fill="none" stroke="#f97316" stroke-width="1.4" stroke-linecap="round"/><polyline points="26,21.5 27,24.5 24,24" fill="none" stroke="#f97316" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 29a5 5 0 0 1-4.5-3" fill="none" stroke="#f97316" stroke-width="1.4" stroke-linecap="round"/><polyline points="22,30.5 21,27.5 24,28" fill="none" stroke="#f97316" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`, l: "처리목적", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><${FOLDER}/><circle cx="24" cy="25.5" r="4.5" fill="white" stroke="#f97316" stroke-width="1.3"/><polyline points="24,23 24,25.5 26.5,25.5" fill="none" stroke="#f97316" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`, l: "보유기간(설정)", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><text x="22" y="29" text-anchor="middle" font-size="18">🗑️</text></svg>`, l: "파기", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><text x="22" y="29" text-anchor="middle" font-size="18">➕</text></svg>`, l: "추가적 이용", show: S.addUsage === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><text x="22" y="29" text-anchor="middle" font-size="18">🔐</text></svg>`, l: "가명정보처리", show: S.pseudonym === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><circle cx="14" cy="18" r="3.5" fill="#dbeafe" stroke="#1a56db" stroke-width="1.2"/><path d="M8 29c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#1a56db" stroke-width="1.2" stroke-linecap="round"/><circle cx="30" cy="18" r="3.5" fill="#fff3e0" stroke="#f97316" stroke-width="1.2"/><path d="M24 29c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#f97316" stroke-width="1.2" stroke-linecap="round"/><line x1="19" y1="21.5" x2="25" y2="21.5" stroke="#f97316" stroke-width="1.3" stroke-linecap="round"/><polyline points="21,19.5 19,21.5 21,23.5" fill="none" stroke="#f97316" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="23,19.5 25,21.5 23,23.5" fill="none" stroke="#f97316" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`, l: "처리위탁", show: S.delegate === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><circle cx="14" cy="19" r="3.5" fill="#dbeafe" stroke="#1a56db" stroke-width="1.2"/><path d="M8 31c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#1a56db" stroke-width="1.2" stroke-linecap="round"/><line x1="21" y1="22" x2="28" y2="22" stroke="#f97316" stroke-width="1.4" stroke-linecap="round"/><polyline points="25.5,19.5 28,22 25.5,24.5" fill="none" stroke="#f97316" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="16" r="5" fill="#f97316"/><text x="32" y="19.5" text-anchor="middle" font-size="7.5" font-weight="bold" fill="white" font-family="Arial,sans-serif">3</text></svg>`, l: "제3자 제공", show: S.thirdParty === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><circle cx="19" cy="25" r="9" fill="#fff3e0" stroke="#f97316" stroke-width="1.3"/><path d="M19 16c-2 3-3 6-3 9s1 6 3 9" fill="none" stroke="#f97316" stroke-width="1.2" stroke-linecap="round"/><path d="M19 16c2 3 3 6 3 9s-1 6-3 9" fill="none" stroke="#f97316" stroke-width="1.2" stroke-linecap="round"/><line x1="10" y1="25" x2="28" y2="25" stroke="#f97316" stroke-width="1.2"/><line x1="11.5" y1="20" x2="26.5" y2="20" stroke="#f97316" stroke-width="1.2"/><circle cx="21" cy="17.5" r="2.5" fill="#1a56db"/><path d="M17.5 23c0-2 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5" fill="#1a56db"/><line x1="29" y1="21" x2="35" y2="21" stroke="#1a56db" stroke-width="1.5" stroke-linecap="round"/><polyline points="32.5,18.5 35,21 32.5,23.5" fill="none" stroke="#1a56db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`, l: "국외이전", show: S.overseas === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><${FOLDER}/><rect x="17" y="21.5" width="13" height="8" rx="1.5" fill="white" stroke="#f97316" stroke-width="1.3"/><text x="23.5" y="27.5" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#f97316" font-family="Arial,sans-serif">AI</text></svg>`, l: "자동화 수집", show: S.cookie === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${HEX}/><${FOLDER}/><circle cx="22" cy="26" r="5.5" fill="#f97316"/><circle cx="19.5" cy="25" r="2" fill="white"/><circle cx="24.5" cy="25" r="2" fill="white"/><path d="M19 28.5c0.5 1 1.5 1.5 3 1.5s2.5-0.5 3-1.5" fill="none" stroke="white" stroke-width="1" stroke-linecap="round"/></svg>`, l: "행태정보 수집", show: S.behavioral === "yes" },
  ].filter(ic => ic.show);
  const _의무 = [
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">⚖️</text></svg>`, l: "정보주체의 권리의무", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><rect x="10" y="9" width="20" height="25" rx="2" fill="#dbeafe" stroke="#1a56db" stroke-width="1.2"/><line x1="14" y1="15" x2="26" y2="15" stroke="#1a56db" stroke-width="1"/><line x1="14" y1="18" x2="26" y2="18" stroke="#1a56db" stroke-width="1"/><line x1="14" y1="21" x2="21" y2="21" stroke="#1a56db" stroke-width="1"/><circle cx="30" cy="29" r="7" fill="#f97316"/><rect x="26.5" y="29" width="7" height="5" rx="1" fill="white"/><path d="M27.5 29v-2.5a2.5 2.5 0 0 1 5 0V29" fill="none" stroke="white" stroke-width="1.3" stroke-linecap="round"/><circle cx="30" cy="31.5" r="1" fill="#f97316"/></svg>`, l: "안전성확보조치", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">📋</text></svg>`, l: "처리방침변경", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">🏅</text></svg>`, l: "개인정보보호인증", show: !!(S.security?.s_isms_cert) },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">📊</text></svg>`, l: "관리수준진단", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">👪</text></svg>`, l: "법정대리인", show: S.child === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">👨‍💼</text></svg>`, l: "개인정보보호책임자", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">🤝</text></svg>`, l: "국내대리인", show: S.domAgent === "yes" },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><circle cx="22" cy="15" r="5" fill="#dbeafe" stroke="#1a56db" stroke-width="1.2"/><path d="M12 35c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="none" stroke="#1a56db" stroke-width="1.2" stroke-linecap="round"/><path d="M16 17.5c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#f97316" stroke-width="1.4" stroke-linecap="round"/><rect x="14" y="17.5" width="3" height="5" rx="1.5" fill="#f97316"/><rect x="27" y="17.5" width="3" height="5" rx="1.5" fill="#f97316"/><path d="M30 22.5v1c0 1.7-1.3 3-3 3h-3" fill="none" stroke="#f97316" stroke-width="1.3" stroke-linecap="round"/></svg>`, l: "고충처리부서", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">🛡️</text></svg>`, l: "권익침해 구제", show: activeAgencies.length > 0 },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">📄</text></svg>`, l: "열람청구", show: true },
    { svg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><${SQ}/><text x="22" y="29" text-anchor="middle" font-size="18">📹</text></svg>`, l: "영상정보처리기기", show: allCollected.includes("영상") },
  ].filter(ic => ic.show);
  // 상단 카테고리 nav에 표시할 라벨 목록
  const NAV_LABELS = new Set([
    "개인정보","개인영상정보","민감정보","생체인식정보","개인위치정보",
    "고유식별정보","주민등록번호","여권번호","운전면허번호","외국인등록번호",
    "처리목적","보유기간(설정)","처리위탁","제3자 제공","국외이전","가명정보처리",
    "열람청구","영상정보처리기기",
  ]);
  // 섹션 헤딩 + 목차 공용 아이콘 매핑 (모든 라벨 → 섹션 key)
  const SEC_ICON_KEY = {
    "처리항목":       "collect",
    "처리목적":       "collect",
    "보유기간(설정)": "collect",
    "파기":           "destroy",
    "제3자 제공":     "tp",
    "처리위탁":       "delegate",
    "국외이전":       "overseas",
    "추가적 이용":    "adduse",
    "민감정보":       "sensitive",
    "가명정보처리":   "pseudo",
    "자동화 수집":    "cookie",
    "행태정보 수집":  "behavior",
    "정보주체의 권리의무": "rights",
    "열람청구":       "rights",
    "안전성확보조치": "security",
    "개인정보보호인증":"security",
    "관리수준진단":   "security",
    "처리방침변경":   "change",
    "법정대리인":     "child",
    "개인정보보호책임자": "cpo",
    "고충처리부서":   "cpo",
    "국내대리인":     "agent",
    "권익침해 구제":  "remedy",
  };
  const iconGroups = [
    { label: "개인정보 유형", items: _유형.filter(ic => NAV_LABELS.has(ic.l)) },
    { label: "개인정보 처리", items: _처리.filter(ic => NAV_LABELS.has(ic.l)) },
    { label: "법적의무사항 등", items: _의무.filter(ic => NAV_LABELS.has(ic.l)) },
  ].filter(g => g.items.length > 0);
  // 섹션 헤딩 + 목차 공용 아이콘 맵 { sectionKey: [icon, ...] }
  const secIconMap = {};
  [..._유형, ..._처리, ..._의무].forEach(ic => {
    const k = SEC_ICON_KEY[ic.l];
    if (k) { if (!secIconMap[k]) secIconMap[k] = []; secIconMap[k].push(ic); }
  });
  const tocIconMap = secIconMap;

  // Build TOC items — stable key, dynamic sequential numbering
  const tocItems = [
    { k: "collect", l: "개인정보의 처리 목적, 처리 항목, 보유 및 이용기간", show: true },
    { k: "child", l: "만 14세 미만 아동의 개인정보 처리", show: S.child === "yes", opt: true },
    { k: "destroy", l: "개인정보의 파기 절차 및 방법", show: true },
    { k: "tp", l: "개인정보의 제3자 제공", show: S.thirdParty === "yes", opt: true },
    { k: "delegate", l: "개인정보 처리업무의 위탁", show: S.delegate === "yes", opt: true },
    { k: "overseas", l: "개인정보의 국외 이전", show: S.overseas === "yes", opt: true },
    { k: "security", l: "개인정보의 안전성 확보 조치", show: true },
    { k: "adduse", l: "추가적인 이용·제공 판단 기준", show: S.addUsage === "yes", opt: true },
    { k: "sensitive", l: "민감정보의 공개 가능성 및 비공개 선택 방법", show: S.sensitive === "yes", opt: true },
    { k: "pseudo", l: "가명정보 처리에 관한 사항", show: S.pseudonym === "yes", opt: true },
    { k: "cookie", l: "개인정보 자동수집 장치의 설치·운영 및 거부", show: S.cookie === "yes", opt: true },
    { k: "behavior", l: "행태정보의 수집·이용·제공 및 거부", show: S.behavioral === "yes", opt: true },
    { k: "autodec", l: "자동화된 결정에 관한 사항", show: S.autoDecision === "yes", opt: true },
    { k: "rights", l: "정보주체와 법정대리인의 권리·의무 및 행사방법", show: true },
    { k: "cpo", l: "개인정보 보호책임자 및 고충처리 부서", show: true },
    { k: "remedy", l: "정보주체의 권익침해에 대한 구제방법", show: activeAgencies.length > 0 },
    { k: "agent", l: "국내대리인 지정", show: S.domAgent === "yes", opt: true },
    { k: "change", l: "개인정보 처리방침의 변경", show: true },
  ];
  const visibleToc = tocItems.filter((t) => t.show);
  // numMap: key → zero-padded sequential number string
  const numMap = {};
  visibleToc.forEach((t, i) => {
    numMap[t.k] = String(i + 1).padStart(2, "0");
  });
  // Helper: render section heading (skips if key not in numMap)
  const sec = (k, label, opt = false) => {
    if (!numMap[k]) return "";
    const icHtml = (secIconMap[k] || []).map(ic => `<span class="pp-sec-icon">${ic.svg}</span>`).join("");
    return (
      '<div id="pp-' + k + '" class="pp-sec">' +
      '<div class="pp-sec-num">' + numMap[k] + "</div>" +
      '<span class="pp-sec-label">' + label + (opt ? ' <span style="font-size:11px;color:#aaa;font-weight:400;"></span>' : "") + '</span>' +
      (icHtml ? `<div class="pp-sec-icons">${icHtml}</div>` : "") +
      "</div>"
    );
  };

  return `
<h2 class="pp-h2">${svc ? svc + " " : co + " "}개인정보 처리방침</h2>
<div class="pp-date-row"><div class="pp-date-badge">${eff} 시행</div></div>

<p class="pp-intro">${svc ? co + " " + svc : co}(이하 '${alias}')는(은) 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.</p>
<p class="pp-intro">이에 「개인정보 보호법」 제30조에 따라 정보주체에게 개인정보의 처리와 보호에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>

<div class="pp-icon-nav">
  ${iconGroups.flatMap(g => g.items).map(ic => `<div class="pp-icon-item"><div class="pp-icon-circle">${ic.svg}</div><div class="pp-icon-label">${ic.l}</div></div>`).join("")}
</div>


<p class="pp-sub-title">[ 목 차 ]</p>
<div class="pp-toc-box">
  <ul>${visibleToc
    .map((t, i) => {
      const n = numMap[t.k];
      const tocIcHtml = (tocIconMap[t.k] || []).map(ic => `<span class="pp-toc-icon">${ic.svg}</span>`).join("");
      return `<li><a href="#pp-${t.k}" class="pp-toc-link"><span class="pp-toc-num">${n}</span>${t.l}${tocIcHtml}${t.opt ? '<span class="pp-toc-opt"></span>' : ""}</a></li>`;
    })
    .join("")}</ul>
</div>
<p class="pp-intro" style="font-size:11px;color:#e87d31;margin-top:4px;">※ 목차를 클릭 시 해당 본문으로 이동됩니다.</p>

${sec("collect", "개인정보의 처리 목적, 처리 항목, 보유 및 이용기간")}
<p>${alias}는 「개인정보 보호법」에 따라 서비스 제공을 위해 필요 최소한의 범위에서 개인정보를 수집·이용합니다.</p>

${
  S.collectNoConsent.length > 0 &&
  S.collectNoConsent.some((r) => r.category || r.items)
    ? `
<p class="pp-sub-title">1. 정보주체의 동의 없이 처리하는 개인정보</p>
<p>${alias}는 다음의 개인정보 항목을 정보주체의 동의 없이 처리하고 있습니다.</p>
${buildCollectTable(S.collectNoConsent, true)}`
    : ""
}

${
  S.collectConsent.length > 0 &&
  S.collectConsent.some((r) => r.category || r.items)
    ? `
<p class="pp-sub-title">${S.collectNoConsent.length > 0 && S.collectNoConsent.some((r) => r.category || r.items) ? "2" : "1"}. 정보주체의 동의를 받아 처리하는 개인정보</p>
<p>${alias}는 다음의 개인정보 항목을 정보주체의 동의를 받아 처리하고 있습니다.</p>
${buildCollectTable(S.collectConsent, true)}`
    : ""
}

${(() => {
  const hasGa =
    S.collectOther.length > 0 &&
    S.collectOther.some((r) => r.purpose || r.items);
  const hasNa =
    S.collectAuto.length > 0 &&
    S.collectAuto.some((r) => r.category || r.items);
  if (!hasGa && !hasNa) return "";
  const n1 =
    S.collectNoConsent.length > 0 &&
    S.collectNoConsent.some((r) => r.category || r.items);
  const n2 =
    S.collectConsent.length > 0 &&
    S.collectConsent.some((r) => r.category || r.items);
  const secNum = n1 && n2 ? 3 : n1 || n2 ? 2 : 1;
  return `
<p class="pp-sub-title">${secNum}. 그 밖에 수집하는 개인정보</p>
${
  hasGa
    ? `<p class="pp-sub-title" style="font-size:12px;padding-left:4px;">가. 정보주체 이외로부터 수집한 개인정보</p>
${buildCollectOtherTable(S.collectOther)}`
    : ""
}
${
  hasNa
    ? `<p class="pp-sub-title" style="font-size:12px;padding-left:4px;">${hasGa ? "나" : "가"}. 서비스 이용 과정에서 자동으로 생성·수집되는 개인정보</p>
${buildCollectTable(S.collectAuto, false)}`
    : ""
}
`;
})()}

${!S.collectNoConsent.some((r) => r.category || r.items) && !S.collectConsent.some((r) => r.category || r.items) && !S.collectOther.some((r) => r.purpose || r.items) && !S.collectAuto.some((r) => r.category || r.items) ? '<p style="color:#aaa;font-style:italic;">← STEP 2에서 수집 항목을 추가해 주세요.</p>' : ""}

<!-- 02 아동 -->
${
  S.child === "yes"
    ? `
${sec("child", "만 14세 미만 아동의 개인정보 처리", true)}
<p style="font-size:13px;color:#000;line-height:1.8;margin:0 0 8px;">① ${alias}는 14세 미만 아동의 개인정보를 수집할 때 법정대리인의 동의를 얻어 해당 서비스 수행에 필요한 최소한의 개인정보를 수집합니다.</p>
${S.childItems ? `<table class="pp-table" style="margin:0 0 14px;">
  <thead><tr><th style="text-align:center;">수집항목</th></tr></thead>
  <tbody><tr><td style="text-align:center;">${S.childItems}</td></tr></tbody>
</table>` : `<p style="margin:0 0 14px;"></p>`}
<p style="font-size:13px;color:#000;line-height:1.8;margin:0;">② ${alias}는 만 14세 미만 아동의 개인정보를 수집할 때에는 아동에게 법정대리인의 성명, 연락처와 같이 최소한의 정보를 요구할 수 있으며, ${S.childMethod || '<span style="color:#bbb;">동의 확인 방법을 선택해 주세요.</span>'}</p>
`
    : ""
}

${sec("destroy", "개인정보의 파기 절차 및 방법")}
<ul class="pp-list">
  <li>① ${alias}는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
  <li>② 정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</li>
</ul>
${
  legalRet.length > 0
    ? `
<p style="font-size:12px;font-weight:700;margin:8px 0 4px;">▶ 법령에 따른 보존</p>
${buildMergedTable(legalRet, [{key:"label",label:"보존 항목"},{key:"basis",label:"근거 법령"},{key:"period",label:"보존 기간",cls:"c"}])}`
    : ""
}${
  otherRet.length > 0
    ? `
<p style="font-size:12px;font-weight:700;margin:8px 0 4px;">▶ 그외 보존 (사내규정·기타사유)</p>
${buildMergedTable(otherRet, [{key:"label",label:"보존 항목"},{key:"basis",label:"보존 사유"},{key:"period",label:"보존 기간",cls:"c"}])}`
    : ""
}
<ul class="pp-list" style="margin-top:8px;">
  <li>③ 파기절차: ${alias}는 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.</li>
  <li>④ 파기방법${S.destroy.electronic || S.destroy.paper ? `<ul style="margin:4px 0 0 0;padding-left:16px;list-style:none;">${S.destroy.electronic ? '<li style="padding:2px 0;">• 전자적 파일: 기록을 재생할 수 없도록 파기합니다.</li>' : ""}${S.destroy.paper ? '<li style="padding:2px 0;">• 종이 문서: 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>' : ""}</ul>` : ""}</li>
</ul>

<!-- 04 제3자 제공 -->
${
  S.thirdParty === "yes"
    ? `
${sec("tp", "개인정보의 제3자 제공", true)}
${
  S.tpConsent.length > 0 && S.tpConsent.some((r) => r.receiver)
    ? `
<p>① ${alias}는 원활한 서비스 제공을 위해 다음의 경우 「개인정보 보호법」 제17조제1항제1호에 따라 정보주체의 동의를 얻어 필요 최소한의 범위로만 제공합니다.</p>
${buildMergedTable(S.tpConsent, [
  {key:"receiver", label:"제공받는 자"},
  {key:"purpose",  label:"제공 목적"},
  {key:"items",    label:"제공 항목"},
  {key:"retention",label:"보유·이용기간", cls:"c"},
])}`
    : ""
}
${
  S.tpLegal.length > 0 && S.tpLegal.some((r) => r.receiver)
    ? `
<p style="margin-top:10px;">② ${alias}는 다음과 같이 정보주체의 동의 없이 관계 기관에 개인정보를 제공할 수 있습니다.</p>
${buildMergedTable(S.tpLegal, [
  {key:"basis",    label:"관련 근거"},
  {key:"receiver", label:"제공받는 자"},
  {key:"purpose",  label:"제공 목적"},
  {key:"items",    label:"제공 항목"},
  {key:"retention",label:"보유·이용기간", cls:"c"},
])}`
    : ""
}
`
    : ""
}

<!-- 05 위탁 -->
${
  S.delegate === "yes"
    ? `
${sec("delegate", "개인정보 처리업무의 위탁", true)}
<p>① ${alias}는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
<p style="font-weight:700;margin:10px 0 4px;">가. 위탁받는 자 (수탁자)</p>
${
  S.dlItems.length > 0 && S.dlItems.some((r) => r.company)
    ? buildMergedTable(S.dlItems, [{key:"company",label:"위탁받는 자 (수탁자)",cls:"c"},{key:"task",label:"위탁 업무"}])
    : '<p style="color:#aaa;font-style:italic;font-size:12px;">수탁업체를 추가해 주세요.</p>'
}${
  S.dlSubItems && S.dlSubItems.length > 0 && S.dlSubItems.some((r) => r.company)
    ? `<p style="font-weight:700;margin:10px 0 4px;">나. 재위탁받는 자 (재수탁자)</p>
${buildMergedTable(S.dlSubItems, [{key:"company",label:"재위탁받는 자 (재수탁자)",cls:"c"},{key:"task",label:"위탁 업무"}])}`
    : ""
}
<p style="margin-top:10px;">② ${alias}는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>${
  S.dlSubItems && S.dlSubItems.length > 0 && S.dlSubItems.some((r) => r.company)
    ? `<p style="margin-top:6px;">③ 「개인정보 보호법」 제26조제6항에 따라 수탁자가 ${alias}의 개인정보 처리 업무를 재위탁하는 경우 ${alias}의 동의를 받고 있으며, 본 개인정보 처리방침을 통하여 재수탁자와 재수탁하는 업무의 내용을 공개하고 있습니다.</p>
<p style="margin-top:6px;">${S.dlSubItems && S.dlSubItems.some((r) => r.company) ? "④" : "③"} 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.</p>`
    : `<p style="margin-top:6px;">③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.</p>`
}
`
    : ""
}

<!-- 06 국외이전 -->
${
  S.overseas === "yes"
    ? `
${sec("overseas", "개인정보의 국외 이전", true)}
<p>${alias}는 서비스 이용자로부터 수집한 개인정보를 아래와 같이 국외에 이전하고 있으며, 「개인정보 보호법」 제28조의8제2항에 따라 국외이전에 대해 다음과 같이 안내합니다.</p>
${S.otRefuseDisadvantage ? `<p style="margin-top:6px;">국외 이전을 거부할 경우 ${S.otRefuseDisadvantage}합니다.</p>` : ""}
${
  S.otItems.length > 0 && S.otItems.some((r) => r.receiver)
    ? `
${buildMergedTable(S.otItems, [
  {key:"receiver", label:"이전받는 자"},
  {key:"country",  label:"이전 국가", cls:"c"},
  {key:"items",    label:"이전 항목"},
  {key:"purpose",  label:"이용 목적"},
  {key:"method",   label:"이전 방법"},
  {key:"retention",label:"보유기간", cls:"c"},
])}`
    : '<p style="color:#aaa;font-style:italic;font-size:12px;">이전 대상을 추가해 주세요.</p>'
}
${S.otRefuseMethod ? `<p style="margin-top:8px;">국외 이전을 원치 않을 경우 ${S.otRefuseMethod}를 통하여 회원 탈퇴를 요청할 수 있습니다.</p>` : ""}
`
    : ""
}

${sec("security", "개인정보의 안전성 확보 조치")}
<p>${alias}는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
<ul class="pp-list">
  ${secMgmt.length > 0 ? `<li><strong>관리적 조치:</strong> ${secMgmt.join(", ")}</li>` : ""}
  ${secTech.length > 0 ? `<li><strong>기술적 조치:</strong> ${secTech.join(", ")}</li>` : ""}
  ${secPhys.length > 0 ? `<li><strong>물리적 조치:</strong> ${secPhys.join(", ")}</li>` : ""}
  ${secExtra.length > 0 ? `<li><strong>기타:</strong> ${secExtra.join(", ")}</li>` : ""}
</ul>

<!-- 08 추가이용 판단기준 -->
${
  S.addUsage === "yes"
    ? `
${sec("adduse", "추가적인 이용·제공 판단 기준", true)}
<p>${alias}는 「개인정보 보호법」 제15조제3항 또는 제17조제4항에 따라 정보주체의 동의 없이 개인정보를 추가적으로 이용·제공할 수 있습니다.</p>
<p>${S.addUsageText || "판단 기준을 입력해 주세요."}</p>
`
    : ""
}

<!-- 09 민감정보 -->
${
  S.sensitive === "yes"
    ? `
${sec("sensitive", "민감정보의 공개 가능성 및 비공개 선택 방법", true)}
<p>${S.sensitiveText || "내용을 입력해 주세요."}</p>
`
    : ""
}

<!-- 10 가명정보 -->
${
  S.pseudonym === "yes"
    ? `
${sec("pseudo", "가명정보 처리에 관한 사항", true)}
<p>${alias}는 수집한 개인정보를 「개인정보 보호법」 제28조의2에 따라 다음과 같이 가명처리하여 활용하고 있습니다.</p>
<p>${S.pseudonymText || "내용을 입력해 주세요."}</p>
`
    : ""
}

<!-- 11 쿠키 -->
${
  S.cookie === "yes"
    ? `
${sec("cookie", "개인정보 자동수집 장치의 설치·운영 및 거부", true)}
<ul class="pp-list">
  <li>① ${alias}는 정보주체에게 개별적인 서비스와 편의를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
  <li>② 쿠키는 웹사이트 운영에 이용되는 서버(http)가 정보주체의 브라우저에 보내는 소량의 정보로서 정보주체의 컴퓨터 또는 모바일에 저장되며, 웹사이트 접속 시 정보주체의 브라우저에서 서버로 자동 전송됩니다.</li>
  <li>③ 정보주체는 브라우저 옵션 설정을 통해 쿠키 허용, 차단 등의 설정을 할 수 있습니다.${
    webBrowsers.length > 0 || mobileBrowsers.length > 0 ? `
<ul style="margin-top:8px; padding-left:16px;">
  ${webBrowsers.length > 0 ? `<li style="margin-bottom:6px;">웹 브라우저에서 쿠키 허용/차단
<table class="pp-table" style="margin-top:6px;">
  <thead><tr><th style="width:35%">브라우저</th><th>설정 방법</th></tr></thead>
  <tbody>${webBrowsers.map((k) => `<tr><td class="c">${bMap[k].n}</td><td>${bMap[k].p}</td></tr>`).join("")}</tbody>
</table></li>` : ""}
  ${mobileBrowsers.length > 0 ? `<li style="margin-top:6px;">모바일 브라우저에서 쿠키 허용/차단
<table class="pp-table" style="margin-top:6px;">
  <thead><tr><th style="width:35%">브라우저</th><th>설정 방법</th></tr></thead>
  <tbody>${mobileBrowsers.map((k) => `<tr><td class="c">${bMap[k].n}</td><td>${bMap[k].p}</td></tr>`).join("")}</tbody>
</table></li>` : ""}
</ul>` : ""
  }</li>
</ul>
`
    : ""
}

<!-- 12 행태정보 -->
${
  S.behavioral === "yes"
    ? `
${sec("behavior", "행태정보의 수집·이용·제공 및 거부", true)}
<ul class="pp-list">
<li>① ${alias}는 서비스 이용과정에서 ${S.bhPurpose || "(목적을 입력해 주세요)"}하기 위하여 ${S.bhTool || "쿠키"}를 활용하여 ${S.bhIdentify || "개인을 식별할 수 없는 비식별 정보"}으로 행태정보를 처리하고 있습니다.</li>
<li>② ${alias}는 자사가 운영하는 웹사이트에서 다음과 같이 행태정보를 수집하고 있습니다.
${
  S.bhItems.length > 0 && S.bhItems.some((r) => r.items)
    ? buildPolicyTable(S.bhItems, [
        {key:"legal",    label:"법적 근거"},
        {key:"items",    label:"수집 항목"},
        {key:"method",   label:"수집 방법"},
        {key:"purpose",  label:"수집 목적"},
        {key:"retention",label:"보유 및 이용기간", cls:"c"},
      ], "행태정보 수집 표", true)
    : '<p style="color:#aaa;font-style:italic;font-size:12px;">행태정보 항목을 추가해 주세요.</p>'
}
</li>
${S.bhProvide === "yes" ? `<li>③ ${alias}는 다음과 같이 행태정보를 제3자에게 제공하고 있습니다.
${
  S.bhTpItems.length > 0 && S.bhTpItems.some((r) => r.recipient)
    ? buildPolicyTable(S.bhTpItems, [
        {key:"legal",     label:"법적 근거"},
        {key:"recipient", label:"제공받는 자"},
        {key:"items",     label:"제공 항목"},
        {key:"purpose",   label:"제공받는 자의 이용 목적"},
        {key:"retention", label:"제공받는 자의 보유 및 이용기간", cls:"c"},
      ], "행태정보 제3자 제공 표", true)
    : '<p style="color:#aaa;font-style:italic;font-size:12px;">제3자 제공 항목을 추가해 주세요.</p>'
}
</li>` : ""}
${S.bhExtCollect === "yes" && S.bhAutoDevices.length > 0 && S.bhAutoDevices.some((d) => d.device) ? `<li>${S.bhProvide === "yes" ? "④" : "③"} ${alias}는 온라인 맞춤형 광고 등을 제공하기 위하여 제3자가 운영하는 웹·앱에 설치된 개인정보 자동 수집 장치로부터 행태정보를 수집·이용하고 있습니다.
${buildPolicyTable(S.bhAutoDevices, [
  {key:"device",  label:"수집장치 명칭"},
  {key:"type",    label:"수집장치 종류"},
  {key:"company", label:"수집해가는 사업자"},
  {key:"items",   label:"수집해가는 행태정보 항목"},
  {key:"purpose", label:"수집해가는 목적"},
], "자동수집장치 현황 표", true)}
</li>` : ""}
${S.bhFlags.bh_nosensitive ? (() => { const n = [S.bhProvide === "yes", S.bhExtCollect === "yes" && S.bhAutoDevices.some(d=>d.device)].filter(Boolean).length; const idx = ["③","④","⑤"][n] || "⑤"; return `<li>${idx} ${alias}는 ${S.bhSensitivePurpose || "온라인 맞춤형 광고 등"}에 필요한 최소한의 행태 정보만을 수집하며, 사상, 신념, 병력 등 개인의 권리·이익이나 사생활을 침해할 우려가 있는 민감한 행태 정보를 수집하지 않습니다.</li>`; })() : ""}
${S.bhFlags.bh_nochild ? (() => { const n = [S.bhProvide === "yes", S.bhExtCollect === "yes" && S.bhAutoDevices.some(d=>d.device), S.bhFlags.bh_nosensitive].filter(Boolean).length; const idx = ["③","④","⑤","⑥"][n] || "⑥"; return `<li>${idx} ${alias}는 14세 미만임을 알고 있는 ${S.bhChildAction || "아동에게 맞춤형 광고를 제공"}하려는 경우 사전에 법정대리인의 동의를 받고 있으며, 이외에는 맞춤형 광고를 목적으로 아동의 행태정보를 수집하지 않고, 아동에게 맞춤형 광고를 제공하지 않습니다.</li>`; })() : ""}
${(S.bhBrowsers.bh_chrome || S.bhBrowsers.bh_edge) ? (() => { const n = [S.bhProvide === "yes", S.bhExtCollect === "yes" && S.bhAutoDevices.some(d=>d.device), S.bhFlags.bh_nosensitive, S.bhFlags.bh_nochild].filter(Boolean).length; const idx = ["③","④","⑤","⑥","⑦"][n] || "⑦"; return `<li>${idx} 정보주체는 웹브라우저의 쿠키 설정 변경 등을 통해 맞춤형 광고를 일괄적으로 차단·허용할 수 있습니다. 다만, 쿠키 설정 변경 시 웹사이트 자동로그인 등 일부 서비스의 이용이 제한될 수 있습니다.
<div class="policy_table scroll" style="margin-top:8px;"><table><colgroup><col style="width:22%"><col style="width:32%"><col></colgroup>
<thead><tr><th>브라우저</th><th>구분</th><th>설정 경로</th></tr></thead>
<tbody>
${S.bhBrowsers.bh_chrome ? `<tr><td rowspan="3">크롬(Chrome)</td><td>웹브라우저에 저장된 쿠키 삭제 방법</td><td>오른쪽 상단 '⋮' → 설정 → '개인정보 보호 및 보안' → '인터넷 사용기록 삭제'</td></tr>
<tr><td>웹브라우저에서 제3자 쿠키 차단 방법</td><td>오른쪽 상단 '⋮' → 설정 → '개인정보 보호 및 보안' → '서드파티쿠키' → '서드파티쿠키 차단'</td></tr>
<tr><td>웹브라우저에서 모든 쿠키 저장 차단 방법</td><td>오른쪽 상단 '⋮' → '새 시크릿 창'<p class="sub_txt">*시크릿 모드로 전환되어 방문 기록, 쿠키 및 사이트 데이터, 양식에 입력된 정보가 기기에 저장되지 않습니다.</p></td></tr>` : ""}
${S.bhBrowsers.bh_edge ? `<tr><td rowspan="3">엣지(Edge)</td><td>웹브라우저에 저장된 쿠키 삭제 방법</td><td>오른쪽 상단 '…' → 설정 → '쿠키 및 사이트 권한' → '쿠키 및 사이트 데이터 관리 및 삭제' → 제거 여부 선택</td></tr>
<tr><td>웹브라우저에서 제3자 쿠키 차단 방법</td><td>오른쪽 상단 '…' → 설정 → '개인정보, 검색 및 서비스' → '추적방지' : 추적방지 여부 및 수준(균형조정 또는 엄격) 선택<br>(또는) 오른쪽 상단 '…' → 설정 → '쿠키 및 사이트 권한' → '쿠키 및 사이트 데이터 관리 및 삭제' → '타사 쿠키 차단' 선택</td></tr>
<tr><td>웹브라우저에서 모든 쿠키 저장 차단 방법</td><td>오른쪽 상단 '…' → '새 InPrivate 창'<p class="sub_txt">*시크릿 모드로 전환되어 방문 기록, 쿠키 및 사이트 데이터, 양식에 입력된 정보가 기기에 저장되지 않습니다.</p></td></tr>` : ""}
</tbody></table></div>
</li>`; })() : ""}
${S.bhFlags.bh_mobile ? (() => { const n = [S.bhProvide === "yes", S.bhExtCollect === "yes" && S.bhAutoDevices.some(d=>d.device), S.bhFlags.bh_nosensitive, S.bhFlags.bh_nochild, S.bhBrowsers.bh_chrome || S.bhBrowsers.bh_edge].filter(Boolean).length; const idx = ["③","④","⑤","⑥","⑦","⑧"][n] || "⑧"; return `<li>${idx} ${alias}는 앱에서 ${S.bhMobileAction || "맞춤형 광고를 위하여 광고식별자를 수집·이용"}합니다. 정보주체는 모바일 단말기의 설정 변경을 통해 앱의 ${S.bhMobileAdType || "맞춤형 광고"}를 차단·허용할 수 있습니다.
<div class="policy_table scroll" style="margin-top:8px;"><table><colgroup><col style="width:22%"><col></colgroup>
<thead><tr><th>구분</th><th>설정 경로</th></tr></thead>
<tbody>
<tr><td>안드로이드</td><td>① 설정 → ② 보안 및 개인정보 보호 → ③ 개인정보 보호 → ④ 기타 개인정보 설정 → ⑤ 광고 → ⑥ 광고ID 재설정 / 광고ID 삭제</td></tr>
<tr><td>아이폰</td><td>① 설정 → ② 개인정보 보호 및 보안 → ③ 추적 → ④ 앱 추적 허용 해제</td></tr>
</tbody></table></div>
<p class="sub_txt">※ 모바일 OS 버전에 따라 메뉴 및 방법이 다소 상이할 수 있습니다.</p>
</li>`; })() : ""}
${(S.bhContactDept || S.bhContactPerson || S.bhContactPhone || S.bhContactEmail) ? (() => { const n = [S.bhProvide === "yes", S.bhExtCollect === "yes" && S.bhAutoDevices.some(d=>d.device), S.bhFlags.bh_nosensitive, S.bhFlags.bh_nochild, S.bhBrowsers.bh_chrome || S.bhBrowsers.bh_edge, S.bhFlags.bh_mobile].filter(Boolean).length; const idx = ["③","④","⑤","⑥","⑦","⑧","⑨"][n] || "⑨"; return `<li>${idx} 정보주체는 아래의 연락처로 행태정보와 관련하여 궁금한 사항과 거부권 행사, 피해 신고 접수 등을 문의할 수 있습니다.
<div class="policy_table scroll" style="margin-top:8px;"><table><colgroup><col style="width:22%"><col style="width:28%"><col></colgroup>
<thead><tr><th>구분</th><th>담당부서 / 담당자</th><th>연락처</th></tr></thead>
<tbody>
<tr><td>개인정보 보호 담당부서</td><td>${[S.bhContactDept, S.bhContactPerson].filter(Boolean).join(" / ") || "-"}</td><td>${[S.bhContactPhone, S.bhContactEmail].filter(Boolean).join("<br>") || "-"}</td></tr>
</tbody></table></div>
</li>`; })() : ""}
</ul>
`
    : ""
}

<!-- 13 자동화된 결정 -->
${
  S.autoDecision === "yes"
    ? `
${sec("autodec", "자동화된 결정에 관한 사항", true)}
<p>${S.autoDecisionText || "내용을 입력해 주세요."}</p>
`
    : ""
}

${sec("rights", "정보주체와 법정대리인의 권리·의무 및 행사방법")}
<ul class="pp-list">
  <li>① 정보주체는 언제든지 개인정보 열람·전송·정정·삭제·처리정지 및 동의 철회 등을 요구할 수 있습니다.</li>
  <li>② 권리 행사는 「개인정보 보호법 시행령」 제41조제1항에 따라 ${activeMethods || "서면, 전화, 전자우편 등"}을 통하여 하실 수 있으며, ${alias}는 이에 대해 지체 없이 조치하겠습니다.</li>
  ${S.rightsPath ? `<li>③ 앱/웹 내 권리행사 경로: ${S.rightsPath}</li>` : ""}
  <li>④ 권리 행사는 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수도 있습니다. 이 경우 위임장을 제출하셔야 합니다.</li>
  <li>⑤ ${alias}는 권리 행사를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.</li>
  <li>⑥ 정보주체가 개인정보 열람 및 처리정지를 요구할 권리는 「개인정보 보호법」 제35조제4항 및 제37조제2항에 의하여 제한될 수 있습니다.</li>
  ${S.mydata === "yes" ? `<li>⑦ <strong>개인정보 전송요구(마이데이터):</strong> 정보주체는 홈페이지 '내정보 &gt; 본인전송요구'를 통해 개인정보 전송을 요구할 수 있으며, 제3자 전송요구는 개인정보전송지원플랫폼(OnMydata.go.kr)에서 확인할 수 있습니다.</li>` : ""}
  <li>⑧ 권리 행사 청구 접수·처리 부서는 아래 '개인정보 보호책임자 및 고충처리 부서' 항목을 참고하여 주시기 바랍니다. ${alias}는 청구받은 날로부터 10일 이내 회신하겠습니다.</li>
</ul>

${sec("cpo", "개인정보 보호책임자 및 고충처리 부서")}
<p>① ${alias}는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
<div class="pp-contact-box">
  <div class="pp-contact-title">▶ 개인정보 보호책임자(CPO)</div>
  <div class="pp-contact-info">
    성명: ${S.cpoName || '<span class="pp-placeholder">미입력</span>'}${S.cpoTitle ? " / 직책: " + S.cpoTitle : ""}<br>
    ${S.cpoPhone ? "전화: " + S.cpoPhone : ""}${S.cpoPhone && S.cpoEmail ? " &nbsp;|&nbsp; " : ""}${S.cpoEmail ? "이메일: " + S.cpoEmail : ""}
  </div>
</div>
<p style="margin-top:8px;">② 정보주체는 ${alias}의 서비스를 이용하시면서 발생한 모든 개인정보보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다.</p>
<div class="pp-contact-box">
  <div class="pp-contact-title">▶ 개인정보 업무 담당부서</div>
  <div class="pp-contact-info">
    ${
      S.depts
        .filter((d) => d.name || d.email || d.phone)
        .map(
          (d) => `
      ${d.name ? "부서: " + d.name : ""} ${d.phone ? "&nbsp;|&nbsp; 전화: " + d.phone : ""} ${d.email ? "&nbsp;|&nbsp; 이메일: " + d.email : ""}
    `,
        )
        .join("<br>") ||
      '<span class="pp-placeholder">부서 정보를 입력해 주세요</span>'
    }
  </div>
</div>

<!-- 16 구제방법 -->
${
  activeAgencies.length > 0
    ? `
${sec("remedy", "정보주체의 권익침해에 대한 구제방법", true)}
<p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 아래의 기관에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
<table class="pp-table"><thead><tr><th>기관명</th><th>기관 URL</th><th>연락처</th></tr></thead>
<tbody>${activeAgencies.map((k) => `<tr><td>${agMap[k].n}</td><td><a href="https://${agMap[k].u}" target="_blank">${agMap[k].u}</a></td><td class="c">${agMap[k].t}</td></tr>`).join("")}</tbody></table>
`
    : ""
}

<!-- 17 국내대리인 -->
${
  S.domAgent === "yes"
    ? `
${sec("agent", "국내대리인 지정", true)}
<p>${alias}는 「개인정보 보호법」 제31조의2에 따라 국내대리인을 지정하였습니다.</p>
<div class="pp-contact-box">
  <div class="pp-contact-info">
    성명(법인명): ${S.daName || "-"}<br>
    주소: ${S.daAddr || "-"}<br>
    전화번호: ${S.daPhone || "-"}<br>
    이메일: ${S.daEmail || "-"}
  </div>
</div>
`
    : ""
}

${sec("change", "개인정보 처리방침의 변경")}
<p class="pp-eff-date">① 이 개인정보 처리방침은 <strong>${eff}</strong>부터 적용됩니다.</p>
<p style="margin-top:6px;font-size:12px;">② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다. (시행일자별 링크 제공)</p>
`;
}
