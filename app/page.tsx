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
  AlertTriangle,
  Download,
  RefreshCw,
  Map as MapIcon,
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
  score: number;
  reason: string;
  source: Source;
};

type MoveMeta = {
  mode: Transport;
  durationMin: number;
  from?: string;
  to?: string;
  needsUpdate?: boolean;
};

type ItineraryBlock = {
  id: string;
  timeStart: string;
  timeEnd: string;
  type: BlockType;

  title: string;
  place?: string;
  note?: string;

  source?: Source;

  options?: Option[];
  selectedOption?: "A" | "B";

  mealType?: MealType;

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

const typeMeta: Record<BlockType, { label: string; icon: any; bg: string; chip: string }> = {
  arrival: { label: "抵達/開始", icon: Flag, bg: "bg-indigo-50 border-indigo-100", chip: "bg-indigo-600" },
  spot: { label: "景點", icon: Landmark, bg: "bg-emerald-50 border-emerald-100", chip: "bg-emerald-600" },
  meal: { label: "餐廳/用餐", icon: Utensils, bg: "bg-orange-50 border-orange-100", chip: "bg-orange-600" },
  hotel: { label: "住宿/Check-in", icon: Hotel, bg: "bg-blue-50 border-blue-100", chip: "bg-blue-600" },
  move: { label: "移動/交通", icon: RouteIcon, bg: "bg-slate-50 border-slate-200", chip: "bg-slate-800" },
  free: { label: "自由/待安排", icon: Coffee, bg: "bg-violet-50 border-violet-100", chip: "bg-violet-600" },
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

// ✅ 吸附：只在 onBlur/normalize 時使用，避免使用者輸入時跳動
const snapMinutes = (hhmm: string, step = 5) => {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return hhmm;
  const m = toMin(hhmm);
  const snapped = Math.round(m / step) * step;
  return toHHMM(snapped);
};

// ✅ 更準地圖 query：place/title + 旅遊地點
const mapQuery = (b: ItineraryBlock, tripLocation: string) => {
  const place = (b.place ?? "").trim();
  const title = (b.title ?? "").trim();
  const loc = (tripLocation ?? "").trim();

  if (place && loc) return `${place} ${loc}`;
  if (place) return place;
  if (title && loc) return `${title} ${loc}`;
  if (title) return title;
  return loc;
};

// ✅ 一天一條 Google Maps 路線（origin/destination/waypoints）
const buildDayDirectionsUrl = (day: ItineraryDay, tripLocation: string, travelmode: "driving" | "transit") => {
  const stops = day.blocks
    .filter((b) => ["arrival", "spot", "meal", "hotel"].includes(b.type))
    .map((b) => mapQuery(b, tripLocation))
    .filter(Boolean);

  if (stops.length < 2) return "";

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1).slice(0, 20);

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode,
  });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

// ✅ CSV 匯出
const downloadCSV = (it: Itinerary) => {
  const rows: string[][] = [["Day", "Start", "End", "Type", "Title", "Place", "Note"]];
  it.days.forEach((d) => {
    d.blocks
      .slice()
      .sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart))
      .forEach((b) => {
        rows.push([String(d.day), b.timeStart, b.timeEnd, b.type, b.title ?? "", b.place ?? "", b.note ?? ""]);
      });
  });

  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replaceAll(`"`, `""`)}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "itinerary.csv";
  a.click();
  URL.revokeObjectURL(a.href);
};

// ✅ ICS 匯出（以今天當 Day1 日期基準）
const downloadICS = (it: Itinerary) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const toICSDateTime = (date: Date) => {
    const y = date.getFullYear();
    const mo = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}${mo}${d}T${h}${mi}${s}`;
  };

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Itinerary//TW//EN",
    "CALSCALE:GREGORIAN",
  ];

  it.days.forEach((day) => {
    const dayDate = new Date(base.getTime());
    dayDate.setDate(base.getDate() + (day.day - 1));

    day.blocks
      .slice()
      .sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart))
      .forEach((b) => {
        const [sh, sm] = b.timeStart.split(":").map(Number);
        const [eh, em] = b.timeEnd.split(":").map(Number);

        const dtStart = new Date(dayDate.getTime());
        dtStart.setHours(sh, sm, 0, 0);

        const dtEnd = new Date(dayDate.getTime());
        dtEnd.setHours(eh, em, 0, 0);

        const uid = `${b.id}-${day.day}@ai-itinerary`;
        const summary = (b.title || "Event").replace(/\n/g, " ");
        const location = (b.place || "").replace(/\n/g, " ");
        const description = (b.note || "").replace(/\n/g, " ");

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${toICSDateTime(new Date())}`);
        lines.push(`DTSTART:${toICSDateTime(dtStart)}`);
        lines.push(`DTEND:${toICSDateTime(dtEnd)}`);
        lines.push(`SUMMARY:${summary}`);
        if (location) lines.push(`LOCATION:${location}`);
        if (description) lines.push(`DESCRIPTION:${description}`);
        lines.push("END:VEVENT");
      });
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "itinerary.ics";
  a.click();
  URL.revokeObjectURL(a.href);
};

