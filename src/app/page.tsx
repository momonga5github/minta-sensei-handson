"use client";

import { useState, useEffect } from "react";

interface AnalysisResult {
  category: string;
  topic_summary: string;
  answer_summary: string;
  contains_pii: boolean;
}

interface QaLog {
  id: string;
  category: string;
  topic_summary: string;
  answer_summary: string;
  question_char_count: number;
  answer_char_count: number;
  contains_pii: boolean;
  created_at: string;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QaLog[]>([]);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [error, setError] = useState("");

  // 履歴の取得
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.logs) {
        setHistory(data.logs);
      }
      setSupabaseConfigured(!!data.supabase_configured);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnswer(data.answer);
        setAnalysis(data.analysis);
        // 履歴を更新
        fetchHistory();
      } else {
        setError(data.error || "エラーが発生しました。");
      }
    } catch (err) {
      setError("サーバーとの通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white text-gray-800 font-sans pb-16">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-rose-100 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👩‍🏫</span>
            <h1 className="text-xl font-bold tracking-tight text-rose-600">教えて、minta先生</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              supabaseConfigured 
                ? "bg-green-100 text-green-800" 
                : "bg-amber-100 text-amber-800"
            }`}>
              {supabaseConfigured ? "● Supabase 接続中" : "● Supabase 未設定"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        {/* 説明カード */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100/50">
          <h2 className="text-lg font-bold text-gray-900 mb-2">授業デモ用アプリ 🚀</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            minta先生に何でも質問してください。AIが回答を生成し、同時に
            <strong className="text-rose-600">個人情報（PII）を除去した分析メタデータ</strong>だけをデータベース（Supabase）に蓄積します。
            元の質問文や回答文は一切DBに保存されないため、プライバシーを守りながら質問傾向を分析できます。
          </p>
        </section>

        {/* 質問入力エリア */}
        <section className="bg-white rounded-2xl p-6 shadow-md border border-rose-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-2">
                minta先生に聞きたいこと 💬
              </label>
              <textarea
                id="question"
                rows={4}
                className="w-full rounded-xl border border-gray-200 p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                placeholder="例: プロンプトエンジニアリングってなんですか？ / 千葉工業大学に通っている田中です。"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>minta先生が考え中...</span>
                </>
              ) : (
                <>
                  <span>質問を送信する ✈️</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* 回答エリア */}
        {(answer || analysis) && (
          <section className="space-y-4 animate-fade-in">
            {/* AIの回答 */}
            {answer && (
              <div className="bg-white rounded-2xl p-6 shadow-md border border-rose-100">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">👩‍🏫</span>
                  <h3 className="font-bold text-lg text-rose-600">minta先生の回答</h3>
                </div>
                <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}

            {/* 分析メタデータ (アコーディオン) */}
            {analysis && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 font-semibold text-sm text-slate-700 cursor-pointer hover:bg-slate-100 transition select-none">
                    <span className="flex items-center space-x-2">
                      <span>🛡️</span>
                      <span>DBに保存された分析メタ（個人情報除去済）</span>
                    </span>
                    <span className="transition group-open:rotate-180">▼</span>
                  </summary>
                  <div className="p-4 border-t border-slate-200 bg-white text-xs space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500 block mb-1">分類カテゴリ</span>
                        <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-semibold text-xs inline-block">
                          {analysis.category}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">個人情報(PII)の有無</span>
                        <span className={`px-2 py-1 rounded font-semibold text-xs inline-block ${
                          analysis.contains_pii 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {analysis.contains_pii ? "検出 (伏字化されました)" : "未検出"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">匿名化した質問の要約</span>
                      <p className="bg-slate-50 p-2.5 rounded text-gray-700 leading-normal">
                        {analysis.topic_summary}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">匿名化した回答の要約</span>
                      <p className="bg-slate-50 p-2.5 rounded text-gray-700 leading-normal">
                        {analysis.answer_summary}
                      </p>
                    </div>
                    <div className="text-[10px] text-gray-400 text-right">
                      {supabaseConfigured 
                        ? "※このデータがSupabaseに保存されました。" 
                        : "※Supabase未設定のため保存はスキップされました。"}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </section>
        )}

        {/* 履歴エリア */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-900 flex items-center space-x-2">
              <span>📊</span>
              <span>みんなの質問傾向（最新10件）</span>
            </h3>
            <button 
              onClick={fetchHistory}
              className="text-xs text-rose-500 hover:text-rose-600 hover:underline"
            >
              更新する 🔄
            </button>
          </div>

          {!supabaseConfigured ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-gray-500">
                現在データベースが接続されていません。<br />
                Vercelにデプロイし、Supabaseと連携することで履歴が表示されます。
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              まだ質問データがありません。最初の質問を投げてみましょう！
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((log) => (
                <div key={log.id} className="border border-gray-100 rounded-xl p-4 hover:bg-rose-50/20 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                        {log.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        log.contains_pii 
                          ? "bg-red-50 text-red-600" 
                          : "bg-green-50 text-green-600"
                      }`}>
                        {log.contains_pii ? "PIIあり" : "PIIなし"}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="leading-relaxed">
                      <strong className="text-gray-900 block text-xs mb-0.5">質問の要約:</strong>
                      {log.topic_summary}
                    </p>
                    <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong className="text-gray-900 block text-xs mb-0.5">minta先生の要約:</strong>
                      {log.answer_summary}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3 text-[10px] text-gray-400 mt-2 border-t border-gray-50 pt-2">
                    <span>質問: {log.question_char_count}文字</span>
                    <span>回答: {log.answer_char_count}文字</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
