/* ════════════════════════════════════════════════════════════════
   동의서 빌더 (CSB / Consent Builder) — 바닐라 JS 단일 IIFE
   · 개인정보 수집·이용 동의서를 작성 → ① 인쇄용 오프라인 서식 +
     ② 실제 작동하는 온라인 동의 화면을 동시에 생성·내보내기.
   · 빌드/번들러/프레임워크 없음. 전역 스코프 <script>로 로드.
   · 좌측 빌더(폼) / 우측 미리보기(stage). 상태(S)가 바뀌면 해당
     영역만 다시 그린다. 텍스트 입력 시엔 빌더를 새로 그리지 않아
     포커스를 유지한다(미리보기만 갱신).
   법적 근거: 개인정보보호법 제15·16·17·22·22의2·23·24·28의8조,
   정보통신망법 제50조, 개인정보 처리 방법에 관한 고시 제4조.
   ──────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var FONT_LINK =
    "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@600;900&display=swap";

  /* 내보내기(다운로드)용 자체 포함 CSS — 빌드 단계에서 editor.css 내용이
     아래 문자열에 그대로 주입된다. editor.css와 항상 동일하게 유지된다. */
  var EXPORT_CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@600;900&display=swap');\n:root{\n  --ink:#1B2434; --ink-soft:#5A6678; --paper:#FFFFFF; --canvas:#EEF1F6;\n  --line:#D9DFE9; --line-soft:#E8ECF3; --seal:#BE3A34; --seal-bg:#FBF1F0;\n  --navy:#23344F; --navy-deep:#16223A; --ok:#2E7D5B; --hint:#F4F6FA;\n}\n*{box-sizing:border-box;margin:0;padding:0}\n.app{font-family:'Noto Sans KR',sans-serif;color:var(--ink);background:var(--canvas);min-height:100vh}\n\n/* 상단바 */\n.topbar{position:sticky;top:0;z-index:40;background:var(--navy-deep);color:#fff;display:flex;align-items:center;gap:16px;padding:0 22px;height:58px}\n.brand{display:flex;align-items:baseline;gap:9px;flex:none}\n.brand-mark{width:26px;height:26px;border-radius:6px;background:var(--seal);display:inline-flex;align-items:center;justify-content:center;font-family:'Noto Serif KR',serif;font-weight:900;font-size:14px;transform:translateY(5px)}\n.brand h1{font-size:16px;font-weight:700;letter-spacing:-.01em}\n.mode-switch{display:flex;background:rgba(255,255,255,.1);border-radius:9px;padding:3px;gap:2px}\n.mode-switch button{font-family:inherit;font-size:12.5px;font-weight:600;color:#AEB9CE;background:none;border:none;border-radius:7px;padding:7px 15px;cursor:pointer;transition:.15s;white-space:nowrap}\n.mode-switch button.on{background:#fff;color:var(--navy-deep)}\n.mode-switch button:focus-visible{outline:2px solid #fff;outline-offset:1px}\n.topbar .actions{margin-left:auto;display:flex;gap:8px}\n.btn{font-family:inherit;font-size:13px;font-weight:600;border:none;border-radius:8px;padding:9px 16px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px}\n.btn-ghost{background:rgba(255,255,255,.1);color:#fff}\n.btn-ghost:hover{background:rgba(255,255,255,.2)}\n.btn-primary{background:var(--seal);color:#fff}\n.btn-primary:hover{background:#A93029}\n.btn:focus-visible{outline:2px solid #fff;outline-offset:2px}\n\n/* 레이아웃 */\n.layout{display:grid;grid-template-columns:430px 1fr;gap:0;height:calc(100vh - 58px)}\n.builder{background:var(--paper);border-right:1px solid var(--line);overflow-y:auto;padding:22px 20px 80px}\n.stage{overflow-y:auto;padding:34px 38px 90px;display:flex;justify-content:center;align-items:flex-start}\n\n/* 빌더 */\n.b-section{border:1px solid var(--line);border-radius:12px;margin-bottom:12px;background:#fff;overflow:hidden}\n.b-head{display:flex;align-items:center;gap:11px;padding:13px 15px;cursor:pointer;user-select:none;background:#fff}\n.b-head:hover{background:#FAFBFD}\n.b-title{flex:1;min-width:0}\n.b-title b{display:block;font-size:13.5px;font-weight:700}\n.b-title small{font-size:11px;color:var(--ink-soft)}\n.chev{color:#9AA4B5;font-size:11px;transition:.2s}\n.chev.open{transform:rotate(90deg)}\n.b-body{padding:4px 15px 16px;border-top:1px solid var(--line-soft)}\n.hint{font-size:11.5px;line-height:1.65;color:var(--ink-soft);background:var(--hint);border-left:3px solid var(--navy);padding:9px 11px;border-radius:0 7px 7px 0;margin:12px 0}\n.hint.warn{border-left-color:var(--seal);background:var(--seal-bg);color:#8A3A36}\n\n/* 토글 */\n.toggle{position:relative;width:38px;height:22px;flex:none}\n.toggle input{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;z-index:2}\n.toggle i{position:absolute;inset:0;background:#CBD3E0;border-radius:999px;transition:.18s}\n.toggle i::after{content:\"\";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.18s;box-shadow:0 1px 2px rgba(0,0,0,.25)}\n.toggle input:checked + i{background:var(--ok)}\n.toggle input:checked + i::after{left:19px}\n.toggle input:disabled + i{background:var(--navy);opacity:.85;cursor:not-allowed}\n.toggle input:focus-visible + i{outline:2px solid var(--navy);outline-offset:2px}\n\n/* 입력 */\n.fld{margin-top:10px}\n.fld label{display:block;font-size:11.5px;font-weight:600;color:var(--ink-soft);margin-bottom:4px}\n.fld input[type=text],.fld textarea{width:100%;font-family:inherit;font-size:13px;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:#fff;transition:.12s}\n.fld textarea{resize:vertical;min-height:54px;line-height:1.55}\n.fld input:focus,.fld textarea:focus{outline:none;border-color:var(--navy);box-shadow:0 0 0 3px rgba(35,52,79,.1)}\n.row-card{border:1px dashed var(--line);border-radius:10px;padding:11px 12px 13px;margin-top:12px;position:relative;background:#FCFDFE}\n.row-card .del{position:absolute;top:8px;right:8px;border:none;background:none;color:#A9B2C2;font-size:15px;cursor:pointer;line-height:1;padding:3px 6px;border-radius:6px}\n.row-card .del:hover{color:var(--seal);background:var(--seal-bg)}\n.add-row{margin-top:11px;width:100%;border:1px dashed #B9C2D2;background:none;color:var(--navy);font-family:inherit;font-size:12.5px;font-weight:600;border-radius:9px;padding:8px;cursor:pointer}\n.add-row:hover{background:var(--hint);border-color:var(--navy)}\n.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}\n.chip{font-size:12px;font-weight:600;border:1px solid var(--line);border-radius:999px;padding:6px 13px;cursor:pointer;background:#fff;color:var(--ink-soft);font-family:inherit;transition:.12s}\n.chip.sel{background:var(--navy);border-color:var(--navy);color:#fff}\n.group-label{font-size:11px;font-weight:800;letter-spacing:.08em;color:#8A93A6;margin:22px 2px 9px;text-transform:uppercase}\n.req-switch{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12px;font-weight:600;color:var(--ink-soft)}\n.req-switch .seg{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}\n.req-switch .seg button{font-family:inherit;font-size:11.5px;font-weight:700;border:none;background:#fff;color:var(--ink-soft);padding:5px 12px;cursor:pointer}\n.req-switch .seg button.on-req{background:var(--seal);color:#fff}\n.req-switch .seg button.on-opt{background:var(--navy);color:#fff}\n\n/* ── 오프라인 서식 (인쇄형 공문서) ── */\n.sheet{width:794px;max-width:100%;background:var(--paper);box-shadow:0 2px 6px rgba(22,34,58,.08),0 18px 44px rgba(22,34,58,.13);padding:64px 62px 58px;position:relative}\n.sheet::before{content:\"\";position:absolute;top:0;left:0;right:0;height:5px;background:var(--navy-deep)}\n.doc{font-family:'Noto Sans KR',sans-serif;font-size:12.5px;line-height:1.7;color:#111}\n.doc .d-title{font-family:'Noto Serif KR',serif;font-weight:900;font-size:27px;text-align:center;letter-spacing:.14em;color:#10192B}\n.doc .d-title-rule{width:54px;height:3px;background:var(--seal);margin:16px auto 22px}\n.doc .d-intro{font-size:12.5px;color:#222;text-align:justify;margin-bottom:8px}\n.doc .d-sec{margin-top:26px}\n.doc .d-sec-h{display:flex;align-items:baseline;gap:8px;font-family:'Noto Serif KR',serif;font-size:15.5px;font-weight:900;color:#10192B;border-bottom:2px solid #10192B;padding-bottom:7px;margin-bottom:11px}\n.doc .d-sec-h .no{color:var(--seal)}\n.doc .badge{font-family:'Noto Sans KR',sans-serif;font-size:10px;font-weight:700;border-radius:4px;padding:2px 7px;letter-spacing:.05em;transform:translateY(-2px)}\n.doc .badge.req,.oc .badge.req{background:var(--seal);color:#fff}\n.doc .badge.opt,.oc .badge.opt{background:#E7ECF4;color:#33415C}\n.doc table{width:100%;border-collapse:collapse;table-layout:fixed}\n.doc th,.doc td{border:1px solid #8E99AC;padding:8px 10px;font-size:12px;vertical-align:top;word-break:keep-all;overflow-wrap:break-word}\n.doc th{background:#F0F3F8;font-weight:700;text-align:center;color:#1B2434}\n.doc td{background:#fff}\n.doc td.hl{font-weight:700;text-decoration:underline;text-underline-offset:3px}\n.doc .d-notice{margin-top:9px;font-size:11.8px;color:#222;background:#F7F8FB;border:1px solid #E3E8F0;padding:9px 12px;text-align:justify}\n.doc .d-notice b{color:var(--seal)}\n.doc .d-consent{margin-top:10px;border:1.6px solid #10192B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}\n.doc .d-consent .q{font-weight:700;font-size:12.5px}\n.doc .d-consent .opts{display:flex;gap:22px;font-size:12.5px;font-weight:700}\n.doc .cbox{display:inline-block;width:13px;height:13px;border:1.6px solid #10192B;vertical-align:-2px;margin-right:6px}\n.doc .d-sign{margin-top:42px;text-align:center}\n.doc .d-sign .date{font-size:13.5px;letter-spacing:.35em;margin-bottom:26px}\n.doc .sign-row{display:flex;justify-content:flex-end;align-items:baseline;gap:14px;font-size:13px;margin-top:11px}\n.doc .sign-line{display:inline-block;width:170px;border-bottom:1px solid #10192B;text-align:left;padding:0 4px 2px;color:#aaa;font-size:11px}\n.doc .sign-seal{color:#666;font-size:11.5px}\n.doc .d-org{margin-top:40px;text-align:center;font-family:'Noto Serif KR',serif;font-size:17px;font-weight:900;letter-spacing:.22em;color:#10192B}\n.doc .d-foot{margin-top:14px;text-align:center;font-size:10.5px;color:#8A93A6}\n\n/* ── 온라인 동의 화면 ── */\n.online-wrap{width:460px;max-width:100%}\n.online-cap{text-align:center;font-size:12px;color:var(--ink-soft);margin-bottom:14px}\n.oc{background:#fff;border-radius:18px;box-shadow:0 2px 6px rgba(22,34,58,.07),0 22px 52px rgba(22,34,58,.14);overflow:hidden;font-family:'Noto Sans KR',sans-serif}\n.oc-head{background:var(--navy-deep);color:#fff;padding:22px 24px 20px}\n.oc-head .org{font-size:11.5px;color:#9AA8C0;font-weight:600;letter-spacing:.06em;margin-bottom:5px}\n.oc-head h2{font-size:18px;font-weight:800;letter-spacing:-.01em}\n.oc-head p{font-size:12px;color:#C2CBDC;margin-top:7px;line-height:1.6}\n.oc-body{padding:18px 20px 22px}\n.oc-all{display:flex;align-items:center;gap:11px;border:1.8px solid var(--navy-deep);border-radius:12px;padding:14px 15px;cursor:pointer;user-select:none;background:#fff;transition:.15s}\n.oc-all.checked{background:#F2F5FA}\n.oc-all b{font-size:14.5px}\n.oc-all small{display:block;font-size:11px;color:var(--ink-soft);font-weight:400;margin-top:1px}\n.oc-item{border-bottom:1px solid var(--line-soft)}\n.oc-item:last-of-type{border-bottom:none}\n.oc-item-row{display:flex;align-items:center;gap:11px;padding:13px 4px}\n.oc-item-row .lbl{flex:1;min-width:0;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;flex-wrap:wrap}\n.oc .badge{font-size:9.5px;font-weight:800;border-radius:4px;padding:2px 6px;letter-spacing:.04em;flex:none}\n.oc-view{flex:none;border:none;background:none;font-family:inherit;font-size:11.5px;font-weight:600;color:#7C879B;cursor:pointer;padding:5px 7px;border-radius:6px;display:flex;align-items:center;gap:3px}\n.oc-view:hover{background:var(--hint);color:var(--navy)}\n.oc-detail{margin:0 4px 14px;padding:13px 14px;background:#F7F8FB;border:1px solid #E3E8F0;border-radius:10px;font-size:11.5px;line-height:1.65}\n.oc-detail table{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:9px}\n.oc-detail th,.oc-detail td{border:1px solid #C8D0DE;padding:6px 8px;font-size:11px;vertical-align:top;word-break:keep-all}\n.oc-detail th{background:#ECF0F6;font-weight:700;text-align:center}\n.oc-detail td{background:#fff}\n.oc-detail td.hl{font-weight:700;text-decoration:underline;text-underline-offset:2px}\n.oc-detail .nt{color:#333}\n.oc-detail .nt b{color:var(--seal)}\n.oc-sub{margin:2px 4px 13px;padding:5px 12px 9px;border:1px dashed #C8D0DE;border-radius:10px}\n.oc-sub .oc-item-row{padding:9px 0}\n.oc-sub .oc-item-row .lbl{font-size:12.5px;font-weight:500}\n.ck{appearance:none;-webkit-appearance:none;width:21px;height:21px;border:1.8px solid #B6BfCE;border-radius:6px;cursor:pointer;flex:none;position:relative;transition:.13s;background:#fff}\n.ck:checked{background:var(--ok);border-color:var(--ok)}\n.ck:checked::after{content:\"\";position:absolute;left:6px;top:2.5px;width:5px;height:10px;border:solid #fff;border-width:0 2.4px 2.4px 0;transform:rotate(43deg)}\n.ck:focus-visible{outline:2px solid var(--navy);outline-offset:2px}\n.oc-all .ck{width:24px;height:24px}\n.oc-all .ck:checked{background:var(--navy-deep);border-color:var(--navy-deep)}\n.oc-minor{margin-top:14px;font-size:11.5px;line-height:1.6;color:#8A3A36;background:var(--seal-bg);border:1px solid #F0D9D7;border-radius:10px;padding:11px 13px}\n.oc-submit{margin-top:18px;width:100%;border:none;border-radius:12px;padding:15px;font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;background:var(--navy-deep);color:#fff;transition:.15s}\n.oc-submit:hover:not(:disabled){background:#0F1830}\n.oc-submit:disabled{background:#D4DAE5;color:#949DB0;cursor:not-allowed}\n.oc-foot{text-align:center;font-size:10.5px;color:#9AA4B5;padding:0 20px 18px}\n.oc-done{padding:46px 24px;text-align:center}\n.oc-done .ic{width:54px;height:54px;border-radius:50%;background:#E8F4EE;color:var(--ok);font-size:26px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}\n.oc-done h3{font-size:17px;font-weight:800;margin-bottom:8px}\n.oc-done p{font-size:12.5px;color:var(--ink-soft);line-height:1.7}\n.oc-done .res{margin-top:16px;text-align:left;font-size:11.5px;background:#F7F8FB;border:1px solid #E3E8F0;border-radius:10px;padding:12px 14px;line-height:1.9}\n.oc-done .res .y{color:var(--ok);font-weight:700}\n.oc-done .res .n{color:#A0AAB9}\n.oc-reset{margin-top:16px;border:1px solid var(--line);background:#fff;border-radius:9px;font-family:inherit;font-size:12px;font-weight:600;color:var(--ink-soft);padding:8px 16px;cursor:pointer}\n\n/* 모바일 */\n.mobile-tabs{display:none}\n@media (max-width:980px){\n  .layout{display:block;height:auto}\n  .builder{border-right:none;display:none;padding-bottom:40px}\n  .stage{display:none;padding:20px 12px 60px}\n  .builder.active{display:block}\n  .stage.active{display:flex}\n  .sheet{padding:34px 22px}\n  .mobile-tabs{display:flex;position:sticky;top:58px;z-index:30;background:#fff;border-bottom:1px solid var(--line)}\n  .mobile-tabs button{flex:1;border:none;background:none;font-family:inherit;font-size:13.5px;font-weight:700;padding:13px;color:var(--ink-soft);border-bottom:2.5px solid transparent;cursor:pointer}\n  .mobile-tabs button.on{color:var(--navy-deep);border-bottom-color:var(--seal)}\n  .topbar{flex-wrap:wrap;height:auto;padding:10px 14px;gap:10px}\n  .topbar .actions{margin-left:auto}\n  .topbar .actions .btn{padding:8px 12px;font-size:12px}\n  .brand span{display:none}\n}\n\n/* 인쇄 */\n@media print{\n  .topbar,.builder,.mobile-tabs,.online-cap{display:none!important}\n  .app{background:#fff}\n  .layout{display:block;height:auto}\n  .stage{display:block!important;padding:0;overflow:visible}\n  .sheet{width:100%;box-shadow:none;padding:10mm 6mm}\n  .sheet::before{display:none}\n  .doc .d-sec{break-inside:avoid}\n}\n@media (prefers-reduced-motion:reduce){*{transition:none!important}}\n";

  var uid = 100;
  function nid() {
    return ++uid;
  }

  /* ── 섹션 정의 (법적 필수 기재사항) ────────────────────── */
  var SECTION_DEFS = {
    essential: {
      label: "개인정보 수집·이용 동의",
      short: "개인정보 수집·이용",
      required: true,
      law: "개인정보보호법 제15조 · 제22조",
      locked: true,
      columns: [
        {
          key: "purpose",
          label: "수집·이용 목적",
          ph: "회원 가입 및 본인 확인",
        },
        { key: "items", label: "수집 항목", ph: "성명, 휴대전화번호, 이메일" },
        { key: "period", label: "보유·이용 기간", ph: "회원 탈퇴 시까지" },
      ],
      notice:
        "귀하는 위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 대한 동의를 거부하실 경우 서비스 제공(계약 체결·이행)이 제한될 수 있습니다.",
      hint: "서비스 제공에 반드시 필요한 최소한의 항목만 필수로 지정해야 합니다(최소수집 원칙, 법 제16조).",
      builderLabel: "수집·이용 동의 (필수)",
    },
    optional: {
      label: "선택 개인정보 수집·이용 동의",
      short: "선택 정보 수집·이용",
      required: false,
      law: "개인정보보호법 제15조 · 제22조",
      columns: [
        { key: "purpose", label: "수집·이용 목적", ph: "맞춤형 서비스 제공" },
        { key: "items", label: "수집 항목", ph: "생년월일, 직업" },
        { key: "period", label: "보유·이용 기간", ph: "회원 탈퇴 시까지" },
      ],
      notice:
        "귀하는 위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있으며, 동의를 거부하시더라도 서비스 이용에 어떠한 불이익도 없습니다.",
      hint: "선택 동의 거부를 이유로 서비스 제공을 거부할 수 없습니다(법 제22조 제5항).",
      builderLabel: "수집·이용 동의 (선택)",
    },
    sensitive: {
      label: "민감정보 수집·이용 동의",
      short: "민감정보 수집·이용",
      required: false,
      law: "개인정보보호법 제23조",
      columns: [
        { key: "items", label: "민감정보 항목", ph: "건강정보(질병 이력)" },
        {
          key: "purpose",
          label: "수집·이용 목적",
          ph: "맞춤형 건강관리 서비스 제공",
        },
        { key: "period", label: "보유·이용 기간", ph: "서비스 종료 시까지" },
      ],
      notice:
        "민감정보는 다른 개인정보와 구분하여 별도로 동의를 받습니다. 귀하는 동의를 거부할 권리가 있으며, 거부 시 해당 서비스 이용이 제한될 수 있습니다.",
      hint: "사상·신념, 건강, 성생활, 유전정보, 범죄경력 등은 반드시 별도 구분 동의가 필요합니다. 서비스 필수 요건이면 빌더에서 '필수'로 전환하세요.",
      builderLabel: "민감정보 수집·이용 동의",
      canSetRequired: true,
    },
    unique: {
      label: "고유식별정보 처리 동의",
      short: "고유식별정보 처리",
      required: false,
      law: "개인정보보호법 제24조",
      columns: [
        {
          key: "items",
          label: "고유식별정보 항목",
          ph: "여권번호, 외국인등록번호",
        },
        { key: "purpose", label: "처리 목적", ph: "본인 확인(실명 인증)" },
        {
          key: "period",
          label: "보유·이용 기간",
          ph: "본인 확인 후 즉시 파기",
        },
      ],
      notice:
        "고유식별정보는 다른 개인정보와 구분하여 별도로 동의를 받습니다. 귀하는 동의를 거부할 권리가 있으며, 거부 시 본인 확인이 필요한 서비스 이용이 제한될 수 있습니다.",
      hint: "⚠ 주민등록번호는 정보주체의 동의만으로는 처리할 수 없으며, 법령에 구체적 근거가 있는 경우에만 처리 가능합니다(법 제24조의2).",
      builderLabel: "고유식별정보 처리 동의",
      canSetRequired: true,
    },
    thirdParty: {
      label: "개인정보 제3자 제공 동의",
      short: "제3자 제공",
      required: false,
      law: "개인정보보호법 제17조",
      columns: [
        { key: "recipient", label: "제공받는 자", ph: "(주)○○물류" },
        { key: "purpose", label: "제공받는 자의 이용 목적", ph: "상품 배송" },
        { key: "items", label: "제공 항목", ph: "성명, 주소, 휴대전화번호" },
        { key: "period", label: "보유·이용 기간", ph: "배송 완료 후 3개월" },
      ],
      notice:
        "귀하는 위 개인정보 제3자 제공에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부하실 경우 해당 서비스(배송 등) 이용이 제한될 수 있습니다.",
      hint: "제공받는 자, 목적, 항목, 보유기간 4가지를 모두 알리고 별도 동의를 받아야 합니다.",
      builderLabel: "제3자 제공 동의",
      canSetRequired: true,
    },
    overseas: {
      label: "개인정보 국외 이전 동의",
      short: "국외 이전",
      required: false,
      law: "개인정보보호법 제28조의8",
      columns: [
        { key: "items", label: "이전 항목", ph: "이메일, 서비스 이용기록" },
        { key: "country", label: "이전 국가", ph: "미국" },
        {
          key: "method",
          label: "이전 일시·방법",
          ph: "서비스 이용 시점에 네트워크를 통한 전송",
        },
        {
          key: "recipient",
          label: "이전받는 자(연락처)",
          ph: "AWS Inc. (privacy@aws.com)",
        },
        { key: "purpose", label: "이용 목적", ph: "클라우드 서버 보관·운영" },
        { key: "period", label: "보유·이용 기간", ph: "회원 탈퇴 시까지" },
      ],
      notice:
        "귀하는 위 개인정보 국외 이전에 대한 동의를 거부할 권리가 있습니다. 동의 거부는 고객센터 또는 개인정보보호 책임자에게 요청하실 수 있으며, 동의를 거부하실 경우 국외 이전이 수반되는 서비스 이용이 제한될 수 있습니다.",
      hint: "이전 항목·국가·일시·방법, 이전받는 자(명칭·연락처), 목적·보유기간, 거부 방법·절차·효과를 모두 알려야 합니다.",
      builderLabel: "국외 이전 동의",
      canSetRequired: true,
    },
  };

  var SEC_ORDER = [
    "essential",
    "optional",
    "sensitive",
    "unique",
    "thirdParty",
    "overseas",
  ];
  var MKT_CHANNELS = ["이메일", "문자(SMS/MMS)", "전화", "앱 푸시", "우편"];

  function emptyRow(key) {
    var o = {};
    SECTION_DEFS[key].columns.forEach(function (c) {
      o[c.key] = "";
    });
    return o;
  }
  function mkRow(key) {
    var r = emptyRow(key);
    r.id = nid();
    return r;
  }

  /* ── 상태 ─────────────────────────────────────────────── */
  var S = {
    org: "주식회사 ○○○",
    docTitle: "개인정보 수집·이용 동의서",
    intro:
      "당사는 「개인정보 보호법」에 따라 아래와 같이 개인정보를 수집·이용하고자 합니다. 내용을 자세히 읽으신 후 동의 여부를 결정하여 주시기 바랍니다.",
    sections: {
      essential: {
        on: true,
        required: true,
        rows: [
          {
            id: nid(),
            purpose: "회원 가입 및 본인 확인, 서비스 제공",
            items: "성명, 휴대전화번호, 이메일",
            period: "회원 탈퇴 시까지",
          },
        ],
      },
      optional: { on: false, required: false, rows: [mkRow("optional")] },
      sensitive: { on: false, required: false, rows: [mkRow("sensitive")] },
      unique: { on: false, required: false, rows: [mkRow("unique")] },
      thirdParty: { on: false, required: false, rows: [mkRow("thirdParty")] },
      overseas: { on: false, required: false, rows: [mkRow("overseas")] },
    },
    marketing: {
      on: false,
      channels: ["이메일", "문자(SMS/MMS)"],
      purpose: "이벤트·혜택 등 광고성 정보 전송",
      items: "성명, 휴대전화번호, 이메일",
      period: "동의 철회 시 또는 회원 탈퇴 시까지",
    },
    minor: { on: false },
  };

  /* 빌더/미리보기 UI 상태 */
  var open = { doc: true, essential: true }; // 접힘/펼침
  var mode = "online"; // offline | online
  var tab = "build"; // build | preview (모바일)
  var online = { checks: {}, expand: {}, done: false }; // 온라인 데모 상태
  var lastItemSig = "";

  /* ── 공통 ─────────────────────────────────────────────── */
  function activeSections() {
    return SEC_ORDER.filter(function (k) {
      return S.sections[k].on;
    }).map(function (k) {
      return {
        key: k,
        def: SECTION_DEFS[k],
        rows: S.sections[k].rows,
        required:
          k === "essential"
            ? true
            : k === "optional"
              ? false
              : !!S.sections[k].required,
      };
    });
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function findRow(key, id) {
    return S.sections[key].rows.filter(function (r) {
      return String(r.id) === String(id);
    })[0];
  }

  /* ════════════════════════════════════════════════════════
     1) 오프라인 서식 미리보기 (HTML 문자열)
     ════════════════════════════════════════════════════════ */
  function tableHTML(def, rows) {
    var ths = def.columns
      .map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      })
      .join("");
    var trs = rows
      .map(function (r) {
        return (
          "<tr>" +
          def.columns
            .map(function (c) {
              var v = r[c.key]
                ? esc(r[c.key])
                : '<span style="color:#bbb">—</span>';
              return "<td>" + v + "</td>";
            })
            .join("") +
          "</tr>"
        );
      })
      .join("");
    return (
      "<table><thead><tr>" +
      ths +
      "</tr></thead><tbody>" +
      trs +
      "</tbody></table>"
    );
  }
  function consentRow(q) {
    return (
      '<div class="d-consent"><span class="q">' +
      esc(q) +
      "</span>" +
      '<span class="opts"><span><span class="cbox"></span>동의함</span>' +
      '<span><span class="cbox"></span>동의하지 않음</span></span></div>'
    );
  }
  function docHTML() {
    var secs = activeSections(),
      no = 0,
      html = "";
    html +=
      '<div class="d-title">' +
      (esc(S.docTitle) || "개인정보 수집·이용 동의서") +
      "</div>";
    html += '<div class="d-title-rule"></div>';
    html += '<p class="d-intro">' + esc(S.intro) + "</p>";

    secs.forEach(function (s) {
      no += 1;
      html +=
        '<div class="d-sec"><div class="d-sec-h"><span class="no">' +
        no +
        ".</span><span>" +
        esc(s.def.label) +
        '</span><span class="badge ' +
        (s.required ? "req" : "opt") +
        '">' +
        (s.required ? "필수" : "선택") +
        "</span></div>";
      html += tableHTML(s.def, s.rows);
      html += '<p class="d-notice">※ <b>' + esc(s.def.notice) + "</b></p>";
      html += consentRow("위 " + s.def.short + "에 동의하십니까?");
      html += "</div>";
    });

    if (S.marketing.on) {
      no += 1;
      var m = S.marketing;
      html +=
        '<div class="d-sec"><div class="d-sec-h"><span class="no">' +
        no +
        '.</span><span>마케팅·광고성 정보 수신 동의</span><span class="badge opt">선택</span></div>';
      html +=
        "<table><thead><tr><th>이용 목적</th><th>이용 항목</th><th>보유·이용 기간</th></tr></thead><tbody><tr>" +
        "<td>" +
        (esc(m.purpose) || "—") +
        '</td><td>' +
        (esc(m.items) || "—") +
        '</td><td>' +
        (esc(m.period) || "—") +
        "</td></tr></tbody></table>";
      html +=
        '<p class="d-notice">※ <b>동의를 거부하셔도 서비스 이용에 제한이 없으며,</b> 동의 이후에도 언제든지 수신을 철회할 수 있습니다. 광고성 정보는 오후 9시부터 다음 날 오전 8시까지 별도 동의 없이 전송되지 않습니다.</p>';
      html +=
        '<div class="d-consent" style="flex-direction:column;align-items:stretch"><span class="q" style="margin-bottom:6px">수신 채널별 동의 여부를 선택해 주십시오.</span>';
      html += m.channels
        .map(function (ch) {
          return (
            '<div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px dashed #C7CEDB"><span style="font-size:12.5px">' +
            esc(ch) +
            ' 수신</span><span class="opts"><span><span class="cbox"></span>동의함</span><span><span class="cbox"></span>동의하지 않음</span></span></div>'
          );
        })
        .join("");
      html += "</div></div>";
    }

    if (S.minor.on) {
      no += 1;
      html +=
        '<div class="d-sec"><div class="d-sec-h"><span class="no">' +
        no +
        '.</span><span>만 14세 미만 아동의 법정대리인 동의</span><span class="badge req">필수</span></div>';
      html +=
        '<p class="d-notice">※ <b>만 14세 미만 아동의 개인정보를 처리하기 위해서는 법정대리인의 동의가 필요합니다(개인정보보호법 제22조의2).</b> 법정대리인 확인을 위해 법정대리인의 성명·연락처를 수집하며, 동의 확인 목적 달성 후 지체 없이 파기합니다.</p>';
      html +=
        '<table><thead><tr><th style="width:26%">아동 성명</th><th style="width:26%">법정대리인 성명</th><th style="width:22%">관계</th><th>법정대리인 연락처</th></tr></thead><tbody><tr><td style="height:30px"></td><td></td><td></td><td></td></tr></tbody></table>';
      html += consentRow(
        "법정대리인으로서 위 아동의 개인정보 처리에 동의하십니까?",
      );
      html += "</div>";
    }

    html += '<div class="d-sign"><div class="date">20　　년　　월　　일</div>';
    html +=
      '<div class="sign-row"><span>성명 :</span><span class="sign-line">&nbsp;</span><span class="sign-seal">(서명 또는 인)</span></div>';
    if (S.minor.on)
      html +=
        '<div class="sign-row"><span>법정대리인 :</span><span class="sign-line">&nbsp;</span><span class="sign-seal">(서명 또는 인)</span></div>';
    html += "</div>";
    html += '<div class="d-org">' + (esc(S.org) || "주식회사 ○○○") + "</div>";

    return '<div class="doc" id="consent-doc">' + html + "</div>";
  }

  /* ════════════════════════════════════════════════════════
     2) 온라인 동의 화면 미리보기 (인터랙티브 데모)
     ════════════════════════════════════════════════════════ */
  function currentItemKeys() {
    var keys = [];
    activeSections().forEach(function (s) {
      s.rows.forEach(function (r) { keys.push(s.key + ":" + r.id); });
    });
    if (S.marketing.on)
      S.marketing.channels.forEach(function (c) {
        keys.push("mkt:" + c);
      });
    if (S.minor.on) keys.push("minor");
    return keys;
  }
  function detailTableHTML(def, rows) {
    return (
      '<div class="oc-detail">' +
      tableHTML(def, rows) +
      '<div class="nt">※ <b>' +
      esc(def.notice) +
      "</b></div></div>"
    );
  }
  function onlineHTML() {
    var secs = activeSections(),
      m = S.marketing,
      minor = S.minor;
    var itemKeys = currentItemKeys();

    /* 빌더에서 항목이 바뀌면 사라진 키 정리 + 데모 결과 초기화 */
    var sig = itemKeys.join("|");
    var pruned = {};
    itemKeys.forEach(function (k) {
      if (online.checks[k]) pruned[k] = true;
    });
    online.checks = pruned;
    if (sig !== lastItemSig) {
      online.done = false;
      lastItemSig = sig;
    }

    var requiredKeys = [];
    secs.filter(function (s) { return s.required; }).forEach(function (s) {
      s.rows.forEach(function (r) { requiredKeys.push(s.key + ":" + r.id); });
    });
    if (minor.on) requiredKeys.push("minor");
    var allChecked =
      itemKeys.length > 0 &&
      itemKeys.every(function (k) {
        return online.checks[k];
      });
    var reqOk = requiredKeys.every(function (k) {
      return online.checks[k];
    });

    if (online.done) {
      var res = secs
        .map(function (s) {
          var allRowsOk = s.rows.every(function (r) {
            return online.checks[s.key + ":" + r.id];
          });
          return (
            "<div>" +
            esc(s.def.short) +
            " — " +
            (allRowsOk
              ? '<span class="y">동의</span>'
              : '<span class="n">미동의</span>') +
            "</div>"
          );
        })
        .join("");
      if (m.on)
        res += m.channels
          .map(function (ch) {
            return (
              "<div>마케팅 수신(" +
              esc(ch) +
              ") — " +
              (online.checks["mkt:" + ch]
                ? '<span class="y">동의</span>'
                : '<span class="n">미동의</span>') +
              "</div>"
            );
          })
          .join("");
      if (minor.on)
        res +=
          "<div>법정대리인 동의 — " +
          (online.checks.minor
            ? '<span class="y">동의</span>'
            : '<span class="n">미동의</span>') +
          "</div>";
      return (
        '<div class="oc" role="region" aria-label="동의 완료"><div class="oc-done"><div class="ic">✓</div>' +
        "<h3>동의가 완료되었습니다</h3><p>선택하신 동의 내역은 아래와 같습니다.<br>동의 내역은 언제든지 철회하실 수 있습니다.</p>" +
        '<div class="res">' +
        res +
        "</div>" +
        '<button class="oc-reset" data-act="o-reset">데모 다시 보기</button></div></div>'
      );
    }

    var items = secs
      .map(function (s) {
        return s.rows
          .map(function (r, idx) {
            var rowKey = s.key + ":" + r.id;
            var domId = "ock-" + s.key + "-" + r.id;
            var label = r.purpose || s.def.label + (s.rows.length > 1 ? " " + (idx + 1) : "");
            return (
              '<div class="oc-item"><div class="oc-item-row">' +
              '<input type="checkbox" class="ck" id="' +
              domId +
              '" data-act="o-toggle" data-key="' +
              esc(rowKey) +
              '"' +
              (online.checks[rowKey] ? " checked" : "") +
              ">" +
              '<label class="lbl" for="' +
              domId +
              '"><span class="badge ' +
              (s.required ? "req" : "opt") +
              '">' +
              (s.required ? "필수" : "선택") +
              "</span>" +
              esc(label) +
              "</label>" +
              '<button type="button" class="oc-view" data-act="o-view" data-key="' +
              esc(rowKey) +
              '" aria-expanded="' +
              (online.expand[rowKey] ? "true" : "false") +
              '">' +
              (online.expand[rowKey] ? "닫기 ▲" : "보기 ▼") +
              "</button>" +
              "</div>" +
              (online.expand[rowKey] ? detailTableHTML(s.def, [r]) : "") +
              "</div>"
            );
          })
          .join("");
      })
      .join("");

    var mktItem = "";
    if (m.on) {
      var mktAllChecked =
        m.channels.length > 0 &&
        m.channels.every(function (c) {
          return online.checks["mkt:" + c];
        });
      var detail = online.expand.mkt
        ? '<div class="oc-detail"><table><thead><tr><th>이용 목적</th><th>이용 항목</th><th>보유·이용 기간</th></tr></thead><tbody><tr>' +
          "<td>" +
          (esc(m.purpose) || "—") +
          '</td><td class="hl">' +
          (esc(m.items) || "—") +
          '</td><td class="hl">' +
          (esc(m.period) || "—") +
          "</td></tr></tbody></table>" +
          '<div class="nt">※ <b>동의를 거부하셔도 서비스 이용에 제한이 없으며,</b> 언제든지 수신을 철회할 수 있습니다. 광고성 정보는 오후 9시~다음 날 오전 8시 사이에 별도 동의 없이 전송되지 않습니다.</div></div>'
        : "";
      var subs = m.channels
        .map(function (ch) {
          var cid = "ock-mkt-" + esc(ch);
          return (
            '<div class="oc-item-row"><input type="checkbox" class="ck" id="' +
            cid +
            '" data-act="o-toggle" data-key="mkt:' +
            esc(ch) +
            '"' +
            (online.checks["mkt:" + ch] ? " checked" : "") +
            ">" +
            '<label class="lbl" for="' +
            cid +
            '">' +
            esc(ch) +
            " 수신 동의</label></div>"
          );
        })
        .join("");
      mktItem =
        '<div class="oc-item"><div class="oc-item-row">' +
        '<input type="checkbox" class="ck" id="ock-mkt-all" data-act="o-mkt-all"' +
        (mktAllChecked ? " checked" : "") +
        ">" +
        '<label class="lbl" for="ock-mkt-all"><span class="badge opt">선택</span>마케팅·광고성 정보 수신 동의</label>' +
        '<button type="button" class="oc-view" data-act="o-mkt-view" aria-expanded="' +
        (online.expand.mkt ? "true" : "false") +
        '">' +
        (online.expand.mkt ? "닫기 ▲" : "보기 ▼") +
        "</button>" +
        "</div>" +
        detail +
        '<div class="oc-sub">' +
        subs +
        "</div></div>";
    }

    var minorItem = "";
    if (minor.on) {
      minorItem =
        '<div class="oc-item"><div class="oc-item-row">' +
        '<input type="checkbox" class="ck" id="ock-minor" data-act="o-toggle" data-key="minor"' +
        (online.checks.minor ? " checked" : "") +
        ">" +
        '<label class="lbl" for="ock-minor"><span class="badge req">필수</span>법정대리인 동의 (만 14세 미만)</label></div>' +
        '<div class="oc-minor">만 14세 미만 아동의 개인정보 처리에는 법정대리인의 동의가 필요합니다(개인정보보호법 제22조의2). 본인이 법정대리인임을 확인하며, 동의 확인을 위해 수집된 법정대리인 정보는 목적 달성 후 지체 없이 파기됩니다.</div></div>';
    }

    return (
      '<div class="oc" role="form" aria-label="개인정보 동의">' +
      '<div class="oc-head"><div class="org">' +
      (esc(S.org) || "주식회사 ○○○") +
      "</div>" +
      "<h2>" +
      (esc(S.docTitle) || "개인정보 수집·이용 동의") +
      "</h2><p>" +
      esc(S.intro) +
      "</p></div>" +
      '<div class="oc-body">' +
      '<label class="oc-all ' +
      (allChecked ? "checked" : "") +
      '">' +
      '<input type="checkbox" class="ck" data-act="o-all"' +
      (allChecked ? " checked" : "") +
      ' aria-label="전체 동의">' +
      "<span><b>전체 동의하기</b><small>선택 항목 포함 모든 항목에 동의합니다. 선택 항목은 동의하지 않아도 서비스를 이용할 수 있습니다.</small></span></label>" +
      '<div style="margin-top:8px">' +
      items +
      mktItem +
      minorItem +
      "</div>" +
      '<button class="oc-submit" data-act="o-submit"' +
      (reqOk ? "" : " disabled") +
      ">" +
      (reqOk ? "동의하고 계속하기" : "필수 항목에 동의해 주세요") +
      "</button>" +
      "</div>" +
      "</div></div>"
    );
  }

  /* ════════════════════════════════════════════════════════
     3) 빌더 패널 (HTML 문자열)
     ════════════════════════════════════════════════════════ */
  function fieldHTML(label, value, attrs, area, ph) {
    var inner = area
      ? "<textarea " +
        attrs +
        ' placeholder="' +
        esc(ph) +
        '">' +
        esc(value) +
        "</textarea>"
      : '<input type="text" ' +
        attrs +
        ' value="' +
        esc(value) +
        '" placeholder="' +
        esc(ph) +
        '">';
    return (
      '<div class="fld"><label>' + esc(label) + "</label>" + inner + "</div>"
    );
  }

  function sectionEditorHTML(key) {
    var def = SECTION_DEFS[key],
      sec = S.sections[key],
      isOpen = !!open[key];
    var head =
      '<div class="b-head" data-act="toggle-open" data-key="' +
      key +
      '" role="button" tabindex="0">' +
      '<span class="chev ' +
      (isOpen ? "open" : "") +
      '">▶</span>' +
      '<div class="b-title"><b>' +
      esc(def.builderLabel) +
      "</b><small>" +
      esc(def.law) +
      "</small></div>" +
      '<span class="toggle" data-act="stop"><input type="checkbox" data-act="toggle-on" data-key="' +
      key +
      '"' +
      (sec.on ? " checked" : "") +
      (def.locked ? " disabled" : "") +
      ' aria-label="' +
      esc(def.builderLabel) +
      ' 포함"><i></i></span></div>';

    if (!isOpen) return '<div class="b-section">' + head + "</div>";

    var body = '<div class="b-body">';
    body +=
      '<div class="hint ' +
      (def.hint.indexOf("⚠") === 0 ? "warn" : "") +
      '">' +
      esc(def.hint) +
      "</div>";
    if (def.canSetRequired) {
      body +=
        '<div class="req-switch">동의 구분<span class="seg">' +
        '<button type="button" class="' +
        (sec.required ? "on-req" : "") +
        '" data-act="set-req" data-key="' +
        key +
        '" data-val="1">필수</button>' +
        '<button type="button" class="' +
        (!sec.required ? "on-opt" : "") +
        '" data-act="set-req" data-key="' +
        key +
        '" data-val="0">선택</button></span></div>';
    }
    body += sec.rows
      .map(function (row) {
        var del =
          sec.rows.length > 1
            ? '<button class="del" title="행 삭제" data-act="del-row" data-key="' +
              key +
              '" data-id="' +
              row.id +
              '">✕</button>'
            : "";
        var flds = def.columns
          .map(function (c) {
            var area =
              c.key === "purpose" || c.key === "items" || c.key === "method";
            var attrs =
              'data-act="row" data-key="' +
              key +
              '" data-id="' +
              row.id +
              '" data-field="' +
              c.key +
              '"';
            return fieldHTML(c.label, row[c.key] || "", attrs, area, c.ph);
          })
          .join("");
        return '<div class="row-card">' + del + flds + "</div>";
      })
      .join("");
    body +=
      '<button class="add-row" data-act="add-row" data-key="' +
      key +
      '">＋ 행 추가</button></div>';

    return '<div class="b-section">' + head + body + "</div>";
  }

  function builderHTML() {
    var html = "";

    html += '<div class="group-label" style="margin-top:0">기본 정보</div>';
    html +=
      '<div class="b-section"><div class="b-head" data-act="toggle-open" data-key="doc" role="button" tabindex="0">' +
      '<span class="chev ' +
      (open.doc ? "open" : "") +
      '">▶</span>' +
      '<div class="b-title"><b>문서 · 사업자 정보</b><small>제목, 기관명, 안내문</small></div></div>';
    if (open.doc) {
      html +=
        '<div class="b-body">' +
        fieldHTML(
          "문서 제목",
          S.docTitle,
          'data-act="field" data-field="docTitle"',
          false,
          "개인정보 수집·이용 동의서",
        ) +
        fieldHTML(
          "기관·회사명",
          S.org,
          'data-act="field" data-field="org"',
          false,
          "주식회사 ○○○",
        ) +
        fieldHTML(
          "상단 안내문",
          S.intro,
          'data-act="field" data-field="intro"',
          true,
          "",
        ) +
        "</div>";
    }
    html += "</div>";

    html += '<div class="group-label">수집·이용 동의</div>';
    html += sectionEditorHTML("essential") + sectionEditorHTML("optional");

    html += '<div class="group-label">별도 구분동의 (민감·고유식별)</div>';
    html += sectionEditorHTML("sensitive") + sectionEditorHTML("unique");

    html += '<div class="group-label">제공 · 이전 동의</div>';
    html += sectionEditorHTML("thirdParty") + sectionEditorHTML("overseas");

    html += '<div class="group-label">기타 동의</div>';

    /* 마케팅 */
    html +=
      '<div class="b-section"><div class="b-head" data-act="toggle-open" data-key="mkt" role="button" tabindex="0">' +
      '<span class="chev ' +
      (open.mkt ? "open" : "") +
      '">▶</span>' +
      '<div class="b-title"><b>마케팅·광고성 정보 수신 동의</b><small>법 제22조 · 정보통신망법 제50조</small></div>' +
      '<span class="toggle" data-act="stop"><input type="checkbox" data-act="mkt-on"' +
      (S.marketing.on ? " checked" : "") +
      ' aria-label="마케팅 동의 포함"><i></i></span></div>';
    if (open.mkt) {
      html +=
        '<div class="b-body"><div class="hint">마케팅 목적 동의는 다른 동의와 묶지 않고 별도 구분하여 받아야 하며, 온라인 화면에서는 채널별 개별 체크박스로 동의를 받습니다.</div>';
      html +=
        '<div class="fld"><label>수신 채널 (클릭하여 선택)</label><div class="chips">';
      html += MKT_CHANNELS.map(function (ch) {
        return (
          '<button class="chip ' +
          (S.marketing.channels.indexOf(ch) >= 0 ? "sel" : "") +
          '" data-act="mkt-channel" data-ch="' +
          esc(ch) +
          '">' +
          esc(ch) +
          "</button>"
        );
      }).join("");
      html += "</div></div>";
      html += fieldHTML(
        "이용 목적",
        S.marketing.purpose,
        'data-act="mkt-field" data-field="purpose"',
        false,
        "이벤트·혜택 등 광고성 정보 전송",
      );
      html += fieldHTML(
        "이용 항목",
        S.marketing.items,
        'data-act="mkt-field" data-field="items"',
        false,
        "성명, 휴대전화번호, 이메일",
      );
      html += fieldHTML(
        "보유·이용 기간",
        S.marketing.period,
        'data-act="mkt-field" data-field="period"',
        false,
        "동의 철회 시까지",
      );
      html += "</div>";
    }
    html += "</div>";

    /* 만 14세 미만 */
    html +=
      '<div class="b-section"><div class="b-head"><span class="chev" style="visibility:hidden">▶</span>' +
      '<div class="b-title"><b>만 14세 미만 법정대리인 동의란</b><small>법 제22조의2</small></div>' +
      '<span class="toggle" data-act="stop"><input type="checkbox" data-act="minor-on"' +
      (S.minor.on ? " checked" : "") +
      ' aria-label="법정대리인 동의란 포함"><i></i></span></div></div>';

    html +=
      '<div class="hint warn" style="margin-top:20px">본 도구는 표준 서식·화면 작성을 돕는 도구이며 법률 자문이 아닙니다. 온라인 동의는 동의 일시와 항목별 동의 여부를 기록·보관해야 하며, 실제 사용 전 개인정보보호 책임자 또는 법률 전문가의 검토를 권장합니다.</div>';

    return html;
  }

  function actionsHTML() {
    if (mode === "offline") {
      return (
        '<button class="btn btn-ghost" data-act="dl-offline">HTML 다운로드</button>' +
        '<button class="btn btn-primary" data-act="print">인쇄 · PDF 저장</button>'
      );
    }
    return '<button class="btn btn-primary" data-act="dl-online">임베드용 HTML 다운로드</button>';
  }

  /* ════════════════════════════════════════════════════════
     렌더링 (영역별 부분 갱신, 스크롤 위치 보존)
     ════════════════════════════════════════════════════════ */
  function setHTML(el, html) {
    var st = el.scrollTop;
    el.innerHTML = html;
    el.scrollTop = st;
  }

  function renderBuilder() {
    setHTML(document.getElementById("csb-builder"), builderHTML());
  }
  function renderStage() {
    var html =
      mode === "offline"
        ? '<div class="sheet">' + docHTML() + "</div>"
        : '<div class="online-wrap"><div class="online-cap">▼ 실제 작동하는 데모입니다. 체크박스·전체동의·필수검증을 직접 확인해 보세요.</div>' +
          onlineHTML() +
          "</div>";
    setHTML(document.getElementById("csb-stage"), html);
  }
  function renderActions() {
    document.getElementById("csb-actions").innerHTML = actionsHTML();
  }
  function updateModeSwitch() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".mode-switch button"),
      function (b) {
        b.classList.toggle("on", b.dataset.mode === mode);
      },
    );
  }
  function updateTabs() {
    document
      .getElementById("csb-builder")
      .classList.toggle("active", tab === "build");
    document
      .getElementById("csb-stage")
      .classList.toggle("active", tab === "preview");
    Array.prototype.forEach.call(
      document.querySelectorAll(".mobile-tabs button"),
      function (b) {
        b.classList.toggle("on", b.dataset.tab === tab);
      },
    );
  }

  /* ════════════════════════════════════════════════════════
     이벤트 (위임)
     ════════════════════════════════════════════════════════ */
  document.addEventListener("input", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t) return;
    var act = t.dataset.act;
    if (act === "field") {
      S[t.dataset.field] = e.target.value;
      renderStage();
    } else if (act === "row") {
      var r = findRow(t.dataset.key, t.dataset.id);
      if (r) r[t.dataset.field] = e.target.value;
      renderStage();
    } else if (act === "mkt-field") {
      S.marketing[t.dataset.field] = e.target.value;
      renderStage();
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t) return;
    var act = t.dataset.act,
      v = e.target.checked;
    switch (act) {
      case "toggle-on":
        S.sections[t.dataset.key].on = v;
        renderStage();
        break;
      case "mkt-on":
        S.marketing.on = v;
        renderStage();
        break;
      case "minor-on":
        S.minor.on = v;
        renderStage();
        break;
      case "o-all": {
        var keys = currentItemKeys(),
          nc = {};
        keys.forEach(function (k) {
          if (v) nc[k] = true;
        });
        online.checks = nc;
        renderStage();
        break;
      }
      case "o-toggle":
        if (v) online.checks[t.dataset.key] = true;
        else delete online.checks[t.dataset.key];
        renderStage();
        break;
      case "o-mkt-all":
        S.marketing.channels.forEach(function (ch) {
          if (v) online.checks["mkt:" + ch] = true;
          else delete online.checks["mkt:" + ch];
        });
        renderStage();
        break;
    }
  });

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t) return;
    var act = t.dataset.act;
    switch (act) {
      case "stop":
        return; // 토글 영역 클릭 — 펼침 토글 방지
      case "toggle-open":
        open[t.dataset.key] = !open[t.dataset.key];
        renderBuilder();
        break;
      case "set-req":
        S.sections[t.dataset.key].required = t.dataset.val === "1";
        renderBuilder();
        renderStage();
        break;
      case "add-row":
        S.sections[t.dataset.key].rows.push(mkRow(t.dataset.key));
        renderBuilder();
        renderStage();
        break;
      case "del-row": {
        var k = t.dataset.key;
        S.sections[k].rows = S.sections[k].rows.filter(function (x) {
          return String(x.id) !== String(t.dataset.id);
        });
        renderBuilder();
        renderStage();
        break;
      }
      case "mkt-channel": {
        var ch = t.dataset.ch,
          arr = S.marketing.channels,
          i = arr.indexOf(ch);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(ch);
        renderBuilder();
        renderStage();
        break;
      }
      case "mode":
        mode = t.dataset.mode;
        updateModeSwitch();
        renderActions();
        renderStage();
        break;
      case "tab":
        tab = t.dataset.tab;
        updateTabs();
        break;
      case "o-view":
        online.expand[t.dataset.key] = !online.expand[t.dataset.key];
        renderStage();
        break;
      case "o-mkt-view":
        online.expand.mkt = !online.expand.mkt;
        renderStage();
        break;
      case "o-submit":
        online.done = true;
        renderStage();
        break;
      case "o-reset":
        online.done = false;
        online.checks = {};
        renderStage();
        break;
      case "dl-offline":
        downloadOffline();
        break;
      case "dl-online":
        downloadOnline();
        break;
      case "print":
        window.print();
        break;
    }
  });

  /* 헤더 키보드 접근성 (Enter/Space로 펼침) */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var t = e.target.closest('[data-act="toggle-open"]');
    if (!t) return;
    e.preventDefault();
    open[t.dataset.key] = !open[t.dataset.key];
    renderBuilder();
  });

  /* ════════════════════════════════════════════════════════
     내보내기
     ════════════════════════════════════════════════════════ */
  function download(html, filename) {
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadOffline() {
    var node = document.getElementById("consent-doc");
    if (!node) return;
    var html =
      '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
      "<title>" +
      esc(S.docTitle) +
      "</title>" +
      '<link rel="stylesheet" href="' +
      FONT_LINK +
      '">' +
      "<style>" +
      EXPORT_CSS +
      "\nbody{background:#fff;margin:0;padding:24px;display:flex;justify-content:center}.sheet{box-shadow:none}</style>" +
      '</head><body><div class="sheet">' +
      node.outerHTML +
      "</div></body></html>";
    download(html, (S.docTitle || "개인정보동의서") + ".html");
  }

  function downloadOnline() {
    download(
      buildOnlineHTML(),
      (S.docTitle || "개인정보동의") + "-온라인.html",
    );
  }

  /* 임베드용 독립 실행 HTML (바닐라, 서버 전송 자리표시 포함) */
  function buildOnlineHTML() {
    var secs = activeSections(),
      m = S.marketing,
      minor = S.minor;

    var itemHTML = secs
      .map(function (s) {
        return s.rows
          .map(function (r, idx) {
            var rowKey = s.key + ":" + r.id;
            var domId = "ck-" + s.key + "-" + r.id;
            var dtId = "dt-" + s.key + "-" + r.id;
            var label = r.purpose || s.def.label + (s.rows.length > 1 ? " " + (idx + 1) : "");
            return (
              '\n  <div class="oc-item">\n    <div class="oc-item-row">\n' +
              '      <input type="checkbox" class="ck" id="' +
              domId +
              '" data-key="' +
              rowKey +
              '"' +
              (s.required ? ' data-req="1"' : "") +
              ">\n" +
              '      <label class="lbl" for="' +
              domId +
              '"><span class="badge ' +
              (s.required ? "req" : "opt") +
              '">' +
              (s.required ? "필수" : "선택") +
              "</span>" +
              esc(label) +
              "</label>\n" +
              '      <button type="button" class="oc-view" data-target="' +
              dtId +
              '" aria-expanded="false">보기 ▼</button>\n    </div>\n' +
              '    <div class="oc-detail" id="' +
              dtId +
              '" hidden>\n      ' +
              tableHTML(s.def, [r]) +
              '\n      <div class="nt">※ <b>' +
              esc(s.def.notice) +
              "</b></div>\n    </div>\n  </div>"
            );
          })
          .join("");
      })
      .join("");

    var mktHTML = !m.on
      ? ""
      : '\n  <div class="oc-item">\n    <div class="oc-item-row">\n' +
        '      <input type="checkbox" class="ck" id="ck-mkt-all">\n' +
        '      <label class="lbl" for="ck-mkt-all"><span class="badge opt">선택</span>마케팅·광고성 정보 수신 동의</label>\n' +
        '      <button type="button" class="oc-view" data-target="dt-mkt" aria-expanded="false">보기 ▼</button>\n    </div>\n' +
        '    <div class="oc-detail" id="dt-mkt" hidden>\n' +
        "      <table><thead><tr><th>이용 목적</th><th>이용 항목</th><th>보유·이용 기간</th></tr></thead>\n" +
        "      <tbody><tr><td>" +
        (esc(m.purpose) || "—") +
        '</td><td class="hl">' +
        (esc(m.items) || "—") +
        '</td><td class="hl">' +
        (esc(m.period) || "—") +
        "</td></tr></tbody></table>\n" +
        '      <div class="nt">※ <b>동의를 거부하셔도 서비스 이용에 제한이 없으며,</b> 언제든지 수신을 철회할 수 있습니다. 광고성 정보는 오후 9시~다음 날 오전 8시 사이에 별도 동의 없이 전송되지 않습니다.</div>\n    </div>\n' +
        '    <div class="oc-sub">' +
        m.channels
          .map(function (ch, i) {
            return (
              '\n      <div class="oc-item-row">\n' +
              '        <input type="checkbox" class="ck mkt-ch" id="ck-mkt-' +
              i +
              '" data-key="mkt:' +
              esc(ch) +
              '">\n' +
              '        <label class="lbl" for="ck-mkt-' +
              i +
              '">' +
              esc(ch) +
              " 수신 동의</label>\n      </div>"
            );
          })
          .join("") +
        "\n    </div>\n  </div>";

    var minorHTML = !minor.on
      ? ""
      : '\n  <div class="oc-item">\n    <div class="oc-item-row">\n' +
        '      <input type="checkbox" class="ck" id="ck-minor" data-key="minor" data-req="1">\n' +
        '      <label class="lbl" for="ck-minor"><span class="badge req">필수</span>법정대리인 동의 (만 14세 미만)</label>\n    </div>\n' +
        '    <div class="oc-minor">만 14세 미만 아동의 개인정보 처리에는 법정대리인의 동의가 필요합니다(개인정보보호법 제22조의2). 본인이 법정대리인임을 확인하며, 동의 확인을 위해 수집된 법정대리인 정보는 목적 달성 후 지체 없이 파기됩니다.</div>\n  </div>';

    var runtime =
      "(function(){\n" +
      "  var form = document.getElementById('consent-form');\n" +
      "  var all = document.getElementById('ck-all');\n" +
      "  var btn = document.getElementById('submit-btn');\n" +
      "  var items = Array.prototype.slice.call(form.querySelectorAll('.ck[data-key]'));\n" +
      "  var mktAll = document.getElementById('ck-mkt-all');\n" +
      "  var mktChs = Array.prototype.slice.call(form.querySelectorAll('.mkt-ch'));\n" +
      "  function sync(){\n" +
      "    var every = items.length && items.every(function(i){return i.checked});\n" +
      "    all.checked = every;\n" +
      "    document.getElementById('all-wrap').classList.toggle('checked', every);\n" +
      "    if(mktAll) mktAll.checked = mktChs.length && mktChs.every(function(i){return i.checked});\n" +
      "    var reqOk = items.filter(function(i){return i.dataset.req}).every(function(i){return i.checked});\n" +
      "    btn.disabled = !reqOk;\n" +
      "    btn.textContent = reqOk ? '동의하고 계속하기' : '필수 항목에 동의해 주세요';\n" +
      "  }\n" +
      "  all.addEventListener('change', function(){ items.forEach(function(i){ i.checked = all.checked; }); sync(); });\n" +
      "  if(mktAll) mktAll.addEventListener('change', function(){ mktChs.forEach(function(i){ i.checked = mktAll.checked; }); sync(); });\n" +
      "  items.forEach(function(i){ i.addEventListener('change', sync); });\n" +
      "  form.querySelectorAll('.oc-view').forEach(function(b){\n" +
      "    b.addEventListener('click', function(){\n" +
      "      var d = document.getElementById(b.dataset.target);\n" +
      "      var openD = d.hidden; d.hidden = !openD;\n" +
      "      b.textContent = openD ? '닫기 ▲' : '보기 ▼';\n" +
      "      b.setAttribute('aria-expanded', String(openD));\n" +
      "    });\n" +
      "  });\n" +
      "  form.addEventListener('submit', function(e){\n" +
      "    e.preventDefault();\n" +
      "    var result = { timestamp: new Date().toISOString(), consents: {} };\n" +
      "    items.forEach(function(i){ result.consents[i.dataset.key] = i.checked; });\n" +
      "    /* 실제 서비스에서는 이 부분을 서버 전송 코드로 교체하세요.\n" +
      "       동의 일시·항목별 동의 여부를 기록·보관해야 합니다(법 제22조). */\n" +
      "    if (typeof window.onConsentSubmit === 'function') { window.onConsentSubmit(result); }\n" +
      "    else { alert('동의가 완료되었습니다.\\n\\n' + JSON.stringify(result, null, 2)); }\n" +
      "  });\n" +
      "  sync();\n" +
      "})();";

    return (
      '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      "<title>" +
      esc(S.docTitle) +
      "</title>\n" +
      '<link rel="stylesheet" href="' +
      FONT_LINK +
      '">\n<style>\n' +
      EXPORT_CSS +
      "\n" +
      "body{background:var(--canvas);margin:0;padding:28px 14px;display:flex;justify-content:center;font-family:'Noto Sans KR',sans-serif}\n" +
      ".online-wrap{width:460px;max-width:100%}\n</style>\n</head>\n<body>\n" +
      '<div class="online-wrap">\n  <form class="oc" id="consent-form" aria-label="개인정보 동의">\n' +
      '    <div class="oc-head">\n      <div class="org">' +
      esc(S.org) +
      "</div>\n" +
      "      <h2>" +
      esc(S.docTitle) +
      "</h2>\n      <p>" +
      esc(S.intro) +
      "</p>\n    </div>\n" +
      '    <div class="oc-body">\n' +
      '      <label class="oc-all" id="all-wrap">\n' +
      '        <input type="checkbox" class="ck" id="ck-all" aria-label="전체 동의">\n' +
      "        <span><b>전체 동의하기</b><small>선택 항목 포함 모든 항목에 동의합니다. 선택 항목은 동의하지 않아도 서비스를 이용할 수 있습니다.</small></span>\n      </label>\n" +
      '      <div style="margin-top:8px">' +
      itemHTML +
      mktHTML +
      minorHTML +
      "\n      </div>\n" +
      '      <button type="submit" class="oc-submit" id="submit-btn" disabled>필수 항목에 동의해 주세요</button>\n    </div>\n' +
      '    <div class="oc-foot">' +
      esc(S.org) +
      "</div>\n  </form>\n</div>\n" +
      "<scr" +
      "ipt>\n" +
      runtime +
      "\n</scr" +
      "ipt>\n</body>\n</html>"
    );
  }

  /* ── 초기 렌더 ─────────────────────────────────────────── */
  function init() {
    updateModeSwitch();
    updateTabs();
    renderActions();
    renderBuilder();
    renderStage();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
