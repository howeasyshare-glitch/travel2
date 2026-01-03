"use client";

import { useState } from "react";
import { MapPin, Calendar, Users, Wallet, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

export default function TravelForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null); // 儲存 AI 回傳結果
  const [formData, setFormData] = useState({
    location: "",
    days: "3",
    members: "2",
    budget: "中等",
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("生成失敗");

      const data = await response.json();
      setResult(data);
      setStep(4); // 顯示結果頁面
    } catch (error) {
      console.error(error);
      alert("AI 規劃失敗，請確認 API Key 是否設定正確。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      {/* 進度條 */}
      <div className="bg-slate-100 h-2 flex">
        <div 
          className="bg-blue-600 transition-all duration-500" 
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {/* 步驟 1: 地點 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-blue-600">
              <MapPin size={28} />
              <h2 className="text-2xl font-bold text-slate-800">你想去哪裡？</h2>
            </div>
            <input 
              type="text"
              placeholder="例如：京都、倫敦、台東..."
              className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none"
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

        {/* 步驟 2: 細節 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-green-600">
              <Calendar size={28} />
              <h2 className="text-2xl font-bold text-slate-800">規劃細節</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">天數</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl"
                  value={formData.days}
                  onChange={(e) => setFormData({...formData, days: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">人數</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl"
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

        {/* 步驟 3: 預算與生成 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-500">
              <Wallet size={28} />
              <h2 className="text-2xl font-bold text-slate-800">預算等級</h2>
            </div>
            <select 
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl appearance-none"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            >
              <option value="經濟">小資經濟</option>
              <option value="中等">標準舒適</option>
              <option value="奢華">高端奢華</option>
            </select>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl font-bold">返回</button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? "AI 正在規劃中..." : "開始生成行程"}
              </button>
            </div>
          </div>
        )}

        {/* 步驟 4: 顯示結果 */}
        {step === 4 && result && (
          <div className="space-y-8 animate-in fade-in zoom-in-95">
            <div className="text-center border-b pb-6">
              <h2 className="text-3xl font-black text-slate-900">{result.title}</h2>
              <p className="text-slate-500 mt-2">{result.summary}</p>
            </div>
            <div className="space-y-6">
              {result.days.map((item: any, i: number) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-blue-600 mb-2">第 {item.day} 天</h3>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">{item.plan}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {setStep(1); setResult(null);}}
              className="w-full py-4 border-2 border-slate-900 rounded-2xl font-bold hover:bg-slate-900 hover:text-white transition-all"
            >
              重新規劃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
