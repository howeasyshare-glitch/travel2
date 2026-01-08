"use client";

import React, { useMemo, useState } from "react";
import {
  MapPin,
  Sparkles,
  Loader2,
  Calendar,
  Utensils,
  Hotel,
  Landmark,
  Plus,
  Trash2,
  Pencil,
  Flag,
  Car,
  Coffee,
} from "lucide-react";

type Mode = "recommend" | "custom";
type Pace = "packed" | "normal" | "relaxed";
type BlockType = "arrival" | "spot" | "meal" | "hotel" | "move" | "free";

type Option = {
  label: "A" | "B";
  title: string;
  place?: string;
  note?: string;
  score: number; // 0-100
  reason: string; // 簡短理由
};

type ItineraryBlock = {
  id: string;
  timeStart: string; // "HH:MM"
  timeEnd: string; // "HH:MM"
  type: BlockType;

  // 目前選中的內容（會跟著 selectedOption 變動）
  title: string;
  place?: string;
  note?: string;

  // 只有 spot/meal/hotel 會有 options
  options?: Option[];
  selectedOption?: "A" | "B";
};

type ItineraryDay = {
  day: number;
  blocks: ItineraryBlock[];
};

type Itinerary = {
  title: string;
  assumptions?: {
    startTime?: string;
    pace?: Pace;
  };
  days: ItineraryDay[];
};

const typeMeta: Record<
  BlockType,
  { label: string; icon: any; bg: string; chip: string }
> = {
  arrival: {
    label: "抵達/開始",
    icon: Flag,
    bg: "bg-indigo-50 border-indigo-100",
    chip: "bg-indigo-600",
  },
  spot: {
    label: "景點",
    icon: Landmark,
    bg: "bg-emerald-50 border-emerald-100",
    chip: "bg-emerald-600",
  },
  meal: {
    label: "餐廳/用餐",
    icon: Utensils,
    bg: "bg-orange-50 border-orange-100",
    chip: "bg-orange-600",
  },
  hotel: {
    label: "住宿/Check-in",
    icon: Hotel,
    bg: "bg-blue-50 border-blue-100",
    chip: "bg-blue-600",
  },
  move: {
    label: "移動/交通",
    icon: Car,
    bg: "bg-slate-50 border-slate-200",
    chip: "bg-slate-700",
  },
  free: {
    label: "自由活動",
    icon: Coffee,
    bg: "bg-violet-50 border-violet-100",
    chip: "bg-violet-600",
  },
};

