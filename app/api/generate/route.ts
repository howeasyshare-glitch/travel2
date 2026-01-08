import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function normalizeSpots(spots: any): string[] {
  const list = spots?.customList ?? [];
  return Array.isArray(list) ? list.map((s) => String(s).trim()).filter(Boolean) : [];
}

function paceText(pace: string) {
  if (pace === "packed") return "趕（景點多、移動緊湊、停留時間短）";
  if (pace === "relaxed") return "悠閑（留白多、停留時間長、安排寬鬆）";
  return "一般（平衡安排，彈性適中）";
}

function transportText(t: string) {
  return t === "drive" ? "自駕" : "大眾運輸";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { location, days, adults, children, pace, transport, meals, hotel, spots } = body;

    if (!location || !days || !adults) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const spotsList = normalizeSpots(spots);
    const hasKids = Number(children) > 0;

    const mealsRequirement =
      meals?.mode === "custom"
        ? `使用者對餐飲的自訂需求（source=user）：${meals.customText}。用餐仍請提供 A/B 兩個選項，但 A 可更貼近使用者需求。`
        : "使用者吃的沒有想法：每次用餐請提供 A/B 兩個餐廳選項（source=ai），並選擇較適合者為 selectedOption。";

    const hotelRequirement =
      hotel?.mode === "custom"
        ? `使用者指定/偏好住宿（source=user）：${hotel.customText}。住宿選項請做：A=使用者指定（source=user），B=替代方案（source=ai）。`
        : "使用者未指定旅館：請提供 A/B 兩個住宿選項（source=ai），以市中心/交通便利為主。";

    const spotsRequirement =
      spots?.mode === "custom"
        ? `使用者指定必去景點清單（source=user）：${spotsList.length ? spotsList.join("、") : "（未提供）"}。請把這些景點分配到天數中。景點 block 的 options：A 優先放指定景點（source=user），B 放附近替代（source=ai）。`
        : "使用者未指定景點：景點 block 的 options 請提供 A/B 兩種附近但風格不同的推薦（source=ai）。";

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
你是一位專業旅遊規劃師。請產生「可編輯的時間行程表」，嚴格只輸出 JSON（不要輸出多餘文字）。

【使用者需求】
- 地點：${location}
- 天數：${days} 天
- 人數：成人 ${adults}、小孩 ${children}
- 旅遊節奏：${paceText(pace)}
- 交通方式：${transportText(transport)}（所有 move blocks 必須使用這種 mode）
- 親子需求：${hasKids ? "有小孩，景點/餐廳請親子友善，避免太晚" : "無小孩，步調正常"}
- 餐飲：${mealsRequirement}
- 旅館：${hotelRequirement}
- 景點：${spotsRequirement}

【時間行程表規則（非常重要）】
1) 每天輸出 blocks 陣列。
   - pace=packed：每日至少 8–10 blocks
   - pace=normal：每日至少 6–8 blocks
   - pace=relaxed：每日至少 5–7 blocks
2) 每個 block 必須有 timeStart/timeEnd（HH:MM 24 小時制），同一天時間不能重疊，銜接要合理。
3) type 只能用：arrival | spot | meal | hotel | move | free
4) 「自訂標示」：每個 block 必須有 source："user" 或 "ai"
   - 使用者指定/自訂的內容（例如指定旅館、指定景點）要標 source="user"
   - AI 推薦的標 source="ai"
5) move blocks（到下一站預估時間）：
   - 任何需要移動的地方，務必插入 move block
   - move block 必須有 move: { mode: "drive"|"transit", durationMin: number, from?: string, to?: string }
   - move block 的 title 例： "移動到下一站（大眾運輸 20 分）"
   - timeEnd 必須等於 timeStart + durationMin（合理安排進時間軸）
6) 對於 type=spot/meal/hotel：
   - 必須提供 options: [A,B]
   - 每個 option 必含：label, title, place, note, score(0-100), reason(短且具體), source("user"|"ai")
   - 同時提供 selectedOption（預設選更適合使用者的那個）
   - block 的 title/place/note 請填入 selectedOption 對應的內容（方便前端直接顯示）
7) Day 1 必須包含 arrival（建議開始時間即可，不要假設航班）。

【JSON 輸出格式】
{
  "title": "旅程標題",
  "assumptions": { "startTime": "HH:MM", "pace": "packed|normal|relaxed", "transport": "drive|transit" },
  "days": [
    {
      "day": 1,
      "blocks": [
        {
          "id": "d1-b1",
          "timeStart": "10:30",
          "timeEnd": "11:00",
          "type": "arrival",
          "source": "ai",
          "title": "抵達/開始逛：${location}",
          "place": "市中心",
          "note": "建議先放行李或從交通樞紐開始"
        },
        {
          "id": "d1-b2",
          "timeStart": "11:00",
          "timeEnd": "11:20",
          "type": "move",
          "source": "ai",
          "title": "移動到下一站（${transportText(transport)} 20 分）",
          "place": "",
          "note": "",
          "move": { "mode": "${transport}", "durationMin": 20, "from": "市中心", "to": "下一站區域" }
        },
        {
          "id": "d1-b3",
          "timeStart": "11:20",
          "timeEnd": "12:30",
          "type": "meal",
          "source": "ai",
          "selectedOption": "A",
          "title": "（填入 A 的 title）",
          "place": "（填入 A 的 place）",
          "note": "（填入 A 的 note）",
          "options": [
            { "label": "A", "title": "推薦餐廳：...", "place": "區域", "note": "提醒", "score": 86, "reason": "短且具體", "source": "ai" },
            { "label": "B", "title": "替代餐廳：...", "place": "區域", "note": "提醒", "score": 79, "reason": "短且具體", "source": "ai" }
          ]
        }
      ]
    }
  ]
}

請嚴格只輸出 JSON。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: "生成失敗" }, { status: 500 });
  }
}
