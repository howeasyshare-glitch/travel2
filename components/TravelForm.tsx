const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. 這裡直接讀取 Vercel 設定的環境變數
      // 請確保在 Vercel 後台變數名是 NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        throw new Error("找不到 API Key，請檢查 Vercel 變數名稱是否加上了 NEXT_PUBLIC_");
      }

      // 2. 使用 HTML 版成功的穩定網址
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const prompt = `你是一位專業旅遊規劃師。請為我規劃一段去 ${formData.location} 的 ${formData.days} 天旅程。
      人數：${formData.members} 人，預算：${formData.budget}。
      請務必以純 JSON 格式回傳，不要包含 markdown 語法：
      {
        "title": "旅程標題",
        "summary": "簡介",
        "days": [
          { "day": 1, "plan": "詳細內容" }
        ]
      }`;

      // 3. 執行 fetch (就像你的 HTML 版一樣)
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            responseMimeType: "application/json" // 確保回傳純 JSON
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Google API 呼叫失敗");
      }

      // 4. 解析結果
      const aiText = data.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(aiText);
      
      setResult(parsedData);
      setStep(4); // 跳轉到結果畫面
    } catch (error: any) {
      console.error("生成錯誤:", error);
      alert("AI 規劃失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };
