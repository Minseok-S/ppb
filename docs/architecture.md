# 아키텍처

CELA Privacy Tools Suite의 전체 구조와 두 앱이 공유하는 패턴을 설명한다. 도구별 상세는 [ppb.md](ppb.md), [lse.md](lse.md) 참고.

## 큰 그림

```
                    index.html  (통합 셸)
                   ┌──────────────────────┐
                   │  [PPB 탭] [LSE 탭]    │  ← 상단 세그먼트 컨트롤
                   ├──────────────────────┤
                   │   <iframe>            │
                   │   ┌────────────────┐  │
   apps/ppb/  ◄────┼───│ builder.html   │  │  PPB: 기본 로드
   builder.html    │   └────────────────┘  │
                   │   ┌────────────────┐  │
   apps/lse/  ◄────┼───│ index.html     │  │  LSE: 탭 최초 전환 시 lazy-load
   index.html      │   └────────────────┘  │
                   └──────────────────────┘
```

- 셸([../index.html](../index.html))은 두 앱을 **iframe**으로 띄우고 탭으로 전환한다.
- PPB iframe은 `src="apps/ppb/builder.html"`로 즉시 로드.
- LSE iframe은 `data-src="apps/lse/index.html"`에 보관했다가 탭을 처음 누를 때 `src`에 채워 lazy-load (`switchTab`).
- 각 iframe 위에 로딩 오버레이가 있고 `onload` 시 사라진다 (`onFrameLoad`).

이 iframe 경로 2개가 셸과 앱 사이의 **유일한 결합점**이다. 앱 폴더를 옮기면 이 두 경로만 고치면 된다.

## 공유 설계 원칙

| 원칙 | 내용 |
|---|---|
| No build | 번들러·트랜스파일러·dev 서버 없음. `file://`로 직접 연다. |
| No npm | 의존성 매니저 없음. 외부 리소스는 CDN(`fonts.googleapis.com`)이나 런타임 fetch만. |
| 전역 스코프 | 모든 JS는 `<script>`로 전역 로드. ES 모듈 미사용. |
| 인라인 핸들러 | HTML(혹은 JS가 생성한 HTML)에 `onclick` 등이 직접 박힘 → 핸들러는 전역 접근 가능해야 함. |
| 상대경로 | 절대경로·번들 가정 금지. 파일 이동은 폴더 단위로. |

## 두 앱의 상태 모델 차이

- **PPB**: 단일 전역 객체 `S`(state.js)에 모든 상태 집중. 모듈이 직접 변경 후 `updatePreview()` 수동 호출. → [ppb.md](ppb.md)
- **LSE**: 단일 IIFE(editor.js) 내부 지역 변수로 상태 관리. DOM(`contenteditable` iframe)이 곧 상태. `MutationObserver`로 변경 추적. → [lse.md](lse.md)

두 앱은 코드를 전혀 공유하지 않으며 서로 독립적으로 수정·실행할 수 있다.
