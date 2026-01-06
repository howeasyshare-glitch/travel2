import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, adults, children, mustVisit, hotelPref } = await req.json();
    
    // 使用 Gemini 1.5 Flash，速度快且對 JSON 支援度高
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      你是一位專業旅遊規劃師。請為以下需求設計行程，並僅以 JSON 格式回傳，不要包含任何開場白或結論。
      
      需求：
      - 地點：${location}
      - 天數：${days}天
      - 人數：${adults}位成人, ${children}位小孩
      - 指定景點：${mustVisit || "由你推薦"}
      - 住宿偏好：${hotelPref || "由你推薦"}

      JSON 結構範例 (請嚴格遵守)：
      {
        "itinerary": [
          {
            "day": 1,
            "date_title": "行程主題",
            "schedule": [
              { "time": "09:00", "activity": "活動名稱", "description": "細節描述" }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // --- 超強效 JSON 擷取邏輯 ---
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("AI 沒有回傳有效的 JSON 格式");
    }
    const cleanJson = JSON.parse(jsonMatch[0]);
    // -------------------------

    return NextResponse.json(cleanJson);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
