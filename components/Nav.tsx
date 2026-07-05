"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const LINKS = [
  { href: "/generate", label: "레시피 생성" },
  { href: "/pantry", label: "팬트리" },
  { href: "/kitchen", label: "키친" },
  { href: "/history", label: "히스토리" },
  { href: "/onboarding", label: "프로필" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-extrabold text-brand-600">
            🍚 QuickBab
          </Link>
          {session && (
            <nav className="hidden gap-4 sm:flex">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm font-medium transition ${
                    pathname.startsWith(l.href)
                      ? "text-brand-600"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status === "loading" ? null : session ? (
            <>
              <span className="hidden text-xs text-stone-500 sm:block">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-stone-500 hover:text-stone-900"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/signin" className="btn-primary">
              로그인
            </Link>
          )}
        </div>
      </div>
      {session && (
        <nav className="flex gap-4 overflow-x-auto border-t border-stone-100 px-4 py-2 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap text-sm font-medium ${
                pathname.startsWith(l.href) ? "text-brand-600" : "text-stone-500"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
