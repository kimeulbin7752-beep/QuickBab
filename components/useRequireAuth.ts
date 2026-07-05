"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/** 미로그인 시 /signin으로 보내는 클라이언트 가드 훅 */
export function useRequireAuth() {
  const router = useRouter();
  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/signin");
    },
  });
  return session;
}
