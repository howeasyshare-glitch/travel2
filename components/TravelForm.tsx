"use client";

import { useState } from "react";
import { MapPin, Calendar, Users, Wallet, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

export default function TravelForm() {
  // 1. 狀態定義
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    location: "",
    days: "3",
    members: "2",
    budget: "中等",
  });

  // 2. 切換步驟邏輯
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // 3. 呼叫 API 邏輯
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("API 響應錯誤");

      const data = await response.json();
      setResult(data);
      setStep(4);
    } catch (error) {
      console.error("生成失敗:", error);
      alert("AI 規劃失敗，請確認 Vercel 後台的 API Key 是否設定正確。");
    } finally {
      setLoading(false);
    }
  };

  // 4. 渲染畫面
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 text-slate-800">
      {/* 頂部進度條 */}
      <div className="bg-slate-100 h-2 flex">
        <div 
          className="bg-blue-600 transition-all duration-500" 
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      <div className="p-8">
        {/* Step 1: 地點 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-blue-600">
              <MapPin size={28} />
              <h2 className="text-2xl font-bold">你想去哪裡？</h2>
            </div>
            <input 
              type="text"
              placeholder="例如：東京、巴黎、花蓮..."
              className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            <button 
              onClick={nextStep}
              disabled={!formData.location}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-all"
            >
              下一步 <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: 細節 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-green-600">
              <Calendar size={28} />
              <h2 className="text-2xl font-bold">規劃細節</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">天數</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none"
                  value={formData.days}
                  onChange={(e) => setFormData({...formData, days: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">人數</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none"
                  value={formData.members}
                  onChange={(e) => setFormData({...formData, members: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl font-bold">返回</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold">下一步</button>
            </div>
          </div>
        )}

        {/* Step 3: 預算 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-500">
              <Wallet size={28} />
              <h2 className="text-2xl font-bold">預算等級</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["經濟", "中等", "奢華"].map((b) => (
                <button
                  key={b}
                  onClick={() => setFormData({...formData, budget: b})}
                  className={`py-4 rounded-2xl font-bold border-2 ${
                    formData.budget === b ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-100 bg-slate-50 text-slate-500"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl font-bold">返回</button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-400"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? "正在規劃..." : "開始生成行程"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 結果 */}
        {step === 4 && result && (
          <div className="space-y-6">
            <div className="text-center pb-6 border-b">
              <h2 className="text-3xl font-black text-slate-900">{result.title}</h2>
              <p className="text-slate-500 mt-2">{result.summary}</p>
            </div>
            <div className="space-y-4">
              {result.days.map((item: any, i: number) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border">
                  <h3 className="font-bold text-blue-600 mb-2">Day {item.day}</h3>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">{item.plan}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {setStep(1); setResult(null);}}
              className="w-full py-4 border-2 border-slate-900 rounded-2xl font-bold hover:bg-black hover:text-white transition-all"
            >
              重新規劃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
