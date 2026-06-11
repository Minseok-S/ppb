# PPB — 개인정보처리방침 빌더

이 디렉터리는 빌더 앱 전체다. 18단계 위저드로 입력받아 개인정보처리방침을 실시간 미리보기로 렌더링하고 HTML/Word로 내보낸다. 상위 가이드는 [../../CLAUDE.md](../../CLAUDE.md), 더 상세한 설명은 [../../docs/ppb.md](../../docs/ppb.md).

## 핵심 개념

### 중앙 상태 객체 `S`
모든 앱 상태는 [js/core/state.js](js/core/state.js)의 단일 전역 객체 `S`에 산다 (190+ 속성). 모든 모듈이 이 객체를 직접 읽고 쓴다. 반응성 레이어는 없다 — `S`를 바꾼 뒤 직접 `updatePreview()`를 호출해야 미리보기가 갱신된다.

### Form → State → Preview 흐름
1. 사용자가 폼 입력 → 인라인 핸들러(`oninput`/`onclick` 등) 발화
2. `readFields()`가 DOM 값을 `S`로 동기화
3. `updatePreview()`가 `S`를 읽어 미리보기 패널을 다시 렌더

### 전역 함수 / 인라인 핸들러
`engine/steps.js`가 생성하는 HTML에 `onclick="..."` 등이 직접 박혀 있다. 따라서 모든 핸들러 함수는 **전역 스코프**에 있어야 한다 (ES 모듈 금지).

### 로드 순서
[builder.html](builder.html) 하단의 `<script>` 순서가 중요하다. `core/state.js`가 가장 먼저, 그 다음 `sections/`의 각 스텝 모듈, 그 다음 `engine/steps.js` → `engine/preview.js` → `engine/export.js`, 마지막에 `core/init.js`. 새 모듈을 추가하면 `state.js` 이후, 그것을 호출하는 모듈 이전에 둔다. **폴더 위치는 런타임에 영향 없음 — 오직 `<script>` 태그 순서만 중요**(번들러·모듈 없음).

## js/ 폴더 구조

세 갈래로 묶여 있다.

| 폴더 | 성격 | 파일 |
|---|---|---|
| `core/` | 앱 골격 | state · navigation · helpers · init |
| `engine/` | 렌더·출력 | steps · preview · export |
| `sections/` | 스텝별 기능 모듈 | 아래 14개 |

### core/

| 파일 | 역할 |
|---|---|
| [js/core/state.js](js/core/state.js) | 전역 `S` 정의 (190+ 속성) — 제일 먼저 로드 |
| [js/core/navigation.js](js/core/navigation.js) | 18단계 위저드 네비게이션·진행률 (`goStep`/`nextStep`/`prevStep`, `stepLabels`) |
| [js/core/helpers.js](js/core/helpers.js) | 라디오·토글·셀렉트 입력 헬퍼 |
| [js/core/init.js](js/core/init.js) | `window.onload` 초기화, 사이드바 리사이즈 핸들 — 가장 마지막 로드 |

### engine/

| 파일 | 역할 |
|---|---|
| [js/engine/steps.js](js/engine/steps.js) | 각 스텝 폼 UI 렌더 (`renderSteps`) — 가장 큼(~93KB) |
| [js/engine/preview.js](js/engine/preview.js) | `S`로부터 미리보기 HTML 생성 (~102KB) — **셀 병합 알고리즘이 가장 복잡** |
| [js/engine/export.js](js/engine/export.js) | HTML·Word(.docx) 내보내기 (`downloadHTML`/`downloadWord`) |

### sections/ (위저드 단계 ↔ 파일)

| # | 스텝 | 파일 |
|---|---|---|
| 1 | 기본 정보 | (state/steps) |
| 2 | 수집 항목 | [js/sections/collect.js](js/sections/collect.js) |
| 3 | 아동 개인정보 | [js/sections/children.js](js/sections/children.js) |
| 4 | 파기 | [js/sections/retention.js](js/sections/retention.js) |
| 5 | 제3자 제공 | [js/sections/thirdparty.js](js/sections/thirdparty.js) |
| 6 | 위탁 | [js/sections/delegation.js](js/sections/delegation.js) |
| 7 | 국외이전 | [js/sections/overseas.js](js/sections/overseas.js) |
| 8 | 안전조치 | [js/sections/security.js](js/sections/security.js) |
| 9 | 자동수집장치·행태정보 | [js/sections/behavioral.js](js/sections/behavioral.js) |
| 11 | 책임자 / 부서 | [js/sections/departments.js](js/sections/departments.js) |
| 12 | 추가적 이용·제공 | [js/sections/addusage.js](js/sections/addusage.js) |
| 13 | 민감정보 | [js/sections/sensitive.js](js/sections/sensitive.js) |
| 14 | 가명정보 | [js/sections/pseudonym.js](js/sections/pseudonym.js) |
| 15 | 자동화 결정 | [js/sections/autodecision.js](js/sections/autodecision.js) |
| 17 | 영상정보처리기기(CCTV) | [js/sections/cctv.js](js/sections/cctv.js) |

(10 권리행사·16 국내대리인·18 자율보호활동은 별도 모듈 없이 engine/steps·preview·core/state에서 처리)

## 작업 시 주의

- **`engine/preview.js`의 테이블 셀 병합**이 이 앱에서 가장 까다로운 부분. 표 출력을 건드릴 땐 병합 로직을 먼저 이해할 것.
- `S`에 새 필드를 추가하면 ① `core/state.js` 기본값, ② 해당 `sections/` 모듈의 `readFields`/렌더, ③ `engine/preview.js` 출력 세 곳을 함께 손봐야 한다.
- 새 스텝 모듈을 추가하면 `sections/`에 두고 [builder.html](builder.html)의 `<script>` 블록(sections 구역)에 등록한다.
- 구문 점검: `node --check js/engine/steps.js` (큰 파일이라 편집 후 권장).
