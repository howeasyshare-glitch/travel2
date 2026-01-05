import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "Vercel 環境變數中找不到 API Key" }, { status: 500 });
  }

  try {
    const { location, days, members, budget } = await req.json();

    // 這是 Google AI Studio 專屬的最穩定 REST API 路徑
    // 不經過任何 SDK，直接對準 v1 版本的 gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `你是一位專業旅遊規劃師。請規劃去 ${location} ${days}天 ${members}人的 ${budget} 旅程。
    請務必只回傳 JSON 格式內容：
    {
      "title": "旅程標題",
      "summary": "旅程簡介",
      "days": [{ "day": 1, "plan": "詳細行程描述" }]
    }`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json" // 強制要求 JSON 回傳
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Google 伺服器回報錯誤:", data);
      return NextResponse.json({ 
        error: "Google API 拒絕請求", 
        details: data.error?.message 
      }, { status: response.status });
    }

    // 解析 Google 的回傳結構
    const aiResponseText = data.candidates[0].content.parts[0].text;
    return NextResponse.json(JSON.parse(aiResponseText));

  } catch (error: any) {
    console.error("❌ 系統發生異常:", error.message);
    return NextResponse.json({ error: "生成失敗", details: error.message }, { status: 500 });
  }
}
