# CELA Privacy Tools Suite

한국 개인정보처리방침을 만들고 편집하기 위한 웹 도구 모음. 빌드 과정·설치 없이 브라우저에서 바로 동작하는 순수 바닐라 HTML/CSS/JS.

## 구성 도구

| 도구 | 이름 | 설명 |
|---|---|---|
| **PPB** | 개인정보처리방침 빌더 | 18단계 위저드로 입력하면 법적 요건을 갖춘 개인정보처리방침을 생성. HTML / Word(.docx) 내보내기 지원. |
| **LSE** | 실시간 편집기 | 기존 처리방침을 URL·파일로 불러와 화면에서 직접 편집하고 원본과 변경점(diff)을 비교. |

## 실행

설치할 것도, 띄울 서버도 없다. 파일을 브라우저로 열면 끝.

```
index.html              # 통합 셸 — 상단 탭으로 두 도구 전환 (권장 진입점)
apps/ppb/builder.html   # 빌더 단독 실행
apps/lse/index.html     # 편집기 단독 실행
```

## 디렉터리 구조

```
.
├── index.html          # 통합 셸 (탭 스위처, iframe으로 두 앱 로드)
├── apps/
│   ├── ppb/            # 빌더: builder.html · styles.css · js/(21개 모듈)
│   └── lse/            # 편집기: index.html · editor.js · editor.css
├── docs/               # 아키텍처/도구별 상세 문서
└── CLAUDE.md           # AI 작업용 가이드
```

## 개발 메모

- 빌드 시스템·npm·모듈 번들러 없음. 스크립트는 전역 스코프에 로드되고 HTML 인라인 핸들러에서 호출된다.
- `file://`로 직접 열기 때문에 모든 경로는 상대경로다.
- 더 깊은 구조 설명은 [docs/architecture.md](docs/architecture.md), 도구별 가이드는 [apps/ppb/CLAUDE.md](apps/ppb/CLAUDE.md) · [apps/lse/CLAUDE.md](apps/lse/CLAUDE.md) 참고.
