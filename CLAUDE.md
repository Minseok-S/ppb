# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CELA Privacy Tools Suite** — 한국 개인정보처리방침 관련 도구 모음. 두 개의 독립 웹앱을 하나의 통합 셸로 묶었다.

- **PPB** (개인정보처리방침 빌더) — 18단계 위저드로 법적 요건을 충족하는 개인정보처리방침 문서를 생성하고 HTML/Word로 내보낸다.
- **LSE** (실시간 편집기 / Live Screen Editor) — 기존 개인정보처리방침을 URL 또는 파일로 불러와 인플레이스로 편집하고 원본과의 diff를 보여준다.

빌드 시스템·npm 없음. 순수 바닐라 HTML/CSS/JS. 브라우저에서 파일을 직접 연다.

## Directory Layout

```
ppb/
├── index.html          # 통합 셸 — 상단 탭으로 두 앱을 iframe으로 전환
├── README.md           # 사람용 개요
├── CLAUDE.md           # (이 파일) AI용 최상위 가이드
├── docs/               # 상세 문서
│   ├── architecture.md # 전체 구조·공통 패턴
│   ├── ppb.md          # 빌더 상세
│   └── lse.md          # 편집기 상세
└── apps/
    ├── ppb/            # 빌더 앱 (자세한 가이드: apps/ppb/CLAUDE.md)
    │   ├── builder.html
    │   ├── styles.css
    │   └── js/         # 21개 모듈
    └── lse/            # 편집기 앱 (자세한 가이드: apps/lse/CLAUDE.md)
        ├── index.html
        ├── editor.js
        └── editor.css
```

## Running the App

빌드/서버/패키지 매니저 없음.

- **전체 스위트**: `index.html`을 브라우저로 연다. PPB 탭이 기본, LSE 탭은 최초 전환 시 lazy-load.
- **빌더 단독**: `apps/ppb/builder.html`
- **편집기 단독**: `apps/lse/index.html`

> ⚠️ 모든 경로는 상대경로다. 파일을 옮기면 폴더 단위로 옮겨 상대참조가 깨지지 않게 한다. 셸의 iframe 경로(`apps/ppb/builder.html`, `apps/lse/index.html`)는 [index.html](index.html)에 하드코딩돼 있다.

## 어디를 고칠까 (라우팅)

| 하고 싶은 것 | 가야 할 곳 |
|---|---|
| 탭 전환·로더·셸 UI | [index.html](index.html) |
| 빌더의 폼/스텝/미리보기/내보내기 | [apps/ppb/](apps/ppb/) → 먼저 [apps/ppb/CLAUDE.md](apps/ppb/CLAUDE.md) |
| 편집기의 로드/편집/diff | [apps/lse/](apps/lse/) → 먼저 [apps/lse/CLAUDE.md](apps/lse/CLAUDE.md) |
| 전체 아키텍처 이해 | [docs/architecture.md](docs/architecture.md) |

## 공통 규칙 (두 앱 모두)

- **No build / no npm / no modules** — `<script>` 태그로 전역 스코프 로드. 함수는 전역에서 접근 가능해야 한다 (HTML의 인라인 `onclick` 등에서 호출).
- **로드 순서가 중요** — 특히 PPB는 `state.js`가 가장 먼저 로드돼야 이후 모듈이 `S`를 쓸 수 있다. 스크립트 순서는 [apps/ppb/builder.html](apps/ppb/builder.html) 하단 참조.
- **상대경로 유지** — `file://`로 직접 열기 때문에 절대경로/번들러 가정 금지.
- **두 앱은 거의 독립** — 유일한 결합점은 셸([index.html](index.html))의 iframe 참조뿐. 한쪽을 고쳐도 다른 쪽에 영향 없음.
