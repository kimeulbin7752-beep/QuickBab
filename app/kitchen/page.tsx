"use client";

import { useRequireAuth } from "@/components/useRequireAuth";
import { ItemManager } from "@/components/ItemManager";
import { KITCHEN_TOOL_PRESETS } from "@/lib/constants";

export default function KitchenPage() {
  useRequireAuth();
  return (
    <ItemManager
      title="🍳 키친"
      description="보유한 조리 도구를 등록하세요. 키친 모드에서 이 도구만으로 완성 가능한 조리법으로 제한합니다."
      apiPath="/api/kitchen"
      listKey="tools"
      suggestions={KITCHEN_TOOL_PRESETS}
      emptyText="아직 등록된 도구가 없어요. 전자레인지, 에어프라이어 등을 추가해보세요!"
    />
  );
}
