import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const getGeminiApiKey = () => process.env.GEMINI_API_KEY;
const getOpenAIApiKey = () => process.env.OPENAI_API_KEY;

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const geminiKey = getGeminiApiKey();
  const openaiKey = getOpenAIApiKey();
  if (geminiKey) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      // @google/generative-ai の方式で systemInstruction を渡すには、生成時に設定するか、
      // あるいは getGenerativeModel の systemInstruction パラメータを利用します。
      const modelWithSystem = systemInstruction 
        ? ai.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: systemInstruction })
        : model;

      const result = await modelWithSystem.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return result.response.text();
    } catch (e) {
      console.error("Gemini Generation Error, falling back to OpenAI if available:", e);
      if (!openaiKey) throw e;
    }
  }

  if (openaiKey) {
    const openai = new OpenAI({ apiKey: openaiKey });
    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });
    return completion.choices[0].message.content || "";
  }

  throw new Error("No API keys found. Please set GEMINI_API_KEY or OPENAI_API_KEY in .env.local.");
}

export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const geminiKey = getGeminiApiKey();
  const openaiKey = getOpenAIApiKey();
  if (geminiKey) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      const modelWithSystem = systemInstruction 
        ? ai.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: systemInstruction,
            generationConfig: { responseMimeType: "application/json" }
          })
        : model;

      const result = await modelWithSystem.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return JSON.parse(result.response.text()) as T;
    } catch (e) {
      console.error("Gemini JSON Generation Error, falling back to OpenAI if available:", e);
      if (!openaiKey) throw e;
    }
  }

  if (openaiKey) {
    const openai = new OpenAI({ apiKey: openaiKey });
    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
    });
    return JSON.parse(completion.choices[0].message.content || "{}") as T;
  }

  throw new Error("No API keys found. Please set GEMINI_API_KEY or OPENAI_API_KEY in .env.local.");
}
