"use client";

import { useRequireAuth } from "@/components/useRequireAuth";
import { ItemManager } from "@/components/ItemManager";
import { COMMON_INGREDIENTS } from "@/lib/constants";

export default function PantryPage() {
  useRequireAuth();
  return (
    <ItemManager
      title="🥫 팬트리"
      description="보유한 식재료를 등록하세요. 팬트리 모드에서 이 재료 위주로 레시피를 생성합니다."
      apiPath="/api/pantry"
      listKey="items"
      suggestions={COMMON_INGREDIENTS}
      emptyText="아직 등록된 재료가 없어요. 냉장고 속 재료를 추가해보세요!"
    />
  );
}
