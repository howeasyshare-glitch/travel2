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
  Bus,
  Route as RouteIcon,
  Coffee,
  Clock,
} from "lucide-react";

type Mode = "recommend" | "custom";
type Pace = "packed" | "normal" | "relaxed";
type Transport = "drive" | "transit";
type BlockType = "arrival" | "spot" | "meal" | "hotel" | "move" | "free";
type Source = "user" | "ai";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

type Option = {
  label: "A" | "B";
  title: string;
  place?: string;
  note?: string;
  score: number; // 0-100
  reason: string;
  source: Source;
};

type MoveMeta = {
  mode: Transport;
  durationMin: number;
  from?: string;
  to?: string;
};

type ItineraryBlock = {
  id: string;
  timeStart: string; // "HH:MM"
  timeEnd: string; // "HH:MM"
  type: BlockType;

  title: string;
  place?: string;
  note?: string;

  source?: Source;

  // spot/meal/hotel
  options?: Option[];
  selectedOption?: "A" | "B";

  // meal
  mealType?: MealType;

  // move
  move?: MoveMeta;
};

type ItineraryDay = {
  day: number;
  blocks: ItineraryBlock[];
};

type Itinerary = {
  title: string;
  assumptions?: {
    startTime?: string;
    endTime?: string;
    pace?: Pace;
    transport?: Transport;
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
    icon: RouteIcon,
    bg: "bg-slate-50 border-slate-200",
    chip: "bg-slate-800",
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

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
};

const toHHMM = (min: number) => {
  const m = Math.max(0, min);
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

const shiftBlockTime = (b: ItineraryBlock, deltaMin: number): ItineraryBlock => {
  const s = toMin(b.timeStart) + deltaMin;
  const e = toMin(b.timeEnd) + deltaMin;
  return { ...b, timeStart: toHHMM(s), timeEnd: toHHMM(e) };
};

const clampTimeWindow = (b: ItineraryBlock, dayStartMin: number, dayEndMin: number) => {
  const s = toMin(b.timeStart);
  const e = toMin(b.timeEnd);
  // 只做最基本保底：不小於 dayStart；不大於 dayEnd
  const ns = Math.max(s, dayStartMin);
  const ne = Math.min(e, dayEndMin);
  return { ...b, timeStart: toHHMM(ns), timeEnd: toHHMM(Math.max(ne, ns)) };
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Itinerary | null>(null);

  const [form, setForm] = useState({
    location: "",
    days: 3,
    adults: 2,
    children: 0,
    pace: "normal" as Pace,
    transport: "transit" as Transport,
    startTime: "09:30",
    endTime: "21:00",
    meals: { mode: "recommend" as Mode, customText: "" },
    hotel: { mode: "recommend" as Mode, customText: "" },
    spots: { mode: "custom" as Mode, customList: ["景點1", "景點2"] as string[] },
  });

  const canSubmit = useMemo(() => {
    if (!form.location) return false;
    if (form.days < 1) return false;
    if (form.adults < 1) return false;

    // start/end time basic sanity
    if (!/^\d{2}:\d{2}$/.test(form.startTime) || !/^\d{2}:\d{2}$/.test(form.endTime)) return false;
    if (toMin(form.endTime) <= toMin(form.startTime)) return false;

    if (form.hotel.mode === "custom" && !form.hotel.customText.trim()) return false;
    if (form.meals.mode === "custom" && !form.meals.customText.trim()) return false;

    if (form.spots.mode === "custom") {
      const list = form.spots.customList.map((s) => s.trim()).filter(Boolean);
      if (list.length === 0) return false;
    }

    return true;
  }, [form]);

  const normalizeItinerary = (parsed: Itinerary) => {
    parsed.days?.forEach((d) => {
      d.blocks?.forEach((b) => {
        if ((b.type === "spot" || b.type === "meal" || b.type === "hotel") && b.options?.length) {
          const pick = b.selectedOption ?? "A";
          const opt = b.options.find((o) => o.label === pick) ?? b.options[0];
          b.selectedOption = opt.label;
          b.title = opt.title;
          b.place = opt.place;
          b.note = opt.note;
        }
      });
      // 確保顯示順序按時間
      d.blocks = [...(d.blocks ?? [])].sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart));
    });
    return parsed;
  };

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
      const parsed = normalizeItinerary(JSON.parse(clean) as Itinerary);
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
      day.blocks = [...day.blocks].sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart));
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

  // ✅ 修正版：刪除後 ripple（只移動刪除區間之後的 blocks）+ 只刪貼齊的 move + 排序
  const deleteBlockWithRipple = (dayIndex: number, blockId: string) => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const day = next.days[dayIndex];

      const idx = day.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;

      const target = day.blocks[idx];
      const targetStart = toMin(target.timeStart);
      const targetEnd = toMin(target.timeEnd);
      const gap = Math.max(0, targetEnd - targetStart);

      // 1) 刪掉目標 block
      day.blocks.splice(idx, 1);

      // 2) 刪掉「緊貼刪除區間」的 move（更安全：只刪 time 對得上的）
      day.blocks = day.blocks.filter((b) => {
        if (b.type !== "move") return true;
        const ms = toMin(b.timeStart);
        const me = toMin(b.timeEnd);
        // move 結束剛好貼到 targetStart 或開始剛好貼到 targetEnd → 一起刪
        if (me === targetStart || ms === targetEnd) return false;
        // move 完全落在刪除區間內 → 刪
        if (ms >= targetStart && me <= targetEnd) return false;
        return true;
      });

      // 3) ripple：只把「在 targetEnd 之後開始」的 blocks 往前移 gap
      day.blocks = day.blocks.map((b) => {
        const bStart = toMin(b.timeStart);
        if (bStart >= targetEnd) return shiftBlockTime(b, -gap);
        return b;
      });

      // 4) 保底：依時間排序 + 夾到日開始/結束（避免變怪）
      const dayStartMin = toMin(form.startTime);
      const dayEndMin = toMin(form.endTime);

      day.blocks = day.blocks
        .map((b) => clampTimeWindow(b, dayStartMin, dayEndMin))
        .sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart));

      return next;
    });
  };

  // ✅ 新增：在某 block 後插入一個 60 分鐘 free（自訂）
  const addBlockAfter = (dayIndex: number, afterBlockId: string) => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const day = next.days[dayIndex];

      const idx = day.blocks.findIndex((b) => b.id === afterBlockId);
      if (idx === -1) return prev;

      const after = day.blocks[idx];
      const start = toMin(after.timeEnd);
      const end = start + 60;

      const newBlock: ItineraryBlock = {
        id: `d${day.day}-b${Date.now()}`,
        timeStart: toHHMM(start),
        timeEnd: toHHMM(end),
        type: "free",
        title: "自由活動（可改成景點/餐廳/飯店）",
        place: "",
        note: "",
        source: "user",
      };

      day.blocks.splice(idx + 1, 0, newBlock);
      day.blocks = [...day.blocks].sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart));
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

  const transportButton = (value: Transport, label: string, Icon: any, sub: string) => {
    const active = form.transport === value;
    return (
      <button
        type="button"
        onClick={() => setForm({ ...form, transport: value })}
        className={`flex-1 p-3 rounded-2xl border text-left transition ${
          active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-2 font-black">
          <Icon size={18} />
          {label}
        </div>
        <div className={`text-xs mt-1 ${active ? "text-white/80" : "text-slate-400"}`}>{sub}</div>
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">專業 AI 旅程助手</h1>
          <p className="text-slate-500">自訂時間窗 / 午餐時段 / 刪除 ripple 修正 / 欄位說明更清楚</p>
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

            {/* 每日時間窗 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Clock size={16} /> 每日行程時間窗
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs font-black text-slate-500 mb-2">開始時間</div>
                  <input
                    type="time"
                    className="w-full bg-white rounded-xl px-4 py-3 outline-none font-mono border border-slate-200"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs font-black text-slate-500 mb-2">結束時間</div>
                  <input
                    type="time"
                    className="w-full bg-white rounded-xl px-4 py-3 outline-none font-mono border border-slate-200"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">會要求 AI 在此時間範圍內安排（並盡量把午餐安排在 11:30–12:30 開始）。</p>
            </div>

            {/* 節奏 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">旅遊節奏</label>
              <div className="flex gap-3">
                {paceButton("packed", "趕", "景點多、動線緊、停留短")}
                {paceButton("normal", "一般", "平衡安排，彈性適中")}
                {paceButton("relaxed", "悠閑", "停留久、留白多、慢慢玩")}
              </div>
            </div>

            {/* 交通方式 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">交通方式</label>
              <div className="flex gap-3">
                {transportButton("drive", "自駕", Car, "可跑郊區、移動彈性")}
                {transportButton("transit", "大眾運輸", Bus, "以車站周邊、轉乘安排")}
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

            {/* 三餐 */}
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
                  placeholder="例：想吃燒肉、不要海鮮、親子友善、清淡..."
                  value={form.meals.customText}
                  onChange={(e) => setForm({ ...form, meals: { ...form.meals, customText: e.target.value } })}
                />
              )}
            </div>

            {/* 景點 */}
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

            {/* 旅館 */}
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
              {loading ? "AI 正在生成時間行程表..." : "生成可編輯行程表"}
            </button>
          </div>
        </div>

        {/* 結果 */}
        {result && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">{result.title}</h2>

            {result.days?.map((day, dayIndex) => (
              <div key={day.day} className="bg-white rounded-3xl p-8 shadow-md border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-sm">
                    DAY {day.day}
                  </span>
                  <span className="text-slate-400 text-sm">（🗑 刪除：預設把後面往前移；➕ 插入新活動）</span>
                </div>

                <div className="space-y-4">
                  {day.blocks?.map((b) => {
                    const meta = typeMeta[b.type];
                    const Icon = meta.icon;

                    const hasOptions =
                      (b.type === "spot" || b.type === "meal" || b.type === "hotel") && b.options?.length;

                    const selected =
                      hasOptions ? b.options!.find((o) => o.label === (b.selectedOption ?? "A")) : null;

                    return (
                      <div key={b.id} className={`rounded-2xl border p-4 ${meta.bg}`}>
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 w-10 h-10 rounded-2xl ${meta.chip} flex items-center justify-center`}>
                            <Icon size={18} className="text-white" />
                          </div>

                          <div className="flex-1">
                            {/* top row */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div className="flex flex-col gap-2">
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

                                  {b.type === "meal" && b.mealType && (
                                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-black bg-white border border-slate-200 text-slate-700">
                                      {b.mealType === "lunch"
                                        ? "午餐"
                                        : b.mealType === "dinner"
                                        ? "晚餐"
                                        : b.mealType === "breakfast"
                                        ? "早餐"
                                        : "點心"}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {b.source === "user" && (
                                    <span className="px-2 py-1 rounded-full text-xs font-black bg-violet-600 text-white">
                                      自訂
                                    </span>
                                  )}
                                  {b.type === "move" && b.move?.mode && (
                                    <span className="px-2 py-1 rounded-full text-xs font-black bg-slate-900 text-white inline-flex items-center gap-2">
                                      {b.move.mode === "drive" ? <Car size={14} /> : <Bus size={14} />}
                                      {b.move.mode === "drive" ? "自駕" : "大眾運輸"}
                                      {typeof b.move.durationMin === "number" ? `・${b.move.durationMin} 分` : ""}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* actions + AB */}
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => addBlockAfter(dayIndex, b.id)}
                                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black"
                                  title="在下方新增"
                                >
                                  ➕
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteBlockWithRipple(dayIndex, b.id)}
                                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black"
                                  title="刪除並把後面往前移"
                                >
                                  🗑️
                                </button>

                                {hasOptions && selected && (
                                  <>
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
                                        <span className="ml-2 text-xs text-slate-500 font-bold">
                                          ({scoreLabel(selected.score)})
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 四格資訊：更清楚的標籤 */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-2xl border border-slate-200 p-3">
                                <div className="text-xs font-black text-slate-500 mb-2">活動名稱</div>
                                <input
                                  className="w-full bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 outline-none font-black text-slate-800"
                                  value={b.title}
                                  onChange={(e) => updateBlock(dayIndex, b.id, { title: e.target.value })}
                                />
                              </div>

                              <div className="bg-white rounded-2xl border border-slate-200 p-3">
                                <div className="text-xs font-black text-slate-500 mb-2">地點 / 區域</div>
                                <input
                                  className="w-full bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 outline-none text-sm"
                                  value={b.place ?? ""}
                                  onChange={(e) => updateBlock(dayIndex, b.id, { place: e.target.value })}
                                />
                              </div>

                              <div className="bg-white rounded-2xl border border-slate-200 p-3">
                                <div className="text-xs font-black text-slate-500 mb-2">
                                  小提醒（例如：排隊、人潮、親子、換乘）
                                </div>
                                <input
                                  className="w-full bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 outline-none text-sm"
                                  value={b.note ?? ""}
                                  onChange={(e) => updateBlock(dayIndex, b.id, { note: e.target.value })}
                                />
                              </div>

                              <div className="bg-white rounded-2xl border border-slate-200 p-3">
                                <div className="text-xs font-black text-slate-500 mb-2">
                                  {b.type === "move" ? "到下一站預估時間" : hasOptions ? "推薦理由（A/B 各自不同）" : "補充資訊"}
                                </div>

                                {b.type === "move" && b.move ? (
                                  <div className="text-sm text-slate-700">
                                    {(b.move.mode === "drive" ? "自駕" : "大眾運輸") + " 約 "}
                                    <span className="font-black">{b.move.durationMin}</span> 分鐘
                                    {(b.move.from || b.move.to) ? (
                                      <div className="text-xs text-slate-500 mt-1">
                                        {b.move.from ? `從 ${b.move.from}` : ""}
                                        {b.move.from && b.move.to ? " → " : ""}
                                        {b.move.to ? `到 ${b.move.to}` : ""}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : hasOptions && selected ? (
                                  <div className="text-sm text-slate-700 leading-relaxed">
                                    {selected.reason}
                                    {selected.source === "user" && (
                                      <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-black bg-violet-600 text-white">
                                        使用者指定
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-slate-500">—</div>
                                )}
                              </div>
                            </div>
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