// ✅ 衝突檢查
const detectConflicts = (day: ItineraryDay) => {
  const sorted = day.blocks.slice().sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart));
  const conflicts = new Map<string, string>();

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    const s = toMin(b.timeStart);
    const e = toMin(b.timeEnd);

    if (e <= s) conflicts.set(b.id, "結束時間需晚於開始時間");

    if (i > 0) {
      const prev = sorted[i - 1];
      const pe = toMin(prev.timeEnd);
      if (s < pe) {
        conflicts.set(b.id, "與上一段時間重疊");
        conflicts.set(prev.id, conflicts.get(prev.id) || "與下一段時間重疊");
      }
    }
  }

  return conflicts;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [reflowing, setReflowing] = useState<{ dayIndex: number } | null>(null);
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

  const openMap = (b: ItineraryBlock) => {
    const q = mapQuery(b, form.location);
    if (!q) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const normalizeItinerary = (parsed: Itinerary) => {
    parsed.days?.forEach((d) => {
      d.blocks?.forEach((b) => {
        // 把 selectedOption 的內容同步到 block（方便 UI 直接顯示）
        if ((b.type === "spot" || b.type === "meal" || b.type === "hotel") && b.options?.length) {
          const pick = b.selectedOption ?? "A";
          const opt = b.options.find((o) => o.label === pick) ?? b.options[0];
          b.selectedOption = opt.label;
          b.title = opt.title;
          b.place = opt.place;
          b.note = opt.note;
        }

        // AI 生成後的時間吸附一下（使用者輸入不會被即時吸附）
        b.timeStart = snapMinutes(b.timeStart, 5);
        b.timeEnd = snapMinutes(b.timeEnd, 5);
      });

      d.blocks = [...(d.blocks ?? [])].sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart));
    });

    parsed.assumptions = {
      ...(parsed.assumptions ?? {}),
      startTime: form.startTime,
      endTime: form.endTime,
      pace: form.pace,
      transport: form.transport,
    };

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

      // ✅ AB 切換：更新 block 的 title/place/note，地圖會跟著變
      b.selectedOption = to;
      b.title = opt.title;
      b.place = opt.place;
      b.note = opt.note;

      return next;
    });
  };

  // ✅ 刪除 = 保留空格（不動後面）
  const deleteBlockKeepGap = (dayIndex: number, blockId: string) => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const day = next.days[dayIndex];

      const idx = day.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;

      const target = day.blocks[idx];

      day.blocks[idx] = {
        ...target,
        type: "free",
        title: "空檔（待安排）",
        place: "",
        note: "你可以在此插入新活動，或按「重排這一天」自動補齊。",
        source: "user",
        options: undefined,
        selectedOption: undefined,
        mealType: undefined,
      };

      // 相鄰交通標記需更新（但時間不動）
      const markMove = (pos: number) => {
        if (pos >= 0 && pos < day.blocks.length && day.blocks[pos].type === "move") {
          day.blocks[pos].move = { ...(day.blocks[pos].move ?? { mode: form.transport, durationMin: 10 }), needsUpdate: true };
          day.blocks[pos].title = "移動（需更新目的地）";
          day.blocks[pos].note = "前後活動已變更，建議重排此段交通。";
          day.blocks[pos].source = "ai";
        }
      };
      markMove(idx - 1);
      markMove(idx + 1);

      day.blocks = [...day.blocks].sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart));
      return next;
    });
  };

  // ✅ 插入一段空檔（60 分）
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
        title: "空檔（待安排）",
        place: "",
        note: "可改成景點/餐廳/飯店，或按重排自動填入",
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
          active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
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
          active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
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

  // ✅ 重排單日（呼叫 /api/reflow-day）
  const reflowDay = async (dayIndex: number) => {
    if (!result) return;
    const day = result.days?.[dayIndex];

    if (!day?.blocks || !Array.isArray(day.blocks)) {
      alert("目前行程資料不是新版（缺少 blocks）。請先重新按「生成可編輯行程表」再重排。");
      return;
    }

    setReflowing({ dayIndex });
    try {
      const resp = await fetch("/api/reflow-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: form.location,
          pace: form.pace,
          transport: form.transport,
          startTime: form.startTime,
          endTime: form.endTime,
          hasKids: form.children > 0,
          day,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || "reflow failed");
      }

      const data = await resp.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const clean = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const newDay = JSON.parse(clean) as ItineraryDay;

      setResult((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        next.days[dayIndex] = {
          ...newDay,
          blocks: (newDay.blocks ?? [])
            .map((b) => ({
              ...b,
              timeStart: snapMinutes(b.timeStart, 5),
              timeEnd: snapMinutes(b.timeEnd, 5),
            }))
            .sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart)),
        };
        return next;
      });
    } catch (e: any) {
      alert("重排失敗: " + e.message);
    } finally {
      setReflowing(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">專業 AI 旅程助手</h1>
          <p className="text-slate-500">地圖更準 / AB 切換即時更新 / move 地圖禁用 / 時間吸附改 onBlur / 每天一鍵地圖路線</p>
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
              <p className="text-xs text-slate-400 mt-2">午餐會盡量安排在 11:30–12:30 開始；時間會在「離開欄位」時對齊 5 分鐘。</p>
            </div>

            {/* 節奏 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">旅遊節奏</label>
              <div className="flex gap-3">
                {paceButton("packed", "趕", "景點多、動線緊")}
                {paceButton("normal", "一般", "平衡安排")}
                {paceButton("relaxed", "悠閑", "留白多、慢慢玩")}
              </div>
            </div>

            {/* 交通方式 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">交通方式</label>
              <div className="flex gap-3">
                {transportButton("drive", "自駕", Car, "彈性高")}
                {transportButton("transit", "大眾運輸", Bus, "轉乘安排")}
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
                    form.meals.mode === "recommend" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  推薦
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, meals: { ...form.meals, mode: "custom" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.meals.mode === "custom" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  自訂
                </button>
              </div>
              {form.meals.mode === "custom" && (
                <input
                  className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none"
                  placeholder="例：想吃燒肉、不要海鮮、親子友善..."
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
                    form.spots.mode === "recommend" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  推薦
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, spots: { ...form.spots, mode: "custom" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.spots.mode === "custom" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
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
                    form.hotel.mode === "recommend" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  推薦（市中心/交通便利）
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hotel: { ...form.hotel, mode: "custom" } })}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    form.hotel.mode === "custom" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  自訂（指定旅館/條件）
                </button>
              </div>
              {form.hotel.mode === "custom" && (
                <input
                  className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none"
                  placeholder="例：想住 ABC 酒店 / 靠近市中心..."
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-slate-800">{result.title}</h2>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadCSV(result)}
                  className="px-4 py-3 rounded-2xl bg-white border border-slate-200 font-black text-slate-700 inline-flex items-center gap-2"
                >
                  <Download size={18} /> 匯出 CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadICS(result)}
                  className="px-4 py-3 rounded-2xl bg-white border border-slate-200 font-black text-slate-700 inline-flex items-center gap-2"
                >
                  <Download size={18} /> 匯出 ICS
                </button>
              </div>
            </div>

            {result.days?.map((day, dayIndex) => {
              const conflicts = detectConflicts(day);
              const dayMapUrl = buildDayDirectionsUrl(
                day,
                form.location,
                form.transport === "drive" ? "driving" : "transit"
              );

              return (
                <div key={day.day} className="bg-white rounded-3xl p-8 shadow-md border border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-sm">
                        DAY {day.day}
                      </span>
                      {conflicts.size > 0 && (
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-black text-sm">
                          <AlertTriangle size={16} /> 有 {conflicts.size} 個時間問題
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!dayMapUrl}
                        onClick={() => dayMapUrl && window.open(dayMapUrl, "_blank", "noopener,noreferrer")}
                        className={`px-4 py-3 rounded-2xl font-black inline-flex items-center gap-2 ${
                          dayMapUrl
                            ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        }`}
                        title="用 Google 地圖把當天景點串成路線"
                      >
                        <MapIcon size={18} /> Google 地圖路線
                      </button>

                      <button
                        type="button"
                        onClick={() => reflowDay(dayIndex)}
                        disabled={!!reflowing}
                        className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-black inline-flex items-center gap-2 disabled:opacity-60"
                        title="AI 重新整理動線與交通、補齊空檔、調整午餐時間"
                      >
                        <RefreshCw size={18} className={reflowing?.dayIndex === dayIndex ? "animate-spin" : ""} />
                        {reflowing?.dayIndex === dayIndex ? "重排中..." : "重排這一天"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {day.blocks
                      ?.slice()
                      .sort((a, b) => toMin(a.timeStart) - toMin(b.timeStart))
                      .map((b) => {
                        const meta = typeMeta[b.type];
                        const Icon = meta.icon;

                        const hasOptions =
                          (b.type === "spot" || b.type === "meal" || b.type === "hotel") && b.options?.length;

                        const selected =
                          hasOptions ? b.options!.find((o) => o.label === (b.selectedOption ?? "A")) : null;

                        const conflictMsg = conflicts.get(b.id);
                        const mapDisabled = b.type === "move";

                        return (
                          <div key={b.id} className={`rounded-2xl border p-4 ${meta.bg}`}>
                            <div className="flex items-start gap-3">
                              <div className={`shrink-0 w-10 h-10 rounded-2xl ${meta.chip} flex items-center justify-center`}>
                                <Icon size={18} className="text-white" />
                              </div>

                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        className="w-24 bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none font-mono text-sm"
                                        value={b.timeStart}
                                        onChange={(e) => updateBlock(dayIndex, b.id, { timeStart: e.target.value })}
                                        onBlur={(e) => updateBlock(dayIndex, b.id, { timeStart: snapMinutes(e.target.value, 5) })}
                                      />
                                      <span className="text-slate-400">—</span>
                                      <input
                                        className="w-24 bg-white rounded-xl px-3 py-2 border border-slate-200 outline-none font-mono text-sm"
                                        value={b.timeEnd}
                                        onChange={(e) => updateBlock(dayIndex, b.id, { timeEnd: e.target.value })}
                                        onBlur={(e) => updateBlock(dayIndex, b.id, { timeEnd: snapMinutes(e.target.value, 5) })}
                                      />

                                      <span className="ml-2 text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Pencil size={14} /> {meta.label}
                                      </span>

                                      {conflictMsg && (
                                        <span className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-black text-sm">
                                          <AlertTriangle size={16} /> {conflictMsg}
                                        </span>
                                      )}

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

                                    <div className="flex flex-wrap items-center gap-2">
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

                                      {b.type === "move" && b.move?.needsUpdate && (
                                        <span className="px-2 py-1 rounded-full text-xs font-black bg-red-600 text-white">
                                          交通需更新
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* 地圖：move 反灰無作用 */}
                                    <button
                                      type="button"
                                      onClick={() => !mapDisabled && openMap(b)}
                                      disabled={mapDisabled}
                                      className={`px-3 py-2 rounded-xl border font-black inline-flex items-center gap-2 ${
                                        mapDisabled
                                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                      }`}
                                      title={mapDisabled ? "交通段不提供地圖" : "在 Google Maps 開啟"}
                                    >
                                      <MapIcon size={16} /> 地圖
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => addBlockAfter(dayIndex, b.id)}
                                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black"
                                      title="在下方新增空檔"
                                    >
                                      ➕
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => deleteBlockKeepGap(dayIndex, b.id)}
                                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black"
                                      title="刪除此活動，但保留時段空格"
                                    >
                                      <Trash2 size={18} />
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

                                {/* 四格資訊 */}
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
                                    <div className="text-xs font-black text-slate-500 mb-2">小提醒</div>
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
                                        {b.move.needsUpdate && (
                                          <div className="text-xs text-red-600 font-black mt-2">
                                            建議按「重排這一天」更新交通與動線
                                          </div>
                                        )}
                                      </div>
                                    ) : hasOptions && selected ? (
                                      <div className="text-sm text-slate-700 leading-relaxed">{selected.reason}</div>
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
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
