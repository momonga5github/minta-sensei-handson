import { createClient } from "@supabase/supabase-js";

export interface QaLog {
  id?: string;
  category: string;
  topic_summary: string;
  answer_summary: string;
  question_char_count: number;
  answer_char_count: number;
  contains_pii: boolean;
  created_at?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// クライアントを初期化（環境変数が存在し、かつプレースホルダーではない場合のみ）
// サーバーサイドでのINSERT用にサービスロールキーを優先
const getSupabaseClient = () => {
  if (!supabaseUrl || supabaseUrl.includes("xxxxxxxxxxxx")) {
    return null;
  }
  
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!key || key.includes("xxxxxxxxxxxx")) {
    return null;
  }

  return createClient(supabaseUrl, key);
};

export const supabase = getSupabaseClient();
export const isSupabaseConfigured = !!supabase;
