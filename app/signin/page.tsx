"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setError("올바른 이메일 주소를 입력해주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <div className="card">
        <h1 className="text-xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-stone-500">
          이메일만 입력하면 바로 시작할 수 있어요. (MVP 간편 로그인)
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "로그인 중..." : "이메일로 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
