# RegionPulse AI (MVP)

합성 페르소나를 기반으로 지역/나이/학력 조건에 따른 사회 이슈 반응을 가설적으로 시뮬레이션하는 프론트엔드 MVP입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 표시되는 로컬 주소(기본 `http://localhost:5173`)로 접속하세요.

## 빌드

```bash
npm run build
```

## 구성

- `src/data/personas.ts`: 200명+ mock 페르소나 데이터
- `src/lib/simulation.ts`: 필터링/샘플링/입장 생성/집계 로직
- `src/lib/chat.ts`: 선택 페르소나와의 후속 대화 응답(mock) 로직
- `src/components/*`: 설문 폼/대시보드/카드 컴포넌트
- `src/types.ts`: 공통 타입 정의

## MVP 기능

- 조건 필터 기반 시뮬레이션 실행(복수 회 실행 가능)
- 조건 일치 표본 부족 시 유사 페르소나 자동 보강
- 대표 발언/태그/분포 시각화
- 선택한 페르소나와 후속 대화
- 이전 설문 히스토리(최대 10건) 조회

## Opinion API 모듈화

기본값은 기존 로직(builtin opinion engine)이며, 환경변수로 외부 API를 선택할 수 있습니다.

- `VITE_OPINION_PROVIDER=builtin` (기본)
- `VITE_OPINION_PROVIDER=gemini`
- `VITE_OPINION_PROVIDER=local_api`

추가 옵션:
- `VITE_GEMINI_API_KEY=...` (Gemini 사용 시)
- `VITE_LOCAL_OPINION_API_URL=http://localhost:8080/opinion` (로컬 API 사용 시)

설정이 없거나 API 호출이 실패하면 자동으로 builtin opinion engine으로 fallback 됩니다.

## 주의

본 도구는 **실제 여론조사 결과를 대체하지 않습니다.**
실제 응답 데이터(예: KOSIS, 공공 여론조사)가 없으면, 페르소나 설정만으로는 실제 설문 결과를 직접 확인할 수 없습니다.
Nemotron-Personas-Korea 류 데이터는 실제 설문 응답 데이터가 아니라 합성 페르소나 데이터이며, RegionPulse는 persona profile에서 opinion signal을 추정해 응답을 생성합니다.
따라서 결과는 실제 여론조사가 아니라 가설 탐색/서비스 프로토타입 용도로 해석해야 합니다.
