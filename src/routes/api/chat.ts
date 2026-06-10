import { createFileRoute } from "@tanstack/react-router";
import { AI_CONFIG } from "@/lib/ai-config";

type ChatMessage = { role: "user" | "assistant"; content: string };

function isMessage(x: unknown): x is ChatMessage {
  if (!x || typeof x !== "object") return false;
  const r = (x as { role?: unknown }).role;
  const c = (x as { content?: unknown }).content;
  return (r === "user" || r === "assistant") && typeof c === "string";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "GROQ_API_KEY is not configured on the server." },
            { status: 500 }
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        const raw = (body as { messages?: unknown })?.messages;
        if (!Array.isArray(raw) || !raw.every(isMessage)) {
          return Response.json({ error: "`messages` must be an array of {role, content}." }, { status: 400 });
        }

        const history = (raw as ChatMessage[])
          .slice(-AI_CONFIG.maxHistory)
          .map((m) => ({
            role: m.role,
            content: m.content.slice(0, AI_CONFIG.maxUserMessageChars),
          }));

        const model = process.env.GROQ_MODEL || AI_CONFIG.defaultModel;

        try {
          const upstream = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              temperature: 0.3,
              messages: [
                { role: "system", content: AI_CONFIG.systemPrompt },
                ...history,
              ],
            }),
          });

          if (!upstream.ok) {
            const errText = await upstream.text();
            console.error("[chat] Groq error", upstream.status, errText);
            return Response.json(
              { error: `Upstream error (${upstream.status}).` },
              { status: 502 }
            );
          }

          const data = (await upstream.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data.choices?.[0]?.message?.content ?? "";
          return Response.json({ role: "assistant", content, model });
        } catch (err) {
          console.error("[chat] request failed", err);
          return Response.json(
            { error: err instanceof Error ? err.message : "Unknown error." },
            { status: 500 }
          );
        }
      },
    },
  },
});
