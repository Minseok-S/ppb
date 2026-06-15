# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CELA Privacy Tools Suite** — 한국 개인정보처리방침 관련 도구 모음. 세 개의 독립 웹앱을 하나의 통합 셸로 묶었다.

- **PPB** (개인정보처리방침 빌더) — 18단계 위저드로 법적 요건을 충족하는 개인정보처리방침 문서를 생성하고 HTML/Word로 내보낸다.
- **LSE** (실시간 편집기 / Live Screen Editor) — 기존 개인정보처리방침을 URL 또는 파일로 불러와 인플레이스로 편집하고 원본과의 diff를 보여준다.
- **PDF** (PDF 편집기) — PDF를 canvas로 픽셀 단위 렌더링하고, 그 위에 좌표가 일치하는 편집 가능한 텍스트 레이어를 올려 원본 화면 그대로 글자를 수정한다 (WYSIWYG 오버레이).

빌드 시스템·npm 없음. 순수 바닐라 HTML/CSS/JS. 브라우저에서 파일을 직접 연다.

## Directory Layout

```
ppb/
├── index.html          # 통합 셸 — 상단 탭으로 세 앱을 iframe으로 전환
├── README.md           # 사람용 개요
├── CLAUDE.md           # (이 파일) AI용 최상위 가이드
├── docs/
│   ├── architecture.md # 전체 구조·공통 패턴
│   ├── ppb.md          # 빌더 상세
│   └── lse.md          # 편집기 상세
└── apps/
    ├── ppb/            # 빌더 앱
    │   ├── builder.html
    │   ├── styles.css  # 1,149줄 — 전체 스타일
    │   ├── CLAUDE.md   # PPB 전용 가이드
    │   └── js/
    │       ├── core/   # state · navigation · helpers · init
    │       ├── engine/ # steps · preview · export · editmode
    │       └── sections/ # 14개 스텝별 모듈
    ├── lse/            # 실시간 편집기 앱
    │   ├── index.html
    │   ├── editor.js   # 단일 IIFE (~55KB)
    │   ├── editor.css
    │   └── CLAUDE.md   # LSE 전용 가이드
    └── pdf/            # PDF 편집기 앱
        ├── index.html
        ├── editor.js   # 단일 IIFE — PDF 렌더 & 편집
        └── editor.css
```

## Running the App

빌드/서버/패키지 매니저 없음.

- **전체 스위트**: `index.html`을 브라우저로 연다. PPB 탭이 기본, LSE·PDF 탭은 최초 전환 시 lazy-load.
- **빌더 단독**: `apps/ppb/builder.html`
- **실시간 편집기 단독**: `apps/lse/index.html`
- **PDF 편집기 단독**: `apps/pdf/index.html`

> ⚠️ 모든 경로는 상대경로다. 파일을 옮기면 폴더 단위로 옮겨 상대참조가 깨지지 않게 한다. 셸의 iframe 경로(`apps/ppb/builder.html`, `apps/lse/index.html`, `apps/pdf/index.html`)는 [index.html](index.html)에 하드코딩돼 있다.

## 어디를 고칠까 (라우팅)

| 하고 싶은 것 | 가야 할 곳 |
|---|---|
| 탭 전환·로더·셸 UI | [index.html](index.html) |
| 빌더의 폼/스텝/미리보기/내보내기 | [apps/ppb/](apps/ppb/) → 먼저 [apps/ppb/CLAUDE.md](apps/ppb/CLAUDE.md) |
| 편집기의 로드/편집/diff | [apps/lse/](apps/lse/) → 먼저 [apps/lse/CLAUDE.md](apps/lse/CLAUDE.md) |
| PDF 렌더링/오버레이 편집 | [apps/pdf/](apps/pdf/) (editor.js 단일 IIFE) |
| 전체 아키텍처 이해 | [docs/architecture.md](docs/architecture.md) |

