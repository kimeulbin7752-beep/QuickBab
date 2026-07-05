"use client";

import { useState } from "react";

interface Props {
  presets: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  customPlaceholder?: string;
}

/** 프리셋 다중 선택 + 직접 입력을 지원하는 칩 셀렉터 */
export function ChipSelector({ presets, selected, onChange, customPlaceholder }: Props) {
  const [custom, setCustom] = useState("");

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  function addCustom() {
    const value = custom.trim();
    if (value && !selected.includes(value)) {
      onChange([...selected, value]);
    }
    setCustom("");
  }

  const customValues = selected.filter((v) => !presets.includes(v));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => toggle(p)}
            className={`chip ${selected.includes(p) ? "chip-on" : "chip-off"}`}
          >
            {p}
          </button>
        ))}
        {customValues.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggle(v)}
            className="chip chip-on"
            title="클릭하여 제거"
          >
            {v} ✕
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={customPlaceholder ?? "직접 입력 후 Enter"}
          className="input max-w-xs"
        />
        <button type="button" onClick={addCustom} className="btn-secondary">
          추가
        </button>
      </div>
    </div>
  );
}
