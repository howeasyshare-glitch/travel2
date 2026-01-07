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
} from "lucide-react";

type Mode = "recommend" | "custom";

type BlockType = "arrival" | "spot" | "meal" | "hotel" | "move" | "free";

type ItineraryBlock = {
  id: string;
  timeStart: string; // "HH:MM"
  timeEnd: string;   // "HH:MM"
  type: BlockType;
  title: string;
  place?: string;
  note?: string;
};

type ItineraryDay = {
  day: number;
  blocks: ItineraryBlock[];
};

type Itinerary = {
  title: string;
  assumptions?: Record<string, any>;
  days: ItineraryDay[];
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Itinerary | null>(null);

  const [form, setForm] = useState({
    location: "",
    days: 3,
    adults: 2,
    children: 0,
    meals: { mode: "recommend" as Mode, customText: "" },
    hotel: { mode: "recommend" as Mode, customText: "" },
    spots: { mode: "custom" as Mode, customList: ["景點1", "景點2"] as string[] },
  });

  const canSubmit = useMemo(() => {
    if (!form.location) return false;
    if (form.days < 1) return false;
    if (form.adults < 1) return false;
    // custom 模式需要有內容
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
      // 你原本是 Gemini candidates 格式；這裡仍保留同樣解析方式
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const clean = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean) as Itinerary;
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

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">專業 AI 旅程助手</h1>
          <p className="text-slate-500">輸入需求 → 生成可編輯的時間行程表</p>
        </div>

        {/* 設定表單 */}
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
              <p className="text-xs text-slate-400 mt-2">小提醒：先做 1–5 天的體驗最好</p>
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
                  placeholder="例：想吃燒肉、不要海鮮、找親子友善餐廳..."
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
                  <button
                    type="button"
                    onClick={addSpotRow}
                    className="inline-flex items-center gap-2 text-blue-600 font-bold"
                  >
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
                  推薦（住市中心附近）
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
              {loading ? "AI 正在生成時間行程表..." : "生成可編輯行程表"}
            </button>
          </div>
        </div>

        {/* 結果顯示（可編輯） */}
        {result && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">{result.title}</h2>

            {result.days?.map((day, dayIndex) => (
              <div key={day.day} className="bg-white rounded-3xl p-8 shadow-md border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-sm">
                    DAY {day.day}
                  </span>
                  <span className="text-slate-400 text-sm">（點文字可直接修改）</span>
                </div>

                <div className="space-y-4">
                  {day.blocks?.map((b) => (
                    <div key={b.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
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
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <Pencil size={14} />
                            {b.type}
                          </div>

                          <input
                            className="w-full bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none font-bold text-slate-800"
                            value={b.title}
                            onChange={(e) => updateBlock(dayIndex, b.id, { title: e.target.value })}
                          />

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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 你之後可以在這裡加：新增一個 block / 重新生成某個 block 的「換一個」 */}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
