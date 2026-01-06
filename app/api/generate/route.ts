import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, adults, children, mustVisit, hotelPref } = await req.json();

    // 使用 1.5-flash 並開啟 JSON Mode
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      你是一位專業旅遊規劃師。請為以下需求設計一份詳細的帶時間點的行程表：
      - 地點：${location}
      - 天數：${days} 天
      - 成員：${adults} 位成人, ${children} 位小孩
      - 必去景點：${mustVisit || "由你根據地點推薦"}
      - 指定住宿/飯店：${hotelPref || "由你推薦距離市中心近的旅館"}

      請根據成員組成調整行程（如有小孩請安排親子友善景點）。
      
      請嚴格以 JSON 格式回傳，格式如下：
      {
        "title": "旅程標題",
        "itinerary": [
          {
            "day": 1,
            "date_label": "第一天 行程開始",
            "schedule": [
              { "time": "09:00", "activity": "抵達地點/活動名稱", "description": "詳細內容與建議" },
              { "time": "12:00", "activity": "午餐建議", "description": "具體餐廳或特色美食建議" }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 直接解析 AI 回傳的純 JSON
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "生成失敗" }, { status: 500 });
  }
}