function scoreLabel(score: number) {
  if (score >= 85) return "很推薦";
  if (score >= 70) return "推薦";
  if (score >= 55) return "可考慮";
  return "普通";
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Itinerary | null>(null);

  const [form, setForm] = useState({
    location: "",
    days: 3,
    adults: 2,
    children: 0,
    pace: "normal" as Pace,
    meals: { mode: "recommend" as Mode, customText: "" },
    hotel: { mode: "recommend" as Mode, customText: "" },
    spots: { mode: "custom" as Mode, customList: ["景點1", "景點2"] as string[] },
  });

  const canSubmit = useMemo(() => {
    if (!form.location) return false;
    if (form.days < 1) return false;
    if (form.adults < 1) return false;
    if (form.hotel.mode === "custom" && !form.hotel.customText.trim()) return false;
    if (form.meals.mode === "custom" && !form.meals.customText.trim()) return false;
    if (form.spots.mode === "custom") {
      const list = form.spots.customList.map((s) => s.trim()).filter(Boolean);
      if (list.length === 0) return false;
    }
    return true;
  }, [form]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "API error");
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const clean = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean) as Itinerary;

      // 若 AI 有給 options + selectedOption，確保 title/place/note 同步（保底）
      parsed.days?.forEach((d) => {
        d.blocks?.forEach((b) => {
          if (
            (b.type === "spot" || b.type === "meal" || b.type === "hotel") &&
            b.options?.length
          ) {
            const pick = b.selectedOption ?? "A";
            const opt = b.options.find((o) => o.label === pick) ?? b.options[0];
            b.selectedOption = opt.label;
            b.title = opt.title;
            b.place = opt.place;
            b.note = opt.note;
          }
        });
      });

      setResult(parsed);
    } catch (error: any) {
      alert("生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBlock = (dayIndex: number, blockId: string, patch: Partial<ItineraryBlock>) => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const day = next.days[dayIndex];
      const idx = day.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      day.blocks[idx] = { ...day.blocks[idx], ...patch };
      return next;
    });
  };

  const switchOption = (dayIndex: number, blockId: string, to: "A" | "B") => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const day = next.days[dayIndex];
      const idx = day.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;

      const b = day.blocks[idx];
      if (!b.options?.length) return prev;

      const opt = b.options.find((o) => o.label === to);
      if (!opt) return prev;

      b.selectedOption = to;
      b.title = opt.title;
      b.place = opt.place;
      b.note = opt.note;

      return next;
    });
  };

  const removeSpotRow = (idx: number) => {
    setForm((p) => {
      const next = structuredClone(p);
      next.spots.customList.splice(idx, 1);
      if (next.spots.customList.length === 0) next.spots.customList.push("");
      return next;
    });
  };

  const addSpotRow = () => {
    setForm((p) => ({ ...p, spots: { ...p.spots, customList: [...p.spots.customList, ""] } }));
  };

  const paceButton = (value: Pace, label: string, sub: string) => {
    const active = form.pace === value;
    return (
      <button
        type="button"
        onClick={() => setForm({ ...form, pace: value })}
        className={`flex-1 p-3 rounded-2xl border text-left transition ${
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <div className="font-black">{label}</div>
        <div className={`text-xs mt-1 ${active ? "text-white/80" : "text-slate-400"}`}>{sub}</div>
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">專業 AI 旅程助手</h1>
          <p className="text-slate-500">輸入需求 → 生成可切換/可編輯的時間行程表</p>
        </div>

        {/* 表單 */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 地點 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">探索目的地</label>
              <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3">
                <MapPin className="text-slate-400 mr-2" size={20} />
                <input
                  className="bg-transparent w-full outline-none font-medium"
                  placeholder="例如：東京、台南..."
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            {/* 節奏 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">旅遊節奏</label>
              <div className="flex gap-3">
                {paceButton("packed", "趕", "景點多、走得密、休息少")}
                {paceButton("normal", "一般", "平衡安排，彈性適中")}
                {paceButton("relaxed", "悠閑", "停留久、留白多、慢慢玩")}
              </div>
            </div>

            {/* 天數與人數 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar size={16} /> 旅遊天數
              </label>
              <input
                type="number"
                min="1"
                max="14"
                className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none font-medium"
                value={form.days}
                onChange={(e) => setForm({ ...form, days: parseInt(e.target.value || "1", 10) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">成人</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none"
                  value={form.adults}
                  onChange={(e) => setForm({ ...form, adults: parseInt(e.target.value || "1", 10) })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">小孩</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none"
                  value={form.children}
                  onChange={(e) => setForm({ ...form, children: parseInt(e.target.value || "0", 10) })}
                />
              </div>
            </div>

            {/* 三餐：推薦/自訂 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Utensils size={16} /> 三餐（餐廳）
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, meals: { ...form.meals, mode: "recommend" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.meals.mode === "recommend"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  推薦
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, meals: { ...form.meals, mode: "custom" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.meals.mode === "custom"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  自訂
                </button>
              </div>
              {form.meals.mode === "custom" && (
                <input
                  className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none"
                  placeholder="例：想吃燒肉、不要海鮮、找親子友善..."
                  value={form.meals.customText}
                  onChange={(e) => setForm({ ...form, meals: { ...form.meals, customText: e.target.value } })}
                />
              )}
            </div>

            {/* 景點：推薦/自訂 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Landmark size={16} /> 景點
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, spots: { ...form.spots, mode: "recommend" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.spots.mode === "recommend"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  推薦
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, spots: { ...form.spots, mode: "custom" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.spots.mode === "custom"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  自訂
                </button>
              </div>

              {form.spots.mode === "custom" && (
                <div className="space-y-3">
                  {form.spots.customList.map((val, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 bg-slate-100 rounded-xl px-4 py-3 outline-none"
                        placeholder={`景點 ${idx + 1}（例：淺草寺）`}
                        value={val}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((p) => {
                            const next = structuredClone(p);
                            next.spots.customList[idx] = v;
                            return next;
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpotRow(idx)}
                        className="px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                        title="刪除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addSpotRow} className="inline-flex items-center gap-2 text-blue-600 font-bold">
                    <Plus size={18} /> 新增景點
                  </button>
                </div>
              )}
            </div>

            {/* 旅館：推薦/自訂 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Hotel size={16} /> 旅館
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hotel: { ...form.hotel, mode: "recommend" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.hotel.mode === "recommend"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  推薦（市中心/交通便利）
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hotel: { ...form.hotel, mode: "custom" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.hotel.mode === "custom"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  自訂（指定旅館/條件）
                </button>
              </div>
              {form.hotel.mode === "custom" && (
                <input
                  className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none"
                  placeholder="例：想住 ABC 酒店 / 靠近市中心 / 靠近車站..."
                  value={form.hotel.customText}
                  onChange={(e) => setForm({ ...form, hotel: { ...form.hotel, customText: e.target.value } })}
                />
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="md:col-span-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "AI 正在生成時間行程表..." : "生成可切換行程表"}
            </button>
          </div>
        </div>

        {/* 結果（可編輯 + A/B 切換） */}
        {result && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">{result.title}</h2>

            {result.days?.map((day, dayIndex) => (
              <div key={day.day} className="bg-white rounded-3xl p-8 shadow-md border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-sm">
                    DAY {day.day}
                  </span>
                  <span className="text-slate-400 text-sm">（不同類型有不同顏色；A/B 可直接切換）</span>
                </div>

                <div className="space-y-4">
                  {day.blocks?.map((b) => {
                    const meta = typeMeta[b.type];
                    const Icon = meta.icon;
                    const hasOptions = (b.type === "spot" || b.type === "meal" || b.type === "hotel") && b.options?.length;

                    const selected =
                      hasOptions ? b.options!.find((o) => o.label === (b.selectedOption ?? "A")) : null;

                    return (
                      <div key={b.id} className={`rounded-2xl border p-4 ${meta.bg}`}>
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 w-10 h-10 rounded-2xl ${meta.chip} flex items-center justify-center`}>
                            <Icon size={18} className="text-white" />
                          </div>

                          <div className="flex-1">
                            {/* header row */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <input
                                  className="w-24 bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none font-mono text-sm"
                                  value={b.timeStart}
                                  onChange={(e) => updateBlock(dayIndex, b.id, { timeStart: e.target.value })}
                                />
                                <span className="text-slate-400">—</span>
                                <input
                                  className="w-24 bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none font-mono text-sm"
                                  value={b.timeEnd}
                                  onChange={(e) => updateBlock(dayIndex, b.id, { timeEnd: e.target.value })}
                                />
                                <span className="ml-2 text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                  <Pencil size={14} /> {meta.label}
                                </span>
                              </div>

                              {/* A/B switch + score */}
                              {hasOptions && selected && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                                    <button
                                      type="button"
                                      onClick={() => switchOption(dayIndex, b.id, "A")}
                                      className={`px-3 py-2 text-sm font-black ${
                                        b.selectedOption === "A" ? "bg-slate-900 text-white" : "text-slate-700"
                                      }`}
                                    >
                                      A
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => switchOption(dayIndex, b.id, "B")}
                                      className={`px-3 py-2 text-sm font-black ${
                                        b.selectedOption === "B" ? "bg-slate-900 text-white" : "text-slate-700"
                                      }`}
                                    >
                                      B
                                    </button>
                                  </div>

                                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200">
                                    <div className="text-xs text-slate-500 font-bold">推薦指數</div>
                                    <div className="font-black text-slate-900">
                                      {selected.score} <span className="text-slate-400 text-sm">/100</span>{" "}
                                      <span className="ml-2 text-xs text-slate-500 font-bold">({scoreLabel(selected.score)})</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* title */}
                            <div className="mt-3">
                              <input
                                className="w-full bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none font-black text-slate-800"
                                value={b.title}
                                onChange={(e) => updateBlock(dayIndex, b.id, { title: e.target.value })}
                              />
                            </div>

                            {/* place + note */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <input
                                className="w-full bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none text-sm"
                                placeholder="地點/區域（可留空）"
                                value={b.place ?? ""}
                                onChange={(e) => updateBlock(dayIndex, b.id, { place: e.target.value })}
                              />
                              <input
                                className="w-full bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none text-sm"
                                placeholder="備註（可留空）"
                                value={b.note ?? ""}
                                onChange={(e) => updateBlock(dayIndex, b.id, { note: e.target.value })}
                              />
                            </div>

                            {/* reason */}
                            {hasOptions && selected && (
                              <div className="mt-3 rounded-2xl bg-white border border-slate-200 p-3">
                                <div className="text-xs font-black text-slate-500 mb-1">推薦原因（A/B 各自不同）</div>
                                <div className="text-sm text-slate-700 leading-relaxed">{selected.reason}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
