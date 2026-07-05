// 알러지 안전 체크 — AI 응답의 재료 목록에 알러지 유발 재료가
// 포함되어 있는지 서버 측에서 2차 검증한다.
// (AI가 "땅콩 제외"라고 답했더라도 절대 그대로 신뢰하지 않는다)

import type { IngredientLine } from "@/lib/calorie";

// 알러지 항목별 동의어/파생 재료 사전.
// 키는 정규화(공백 제거·소문자화)된 알러지명, 값은 감지할 키워드 목록.
const ALLERGEN_SYNONYMS: Record<string, string[]> = {
  땅콩: ["땅콩", "피넛", "peanut"],
  견과류: [
    "견과", "아몬드", "호두", "캐슈", "캐슈넛", "피스타치오", "마카다미아",
    "헤이즐넛", "브라질너트", "피칸", "잣", "nut", "almond", "walnut",
  ],
  갑각류: ["새우", "게", "꽃게", "랍스터", "가재", "크릴", "shrimp", "crab", "lobster"],
  조개류: ["조개", "바지락", "홍합", "굴", "전복", "가리비", "소라", "clam", "oyster", "mussel"],
  생선: [
    "생선", "고등어", "연어", "참치", "멸치", "갈치", "삼치", "명태", "대구",
    "조기", "꽁치", "어묵", "액젓", "젓갈", "fish", "salmon", "tuna", "anchovy",
  ],
  "우유(유제품)": [
    "우유", "치즈", "버터", "요거트", "요구르트", "크림", "생크림", "연유",
    "분유", "유청", "카제인", "milk", "cheese", "butter", "yogurt", "cream",
  ],
  달걀: ["달걀", "계란", "난백", "난황", "메추리알", "마요네즈", "egg"],
  "밀(글루텐)": [
    "밀가루", "밀", "글루텐", "빵", "파스타", "면", "국수", "라면", "우동",
    "부침가루", "튀김가루", "빵가루", "또띠아", "wheat", "flour", "gluten",
  ],
  대두: ["대두", "콩", "두부", "두유", "간장", "된장", "낫토", "콩나물", "soy", "tofu"],
  메밀: ["메밀", "buckwheat"],
  복숭아: ["복숭아", "peach"],
  토마토: ["토마토", "케첩", "tomato", "ketchup"],
  돼지고기: ["돼지", "삼겹살", "베이컨", "햄", "소시지", "목살", "pork", "bacon", "ham"],
  닭고기: ["닭", "치킨", "chicken"],
  쇠고기: ["쇠고기", "소고기", "우육", "등심", "안심", "차돌", "beef"],
  아황산류: ["아황산", "sulfite"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

/** 알러지명에 해당하는 감지 키워드 목록을 만든다 (사전에 없으면 이름 자체를 키워드로). */
export function keywordsForAllergy(allergy: string): string[] {
  const key = Object.keys(ALLERGEN_SYNONYMS).find(
    (k) => normalize(k) === normalize(allergy) || normalize(k).includes(normalize(allergy))
  );
  const base = key ? ALLERGEN_SYNONYMS[key] : [];
  return [...new Set([allergy, ...base])].map(normalize).filter(Boolean);
}

export interface AllergenViolation {
  allergy: string;
  ingredient: string;
  matchedKeyword: string;
}

/**
 * 재료 목록에서 알러지 위반을 찾는다.
 * 재료명에 알러지 키워드가 부분 문자열로라도 포함되면 위반으로 간주한다
 * (안전 우선 — 과잉 감지가 미감지보다 낫다).
 */
export function findAllergenViolations(
  ingredients: Pick<IngredientLine, "name">[],
  allergies: string[]
): AllergenViolation[] {
  const violations: AllergenViolation[] = [];
  for (const allergy of allergies) {
    const keywords = keywordsForAllergy(allergy);
    for (const ing of ingredients) {
      const name = normalize(ing.name);
      const matched = keywords.find((kw) => kw.length > 0 && name.includes(kw));
      if (matched) {
        violations.push({ allergy, ingredient: ing.name, matchedKeyword: matched });
      }
    }
  }
  return violations;
}
