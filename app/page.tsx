"use client";

import React, { useState } from "react";

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
      // 使用你提供的最新模型路徑
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `請規劃去 ${location} 的 3 天行程。以純 JSON 回傳：{"title":"標題","days":[{"day":1,"plan":"內容"}]}` }] }]
        })
      });

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      setResult(JSON.parse(cleanJson));
      setStep(2);
    } catch (error: any) {
      alert("生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-slate-50 text-black">
      <h1 className="text-3xl font-bold text-center mb-8">AI 旅遊規劃師</h1>
      
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">
        {step === 1 ? (
          <div className="space-y-4">
            <input 
              className="w-full p-2 border rounded" 
              placeholder="你想去哪？" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button 
              onClick={handleSubmit}
              disabled={loading || !location}
              className="w-full py-2 bg-blue-600 text-white rounded font-bold"
            >
              {loading ? "生成中..." : "開始規劃"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{result?.title}</h2>
            {result?.days?.map((d: any) => (
              <div key={d.day} className="p-2 border-b">
                <div className="font-bold">第 {d.day} 天</div>
                <p className="text-sm">{d.plan}</p>
              </div>
            ))}
            <button onClick={() => setStep(1)} className="w-full py-2 border mt-4">重新開始</button>
          </div>
        )}
      </div>
    </main>
  );
}
