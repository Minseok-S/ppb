# LSE — 실시간 편집기 (Live Screen Editor)

기존 개인정보처리방침 HTML을 불러와 화면에서 직접 편집하고, 원본 대비 변경점(diff)을 보여주는 도구. 상위 가이드는 [../../CLAUDE.md](../../CLAUDE.md), 더 상세한 설명은 [../../docs/lse.md](../../docs/lse.md).

## 구성

| 파일 | 역할 |
|---|---|
| [index.html](index.html) | UI 전체 (좌: 원본 패널 / 우: 편집 패널, 툴바, 모달) |
| [editor.js](editor.js) | 모든 로직. 단일 IIFE(`(function(){ "use strict"; ... })()`)로 캡슐화 (~55KB) |
| [editor.css](editor.css) | 스타일 |

`index.html`은 `editor.css`, `editor.js?v=N`을 상대경로로 로드한다. `?v=N`은 GitHub Pages 캐시 무력화용 버전 쿼리 — `editor.js` 수정 시 숫자를 올린다.

## 동작 흐름

1. **입력**: URL 입력(직접 fetch 시도 후 실패 시 `corsproxy.io` 폴백), HTML 파일 업로드/드래그앤드롭 (`loadFromFile`), 또는 PDF 업로드/드래그앤드롭 (`loadPdfFile` — CDN `pdfjsLib`로 텍스트 추출 후 편집용 HTML로 변환, 표·다단 레이아웃은 단순화).
2. **로드**: 원본을 좌측 iframe(`originalFrame`), 편집본을 우측 iframe(`editorFrame`)에 주입 (`loadBothPanels`). 편집본은 `contenteditable`로 만들고 편집 외 상호작용을 제한(`restrictEditorInteractions`).
3. **편집**: 서식(`fmt`), 표 삽입/행열 추가·삭제(`insertTable`/`tableInsert*`/`tableDelete*`), 링크(`showLinkModal`/`confirmInsertLink`), 이미지, 가로줄(`insertHR`), 우클릭 컨텍스트 메뉴(`showContextMenu`), 컬러 팔레트(`togglePalette`).
4. **Diff**: 편집본 변경을 `MutationObserver`로 감시(`initDiffTracking`/`scheduleDiff`/`runDiff`)해 원본 스냅샷과 비교, 변경 노드에 마커 표시. 단어 단위 diff(`tokenizeWords`/`wordDiff`)와 비교 모달(`showCompModal`)도 제공.
5. **내보내기**: 편집 결과를 `getEditorExportHtml`로 추출해 `exportHTML`(HTML 파일 다운로드)로 저장. diff 마커 속성(`data-changed`, `data-deleted`)은 내보내기 전 임시 제거 후 복원.

## 작업 시 주의

- **단일 IIFE 구조** — 내부 함수·상태는 외부에서 보이지 않는다. 전역으로 노출이 필요한 핸들러는 IIFE 안에서 명시적으로 `window.X = ...` 하거나 `index.html`의 인라인 핸들러와 이름을 맞춰야 한다. 새 함수 추가 시 호출 경로(인라인 onclick ↔ 정의)를 반드시 확인.
- **iframe 경계** — 원본/편집 콘텐츠는 별도 iframe 문서 안에 있다. 노드 접근은 `elByPath`/iframe `contentDocument`를 통한다. 스크롤 동기화는 `injectScrollSync`로 주입.
- **diff 정확도** — 비교 전 `sanitizeHtmlForComp`로 정규화한다. 표가 있으면 `hasTable` 분기가 동작.
- PPB와 완전히 독립적이다. 공유 코드 없음.
