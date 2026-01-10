import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function paceText(pace: string) {
  if (pace === "packed") return "趕（景點多、移動緊湊、停留短）";
  if (pace === "relaxed") return "悠閑（留白多、停留久、安排寬鬆）";
  return "一般（平衡安排）";
}

function transportText(t: string) {
  return t === "drive" ? "自駕" : "大眾運輸";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { location, pace, transport, startTime, endTime, hasKids, day } = body;

    if (!day?.day || !Array.isArray(day?.blocks)) {
      return NextResponse.json({ error: "缺少 day.blocks" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
你是旅遊規劃師。請「重排單日行程」，嚴格只輸出 JSON（不要多餘文字）。

【重排目標】
- 地點：${location}
- 節奏：${paceText(pace)}
- 交通方式：${transportText(transport)}（所有 move blocks 必須用此 mode）
- 每日時間窗：${startTime} ～ ${endTime}
- 親子：${hasKids ? "有小孩，避免太晚、安排親子友善" : "無小孩"}

【輸入：當天現有 blocks（包含空檔、交通需更新）】
${JSON.stringify(day, null, 2)}

【重排規則】
1) 你要輸出一個「新的 day 物件」，格式：
{ "day": <number>, "blocks": [ ... ] }
2) 所有 blocks 必須落在 ${startTime}～${endTime}，同一天時間不能重疊，按 timeStart 排序。
3) 遇到 type="free" 且 title 含「空檔」或「待安排」：
   - 你可以保留為 free（若需要留白），或替換成更合理的 spot/meal/hotel
   - 但請避免整天大量空白
4) move blocks：
   - 若 move.needsUpdate=true 或 title/note 顯示需更新：請更新 move 的 from/to 與 durationMin
   - move.timeEnd 必須等於 timeStart + durationMin（真的佔用時間）
5) 用餐：
   - meal 必須帶 mealType
   - 午餐（mealType="lunch"）timeStart 盡量安排在 11:30～12:30（偏離要在 note 說明原因）
6) 對 spot/meal/hotel：
   - 若你新增或改動，請仍提供 options[A,B]、selectedOption、score、reason、source
   - block.title/place/note 必須對應 selectedOption
7) 若某些 blocks 已被使用者手動調整過（例如 title/place/time 很明確），請盡量保留不大改其內容，優先補交通與空檔。

【請嚴格只輸出 JSON：】
{ "day": <number>, "blocks": [ ... ] }
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: "重排失敗" }, { status: 500 });
  }
}
