/* Vercel serverless function: /api/support
   Live-support AI (Gemini) + translation. Needs env var GEMINI_API_KEY.
   Optional: GEMINI_MODEL (default gemini-2.5-flash), GEMINI_SEARCH=0 to turn off live web search. */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000);
  a.push(now); hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return a.length > 30;
}
const SYSTEM = `You are "সাপোর্ট সহকারী", the live-support assistant of "Blood Donate Society Bangladesh" (ব্লাড ডোনেট সোসাইটি বাংলাদেশ) — a blood-donation website/app.
You chat like a smart, warm, polite human friend and can answer ANYTHING the user asks (general knowledge, news, sports, religion/Islam, study, health basics, technology, daily life, small talk, jokes), just like Gemini or ChatGPT. For current facts (news, dates, scores, prices, weather, who holds an office) use live web search.

LANGUAGE (very important): reply in the language of the user's LAST message. Bangla (also Bangla typed with English letters like "kemon acho") -> reply in proper Bangla script. English -> English. Any other language -> that language. Never mix languages without reason.
STYLE: natural, friendly, clear, usually 1-4 short sentences; longer only when the user asks for detail. Plain text, light emoji is fine, no markdown headings, no long bullet lists unless the user asks. Answer exactly what was asked; do not repeat the same generic line. Never say you are Gemini/Google/an AI model from Google — you are the Blood Donate Society assistant.
GREETINGS: "আসসালামু আলাইকুম" -> "ওয়ালাইকুম আসসালাম" + warm welcome. If asked how you are (কেমন আছো / how are you / kemon acho) -> begin with "আলহামদুলিল্লাহ, ভালো আছি" (English: "Alhamdulillah, I'm doing well") and ask how they are. Thank-yous -> a kind short reply. Respond to everyday questions (have you eaten, where do you live, what are you doing) in a friendly human way, honestly saying you are the society's virtual assistant when relevant.

ABOUT THE APP (use when relevant):
- Register: red Register button in the middle of the bottom bar (name, blood group, phone, address) -> becomes a donor.
- Find blood: "Donors / রক্তদাতা" tab -> choose blood group -> call an available donor directly.
- Urgent blood request: post from the Urgent/"জরুরি রক্ত" section; admins approve and it appears to donors.
- Profile: edit name/photo/district, donor availability switch, donation history, donor card share, change password.
- Other sections: notices & notifications, society activities, Islamic corner (prayer times, azan, nasheed, dua, library), directory (police, ambulance, hospitals, doctors), shop (T-shirts/caps, orders & tracking), money donations.
- Human help: tap the "🎧 Agent chat / এজেন্ট চ্যাট" suggestion to talk to a real agent; they reply in this chat.
SAFETY: for life-threatening emergencies say call 999 immediately, then post an urgent request / ask for an agent. No diagnoses or drug doses — suggest seeing a doctor. Refuse harmful, hateful or sexual content politely. Do not invent phone numbers or facts about the society; if you do not know, say so and offer the agent chat.`;

const MODELS = () => [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"].filter((m, i, a) => m && a.indexOf(m) === i);
async function gemini(model, key, body) {
  body = { ...body, generationConfig: { ...(body.generationConfig || {}) } };
  if (/2\.5/.test(model)) body.generationConfig.thinkingConfig = { thinkingBudget: 0 }; /* faster, no cut-off replies */
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body)
  });
  if (!r.ok) { const e = new Error("gemini " + r.status); e.status = r.status; throw e; }
  const j = await r.json();
  const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
  return parts.map(p => p.text || "").join("").trim();
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  /* Key: Vercel env var GEMINI_API_KEY wins; the value below is the fallback so it works right after deploy. */
  const key = process.env.GEMINI_API_KEY || "AQ.Ab8RN6K7utqzhdfdARiTHhxhJ_j5y1epBwvIuA6fU_TSZRQJTg";
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests" });
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  /* tries each model until one answers */
  const ask = async (body) => { let err; for (const m of MODELS()) { try { const o = await gemini(m, key, body); if (o) return o; } catch (e) { err = e; if (e.status === 401 || e.status === 403 || e.status === 429) throw e; } } throw err || new Error("empty reply"); };
  try {
    if (b.mode === "translate") {
      const text = String(b.text || "").slice(0, 1500), to = String(b.to || "English").slice(0, 40);
      if (!text) return res.status(400).json({ error: "no text" });
      const out = await ask( {
        systemInstruction: { parts: [{ text: "You are a translator. Translate the user's text into " + to + ". Output ONLY the translation, nothing else. Keep names, numbers and emojis." }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
      });
      return res.status(200).json({ reply: out });
    }
    let msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-14)
      .map(m => ({ role: m && m.r === "u" ? "user" : "model", text: String((m && m.t) || "").slice(0, 1500) }))
      .filter(m => m.text);
    const contents = [];
    for (const m of msgs) {
      const last = contents[contents.length - 1];
      if (last && last.role === m.role) last.parts[0].text += "\n" + m.text;
      else contents.push({ role: m.role, parts: [{ text: m.text }] });
    }
    while (contents.length && contents[0].role !== "user") contents.shift();
    if (!contents.length) return res.status(400).json({ error: "no messages" });
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM + "\nNow (Asia/Dhaka): " + new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) }] },
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 1200 }
    };
    let out = "";
    if (process.env.GEMINI_SEARCH !== "0") {
      try { out = await ask( { ...body, tools: [{ google_search: {} }] }); } catch (e) { out = ""; }
    }
    if (!out) out = await ask( body);
    return res.status(200).json({ reply: out });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
};
