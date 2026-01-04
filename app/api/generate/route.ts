import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "缺少 API Key" }, { status: 500 });

  try {
    const { location, days, members, budget } = await req.json();

    // 1. 改用 v1 穩定版路徑 (捨棄 v1beta)
    // 2. 改用 gemini-1.5-pro (pro 版本通常權限最廣)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    const prompt = `你是一位旅遊規劃師。請規劃去 ${location} ${days}天 ${members}人的 ${budget} 旅程。
    請務必以 JSON 格式回傳：
    {
      "title": "標題",
      "summary": "簡介",
      "days": [{ "day": 1, "plan": "行程內容" }]
    }`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // 如果 pro 也失敗，嘗試最後一個 fallback: gemini-1.0-pro
      console.error("Pro 模型失敗，嘗試降級...", data);
      return NextResponse.json({ error: "模型未就緒", details: data.error?.message }, { status: 404 });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (error: any) {
    return NextResponse.json({ error: "生成失敗", details: error.message }, { status: 500 });
  }
}
