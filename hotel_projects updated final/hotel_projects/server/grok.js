const GROK_BASE_URL = process.env.GROK_API_BASE_URL || "https://api.x.ai/v1";
const GROK_TEXT_MODEL = process.env.GROK_TEXT_MODEL || process.env.GROK_MODEL || "grok-4-latest";
const GROK_IMAGE_MODEL = process.env.GROK_IMAGE_MODEL || "grok-2-image-latest";

const TASK_PROMPTS = {
  translate: "Translate restaurant menu and guest-facing copy. Preserve meaning, names, prices, and formatting.",
  writing: "Improve restaurant and hotel copy so it is clear, warm, concise, and professional.",
  content: "Generate useful restaurant menu, promotion, and hospitality content for a QR menu system."
};

function apiKey() {
  return process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
}

function requireGrokKey() {
  const key = apiKey();
  if (!key) {
    throw new Error("Grok API key is not configured");
  }
  return key;
}

export async function runGrokTask(input = {}) {
  const key = requireGrokKey();
  const task = TASK_PROMPTS[input.task] ? input.task : "writing";
  const targetLanguage = input.targetLanguage ? `Target language: ${input.targetLanguage}.` : "";
  const tone = input.tone ? `Tone: ${input.tone}.` : "";

  const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model || GROK_TEXT_MODEL,
      temperature: Number(input.temperature ?? 0.4),
      messages: [
        {
          role: "system",
          content: `${TASK_PROMPTS[task]} ${targetLanguage} ${tone}`.trim()
        },
        {
          role: "user",
          content: String(input.prompt || input.text || "")
        }
      ]
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Grok request failed");
  }

  return {
    task,
    model: payload.model || input.model || GROK_TEXT_MODEL,
    text: payload.choices?.[0]?.message?.content || ""
  };
}

export async function generateGrokImage(input = {}) {
  const key = requireGrokKey();
  const prompt = String(input.prompt || "").trim();
  if (!prompt) {
    throw new Error("Image prompt is required");
  }

  const response = await fetch(`${GROK_BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model || GROK_IMAGE_MODEL,
      prompt,
      n: 1
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Grok image generation failed");
  }

  return {
    model: input.model || GROK_IMAGE_MODEL,
    url: payload.data?.[0]?.url || "",
    revisedPrompt: payload.data?.[0]?.revised_prompt || ""
  };
}
