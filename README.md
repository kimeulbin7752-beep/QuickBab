# 🍚 QuickBab

> **"당신의 제약이 메뉴가 됩니다"**

알러지 · 종교 · 건강 조건을 고려한 **AI 맞춤 레시피** 웹앱입니다.
목표 칼로리를 지정하면 재료의 양을 역설계해 **±5% 오차 이내**로 맞춘 레시피를 생성합니다.

## 핵심 기능

| 기능 | 설명 |
|---|---|
| 🛡️ **식이 프로필** | 알러지(다중 선택 + 직접 입력), 종교·신념 제한(할랄/코셔/비건 등), 건강 조건(당뇨/고혈압 등)을 등록하면 모든 레시피 생성에 자동 반영 |
| 🎯 **칼로리 정밀 매칭** | 목표 칼로리(예: 650kcal) 지정 시 재료 양을 조절해 ±5% 이내로 수렴. 결과 화면에 재료별 칼로리 분해표 표시 |
| 📅 **하루 칼로리 배분** | 하루 총 칼로리 입력 시 아침 30% / 점심 40% / 저녁 30% 배분 제안 |
| 🥫 **팬트리** | 보유 식재료 등록(자동완성), 팬트리 모드로 보유 재료 위주 레시피 생성 + 부족 재료 목록 표시 |
| 🍳 **키친** | 보유 조리 도구 등록, 키친 모드로 등록된 도구만 사용하는 조리법으로 제한 |
| 🛒 **재료 주문 (Mock)** | 부족한 재료 → 장바구니 담기 → 모의 주문서. 실제 커머스 API 연동 지점은 `app/api/order/route.ts`에 주석으로 표시 |

## 안전 설계 (AI 응답을 신뢰하지 않기)

AI가 "알러지 재료를 제외했다"고 답해도 **서버가 다시 검증**합니다.

1. **알러지 2차 검증** — `lib/allergen.ts`의 동의어 사전(예: 땅콩 → 피넛/peanut, 유제품 → 치즈/버터/유청)으로 응답의 모든 재료를 부분 문자열 매칭. 위반 발견 시 즉시 거부.
2. **칼로리 재계산** — `lib/calorie.ts`가 재료별 칼로리를 직접 합산해 (a) AI가 주장한 총량과의 정합성, (b) 목표 ±5% 오차를 검증.
3. **자동 재시도** — 검증 실패 시 실패 사유를 피드백 프롬프트로 주입해 **최대 2회 재시도** (`lib/recipe-engine.ts`).

## 기술 스택

- **Next.js 14 (App Router)** + TypeScript — 프론트엔드/백엔드 통합
- **Tailwind CSS** — 스타일링
- **Prisma + SQLite** — 개발용 DB (스키마는 Postgres 전환 가능하게 설계, `prisma/schema.prisma` 주석 참고)
- **Anthropic API (Claude)** — 레시피 생성 엔진. structured outputs(JSON Schema)로 응답 형식 강제
- **NextAuth.js** — 이메일 기반 간단 로그인 (MVP)
- **Vitest** — 핵심 로직(칼로리 검증, 알러지 안전 체크) 단위 테스트

## 로컬 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env를 열어 ANTHROPIC_API_KEY와 NEXTAUTH_SECRET을 채워주세요
# NEXTAUTH_SECRET 생성: openssl rand -base64 32

# 3. DB 초기화 (SQLite)
npm run db:push

# 4. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

### 테스트

```bash
npm test
```

## 아키텍처

```
app/
├── page.tsx                  # 랜딩 (슬로건 + 핵심 가치)
├── signin/                   # 이메일 간편 로그인
├── onboarding/               # 식이 프로필 설정 (3단계 위저드)
├── generate/                 # 레시피 생성 (칼로리 목표 + 팬트리/키친 모드 토글)
├── recipe/[id]/              # 레시피 상세 (칼로리 분해표, 조리 단계, 주문 버튼)
├── pantry/ · kitchen/        # 재료/도구 관리 (자동완성)
├── history/                  # 생성 레시피 히스토리
└── api/
    ├── auth/[...nextauth]/   # NextAuth
    ├── profile/              # 식이 프로필 CRUD
    ├── pantry/ · kitchen/    # 재료/도구 CRUD
    ├── generate/             # AI 레시피 생성 (검증 + 재시도 포함)
    ├── recipes/              # 히스토리/상세 조회
    ├── meal-plan/            # 하루 칼로리 배분
    └── order/                # 모의 주문 (실제 커머스 연동 지점)

lib/
├── recipe-engine.ts          # Anthropic 호출 + 프롬프트 구성 + 검증/재시도 루프
├── recipe-schema.ts          # 응답 JSON Schema (structured outputs) + zod 스키마
├── allergen.ts               # 알러지 동의어 사전 + 위반 감지 (서버측 2차 검증)
├── calorie.ts                # 칼로리 합산/±5% 검증/하루 배분
├── auth.ts                   # NextAuth 설정 (이메일 credentials)
├── prisma.ts                 # Prisma 클라이언트 싱글턴
└── constants.ts              # 알러지/종교/건강/도구/재료 프리셋

prisma/schema.prisma          # User, DietaryProfile, PantryItem, KitchenTool, Recipe, MealPlan
tests/                        # 칼로리 검증 · 알러지 안전 체크 단위 테스트
```

### 레시피 생성 흐름

```
사용자 요청 (목표 kcal, 모드)
  → 저장된 프로필/팬트리/키친 로드
  → 시스템 프롬프트에 구조화 주입
  → Claude 호출 (JSON Schema 강제)
  → 서버 검증: 알러지 체크 → 칼로리 합산 ±5% 체크
      ├─ 통과 → DB 저장 → 상세 페이지로 이동
      └─ 실패 → 실패 사유를 피드백으로 재시도 (최대 2회)
```

## 향후 계획

- [ ] 실제 커머스 API 연동 (장바구니/주문)
- [ ] 매직 링크(EmailProvider) 또는 OAuth 로그인
- [ ] Postgres 전환 (schema.prisma의 JSON 문자열 필드 → Json/배열 타입)
- [ ] 하루 식단 전체(아침/점심/저녁) 일괄 생성
