import { NextResponse } from "next/server";
import { generateText } from "@/lib/llm";
import { MINTA_SYSTEM_PROMPT } from "@/lib/minta";
import { analyzeAndSanitize } from "@/lib/pii";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "質問内容を入力してください。" },
        { status: 400 }
      );
    }

    // 1. minta先生の回答を生成
    const answer = await generateText(question, MINTA_SYSTEM_PROMPT);

    // 2. 個人情報の除去とメタデータ分析
    const analysis = await analyzeAndSanitize(question, answer);

    let supabaseSaved = false;
    let dbError = null;

    // 3. Supabaseに蓄積（設定されている場合のみ）
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("qa_logs").insert([
        {
          category: analysis.category,
          topic_summary: analysis.topic_summary,
          answer_summary: analysis.answer_summary,
          question_char_count: question.length,
          answer_char_count: answer.length,
          contains_pii: analysis.contains_pii,
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        dbError = error.message;
      } else {
        supabaseSaved = true;
      }
    }

    return NextResponse.json({
      answer,
      analysis,
      supabase_configured: isSupabaseConfigured,
      supabase_saved: supabaseSaved,
      db_error: dbError,
    });
  } catch (error: any) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
