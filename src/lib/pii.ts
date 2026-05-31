import { generateJSON } from "./llm";

export interface AnalysisResult {
  category: string;
  topic_summary: string;
  answer_summary: string;
  contains_pii: boolean;
}

// 1次フィルタ: 正規表現による機械的な個人情報の除去
export function filterPIIWithRegex(text: string): { filteredText: string; detected: boolean } {
  let detected = false;
  let result = text;

  // メールアドレスのパターン
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(result)) {
    result = result.replace(emailRegex, "[個人情報(メール)]");
    detected = true;
  }

  // 電話番号のパターン（ハイフンあり/なし）
  const phoneRegex = /\b\d{2,4}-\d{2,4}-\d{4}\b|\b0[789]0\d{8}\b/g;
  if (phoneRegex.test(result)) {
    result = result.replace(phoneRegex, "[個人情報(電話番号)]");
    detected = true;
  }

  // URLのパターン（一般公開の学習サイト等のドメイン以外を除去）
  const urlRegex = /https?:\/\/[^\s]+/g;
  if (urlRegex.test(result)) {
    result = result.replace(urlRegex, "[個人情報(URL)]");
    detected = true;
  }

  return { filteredText: result, detected };
}

const ANALYZER_INSTRUCTION = `
あなたは、入力された「質問」と「回答」のペアを分析し、個人情報（PII）を除去して、分析用メタデータをJSON形式で出力するセキュリティAIです。

以下のルールに従って分析結果をJSONで出力してください：
1. 「質問」および「回答」から、名前、住所、学校名、具体的な地名、組織名など、特定の個人を特定または推測できる情報を探し、それを「[個人情報]」という伏字に置換してください。
2. 分析結果として以下の構造のJSONを出力してください：
   - "category": 質問のカテゴリを以下のいずれかから選択してください。「プログラミング」「AI・web3」「学習相談」「雑談」「その他」
   - "topic_summary": 質問文からすべての個人情報を完全に排除し、かつ客観的に要約したテキスト（元の質問文は絶対に漏洩させないでください）
   - "answer_summary": 回答文からすべての個人情報を完全に排除し、かつ客観的に要約したテキスト（元の回答文は絶対に漏洩させないでください）
   - "contains_pii": 質問または回答に個人情報（名前、具体的な学校名、住所、組織名など）が含まれていた場合は true、含まれていなければ false。

必ず以下のJSONスキーマを守ってください：
{
  "category": "string",
  "topic_summary": "string",
  "answer_summary": "string",
  "contains_pii": boolean
}
`;

export async function analyzeAndSanitize(
  question: string,
  answer: string
): Promise<AnalysisResult> {
  // 1. 1次Regexフィルタの適用
  const qRegexResult = filterPIIWithRegex(question);
  const aRegexResult = filterPIIWithRegex(answer);

  const preSanitizedQuestion = qRegexResult.filteredText;
  const preSanitizedAnswer = aRegexResult.filteredText;
  const hasRegexPII = qRegexResult.detected || aRegexResult.detected;

  // 2. 2次LLMによる分析と完全な匿名化
  const prompt = `
以下の質問と回答を分析・匿名化してください。
---
【質問】: ${preSanitizedQuestion}
【回答】: ${preSanitizedAnswer}
---
`;

  try {
    const analysis = await generateJSON<AnalysisResult>(prompt, ANALYZER_INSTRUCTION);
    
    // RegexフィルタでPIIを検出していた場合、またはLLMがPIIありと判定した場合
    return {
      category: analysis.category || "その他",
      topic_summary: analysis.topic_summary || "質問の要約",
      answer_summary: analysis.answer_summary || "回答の要約",
      contains_pii: hasRegexPII || !!analysis.contains_pii,
    };
  } catch (e) {
    console.error("PII analysis error:", e);
    // エラー時のフォールバック処理
    return {
      category: "その他",
      topic_summary: "分析エラーによるフォールバック要約",
      answer_summary: "分析エラーによるフォールバック要約",
      contains_pii: hasRegexPII,
    };
  }
}
