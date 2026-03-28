// ════════════════════════════════════════
//  EXPORT
// ════════════════════════════════════════
function generateFinalHTML() {
  const content = document.getElementById("previewContent").innerHTML;
  const co = S.companyName || "회사";
  const svc = S.serviceName || "";
  const eff = S.effectiveDate || "";
  const scriptTag = "<scr" + "ipt>";
  const scriptCloseTag = "</" + "script>";

  const css = `*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;background:#f5f5f7;color:#333;}
.wrapper{max-width:780px;margin:0 auto;padding:36px 20px 80px;}
.preview-doc{background:#fff;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,.15);overflow:hidden;font-family:'Noto Sans KR',sans-serif;}
@media(max-width:600px){.pp{padding:28px 20px;}}
.pp{padding:48px 56px;color:#000;font-size:14px;line-height:1.7;}
.pp-h2{font-size:26px;font-weight:700;color:#111;text-align:center;margin-bottom:6px;letter-spacing:-.5px;}
.pp-date-row{display:flex;justify-content:flex-end;margin:36px 0 20px;}
.pp-date-badge{background:#f4f5f7;border-radius:7px;padding:5px 14px;font-size:12px;font-weight:600;color:#000;border:1px solid #e0e0e0;}
.pp-intro{color:#000;font-size:13px;line-height:1.85;margin-bottom:8px;}
.pp-icon-nav{border:1px solid #e2e2e5;border-radius:10px;padding:12px 16px;margin:12px 0;display:grid;grid-template-rows:repeat(2,auto);grid-auto-flow:column;grid-auto-columns:1fr;}
.pp-icon-item{display:flex;flex-direction:column;align-items:center;padding:8px 4px;text-align:center;}
.pp-icon-circle{width:52px;height:52px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;}
.pp-icon-circle svg{width:52px;height:52px;}
.pp-icon-label{font-size:11px;font-weight:700;color:#000;word-break:keep-all;}
.pp-toc-box{background:#f4f5f7;border-radius:7px;padding:10px 16px;margin:12px 0;}
.pp-toc-box ul{list-style:none;}
.pp-toc-box ul li{padding:2px 0;}
.pp-toc-link{display:flex;align-items:center;gap:4px;color:#444;text-decoration:none;padding:4px 7px;border-radius:5px;transition:background .15s,color .15s;font-size:12px;}
.pp-toc-link:hover{background:#e4e8ff;color:#4f6ef7;}
.pp-toc-icon{display:inline-flex;align-items:center;flex-shrink:0;}
.pp-toc-icon svg{width:22px;height:22px;}
.pp-toc-num{font-size:10px;font-weight:700;min-width:20px;flex-shrink:0;}
.pp-toc-opt{font-size:9px;color:#aaa;margin-left:2px;}
.pp-sec{font-size:14px;font-weight:700;color:#343434;margin-top:28px;margin-bottom:10px;padding-bottom:7px;border-bottom:2px solid #f0f0f0;display:flex;align-items:center;gap:7px;scroll-margin-top:20px;}
.pp-sec-icons{display:flex;align-items:center;gap:3px;flex-shrink:0;}
.pp-sec-icon{display:inline-flex;align-items:center;}
.pp-sec-icon svg{width:28px;height:28px;}
.pp p{font-size:13px;color:#000;margin-bottom:7px;line-height:1.8;}
.pp-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;}
.pp-table th{background:#f2f2f2;padding:7px 9px;text-align:center;border:1px solid #ddd;font-weight:700;color:#000;}
.pp-table td{padding:7px 9px;border:1px solid #ddd;color:#000;vertical-align:middle;text-align:center;}
.pp-table td.c{text-align:center;vertical-align:middle;}
.pp ul.pp-list{padding-left:0;margin:6px 0;list-style:none;}
.pp ul.pp-list li{font-size:13px;color:#000;padding:2px 0;line-height:1.7;}
.pp ul.pp-list li::before{content:none;}
.pp-contact-box{background:#f8f9fa;border-radius:7px;padding:14px 18px;margin:10px 0;}
.pp-contact-title{font-weight:700;font-size:13px;color:#000;margin-bottom:5px;}
.pp-contact-info{font-size:12px;color:#000;line-height:1.8;}
.pp-contact-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;table-layout:fixed;}
.pp-ct-head{background:#e9ecef;color:#495057;font-weight:600;padding:5px 10px;border:1px solid #dee2e6;text-align:center;}
.pp-ct-label{width:25%;background:#e9ecef;color:#495057;font-weight:600;padding:5px 10px;border:1px solid #dee2e6;text-align:center;}
.pp-ct-value{width:25%;padding:5px 10px;border:1px solid #dee2e6;color:#000;word-break:break-all;text-align:center;vertical-align:middle;}
.pp-eff-date{font-size:13px;color:#000;}
.pp-sub-title{font-size:13px;font-weight:700;color:#000;margin:14px 0 6px;}
.pp-placeholder{color:#bbb;font-style:italic;}
.pp-hidden{display:none;}
a{color:#4f6ef7;}
.policy_cnt{margin:8px 0;}
.policy_table{margin:8px 0;}
.policy_table.scroll{overflow-x:auto;}
.policy_table table{width:100%;border-collapse:collapse;font-size:12px;}
.policy_table table caption{font-size:11px;color:#888;text-align:left;margin-bottom:4px;caption-side:top;}
.policy_table table th{background:#f2f2f2;padding:7px 9px;text-align:center;border:1px solid #ddd;font-weight:700;color:#000;}
.policy_table table td{padding:7px 9px;border:1px solid #ddd;color:#000;vertical-align:middle;text-align:left;}
.policy_table table td.c{text-align:center;}
p.sub_txt{font-size:11px;color:#888;margin:4px 0 0;}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${svc ? svc + " " : co + " "}개인정보 처리방침${eff ? " (" + eff + ")" : ""}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
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
  const svc = S.serviceName || "";
  const eff = S.effectiveDate || "";

  // SVG 요소 제거 (Word 호환성)
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;
  tempDiv.querySelectorAll("svg").forEach((el) => el.remove());
  // 아이콘 네비게이션·TOC 숨김 (인쇄용 불필요)
  tempDiv
    .querySelectorAll(".pp-icon-nav, .pp-toc-box")
    .forEach((el) => el.remove());
  const wordContent = tempDiv.innerHTML;

  const wordHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${svc ? svc : co} 개인정보 처리방침${eff ? " (" + eff + ")" : ""}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
<style>
  body{font-family:'맑은 고딕','Malgun Gothic',sans-serif;font-size:10pt;color:#000;margin:40pt 50pt;}
  table{border-collapse:collapse;width:100%;font-size:9pt;margin:8pt 0;}
  th{background:#f2f2f2;padding:5pt 7pt;border:1pt solid #ccc;font-weight:bold;text-align:center;}
  td{padding:5pt 7pt;border:1pt solid #ccc;vertical-align:middle;}
  .pp-h2{font-size:16pt;font-weight:bold;text-align:center;margin-bottom:4pt;}
  .pp-date-row{text-align:right;margin:16pt 0 10pt;}
  .pp-date-badge{font-size:9pt;border:1pt solid #ccc;padding:2pt 8pt;}
  .pp-intro{font-size:10pt;line-height:1.8;margin-bottom:6pt;}
  .pp-sec{font-size:11pt;font-weight:bold;border-bottom:1pt solid #ccc;padding-bottom:4pt;margin-top:18pt;margin-bottom:8pt;}
  .pp-sub-title{font-size:10pt;font-weight:bold;margin:10pt 0 4pt;}
  p{font-size:10pt;line-height:1.7;margin-bottom:5pt;}
  ul.pp-list{margin:4pt 0 4pt 16pt;padding:0;}
  ul.pp-list li{font-size:10pt;line-height:1.7;list-style:disc;}
  .pp-contact-box{border:1pt solid #e0e0e0;padding:8pt 12pt;margin:8pt 0;}
  .pp-contact-title{font-size:10pt;font-weight:bold;margin-bottom:4pt;}
  .pp-contact-info{font-size:9pt;line-height:1.8;}
  .pp-contact-table{width:100%;border-collapse:collapse;font-size:9pt;margin-top:4pt;}
  .pp-ct-head,.pp-ct-label{background:#e9ecef;font-weight:600;padding:4pt 8pt;border:1pt solid #ccc;text-align:center;}
  .pp-ct-value{padding:4pt 8pt;border:1pt solid #ccc;word-break:break-all;text-align:center;}
  .pp-eff-date{font-size:10pt;}
  .pp-placeholder{color:#bbb;font-style:italic;}
  .pp-hidden{display:none;}
  .policy_table table{width:100%;border-collapse:collapse;font-size:9pt;}
  .policy_table table th{background:#f2f2f2;padding:5pt 7pt;border:1pt solid #ccc;font-weight:bold;text-align:center;}
  .policy_table table td{padding:5pt 7pt;border:1pt solid #ccc;}
  p.sub_txt{font-size:9pt;color:#888;margin:2pt 0 0;}
  a{color:#4f6ef7;}
</style>
</head>
<body>
${wordContent}
</body>
</html>`;

  const blob = new Blob(["\ufeff", wordHtml], {
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
