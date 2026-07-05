import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";

// 재료 주문 연동 (Mock)
//
// ⚠️ 실제 배달/커머스 플랫폼 연동 지점:
//   - 쿠팡/마켓컬리/B마트 등의 파트너 API로 교체할 자리입니다.
//   - 연동 시: 상품 검색 API로 재료명 → SKU 매핑 후, 장바구니 생성 API 호출.
//   - 현재는 mock 가격/배송 정보를 만들어 주문 흐름만 시뮬레이션합니다.

const OrderSchema = z.object({
  items: z.array(z.string().trim().min(1)).min(1).max(50),
});

// 재료명 기반 결정적(deterministic) mock 가격 — 데모 시 일관된 값 표시용
function mockPrice(name: string): number {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 10000;
  return 1500 + (hash % 70) * 100; // 1,500 ~ 8,400원
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = OrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const cart = parsed.data.items.map((name) => ({
    name,
    price: mockPrice(name),
    quantity: 1,
    // TODO(실연동): 실제 상품 이미지/SKU/판매처 정보로 교체
    vendor: "QuickBab 모의마켓",
  }));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= 30000 ? 0 : 3000;

  return NextResponse.json({
    orderId: `mock-${Date.now()}`,
    cart,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    estimatedDelivery: "내일 오전 도착 (모의 데이터)",
  });
}