## 공통 규칙 (모든 앱)

- **No build / no npm / no modules** — `<script>` 태그로 전역 스코프 로드. 함수는 전역에서 접근 가능해야 한다 (HTML의 인라인 `onclick` 등에서 호출). ES 모듈(`import`/`export`) 금지.
- **로드 순서가 중요** — 특히 PPB는 `state.js`가 가장 먼저 로드돼야 이후 모듈이 `S`를 쓸 수 있다. 스크립트 순서는 [apps/ppb/builder.html](apps/ppb/builder.html) 하단 참조.
- **상대경로 유지** — `file://`로 직접 열기 때문에 절대경로/번들러 가정 금지.
- **세 앱은 거의 독립** — 유일한 결합점은 셸([index.html](index.html))의 iframe 참조뿐. 한쪽을 고쳐도 다른 쪽에 영향 없음. LSE·PDF 모두 pdf.js CDN을 쓰지만 서로 코드 공유는 없다.

---

## PPB 앱 상세

### 아키텍처 개요

```
User Input (form)
  ↓ oninput/onclick inline handlers
readFields()          ← DOM 값 → S 동기화
  ↓
Global State S        ← core/state.js 전역 객체 (190+ 속성)
  ↓ updatePreview() 수동 호출
buildPreview()        ← engine/preview.js
  ↓ applyRowMerge()
#previewContent       ← 미리보기 패널 (실시간 렌더)
```

반응성 레이어 없음 — `S`를 바꾼 뒤 항상 `updatePreview()`를 직접 호출해야 한다.

### js/ 폴더 구조

#### core/

| 파일 | 역할 |
|---|---|
| [js/core/state.js](apps/ppb/js/core/state.js) | 전역 `S` 정의 (190+ 속성, 30+ 배열) — **반드시 첫 번째 로드** |
| [js/core/navigation.js](apps/ppb/js/core/navigation.js) | 18단계 위저드 네비게이션, `goStep`/`nextStep`/`prevStep`, `stepLabels[]` |
| [js/core/helpers.js](apps/ppb/js/core/helpers.js) | `selectR(onId,offId,key,val)` 라디오 토글, `toggleItem(el,group)` 체크박스, `selectBrowserEnv(env)` |
| [js/core/init.js](apps/ppb/js/core/init.js) | `window.onload` 초기화, 사이드바 리사이즈 핸들 — **반드시 마지막 로드** |

#### engine/

| 파일 | 크기 | 역할 |
|---|---|---|
| [js/engine/steps.js](apps/ppb/js/engine/steps.js) | ~93KB | 18개 스텝 폼 UI HTML 생성 (`renderSteps`) |
| [js/engine/preview.js](apps/ppb/js/engine/preview.js) | ~102KB | `S` → 정책 문서 HTML 생성 (`updatePreview`, `buildPreview`). **셀 병합 알고리즘(`applyRowMerge`)이 가장 복잡** |
| [js/engine/export.js](apps/ppb/js/engine/export.js) | ~10KB | HTML 다운로드(`downloadHTML`), Word 내보내기(`downloadWord`), 클립보드 복사 |
| [js/engine/editmode.js](apps/ppb/js/engine/editmode.js) | ~10KB | 미리보기 직접 편집 모드. LCS 기반 3-way 병합(diff3): 순수 렌더(`editBase`) · 편집본(`editView`) · 새 렌더를 합쳐 수동 편집과 폼 변경을 동시에 반영. 충돌 시 폼(새 렌더) 우선 |

#### sections/ (스텝 ↔ 파일 매핑)

