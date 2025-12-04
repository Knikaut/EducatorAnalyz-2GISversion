import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Performs the specific analysis requested in the prompt using the JSON data.
 */
export const analyzeUniversityData = async (jsonString: string): Promise<{ text: string; reviews: { positive: string[], negative: string[] }; groundingChunks?: any[] }> => {
  const modelId = 'gemini-2.5-flash';

  const systemInstruction = `
    Ты — профессиональный консультант по поступлению в международные университеты (Senior Admissions Consultant).
    Твоя задача — составить ОБЪЕКТИВНЫЙ, ГЛУБОКИЙ и ПОЛЕЗНЫЙ отчет об университете.

    У тебя есть доступ к инструментам:
    1. Google Search: для поиска фактов, рейтингов и "2-gis" локаций.
    2. Google Maps: для точного определения местоположения.
    3. JSON-данные из Instagram: для анализа "вайба".

    ТВОЙ ПОДХОД:
    — Обязательно найди, где находится университет.
    — Опиши визуальный стиль кампуса (найди описание фото в поиске).
    — Сопоставляй факты с Instagram.
    — Из отзывов в интернете (Google Maps, 2GIS, Student Forums) выдели реальные плюсы и минусы.
  `;

  const analysisPrompt = `
    Вот JSON-файл с последними постами Instagram-аккаунта университета:
    \`\`\`json
    ${jsonString}
    \`\`\`

    ЗАДАЧА:
    1. Используй **Google Search** и **Google Maps** чтобы найти отзывы студентов, локацию и рейтинги.
    2. Сформируй полный текстовый отчет (markdown_report).
    3. Выдели список конкретных Плюсов и Минусов для раздела "Real Reviews" (reviews).

    СТРУКТУРА ОТЧЕТА (для markdown_report):
    Название университета
    📍 ЛОКАЦИЯ И КАМПУС
    🎓 ОБЩАЯ РЕПУТАЦИЯ
    🏛 ТРЕБОВАНИЯ (ФАКТЫ С САЙТА)
    📸 АНАЛИЗ INSTAGRAM (АТМОСФЕРА)
    💡 ВЕРДИКТ

    OUTPUT FORMAT:
    Return valid JSON only. Do not use Markdown code blocks.
    {
      "markdown_report": "Full text report in Markdown...",
      "reviews": {
        "positive": ["plus 1", "plus 2"],
        "negative": ["minus 1", "minus 2"]
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: analysisPrompt,
    config: {
      systemInstruction: systemInstruction,
      tools: [
        { googleSearch: {} },
        { googleMaps: {} }
      ],
      // Note: responseSchema and responseMimeType are not used with tools to comply with guidelines
    }
  });

  if (!response.text) {
    throw new Error("Failed to analyze the data.");
  }

  // Parse the JSON response
  let parsedResponse;
  try {
    let cleanText = response.text.trim();
    // Handle markdown code blocks if the model outputs them despite instructions
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    parsedResponse = JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse Gemini JSON response", e);
    // If JSON parsing fails, assume the whole text is the report and provide empty reviews
    parsedResponse = {
        markdown_report: response.text,
        reviews: { positive: [], negative: [] }
    };
  }

  return {
    text: parsedResponse.markdown_report || response.text,
    reviews: parsedResponse.reviews || { positive: [], negative: [] },
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};