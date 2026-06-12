import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageSquare, Send, X, Loader2, AlertTriangle, Link2 } from "lucide-react";
import { useGrid } from "@/lib/grid-store";
import { cn } from "@/lib/utils";

type Source = string | { title?: string; url?: string; source?: string; [k: string]: unknown };

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  route?: string;
};

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hola — soy tu analista energético. Pregúntame sobre generación renovable, redes eléctricas, centros de datos o planificación de infraestructura.",
};

const RAG_ENDPOINT = "https://hanslaston-energy-intelligence-api.hf.space/chat";
const REQUEST_TIMEOUT_MS = 15000;

export function ChatPanel() {
  const open = useGrid((s) => s.chatOpen);
  const toggle = useGrid((s) => s.toggleChat);
  const presentation = useGrid((s) => s.presentationMode);

  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || status === "loading") return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setStatus("loading");
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(RAG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ question: text }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { answer?: string; sources?: Source[]; route?: string };
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer ?? "(respuesta vacía)",
          sources: Array.isArray(data.sources) ? data.sources : undefined,
          route: data.route,
        },
      ]);
      setStatus("idle");
    } catch (e) {
      clearTimeout(timeoutId);
      const aborted = e instanceof DOMException && e.name === "AbortError";
      setStatus("error");
      setError(aborted ? "Tiempo de espera agotado (15s). Intenta de nuevo." : e instanceof Error ? e.message : String(e));
    }
  }, [input, status]);

  if (presentation) return null;

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Open AI assistant"
        className={cn(
          "fixed bottom-20 right-3 z-30 size-12 rounded-full flex items-center justify-center transition shadow-2xl",
          "bg-gradient-to-br from-primary/80 to-[#7B61FF]/80 text-primary-foreground hover:scale-105",
          "ring-2 ring-primary/40",
          open && "opacity-0 pointer-events-none"
        )}
      >
        <MessageSquare className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-3 right-3 z-40 w-[380px] max-w-[92vw] h-[520px] max-h-[80vh] glass-panel rounded-xl shadow-2xl flex flex-col overflow-hidden ring-glow"
          >
            <header className="flex items-center gap-2 px-3 h-11 border-b border-[var(--panel-border)]">
              <div className="size-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center text-primary">
                <Bot className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold">Energy Analyst</div>
                <div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  RAG · Energy Intelligence
                </div>
              </div>
              <button
                onClick={toggle}
                className="size-7 grid place-items-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scrollbar px-3 py-3 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-[12.5px] leading-relaxed",
                    m.role === "user" ? "text-right" : "text-left"
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="space-y-1.5">
                      <div className="text-foreground whitespace-pre-wrap">{m.content}</div>
                      {m.route && (
                        <div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          route · <span className="text-primary">{m.route}</span>
                        </div>
                      )}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-1 border-t border-[var(--panel-border)] pt-1.5">
                          <div className="mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                            Sources ({m.sources.length})
                          </div>
                          <ul className="space-y-1">
                            {m.sources.map((s, j) => {
                              const label =
                                typeof s === "string" ? s : s.title ?? s.source ?? s.url ?? JSON.stringify(s);
                              const rawUrl = typeof s === "object" ? s.url : undefined;
                              const safeUrl =
                                typeof rawUrl === "string" && /^https?:\/\//i.test(rawUrl) ? rawUrl : undefined;
                              return (
                                <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                  <Link2 className="size-3 mt-0.5 shrink-0 text-primary/70" />
                                  {safeUrl ? (
                                    <a
                                      href={safeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary underline-offset-2 hover:underline break-all"
                                    >
                                      {label}
                                    </a>
                                  ) : (
                                    <span className="break-all">{label}</span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="inline-block px-3 py-2 rounded-lg bg-primary/15 border border-primary/30 text-foreground whitespace-pre-wrap max-w-[85%]">
                      {m.content}
                    </div>
                  )}
                </div>
              ))}
              {status === "loading" && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  Consultando base de conocimiento…
                </div>
              )}
              {status === "error" && (
                <div className="flex items-start gap-2 text-[11px] text-destructive">
                  <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); void send(); }}
              className="border-t border-[var(--panel-border)] p-2 flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder="Pregunta sobre energía, redes, renovables…"
                className="flex-1 resize-none bg-[rgba(255,255,255,0.04)] border border-[var(--panel-border)] rounded-md text-[12px] px-2.5 py-2 outline-none focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={status === "loading" || !input.trim()}
                className="size-9 grid place-items-center rounded-md bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
