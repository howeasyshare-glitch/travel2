const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("環境變數中找不到 API Key");

      // 修正點 1: 改用 v1 穩定版路徑 (捨棄 v1beta)
      // 修正點 2: 確保模型名稱為 gemini-1.5-flash
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `你是一位專業導遊，請為我規劃一段去 ${formData.location} 的行程。天數：${formData.days}天，預算：${formData.budget}。請務必回傳純 JSON 格式，不要包含任何 markdown 標籤。` 
            }] 
          }],
          // 修正點 3: 移除在某些 v1 版本中可能導致錯誤的 generationConfig 測試
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // 如果還是 404，嘗試最後一個 fallback 名稱
        console.error("嘗試 v1 失敗，詳細資訊:", data);
        throw new Error(data.error?.message || "Google API 呼叫失敗");
      }

      const aiText = data.candidates[0].content.parts[0].text;
      
      // 額外處理：防止 AI 噴出 ```json ... ``` 標籤導致 JSON 解析失敗
      const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      setResult(JSON.parse(cleanJson));
      setStep(4);
    } catch (error: any) {
      console.error("最終錯誤診斷:", error);
      alert("AI 生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };
