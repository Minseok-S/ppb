# PPB 상세 — 개인정보처리방침 빌더

앱 위치: [../apps/ppb/](../apps/ppb/) · 앱 스코프 가이드: [../apps/ppb/CLAUDE.md](../apps/ppb/CLAUDE.md)

## 데이터 흐름

```
사용자 입력
   │ (oninput/onclick 인라인 핸들러)
   ▼
readFields()  ──►  전역 객체 S (state.js)
   │                      │
   │                      ▼
   └────────────►  updatePreview()  (preview.js)
                          │
                          ▼
                   #previewContent 에 HTML 렌더
```

반응성 없음. `S`를 바꾸면 **반드시** `updatePreview()`를 직접 호출해야 화면이 갱신된다.

## 18단계 위저드

스텝 라벨과 순서는 [../apps/ppb/js/core/navigation.js](../apps/ppb/js/core/navigation.js)의 `stepLabels`에 정의(`TOTAL = 18`). 사이드바 칩과 진행률 바는 `goStep(n)`이 갱신한다.

1. 기본 정보 · 2. 수집 항목 · 3. 아동 개인정보 · 4. 파기 · 5. 제3자 제공 · 6. 위탁 · 7. 국외이전 · 8. 안전조치 · 9. 자동수집장치·행태정보 · 10. 권리행사 · 11. 책임자 · 12. 추가적 이용·제공 · 13. 민감정보 · 14. 가명정보 · 15. 자동화 결정 · 16. 국내대리인 · 17. 영상정보처리기기 · 18. 자율적 개인정보 보호활동

스텝 ↔ 모듈 매핑 표는 [../apps/ppb/CLAUDE.md](../apps/ppb/CLAUDE.md) 참고.

## UI 레이아웃

3분할: **사이드바(폼)** | **리사이즈 핸들** | **미리보기(렌더 HTML)**.
- 사이드바 너비는 드래그로 280~700px 조절 ([../apps/ppb/js/core/init.js](../apps/ppb/js/core/init.js)의 리사이즈 IIFE).
- 미리보기는 입력 변경마다 `updatePreview()`로 재렌더.
- 상단 툴바에 Word/HTML 내보내기 버튼 (`downloadWord`/`downloadHTML`, [../apps/ppb/js/engine/export.js](../apps/ppb/js/engine/export.js)).

## 상태(`S`) 다루기

`S`는 [../apps/ppb/js/core/state.js](../apps/ppb/js/core/state.js)에 190+ 속성으로 정의. 구조 예:
- 단순 값: `companyName`, `serviceName`, `effectiveDate`
- 불리언 묶음(객체): `retention`, `destroy`, `security`, `rights`, `vaFlags` 등
- 행 배열(반복 입력): `addUsageRows`, `sensitiveRows`, `pseudonymRows`, `adInfoRows`, `depts`, `prevPolicies`
- `"yes"/"no"` 토글: `thirdParty`, `delegate`, `overseas`, `autoDecision`, `cctvFixed` 등

**새 필드 추가 체크리스트**
1. `core/state.js`에 기본값 추가
2. 해당 `sections/` 모듈 / `engine/steps.js`에 입력 UI + `readFields` 반영
3. `engine/preview.js`에 출력 추가 (필요 시 `engine/export.js`도)

## 가장 복잡한 부분: 미리보기 테이블 셀 병합

[../apps/ppb/js/engine/preview.js](../apps/ppb/js/engine/preview.js)는 정책 표를 만들 때 셀 병합(rowspan/colspan) 알고리즘을 돈다. 표 출력 관련 작업은 이 로직을 먼저 파악하고 손댈 것. 파일이 크므로(~102KB) 편집 후 `node --check`로 구문 확인 권장.

## js/ 폴더 구조와 로드 순서

`js/`는 세 폴더로 묶여 있다: `core/`(state·navigation·helpers·init), `engine/`(steps·preview·export), `sections/`(스텝별 기능 모듈 14개). 폴더 위치는 런타임에 영향이 없고 **오직 `<script>` 태그 순서만 중요**하다(번들러·모듈 없음).

[../apps/ppb/builder.html](../apps/ppb/builder.html) 하단 스크립트 순서:
`core/state.js` → `core/navigation.js` → `core/helpers.js` → `sections/*`(collect, children, …, cctv) → `engine/steps.js` → `engine/preview.js` → `engine/export.js` → `core/init.js`.
`core/init.js`의 `window.onload`가 `renderSteps()` + 초기 `updatePreview()`를 호출하며 앱을 띄운다.
