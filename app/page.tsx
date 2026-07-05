import Link from "next/link";

const FEATURES = [
  {
    icon: "🛡️",
    title: "식이 프로필",
    desc: "알러지·종교·건강 조건을 한 번 등록하면 모든 레시피에 자동 반영됩니다. AI 응답은 서버에서 한 번 더 안전 검증합니다.",
  },
  {
    icon: "🎯",
    title: "칼로리 정밀 매칭",
    desc: "650kcal이 필요하면 딱 그만큼. 재료의 양을 역설계해 목표 칼로리 ±5% 이내로 수렴시킵니다.",
  },
  {
    icon: "🥫",
    title: "팬트리 모드",
    desc: "지금 냉장고에 있는 재료 위주로 레시피를 생성하고, 부족한 재료는 장바구니로 바로 연결합니다.",
  },
  {
    icon: "🍳",
    title: "키친 모드",
    desc: "전자레인지뿐이어도 괜찮아요. 보유한 조리 도구만으로 완성 가능한 조리법으로 제한합니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          당신의 <span className="text-brand-600">제약</span>이
          <br />
          <span className="text-brand-600">메뉴</span>가 됩니다
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600">
          알러지, 종교, 건강 조건, 목표 칼로리, 냉장고 사정까지 —
          모든 제약을 만족하는 단 하나의 레시피를 AI가 설계합니다.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/onboarding" className="btn-primary px-6 py-3 text-base">
            시작하기
          </Link>
          <Link href="/generate" className="btn-secondary px-6 py-3 text-base">
            레시피 생성해보기
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <div className="text-3xl">{f.icon}</div>
            <h2 className="mt-3 text-lg font-bold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="card bg-brand-50 text-center">
        <h2 className="text-xl font-bold">이런 요청이 가능해요</h2>
        <p className="mt-3 text-stone-700">
          “땅콩 알러지가 있고 할랄만 먹는데, 냉장고에 있는 닭가슴살로
          <br className="hidden sm:block" />
          <strong> 정확히 650kcal</strong>짜리 저녁을 에어프라이어만으로 만들어줘”
        </p>
      </section>
    </div>
  );
}
