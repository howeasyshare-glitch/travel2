import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, adults, children, mustVisit, hotelPref } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `你是一位專業導遊。請為以下需求規劃行程：
      地點：${location}，天數：${days}天，成員：${adults}大${children}小。
      指定景點：${mustVisit}，指定旅館：${hotelPref}。

      請嚴格回傳 JSON 格式（不要包含任何 Markdown 區塊標籤），結構必須如下：
      {
        "itinerary": [
          {
            "day": 1,
            "date_title": "行程主題",
            "schedule": [
              { "time": "09:00", "activity": "景點名稱", "description": "描述" }
            ]
          }
        ]
      }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text(); 
    
    // 這裡直接回傳純文字，讓前端處理
    return NextResponse.json({ rawText: text });
  } catch (error) {
    return NextResponse.json({ error: "API 錯誤" }, { status: 500 });
  }
}
