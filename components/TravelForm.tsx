"use client";

import React, { useState } from "react";
import { MapPin, Calendar, Users, Wallet, Sparkles, Loader2 } from "lucide-react";

export default function TravelForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    location: "",
    days: "3",
    members: "2",
    budget: "中等",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 這裡使用了前端變數，請確保 Vercel 變數名為 NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
      
      // 使用穩定版 v1 路徑
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: `請規劃去 ${formData.location} 的 ${formData.days} 天行程。請以純 JSON 回傳，格式如下：{"title":"標題","summary":"簡介","days":[{"day":1,"plan":"內容"}]}` }] 
          }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "請求失敗");

      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      setResult(JSON.parse(cleanJson));
      setStep(4);
    } catch (error: any) {
      alert("AI 生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6 text-slate-800">
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><MapPin /> 你想去哪？</h2>
          <input 
            className="w-full p-3 border rounded-xl outline-blue-500"
            value={formData.location} 
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="例如：台北"
          />
          <button onClick={() => setStep(2)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">下一步</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Calendar /> 細節設定</h2>
          <div className="flex gap-2">
            <input type="number" className="flex-1 p-3 border rounded-xl" value={formData.days} onChange={(e) => setFormData({...formData, days: e.target.value})} placeholder="天數" />
            <input type="number" className="flex-1 p-3 border rounded-xl" value={formData.members} onChange={(e) => setFormData({...formData, members: e.target.value})} placeholder="人數" />
          </div>
          <button onClick={() => setStep(3)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">下一步</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Wallet /> 預算等級</h2>
          <div className="flex gap-2">
            {["經濟", "中等", "奢華"].map(b => (
              <button key={b} onClick={() => setFormData({...formData, budget: b})} className={`flex-1 py-3 border rounded-xl ${formData.budget === b ? 'bg-blue-50 border-blue-500' : ''}`}>{b}</button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} {loading ? "生成中..." : "開始規劃"}
          </button>
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">{result.title}</h2>
          {result.days.map((d: any, i: number) => (
            <div key={i} className="p-4 bg-slate-50 rounded-lg">
              <div className="font-bold text-blue-600">Day {d.day}</div>
              <p className="text-sm">{d.plan}</p>
            </div>
          ))}
          <button onClick={() => setStep(1)} className="w-full py-3 border rounded-xl mt-4">重新開始</button>
        </div>
      )}
    </div>
  );
}
