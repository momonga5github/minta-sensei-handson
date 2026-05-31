import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        logs: [],
        supabase_configured: false,
        message: "Supabaseは設定されていません。",
      });
    }

    const { data, error } = await supabase
      .from("qa_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: data || [],
      supabase_configured: true,
    });
  } catch (error: any) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: error.message || "内部サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
