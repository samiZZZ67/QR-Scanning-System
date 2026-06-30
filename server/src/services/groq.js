import config from '../config/env.js';

const GROQ_BASE_URL = process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1';

const TASK_PROMPTS = {
  translate:
    'Translate restaurant menu and guest-facing copy. Preserve meaning, names, prices, and formatting.',
  writing:
    'Improve restaurant and hotel copy so it is clear, warm, concise, and professional.',
  content:
    'Generate useful restaurant menu, promotion, and hospitality content for a QR menu system.'
};

function requireGroqKey() {
  const key = config.groq.apiKey;
  if (!key) {
    throw new Error('Groq API key is not configured');
  }
  return key;
}

export async function runGroqTask(input = {}) {
  const key = requireGroqKey();
  const task = TASK_PROMPTS[input.task] ? input.task : 'writing';
  const targetLanguage = input.targetLanguage ? `Target language: ${input.targetLanguage}.` : '';
  const tone = input.tone ? `Tone: ${input.tone}.` : '';

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.model || config.groq.textModel,
      temperature: Number(input.temperature ?? 0.4),
      messages: [
        {
          role: 'system',
          content: `${TASK_PROMPTS[task]} ${targetLanguage} ${tone}`.trim()
        },
        {
          role: 'user',
          content: String(input.prompt || input.text || '')
        }
      ]
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Groq request failed');
  }

  return {
    task,
    model: payload.model || input.model || config.groq.textModel,
    text: payload.choices?.[0]?.message?.content || ''
  };
}

export async function generateGroqImage(input = {}) {
  const key = requireGroqKey();
  const prompt = String(input.prompt || '').trim();
  if (!prompt) {
    throw new Error('Image prompt is required');
  }

  const response = await fetch(`${GROQ_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.model || config.groq.imageModel,
      prompt,
      n: 1
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Groq image generation failed');
  }

  return {
    model: input.model || config.groq.imageModel,
    url: payload.data?.[0]?.url || '',
    revisedPrompt: payload.data?.[0]?.revised_prompt || ''
  };
}
