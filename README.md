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

## 주의

본 도구는 **실제 여론조사 결과를 대체하지 않습니다.**
