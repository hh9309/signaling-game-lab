import { GoogleGenAI } from "@google/genai";
import { GameStructure, EquilibriumResult, AISettings } from "../types";

async function callDeepSeek(apiKey: string, prompt: string): Promise<string> {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-reasoner", // DeepSeek R1
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return `DeepSeek API 错误: ${response.status} ${errorData.error?.message || response.statusText}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "DeepSeek 未返回有效内容。";
  } catch (error) {
    console.error("DeepSeek Error:", error);
    return `DeepSeek 调用失败: ${error instanceof Error ? error.message : '未知错误'}`;
  }
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model === 'gemini-3-flash' ? 'gemini-3-flash-preview' : model,
      contents: prompt,
    });
    return response.text || "Gemini 未返回有效内容。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Gemini 调用失败: ${error instanceof Error ? error.message : '未知错误'}`;
  }
}

export async function explainEquilibrium(game: GameStructure, results: EquilibriumResult[], settings: AISettings | null): Promise<string> {
  if (!settings || !settings.apiKey) return "请先点击右上角齿轮图标配置 API Key。";

  const prompt = `你是一个博弈论导师。请用通俗易懂的语言解释以下信号博弈的均衡结果。
博弈结构: ${JSON.stringify(game)}
均衡结果: ${JSON.stringify(results)}

请解释：
1. 为什么会形成这种均衡？
2. 这种均衡在现实中意味着什么？
3. 发信者和接收者的心理预期（信念）是如何更新的？`;

  if (settings.model === 'deepseek-r1') {
    return await callDeepSeek(settings.apiKey, prompt);
  } else {
    return await callGemini(settings.apiKey, "gemini-3-flash", prompt);
  }
}

export async function counterfactualAnalysis(game: GameStructure, change: string, settings: AISettings | null): Promise<string> {
  if (!settings || !settings.apiKey) return "请先点击右上角齿轮图标配置 API Key。";

  const prompt = `你是一个博弈论专家。如果我们将以下博弈结构进行如下修改：
修改建议: "${change}"
原始结构: ${JSON.stringify(game)}

请分析：
1. 这种改变会如何影响参与者的收益？
2. 均衡类型（分离/混同）是否会发生变化？
3. 这种改变在政策或管理上有什么启示？`;

  if (settings.model === 'deepseek-r1') {
    return await callDeepSeek(settings.apiKey, prompt);
  } else {
    return await callGemini(settings.apiKey, "gemini-3-flash", prompt);
  }
}
