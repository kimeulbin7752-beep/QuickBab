"use client";

import { useEffect, useMemo, useState } from "react";

interface Item {
  id: string;
  name: string;
}

interface Props {
  title: string;
  description: string;
  apiPath: string; // /api/pantry | /api/kitchen
  listKey: string; // items | tools
  suggestions: readonly string[];
  emptyText: string;
}

/** 팬트리/키친 공용 — 자동완성 지원 아이템 등록/삭제 UI */
export function ItemManager({
  title,
  description,
  apiPath,
  listKey,
  suggestions,
  emptyText,
}: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiPath)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setItems(data?.[listKey] ?? []))
      .finally(() => setLoading(false));
  }, [apiPath, listKey]);

  const matches = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    const owned = new Set(items.map((i) => i.name));
    return suggestions
      .filter((s) => s.toLowerCase().includes(q) && !owned.has(s))
      .slice(0, 8);
  }, [input, items, suggestions]);

  async function add(name: string) {
    const value = name.trim();
    if (!value) return;
    setInput("");
    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value }),
    });
    if (res.ok) {
      const data = await res.json();
      const created: Item = data.item ?? data.tool;
      setItems((prev) =>
        prev.some((i) => i.id === created.id) ? prev : [created, ...prev]
      );
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`${apiPath}/${id}`, { method: "DELETE" });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">{description}</p>

        <div className="relative mt-6">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(matches[0] ?? input);
                }
              }}
              placeholder="이름 입력 (자동완성 지원)"
              className="input"
            />
            <button onClick={() => add(input)} className="btn-primary shrink-0">
              추가
            </button>
          </div>
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
              {matches.map((m) => (
                <li key={m}>
                  <button
                    onClick={() => add(m)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-stone-500">불러오는 중...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-stone-500">{emptyText}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-sm"
                >
                  {item.name}
                  <button
                    onClick={() => remove(item.id)}
                    className="text-stone-400 hover:text-red-600"
                    aria-label={`${item.name} 삭제`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
