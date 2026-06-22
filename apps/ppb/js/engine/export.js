// ════════════════════════════════════════
//  EXPORT
// ════════════════════════════════════════
function getExportCSS() {
  const base = `*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic','나눔고딕','NanumGothic',sans-serif;background:#f5f5f7;color:#333;}
.wrapper{max-width:780px;margin:0 auto;padding:36px 20px 80px;}
a{color:#4f6ef7;}
@media(max-width:600px){.pp{padding:28px 20px;}}
`;
  let extracted = "";
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const text = rule.cssText;
        if (
          text.includes(".pp") ||
          text.includes(".policy_") ||
          text.includes("sub_txt") ||
          text.includes(".preview-doc")
        ) {
          extracted += text + "\n";
        }
      }
    } catch (e) {}
  }
  return base + extracted;
}

function generateFinalHTML() {
  const content = document.getElementById("previewContent").innerHTML;
  const co = S.companyName || "회사";
  const eff = S.effectiveDate || "";
  const scriptTag = "<scr" + "ipt>";
  const scriptCloseTag = "</" + "script>";

  const css = getExportCSS();

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${co + " "}개인정보 처리방침${eff ? " (" + eff + ")" : ""}</title>
<style>${css}</style>
${scriptTag}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.pp-toc-link').forEach(function(a){
    a.addEventListener('click',function(e){
      var h=a.getAttribute('href');
      if(h&&h.startsWith('#')){e.preventDefault();var t=document.querySelector(h);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}
    });
  });
});
${scriptCloseTag}
</head>
<body>
<div class="wrapper"><div class="preview-doc"><div class="pp">${content}</div></div></div>
</body>
</html>`;
}

function downloadHTML() {
  const html = generateFinalHTML();
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const name = (S.companyName || "company").replace(/[^a-zA-Z0-9가-힣]/g, "");
  a.download = "개인정보처리방침_" + name + ".html";
  a.click();
  showToast("✅ HTML 파일이 다운로드되었습니다!", "success");
}

function copyHTML() {
  navigator.clipboard
    .writeText(generateFinalHTML())
    .then(() => showToast("📋 HTML 코드가 복사되었습니다!", "success"));
}

function downloadWord() {
  const content = document.getElementById("previewContent").innerHTML;
  const co = S.companyName || "회사";
  const eff = S.effectiveDate || "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;
  // Word 비호환 요소 제거
  tempDiv.querySelectorAll("svg").forEach((el) => el.remove());
  tempDiv.querySelectorAll(".pp-icon-nav, .pp-toc-box, .pp-sec-icons").forEach((el) => el.remove());
  // TOC 클릭 안내 문구 제거
  tempDiv.querySelectorAll("p").forEach((p) => {
    if (p.textContent.includes("목차를 클릭")) p.remove();
  });
  const wordContent = tempDiv.innerHTML;

  const MG = "'맑은 고딕','Malgun Gothic',sans-serif";

  const wordHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${co} 개인정보 처리방침${eff ? " (" + eff + ")" : ""}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
<style>
  *{font-family:${MG};box-sizing:border-box;margin:0;padding:0;}
  body{font-family:${MG};font-size:10pt;color:#000;margin:40pt 50pt;line-height:1.7;}

  /* 제목 */
  .pp-h2{font-size:18pt;font-weight:bold;color:#111;text-align:center;margin-bottom:4pt;letter-spacing:-0.5px;}

  /* 시행일 */
  .pp-date-row{text-align:right;margin:18pt 0 12pt;}
  .pp-date-badge{font-size:9pt;font-weight:600;color:#000;border:1pt solid #e0e0e0;padding:3pt 10pt;background:#f4f5f7;}

  /* 서문 */
  .pp-intro{font-size:10pt;line-height:1.85;margin-bottom:6pt;color:#000;}

  /* 섹션 헤딩 */
  .pp-sec{font-size:11pt;font-weight:bold;color:#343434;margin-top:20pt;margin-bottom:7pt;padding-bottom:5pt;border-bottom:1.5pt solid #e0e0e0;}
  .pp-sec-num{font-size:9pt;font-weight:bold;color:#555;margin-right:4pt;}
  .pp-sec-label{font-size:11pt;font-weight:bold;}

  /* 소제목 */
  .pp-sub-title{font-size:10pt;font-weight:bold;color:#000;margin:10pt 0 4pt;}

  /* 본문 단락 */
  p{font-size:10pt;line-height:1.8;margin-bottom:5pt;color:#000;}

  /* 목록 */
  ul.pp-list{padding-left:0;margin:4pt 0;list-style:none;}
  ul.pp-list li{font-size:10pt;color:#000;padding:1pt 0;line-height:1.7;}
  ul.pp-list li::before{content:none;}

  /* 테이블 공통 */
  table{border-collapse:collapse;width:100%;font-size:9pt;margin:6pt 0;table-layout:fixed;}
  th{background:#f2f2f2;padding:5pt 7pt;border:1pt solid #ddd;font-weight:bold;text-align:center;color:#000;}
  td{padding:5pt 7pt;border:1pt solid #ddd;color:#000;vertical-align:middle;text-align:center;}

  /* pp-table */
  .pp-table{width:100%;border-collapse:collapse;margin:6pt 0;font-size:9pt;table-layout:fixed;}
  .pp-table th{background:#f2f2f2;padding:5pt 7pt;text-align:center;border:1pt solid #ddd;font-weight:bold;color:#000;}
  .pp-table td{padding:5pt 7pt;border:1pt solid #ddd;color:#000;vertical-align:middle;text-align:center;}
  .pp-table td.c{text-align:center;vertical-align:middle;}

  /* 연락처 박스 */
  .pp-contact-box{border:1pt solid #e0e0e0;padding:10pt 14pt;margin:7pt 0;background:#f8f9fa;}
  .pp-contact-title{font-size:10pt;font-weight:bold;margin-bottom:4pt;color:#000;}
  .pp-contact-info{font-size:9pt;line-height:1.8;color:#000;}
  .pp-contact-list{list-style:none;padding:0;margin:0 0 3pt 6pt;font-size:10pt;color:#000;line-height:1.9;}
  .pp-contact-table{width:100%;border-collapse:collapse;font-size:9pt;margin-top:3pt;table-layout:fixed;}
  .pp-ct-head{background:#e9ecef;color:#495057;font-weight:600;padding:4pt 8pt;border:1pt solid #dee2e6;text-align:center;}
  .pp-ct-label{width:25%;background:#e9ecef;color:#495057;font-weight:600;padding:4pt 8pt;border:1pt solid #dee2e6;}
  .pp-ct-value{width:25%;padding:4pt 8pt;border:1pt solid #dee2e6;color:#000;word-break:break-all;text-align:center;vertical-align:middle;}

  /* policy_table (행태정보 등) */
  .policy_cnt{margin:5pt 0;}
  .policy_table{margin:5pt 0;}
  .policy_table table{width:100%;border-collapse:collapse;font-size:9pt;table-layout:fixed;}
  .policy_table table caption{font-size:8.5pt;color:#888;text-align:left;margin-bottom:3pt;}
  .policy_table table th{background:#f2f2f2;padding:5pt 7pt;text-align:center;border:1pt solid #ddd;font-weight:bold;color:#000;}
  .policy_table table td{padding:5pt 7pt;border:1pt solid #ddd;color:#000;vertical-align:middle;text-align:left;}
  .policy_table table td.c{text-align:center;}

  /* 이전 방침 */
  .pp-prev-wrap{margin-top:7pt;}
  .pp-prev-header{font-size:9pt;font-weight:bold;color:#888;}
  .pp-prev-list{border:1pt solid #e2e4f0;margin-top:4pt;font-size:10pt;}
  .pp-prev-list-item{display:block;padding:6pt 10pt;color:#333;text-decoration:none;border-bottom:1pt solid #eef0f8;}
  .pp-prev-list-nolink{padding:6pt 10pt;color:#aaa;border-bottom:1pt solid #eef0f8;}
  .pp-prev-list-arrow{margin-left:4pt;color:#ccc;}

  /* 기타 */
  .pp-eff-date{font-size:10pt;color:#000;}
  p.sub_txt{font-size:8.5pt;color:#888;margin:2pt 0 0;}
  a{color:#4f6ef7;}
  .pp-placeholder{color:#bbb;font-style:italic;}
  .pp-hidden{display:none;}
</style>
</head>
<body>
${wordContent}
</body>
</html>`;

  const blob = new Blob(["﻿", wordHtml], {
    type: "application/msword;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const name = (S.companyName || "company").replace(/[^a-zA-Z0-9가-힣]/g, "");
  a.download = "개인정보처리방침_" + name + ".doc";
  a.click();
  showToast("✅ Word 파일이 다운로드되었습니다!", "success");
}

function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast " + (type || "") + " show";
  setTimeout(() => t.classList.remove("show"), 3000);
}
