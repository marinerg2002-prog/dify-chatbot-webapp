import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      text: "こんにちは！何かお手伝いできることはありますか？",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // UI確認用のダミー応答（Dify API連携時に置き換える）
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: "これはAIのサンプル応答です。Dify APIと連携すると、実際の回答が表示されます。",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">AIチャットボット</h1>
          <p className="text-xs text-slate-400">いつでもお気軽にご質問ください</p>
        </div>
      </header>

      {/* チャット履歴 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* アイコン */}
              <div
                className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full ${
                  msg.role === "user"
                    ? "bg-slate-600 text-white"
                    : "bg-teal-500 text-white"
                }`}
              >
                {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
              </div>

              {/* 吹き出し */}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-slate-600 text-white rounded-tr-sm"
                    : "bg-white text-slate-700 rounded-tl-sm shadow-sm border border-slate-100"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* 入力中インジケーター */}
          {isTyping && (
            <div className="flex gap-3 flex-row">
              <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-teal-500 text-white">
                <Bot size={18} />
              </div>
              <div className="px-4 py-4 rounded-2xl rounded-tl-sm bg-white shadow-sm border border-slate-100">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 入力欄 */}
      <div className="px-4 py-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-teal-400 focus-within:bg-white transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力してください..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none py-2 max-h-32"
              style={{
                height: "auto",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              aria-label="送信"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Enterで送信 / Shift+Enterで改行
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
