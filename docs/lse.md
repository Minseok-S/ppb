# LSE 상세 — 실시간 편집기 (Live Screen Editor)

앱 위치: [../apps/lse/](../apps/lse/) · 앱 스코프 가이드: [../apps/lse/CLAUDE.md](../apps/lse/CLAUDE.md)

기존 개인정보처리방침 HTML을 불러와 좌(원본)/우(편집) 두 패널로 보여주고, 우측을 직접 편집하면서 변경점을 실시간 비교한다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| [../apps/lse/index.html](../apps/lse/index.html) | 전체 UI: 입력 바, 좌/우 패널, 툴바, 모달, 컨텍스트 메뉴 |
| [../apps/lse/editor.js](../apps/lse/editor.js) | 모든 로직. 단일 IIFE(`"use strict"`)로 캡슐화 |
| [../apps/lse/editor.css](../apps/lse/editor.css) | 스타일 |

`index.html`은 `editor.js?v=N`을 캐시 버스팅 쿼리와 함께 로드한다 (GitHub Pages 캐시 대응). editor.js 수정 시 `N`을 올린다.

## 처리 단계

### 1. 입력 (세 가지)
- **URL**: 직접 `fetch` 시도 → 실패하면 `corsproxy.io` 프록시로 폴백.
- **HTML 파일**: 업로드/드래그앤드롭 → `FileReader`로 텍스트 읽기 (`loadFromFile`).
- **PDF 파일**: 업로드/드래그앤드롭 → `loadPdfFile`. CDN으로 로드한 **pdf.js**(`window.pdfjsLib`)로 **원본 레이아웃을 그대로 재현**한다 (`extractPdfToHtml` → `extractPdfPage`):
  - 글자: `getTextContent`의 각 아이템을 `pdfjsLib.Util.transform`으로 뷰포트 좌표로 변환해 `position:absolute` `<span>`으로 **글자별 절대배치** (좌표·폰트 크기·굵게/기울임 보존).
  - 표 테두리·구분선: `getOperatorList`를 훑어 사각형/선 그리기 연산만 추려(`buildPdfGraphics`) 페이지마다 `<svg>`로 복원. 얇은 사각형은 채움(선), 큰 사각형은 테두리로 렌더.
  - 페이지: 크기를 **pt 단위**로 잡아(`buildPdfDocHtml`) 인쇄 시 원본과 동일한 물리 크기로 출력. 페이지마다 `.pdf-page` div, `@page{margin:0}` + `page-break-after`로 페이지 분할.
  - 이후 동일한 `loadBothPanels` 파이프라인에 태운다. 색상 채움은 흑백 선/테두리로 단순화되고, 스캔(이미지) PDF는 추출할 텍스트가 없어 안내 후 중단된다.

### 2. 패널 로드 (`loadBothPanels`)
- 원본 HTML → 좌측 iframe(`originalFrame`).
- 사본 → 우측 iframe(`editorFrame`)에 `contenteditable`로 주입.
- `restrictEditorInteractions`로 편집 외 동작(링크 이동 등) 차단.
- `injectScrollSync`로 좌우 스크롤 동기화, `injectDiffCSS`로 diff 마커 스타일 주입.

### 3. 편집 도구
- 서식: `fmt` (bold/italic/정렬 등 execCommand 기반)
- 표: `insertTable`, `tableInsertRow/Col`, `tableDeleteRow/Col` (우클릭 컨텍스트 메뉴 `showContextMenu`에서 호출)
- 링크: `showLinkModal` → `confirmInsertLink`
- 이미지: `triggerImageInsert`
- 가로줄: `insertHR`
- 색상: `togglePalette` / `buildSwatches`

### 4. Diff 추적
- `initDiffTracking`이 `MutationObserver`를 붙여 편집 변경을 감지.
- `scheduleDiff`(디바운스) → `runDiff`가 편집 트리를 순회(`walk`)하며 원본 스냅샷(`buildSnapshot`)과 비교, 변경 노드에 마커(`clearMarkers`로 초기화).
- 단어 단위 비교: `tokenizeWords` + `wordDiff`.
- 비교 모달: `collectDiffPairs` → `showCompModal` (정규화는 `sanitizeHtmlForComp`, 표 분기 `hasTable`).

### 5. 내보내기
- 편집 결과 추출은 `getEditorExportHtml`이 담당 (주입 스타일 `id^="__"` 임시 제거 후 직렬화).
- `exportHTML`: 추출한 HTML을 파일로 다운로드.
- `clearEditor`: 초기화.

## 작업 시 주의

- **단일 IIFE** — 내부 함수/상태는 캡슐화돼 외부에서 안 보인다. 인라인 `onclick`에서 부르는 핸들러는 `window`에 노출돼 있거나 IIFE가 바인딩한 것. 새 핸들러 추가 시 정의 ↔ 인라인 참조 이름을 맞출 것.
- **iframe 경계** — 콘텐츠는 별도 iframe 문서 안. 노드 접근은 iframe `contentDocument` + 경로 헬퍼 `elByPath`를 거친다.
- PPB와 코드 공유 없음. 독립적으로 열고 고칠 수 있다.
