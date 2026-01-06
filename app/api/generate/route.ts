import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, adults, children, mustVisit, hotelPref } = await req.json();
    
    // 指定使用最新的 1.5 Flash 模型
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // 強制要求輸出格式為 JSON
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      你是一位專業旅遊規劃師。請根據以下參數規劃行程：
      目的地：${location}
      總天數：${days}天
      旅客：${adults}位成人，${children}位小孩
      必去景點：${mustVisit}
      住宿偏好：${hotelPref}

      輸出的 JSON 格式必須精確對應以下結構：
      {
        "itinerary": [
          {
            "day": 1,
            "date_title": "當日標題",
            "schedule": [
              { "time": "09:00", "activity": "活動名稱", "description": "詳細描述" }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 這裡直接解析並回傳，因為 JSON Mode 保證了 text 就是 JSON
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error("API 執行出錯:", error);
    return NextResponse.json({ error: "API 請求失敗，請確認 API Key 是否有效" }, { status: 500 });
  }
}
