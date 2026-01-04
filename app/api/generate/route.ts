import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 500 });
  }

  try {
    const { location, days, members, budget } = await req.json();

    // 直接呼叫 Google 的 REST API 路徑
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `你是一位旅遊規劃師。請規劃去 ${location} ${days}天 ${members}人的 ${budget} 旅程。
    請務必只回傳純 JSON 格式（不要 Markdown 標籤）：
    {
      "title": "標題",
      "summary": "簡介",
      "days": [{ "day": 1, "plan": "行程" }]
    }`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Google API 錯誤回傳:", data);
      throw new Error(data.error?.message || "Google API 呼叫失敗");
    }

    // 解析 Google 回傳的格式
    const aiText = data.candidates[0].content.parts[0].text;
    return NextResponse.json(JSON.parse(aiText));

  } catch (error: any) {
    console.error("最終診斷錯誤:", error.message);
    return NextResponse.json({ error: "AI 生成失敗", details: error.message }, { status: 500 });
  }
}
