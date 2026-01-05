"use client";

import { useState } from "react";
import { MapPin, Calendar, Users, Wallet, Sparkles, ArrowRight, Loader2 } from "lucide-react";

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

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // 基於 HTML 成功經驗的直連 API 邏輯
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("環境變數中找不到 API Key");

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `你是一位導遊，請規劃 ${formData.location} ${formData.days}天行程。請回傳純 JSON: {"title":"標題","summary":"簡介","days":[{"day":1,"plan":"行程"}]}` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "請求失敗");

      const aiText = data.candidates[0].content.parts[0].text;
      setResult(JSON.parse(aiText));
      setStep(4);
    } catch (error: any) {
      console.error(error);
      alert("AI 生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 text-slate-800">
      <div className="bg-slate-100 h-2 flex">
        <div className="bg-blue-600 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-blue-600"><MapPin size={24} /> <h2 className="text-xl font-bold">你想去哪？</h2></div>
            <input type="text" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="例如：東京" />
            <button onClick={nextStep} disabled={!formData.location} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold">下一步</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-green-600"><Calendar size={24} /> <h2 className="text-xl font-bold">規劃細節</h2></div>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" className="p-4 bg-slate-50 border-2 rounded-2xl outline-none" value={formData.days} onChange={(e) => setFormData({...formData, days: e.target.value})} />
              <input type="number" className="p-4 bg-slate-50 border-2 rounded-2xl outline-none" value={formData.members} onChange={(e) => setFormData({...formData, members: e.target.value})} />
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 rounded-2xl">返回</button>
              <button onClick={nextStep} className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-bold px-8">下一步</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-500"><Wallet size={24} /> <h2 className="text-xl font-bold">預算等級</h2></div>
            <div className="grid grid-cols-3 gap-2">
              {["經濟", "中等", "奢華"].map(b => (
                <button key={b} onClick={() => setFormData({...formData, budget: b})} className={`py-4 rounded-2xl border-2 ${formData.budget === b ? "border-amber-500 bg-amber-50" : "bg-slate-50"}`}>{b}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 rounded-2xl">返回</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-2 py-4 bg-black text-white rounded-2xl font-bold px-8 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} {loading ? "規劃中..." : "開始規劃"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b">
              <h2 className="text-2xl font-bold">{result.title}</h2>
              <p className="text-slate-500">{result.summary}</p>
            </div>
            <div className="space-y-4">
              {result.days.map((item: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border">
                  <h3 className="font-bold text-blue-600">Day {item.day}</h3>
                  <p className="text-sm whitespace-pre-line">{item.plan}</p>
                </div>
              ))}
            </div>
            <button onClick={() => {setStep(1); setResult(null);}} className="w-full py-4 border-2 rounded-2xl font-bold">重新規劃</button>
          </div>
        )}
      </div>
    </div>
  );
}
