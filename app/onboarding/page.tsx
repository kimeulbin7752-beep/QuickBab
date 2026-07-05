"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/components/useRequireAuth";
import { ChipSelector } from "@/components/ChipSelector";
import {
  ALLERGY_PRESETS,
  RELIGIOUS_PRESETS,
  HEALTH_PRESETS,
} from "@/lib/constants";

const STEPS = [
  {
    key: "allergies" as const,
    title: "알러지가 있나요?",
    desc: "선택한 재료와 파생물은 레시피에서 완전히 제외되며, AI 응답도 서버에서 한 번 더 검증합니다.",
    presets: ALLERGY_PRESETS,
    placeholder: "예: 키위",
  },
  {
    key: "religiousRestrictions" as const,
    title: "종교·신념에 따른 제한이 있나요?",
    desc: "할랄, 코셔, 비건 등 식이 규칙을 모든 레시피에 반영합니다.",
    presets: RELIGIOUS_PRESETS,
    placeholder: "예: 자이나교",
  },
  {
    key: "healthConditions" as const,
    title: "건강 조건을 알려주세요",
    desc: "당뇨, 고혈압 등 조건에 맞춰 나트륨·당류·지방을 조절합니다.",
    presets: HEALTH_PRESETS,
    placeholder: "예: 빈혈",
  },
];

type ProfileState = {
  allergies: string[];
  religiousRestrictions: string[];
  healthConditions: string[];
};

export default function OnboardingPage() {
  useRequireAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileState>({
    allergies: [],
    religiousRestrictions: [],
    healthConditions: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile({
            allergies: data.allergies ?? [],
            religiousRestrictions: data.religiousRestrictions ?? [],
            healthConditions: data.healthConditions ?? [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (res.ok) router.push("/generate");
  }

  if (loading) return <p className="text-stone-500">불러오는 중...</p>;

  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-brand-500" : "bg-stone-200"
            }`}
          />
        ))}
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-brand-600">
          단계 {step + 1} / {STEPS.length}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{current.title}</h1>
        <p className="mt-2 text-sm text-stone-500">{current.desc}</p>

        <div className="mt-6">
          <ChipSelector
            presets={current.presets}
            selected={profile[current.key]}
            onChange={(next) =>
              setProfile((p) => ({ ...p, [current.key]: next }))
            }
            customPlaceholder={current.placeholder}
          />
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="btn-secondary"
          >
            이전
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
              다음
            </button>
          ) : (
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "저장 중..." : "프로필 저장하고 시작"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