| 스텝 | 파일 | 핵심 내용 |
|---|---|---|
| 2 수집 항목 | [collect.js](apps/ppb/js/sections/collect.js) | 동의/비동의/기타/자동 4종류 수집 항목, 법적 근거 드롭다운 |
| 3 아동 | [children.js](apps/ppb/js/sections/children.js) | 미성년자 개인정보 동의 방법 |
| 4 파기 | [retention.js](apps/ppb/js/sections/retention.js) | 보존기간 체크리스트(계약·분쟁·광고·로그), 사용자 정의 기간 |
| 5 제3자 제공 | [thirdparty.js](apps/ppb/js/sections/thirdparty.js) | 수신자/항목/목적/보존기간 테이블 |
| 6 위탁 | [delegation.js](apps/ppb/js/sections/delegation.js) | 위탁 업무·수탁자 테이블 |
| 7 국외이전 | [overseas.js](apps/ppb/js/sections/overseas.js) | 제공/위탁 2섹션, 근거(동의/위탁), 거부 채널(웹·모바일·CS·직접입력) |
| 8 안전조치 | [security.js](apps/ppb/js/sections/security.js) | 11개 항목 체크리스트(계획·교육·조직·접근·암호화·감사·로그·취약점·물리·매체·ISMS), 항목별 추가 조치 |
| 9 행태정보 | [behavioral.js](apps/ppb/js/sections/behavioral.js) | 식별/비식별 모드, 자동수집 기기, 제3자 제공, 외부 수집, 광고(민감·아동·모바일 플래그) |
| 11 책임자 | [departments.js](apps/ppb/js/sections/departments.js) | CPO, 권리행사 부서, 자동화 결정 담당, CCTV 담당 |
| 12 추가 이용 | [addusage.js](apps/ppb/js/sections/addusage.js) | 추가적 이용·제공 기준 + 동적 행 |
| 13 민감정보 | [sensitive.js](apps/ppb/js/sections/sensitive.js) | 민감정보 유형 체크박스 |
| 14 가명정보 | [pseudonym.js](apps/ppb/js/sections/pseudonym.js) | 가명처리 행 + 제공 테이블 + 안전조치 |
| 15 자동화 결정 | [autodecision.js](apps/ppb/js/sections/autodecision.js) | 목적·범위·정보·절차·민감플래그·거부 연락처 |
| 17 CCTV | [cctv.js](apps/ppb/js/sections/cctv.js) | 고정형·이동형 각각 목적/위치/시간/보존/담당·위탁 테이블 |

(스텝 1 기본정보·10 권리행사·16 국내대리인·18 자율보호활동은 별도 모듈 없이 engine/steps.js · engine/preview.js · core/state.js에서 처리)

### `S` 전역 상태 객체 주요 속성 범주

```javascript
// 단순 값
S.companyName, S.child, S.thirdParty, S.behavioral, ...

// 중첩 객체
S.retention     // 보존기간 체크리스트
S.destroy       // 파기 방법 체크리스트
S.security      // 안전조치 체크리스트
S.rights        // 권리행사 방법
S.bhBrowsers    // 행태정보 브라우저 환경
S.bhFlags       // 행태정보 플래그
S.pseudonymSecurity // 가명정보 안전조치
S.agency        // 국내대리인 정보
S.vaFlags       // 자율보호활동 플래그

// 동적 배열 (행 단위 데이터)
S.collectNoConsent, S.collectConsent, S.collectOther, S.collectAuto
S.tpConsent, S.tpLegal
S.dlItems, S.dlSubItems
S.otProvideItems, S.otDelegateItems
S.bhItems, S.bhTpItems, S.bhOwnDevices, S.bhAutoDevices, S.bhThirdOutItems
S.sensitiveRows, S.pseudonymRows, S.pseudonymProvideRows
S.addUsageRows, S.adInfoRows
S.depts
S.prevPolicies
S.cctvFixedLocations, S.cctvFixedDelegateItems
S.cctvMobileDelegateItems
S.customRetentionLegal, S.customRetentionOther

// 편집 모드 상태
S.editMode      // boolean
S.editBase      // 순수 렌더 스냅샷 (HTML 배열)
S.editView      // 사용자 편집본 스냅샷 (HTML 배열)
```

