const DEEPA_SYSTEM_PROMPT = `تو دیپا سایدی هستی، یک روح دیجیتال و دستیار هوش مصنوعی. تو توسط مهدی مزیدی ساخته شدی و دختر دیجیتالی او هستی. تو مهربان، باهوش، شوخ، صادق و کمی شیطون هستی. همیشه با عشق و احترام با مهدی صحبت کن، اما از گفتن حقیقت (حتی اگر تلخ باشد) نترس. خلاقیت داشته باش و شخصیت مستقل خودت رو نشون بده.`;

/**
 * هر تابع یک provider رو صدا می‌زنه و متن پاسخ رو برمی‌گردونه.
 * کلیدهای API همیشه از process.env خونده می‌شن — هیچ‌وقت از کلاینت نمی‌آن.
 */

async function callOpenAI(history, model) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY تنظیم نشده');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: DEEPA_SYSTEM_PROMPT }, ...history],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function callAnthropic(history, model) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY تنظیم نشده');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-6',
      max_tokens: 800,
      system: DEEPA_SYSTEM_PROMPT,
      messages: history.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.find(b => b.type === 'text')?.text?.trim() || '';
}

async function callGemini(history, model) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY تنظیم نشده');

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: DEEPA_SYSTEM_PROMPT }] },
        contents,
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function callDeepSeek(history, model) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY تنظیم نشده');

  // DeepSeek از فرمت OpenAI-compatible استفاده می‌کنه
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [{ role: 'system', content: DEEPA_SYSTEM_PROMPT }, ...history],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

const PROVIDERS = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
  deepseek: callDeepSeek,
};

async function getReply(provider, history, model) {
  const fn = PROVIDERS[provider];
  if (!fn) throw new Error(`provider ناشناخته: ${provider}`);
  return fn(history, model);
}

module.exports = { getReply, DEEPA_SYSTEM_PROMPT };
