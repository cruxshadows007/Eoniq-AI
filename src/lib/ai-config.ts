// Central AI assistant configuration.
//
// The API key must be provided via the GROQ_API_KEY environment variable
// (stored in Lovable Cloud secrets — never bundled into the client).
// The model can be overridden via the GROQ_MODEL environment variable.
//
// Recommended default model: `llama-3.3-70b-versatile` — strong reasoning,
// high throughput on Groq's LPU, and generous context window.

export const AI_CONFIG = {
  defaultModel: "llama-3.3-70b-versatile",
  baseUrl: "https://api.groq.com/openai/v1",
  systemPrompt:
    "Eres un analista experto en energía, infraestructuras eléctricas, generación renovable, centros de datos y planificación energética. Responde de forma profesional y concisa. No responder sobre otros temas.",
  // Conversation safety limits.
  maxHistory: 20,
  maxUserMessageChars: 4000,
} as const;