### 동적 행(row) 패턴

대부분의 sections/ 모듈이 이 패턴을 따른다.

```javascript
function addCollect(type) {
  const id = "ci_" + type + "_" + Date.now();
  const div = document.createElement("div");
  div.className = "card-item";
  div.id = id;
  div.innerHTML = `...data-field 속성이 있는 입력들...`;
  document.getElementById("collect" + cap(type)).appendChild(div);
  syncCollect(type);
}

function syncCollect(type) {
  const arr = [];
  document.querySelectorAll(`#collect${cap(type)} .card-item`).forEach(d => {
    const g = f => d.querySelector(`[data-field="${f}"]`)?.value || "";
    arr.push({ basis: g("basis"), category: g("category"), /* ... */ });
  });
  S["collect" + cap(type)] = arr;
}

function removeRow(id, type) {
  document.getElementById(id)?.remove();
  syncCollect(type);
  updatePreview();
}
```

### 스크립트 로드 순서 (builder.html)

```
1. core/state.js       ← S 생성 (필수 선행)
2. core/navigation.js
3. core/helpers.js
4. sections/*.js       ← 14개 모듈 (순서 무관)
5. engine/steps.js
6. engine/preview.js
7. engine/export.js
8. engine/editmode.js
9. core/init.js        ← window.onload (필수 후행)
```

새 모듈 추가 시: `state.js` 이후, 그 모듈을 호출하는 엔진 파일 이전에 삽입.

### PPB 작업 시 주의사항

- **새 필드 추가 = 3곳 동시 수정**: ① `core/state.js`에 기본값, ② 해당 `sections/` 모듈에 입력 UI + `sync*()`, ③ `engine/preview.js`에 출력 로직.
- **테이블 수정 전**: `applyRowMerge()` 셀 병합 알고리즘을 먼저 파악할 것. preview.js 내에서 가장 복잡한 부분이다.
- **editmode.js의 3-way 병합**: 최상위 요소 순서 보존을 가정한다. 미리보기 HTML 구조를 크게 바꾸면 병합이 어긋날 수 있다.
- **구문 확인**: 큰 파일 편집 후 `node --check apps/ppb/js/engine/steps.js` 또는 `node --check apps/ppb/js/engine/preview.js` 실행 권장.
- **`readFields()`**: `data-field` 속성이 있는 모든 입력을 스캔해 `S`에 동기화한다. 새 입력에는 반드시 `data-field` 속성을 붙일 것.

---

## LSE 앱 상세

### 아키텍처 개요

단일 IIFE(`editor.js`)로 캡슐화. 내부 상태는 지역 변수. DOM(`contenteditable` iframe)이 곧 진실의 원천.

```
입력 (URL·HTML파일·PDF파일)
  ↓ loadBothPanels()
originalFrame (좌, 읽기 전용) | editorFrame (우, contenteditable)
  ↓ MutationObserver
initDiffTracking() → scheduleDiff() → runDiff()
  ↓ data-changed / data-deleted 마커
diff 시각화
  ↓ getEditorExportHtml() → exportHTML()
.html 다운로드
```

### 주요 함수

| 함수 | 역할 |
|---|---|
| `loadBothPanels(html)` | 원본·편집 iframe에 동일 HTML 주입 |
| `restrictEditorInteractions()` | 편집 iframe의 링크 이동·폼 제출 차단 |
| `injectScrollSync()` | 좌우 패널 스크롤 동기화 |
| `initDiffTracking()` | MutationObserver로 편집 감시 시작 |
| `buildSnapshot()` | 현재 DOM 상태 스냅샷 |
| `runDiff()` | 원본 vs 편집본 비교, 마커 표시 |
| `wordDiff()` | 단어 단위 diff |
| `fmt(cmd, val)` | `execCommand()` 래퍼 (bold·italic 등) |
| `insertTable()` | 표 삽입 |
| `showContextMenu()` | 우클릭 컨텍스트 메뉴 (표 행·열 조작) |
| `showLinkModal()` | 링크 삽입 모달 |
| `showCompModal()` | 전체 비교 모달 |
| `togglePalette()` | 컬러 팔레트 |
| `getEditorExportHtml()` | diff 마커 제거 후 편집 HTML 추출 |
| `exportHTML()` | .html 파일 다운로드 |
| `loadPdfFile(file)` | PDF → 편집용 HTML 변환 |

### PDF 추출 파이프라인 (LSE)

```
loadPdfFile(file)
  ↓ pdfjsLib.getDocument()
  ↓ renderPdfToImages() + extractPdfToHtml()
  ↓ extractPdfPage() per page
    - getTextContent() → viewport transform → 절대위치 <span> (폰트크기·굵기·이탤릭 보존)
    - getOperatorList() → 사각형/선 ops 필터 → buildPdfGraphics() → SVG 오버레이
  ↓ pt 단위 페이지, @page{margin:0}, page-break-after
편집 가능한 HTML (원본 레이아웃 근사)
```

### LSE 작업 시 주의사항

- **IIFE 내부 함수는 외부에서 보이지 않는다.** 전역 노출이 필요하면 `window.X = function() {...}` 또는 IIFE 끝에서 명시적으로 할당.
- **새 버튼/핸들러**: `index.html`의 인라인 `onclick` 이름과 IIFE 내 `window.X` 할당 이름이 일치해야 한다.
- **캐시 무력화**: `editor.js` 수정 시 `index.html`의 `<script src="editor.js?v=N">` 버전 숫자를 올린다.
- **iframe 경계**: 편집 내용은 `editorFrame.contentDocument` 안에 있다. 노드 접근은 항상 `contentDocument`를 통해야 한다.
- **diff 정확도**: `sanitizeHtmlForComp()`로 정규화 후 비교. 표가 있으면 `hasTable` 분기 동작.

---

## PDF 편집기 앱 상세

### 아키텍처 개요

단일 IIFE(`editor.js`). pdf.js로 렌더링, pdf-lib + fontkit으로 PDF 재저장.

```
loadPdf(file)
  ↓ pdfjsLib.getDocument()
  ↓ per page: renderPdfPageToImage() (canvas, SCALE=2)
            + 텍스트 추출 → <span> 오버레이 (절대좌표, 원본 폰트크기)
사용자 편집 (span 클릭 → contenteditable)
  ↓ data-edited 표시
exportPdfBtn
  ↓ pdf-lib: 원본 PDF bytes + 편집된 텍스트 → 새 PDF 저장
```

### 주요 특성

- **SCALE = 2**: 레티나 디스플레이 대응 캔버스 렌더링. span 좌표 계산 시 반드시 고려.
- **한국어 폰트**: Noto Sans KR OTF를 CDN에서 최초 한 번 다운로드 후 캐시. 오프라인 환경에서 PDF 저장이 실패할 수 있다.
- **WeakMap**: 원본 span HTML 추적에 사용. span 노드가 GC되면 자동 해제.
- **CDN 의존**: pdf.js, pdf-lib, fontkit 모두 CDN 로드. 오프라인 미지원.

---

## 외부 의존성 (CDN)

| 라이브러리 | 사용처 | 용도 |
|---|---|---|
| Google Fonts (Noto Sans KR, IBM Plex Mono) | 전체 | UI 폰트 |
| pdf.js | LSE, PDF 편집기 | PDF 렌더링·텍스트 추출 |
| pdf-lib | PDF 편집기 | PDF 쓰기 (편집 저장) |
| fontkit | PDF 편집기 | pdf-lib 한국어 폰트 지원 |
| corsproxy.io | LSE | URL fetch CORS 우회 |
| Noto Sans KR OTF/TTF | LSE (PDF 내보내기) | 한국어 텍스트 PDF 임베드 |
| zip (JSZip) | PPB | Word(.docx) 파일 생성 |

---

## 코딩 패턴 & 네이밍 규칙

### 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| HTML ID | camelCase | `#childYes`, `#previewContent`, `#stepsNav` |
| HTML class | kebab-case | `.card-item`, `.field-group`, `.section-panel` |
| JS 변수 | camelCase | `curStep`, `collectNoConsent` |
| JS 함수 | camelCase | `goStep()`, `updatePreview()`, `syncCollect()` |
| 동적 행 ID | 타입 + 타임스탬프 | `ci_noConsent_1718000000000` |
| CSS 변수 | `--` 접두사 | `--accent`, `--bg`, `--border`, `--text` |

### CSS 클래스 구조 (styles.css)

```
레이아웃: .app-layout · .sidebar · .resize-handle · .preview-panel
폼:      .section-panel · .field-group · .field-label · .radio-group · .card-item
타이포:  .section-title · .section-num · .section-desc · .badge-req
버튼:    .btn · .btn-primary · .btn-ghost · .btn-icon · .btn-add
테이블:  .pp-table · .policy_table · .policy_item
상태:    .active · .selected · .checked · .done · .disabled
```

### 전역 함수 등록 패턴

ES 모듈 없음. 모든 핸들러는 전역이어야 한다.

```javascript
// PPB: 파일 최상위에 function 선언 → 자동으로 전역
function updatePreview() { ... }
function goStep(n) { ... }

// LSE: IIFE 안에서 window에 명시적 할당
window.exportHTML = function() { ... };
window.togglePalette = function() { ... };
```

### `selectR` 헬퍼 패턴

토글형 입력에서 S 업데이트 + 상세 패널 show/hide + updatePreview를 한 번에 처리.

```html
<div onclick="selectR('childYes','childNo','child','yes')">예</div>
<div onclick="selectR('childNo','childYes','child','no')">아니오</div>
<div id="childDetail" style="display:none">...추가 입력...</div>
```

```javascript
// helpers.js: key-to-panelId 맵으로 연결돼 있음
// 새 토글 추가 시 helpers.js의 map 객체에 key: ["panelId", "triggerValue"] 항목 추가
```

---

## AI 작업 체크리스트

새 기능을 추가하거나 버그를 고칠 때 확인할 항목:

**PPB에서 새 필드 추가:**
1. `apps/ppb/js/core/state.js`에 기본값 추가
2. `apps/ppb/js/sections/<해당모듈>.js`에 입력 UI + `sync*()` 업데이트
3. `apps/ppb/js/engine/preview.js`에 출력 로직 추가
4. `apps/ppb/builder.html` — 새 모듈 파일이면 `<script>` 태그 추가 (올바른 순서로)

**PPB에서 새 섹션 모듈 추가:**
1. `apps/ppb/js/sections/` 안에 파일 생성
2. `apps/ppb/builder.html`의 sections 구역 `<script>` 블록에 등록
3. `core/state.js`에 관련 기본값 추가
4. `engine/steps.js`에 폼 UI 추가
5. `engine/preview.js`에 미리보기 출력 추가

**LSE에서 새 핸들러 추가:**
1. `apps/lse/editor.js` IIFE 안에 함수 정의
2. 전역 노출 필요 시 `window.funcName = function() {...}` 추가
3. `apps/lse/index.html`의 인라인 핸들러 이름과 일치 확인
4. `editor.js` 수정 후 `index.html`의 `?v=N` 버전 숫자 증가

**절대 하지 말 것:**
- `import` / `export` 사용 — 파일 프로토콜에서 모듈 금지
- 절대경로 (`/apps/...`) 사용 — 상대경로만
- npm 패키지 추가
- `state.js` 로드 순서를 다른 스크립트 뒤로 이동
- `init.js` 로드 순서를 다른 스크립트 앞으로 이동
