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

  // 直接在前端呼叫的函數 (排除後端 404 問題)
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 這裡直接讀取 Vercel 的環境變數 (需要在 Vercel 設定中將該變數設為 NEXT_PUBLIC_)
      // 或者為了測試，你可以暫時直接把 Key 字串貼在下方 (測試完記得刪除)
      const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY; 

      if (!API_KEY) {
        throw new Error("找不到 API KEY，請確認是否有加上 NEXT_PUBLIC_ 前綴");
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

      const prompt = `你是一位旅遊規劃師。請規劃去 ${formData.location} ${formData.days}天 ${formData.members}人的 ${formData.budget} 旅程。回傳純 JSON: {"title": "標題", "summary": "簡介", "days": [{"day": 1, "plan": "行程"}]}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || "請求失敗");

      const aiText = data.candidates[0].content.parts[0].text;
      setResult(JSON.parse(aiText));
      setStep(4);
    } catch (error: any) {
      console.error("前端直連錯誤:", error);
      alert("AI 生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... 這裡保留你原本的 return 畫面代碼 (與之前相同)
  // 記得將 handleSubmit 綁定到步驟 3 的按鈕上
  return (
    // ... (此處省略中間重複的 UI 代碼，請沿用之前的 TravelForm UI)
    <div className="p-8">
       {/* 步驟 1, 2, 3 ... 確保按鈕呼叫的是上面這個 handleSubmit */}
       {step === 3 && (
         <button onClick={handleSubmit} disabled={loading}>
            {loading ? "生成中..." : "開始生成"}
         </button>
       )}
       {/* 步驟 4 展示結果 */}
    </div>
  );
}
