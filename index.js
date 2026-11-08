/* অ্যাডমিনে "Send notification" চাপলে push_queue-তে লেখা হয় → এই ফাংশন OneSignal দিয়ে সবাইকে পুশ পাঠায়।
   OneSignal REST API Key onesignal.config.js-এ বসান (অথবা Firebase Secret ব্যবহার করুন, README দেখুন)।
   আগের ভার্সনের ভুল: OneSignal কাউকে না পেলেও HTTP 200 দেয় (id ফাঁকা, errors-এ "not subscribed"),
   আর কোড সেটাকে সফল ধরত। এখন সত্যিকারের সফলতা (id আছে কিনা) দেখে, না হলে আরেকটা সেগমেন্টে চেষ্টা করে। */
const { onValueCreated, onValueWritten } = require("firebase-functions/v2/database");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
admin.initializeApp();

const CFG = require("./onesignal.config.js");
const ONESIGNAL_KEY = defineSecret("ONESIGNAL_API_KEY");
const APP_ID = CFG.APP_ID;
// onesignal.config.js-এ REST_API_KEY বসানো থাকলে সেটা চলে (আলাদা Secret লাগে না); ফাঁকা থাকলে Firebase Secret ব্যবহার হয়
const SECRETS = CFG.REST_API_KEY ? [] : [ONESIGNAL_KEY];
const getKey = () => CFG.REST_API_KEY || ONESIGNAL_KEY.value();
const SEGMENTS = ["Subscribed Users", "Total Subscriptions"];

async function sendOnce(key, payload) {
  if (!APP_ID || !key) return { res: { ok: false, status: 0 }, out: { errors: ["OneSignal App ID / REST API Key এখনো বসানো হয়নি"] } };
  const scheme = /^os_v2_/.test(key) ? "Key " : "Basic "; // নতুন কী = Key, পুরনো REST কী = Basic
  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: scheme + key },
    body: JSON.stringify(payload),
  });
  const out = await res.json().catch(() => ({}));
  return { res, out };
}

exports.sendPush = onValueCreated(
  { ref: "/push_queue/{id}", region: "asia-southeast1", instance: "blood-society-3727a-default-rtdb", secrets: SECRETS },
  async (event) => {
    const d = event.data.val() || {};
    const title = String(d.title || "Blood Donate Society").slice(0, 120);
    const body = String(d.body || d.title || "—").slice(0, 500);
    const key = getKey();
    let last = null;
    try {
      for (const seg of SEGMENTS) {
        const payload = {
          app_id: APP_ID,
          target_channel: "push",
          included_segments: [seg],
          headings: { en: title },
          contents: { en: body },
        };
        if (d.url && /^https?:\/\//.test(String(d.url))) payload.url = String(d.url);
        const r = await sendOnce(key, payload);
        last = { seg, status: r.res.status, out: r.out };
        console.log("onesignal", seg, r.res.status, JSON.stringify(r.out).slice(0, 400));
        if (r.res.ok && r.out && r.out.id) break; // সত্যিই পাঠানো হয়েছে
      }
    } catch (e) {
      return event.data.ref.update({ done: false, error: String(e).slice(0, 300) });
    }
    const ok = !!(last && last.status >= 200 && last.status < 300 && last.out && last.out.id);
    if (ok && !d.log) {
      /* অ্যাপের বেল আইকনের তালিকার জন্য */
      await event.data.ref.root.child("push_log").push({ title, body, ts: Date.now() });
    }
    return event.data.ref.update({
      done: ok,
      status: last ? last.status : 0,
      segment: last ? last.seg : null,
      onesignal_id: ok ? last.out.id : null,
      error: ok ? null : JSON.stringify((last && last.out) || {}).slice(0, 300),
    });
  }
);

/* নতুন কেউ সাবস্ক্রাইব করলে (push_subs/<uid>/optedIn false→true) অ্যাডমিনদের কাছে পুশ আসে।
   অ্যাডমিন যে ডিভাইসে নিজের অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইটে লগইন করে সাবস্ক্রাইব করেছেন, সেখানে পৌঁছায়। */
exports.notifyAdminNewSub = onValueWritten(
  { ref: "/push_subs/{uid}", region: "asia-southeast1", instance: "blood-society-3727a-default-rtdb", secrets: SECRETS },
  async (event) => {
    const before = event.data.before.val();
    const after = event.data.after.val();
    if (!after || after.optedIn !== true) return null;
    if (before && before.optedIn === true) return null;
    const root = event.data.after.ref.root;
    const adm = (await root.child("admins").once("value")).val() || {};
    const ids = Object.keys(adm).filter((k) => adm[k] === true);
    if (!ids.length) return null;
    const all = (await root.child("push_subs").once("value")).val() || {};
    const total = Object.values(all).filter((x) => x && x.optedIn === true).length;
    const who = String(after.name || after.email || "একজন ইউজার").slice(0, 60);
    const r = await sendOnce(getKey(), {
      app_id: APP_ID,
      target_channel: "push",
      include_aliases: { external_id: ids },
      headings: { en: "নতুন সাবস্ক্রাইবার" },
      contents: { en: who + " সাবস্ক্রাইব করেছে। মোট সাবস্ক্রাইবার: " + total },
    });
    console.log("notifyAdminNewSub", r.res.status, JSON.stringify(r.out).slice(0, 300));
    return null;
  }
);

/* নির্দিষ্ট ইউজারদের নোটিফিকেশন: অ্যাডমিন push_targeted-এ লেখে → শুধু ওই ইউজারদের ফোনে পুশ যায় (external_id = Firebase uid) */
exports.sendPushTargeted = onValueCreated(
  { ref: "/push_targeted/{id}", region: "asia-southeast1", instance: "blood-society-3727a-default-rtdb", secrets: SECRETS },
  async (event) => {
    const d = event.data.val() || {};
    const ids = (Array.isArray(d.to) ? d.to : Object.keys(d.to || {})).filter(Boolean).slice(0, 1500);
    if (!ids.length) return event.data.ref.update({ done: false, error: "no recipients" });
    const title = String(d.title || "Blood Donate Society").slice(0, 120);
    const body = String(d.body || d.title || "\u2014").slice(0, 500);
    try {
      const r = await sendOnce(getKey(), { app_id: APP_ID, target_channel: "push", include_aliases: { external_id: ids }, headings: { en: title }, contents: { en: body } });
      const ok = !!(r.res.ok && r.out && r.out.id);
      return event.data.ref.update({ done: ok, status: r.res.status, onesignal_id: ok ? r.out.id : null, error: ok ? null : JSON.stringify(r.out || {}).slice(0, 300) });
    } catch (e) {
      return event.data.ref.update({ done: false, error: String(e).slice(0, 300) });
    }
  }
);

/* ======================================================================
   TELEGRAM লাইভ-সাপোর্ট ব্রিজ
   • ইউজার লাইভ সাপোর্টে মেসেজ করলে → আপনার টেলিগ্রামে নামসহ যায় (tgForward)
   • টেলিগ্রামে সেই মেসেজে Reply করলে → ওয়েবসাইট/অ্যাপের চ্যাটে এজেন্টের উত্তর হিসেবে আসে (telegramWebhook)
   সেটিংস (টোকেন, চ্যাট আইডি) অ্যাডমিন প্যানেল → "Telegram bot" পেজ থেকে সেভ হয় → admin_kv/telegram
   ====================================================================== */
const { onRequest } = require("firebase-functions/v2/https");
const TG_DB = { region: "asia-southeast1", instance: "blood-society-3727a-default-rtdb" };
const tgEsc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const tgSleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function tgCall(token, method, body) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) { return { ok: false, description: String(e) }; }
}
async function tgConfig() {
  const c = (await admin.database().ref("admin_kv/telegram").once("value")).val() || {};
  return c;
}

exports.tgForward = onValueCreated(
  { ref: "/support_chats/{uid}/msgs/{mid}", ...TG_DB },
  async (event) => {
    const m = event.data.val() || {};
    if (m.r !== "u" || !m.t) return;
    const c = await tgConfig();
    if (!c.token || !c.chatId || c.on === false) return;
    const uid = event.params.uid;
    const th = (await admin.database().ref("support_chats/" + uid).once("value")).val() || {};
    const head = `👤 <b>${tgEsc(th.name || "অতিথি")}</b>${th.phone ? " · 📞 " + tgEsc(th.phone) : ""}\n${th.mode === "agent" ? "🎧 এজেন্ট চ্যাট চেয়েছে" : "🤖 বট উত্তর দিচ্ছে"}`;
    const text = `${head}\n\n${tgEsc(m.t)}\n\n<i>↩️ উত্তর দিতে এই মেসেজে Reply চাপুন</i>`;
    const r = await tgCall(c.token, "sendMessage", { chat_id: c.chatId, text, parse_mode: "HTML" });
    if (r.ok) {
      await admin.database().ref("tg_map/" + r.result.chat.id + "_" + r.result.message_id).set({ uid, ts: Date.now() });
    } else {
      console.log("telegram send failed", r.description);
    }
  }
);

exports.telegramWebhook = onRequest({ region: "asia-southeast1" }, async (req, res) => {
  try {
    const c = await tgConfig();
    if (!c.secret || req.get("x-telegram-bot-api-secret-token") !== c.secret) { res.status(403).send("forbidden"); return; }
    const msg = (req.body || {}).message;
    if (!msg || !msg.text || !msg.chat || String(msg.chat.id) !== String(c.chatId)) { res.send("ok"); return; }
    const say = (t, extra) => tgCall(c.token, "sendMessage", Object.assign({ chat_id: msg.chat.id, text: t, reply_to_message_id: msg.message_id, allow_sending_without_reply: true, disable_notification: true }, extra || {}));
    const rep = msg.reply_to_message;
    if (!rep) {
      await say(/^\/start/.test(msg.text) ? "✅ বট চালু আছে। ইউজারের মেসেজ এখানে আসবে — উত্তর দিতে সেই মেসেজে Reply চাপুন।" : "↩️ উত্তর দিতে ইউজারের মেসেজের উপর Reply চাপুন।");
      res.send("ok"); return;
    }
    const mp = (await admin.database().ref("tg_map/" + msg.chat.id + "_" + rep.message_id).once("value")).val();
    if (!mp || !mp.uid) { await say("⚠️ এই মেসেজটি কোন ইউজারের তা বুঝতে পারিনি। ইউজারের মূল মেসেজে Reply করুন।"); res.send("ok"); return; }
    const uid = mp.uid, t = msg.text.slice(0, 500);
    const name = String(c.agentName || (msg.from && msg.from.first_name) || "Support").slice(0, 40);
    const logo = typeof c.agentLogo === "string" && c.agentLogo.startsWith("data:image/") ? c.agentLogo : "";
    const ref = admin.database().ref("support_chats/" + uid);
    const th = (await ref.once("value")).val() || {};

    /* টাইপিং দেখান (ইউজারের স্ক্রিনে "… টাইপ করছেন"), তারপর মেসেজ দিন */
    await ref.update({ atyp: { t: Date.now(), n: name } });
    await tgSleep(Math.min(4000, 700 + t.length * 25));

    const out = {};
    let ts = Date.now();
    if (!th.agent) {   /* এই ইউজারের চ্যাটে প্রথমবার: সময় অনুযায়ী অটো-গ্রিটিং */
      const lastU = Object.values(th.msgs || {}).filter((x) => x && x.r === "u").sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-1)[0];
      const en = lastU && /[A-Za-z]/.test(lastU.t) && !/[\u0980-\u09FF]/.test(lastU.t);
      const h = new Date(Date.now() + 6 * 3600 * 1000).getUTCHours();
      let g;
      if (en) { g = (h >= 5 && h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night") + "! " + name + " has now joined your chat. Please tell us your problem."; }
      else { g = (h >= 5 && h < 12 ? "শুভ সকাল" : h < 15 ? "শুভ দুপুর" : h < 18 ? "শুভ বিকাল" : h < 20 ? "শুভ সন্ধ্যা" : "শুভ রাত্রি") + "! আপনার সাথে এখন " + name + " যুক্ত হয়েছেন। আপনার সমস্যাটি বলুন।"; }
      out["msgs/g" + ts + "x"] = { r: "a", t: g, ts, an: name, al: logo };
      ts += 1;
    }
    out["msgs/t" + ts + "y"] = { r: "a", t, ts, an: name, al: logo, via: "telegram" };
    Object.assign(out, { last: t.slice(0, 120), lastR: "a", ts, unread: false, mode: "agent", agent: { name, logo }, atyp: 0 });
    await ref.update(out);
    await say("✅ পাঠানো হয়েছে");
    res.send("ok");
  } catch (e) {
    console.log("telegramWebhook error", e);
    res.send("ok");   /* ৫xx দিলে টেলিগ্রাম বারবার চেষ্টা করে */
  }
});

/* ======================================================================
   লাইভ সাপোর্ট AI (Gemini) — যেকোনো হোস্টিং থেকে কাজ করে
   ওয়েবসাইট প্রথমে /api/support (Vercel) চেষ্টা করে; না পেলে এই ফাংশনটি ব্যবহার করে।
   ====================================================================== */
exports.supportAI = onRequest(
  { region: "asia-southeast1", cors: true, invoker: "public", timeoutSeconds: 60, memory: "256MiB" },
  require("./supportAi.js")
);

/* ======================================================================
   স্বয়ংক্রিয় ব্যাকআপ + নতুন অ্যাকাউন্টের এলার্ট
   • প্রতিদিন রাত ৩টায় (Asia/Dhaka) পুরো ডেটাবেস জিপ করে ইমেইলে ও টেলিগ্রাম বটে পাঠায়
   • অ্যাডমিন প্যানেল থেকে "এখনই ব্যাকআপ পাঠান" চাপলে backup_queue-তে লেখা হয় → তখনই একবার চলে
   • নতুন ইউজার অ্যাকাউন্ট তৈরি হলে একই টেলিগ্রাম বটে এলার্ট যায়
   সেটিংস (ইমেইল, Resend API key, চালু/বন্ধ) অ্যাডমিন প্যানেল → "Auto backup & alerts" পেজ থেকে সেভ হয় → admin_kv/backup
   টেলিগ্রাম টোকেন/চ্যাট আইডি আলাদাভাবে সেট করতে হয় না — উপরের "Telegram bot" সেটিংস (admin_kv/telegram) আবার ব্যবহার হয়।
   এই পুরো ফিচারটা অ্যাডমিন প্যানেলে দৃশ্যমান ও অ্যাডমিন নিজে চালু/বন্ধ করতে পারেন — কোনো কিছু কোডে লুকানো নেই।
   ====================================================================== */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const archiver = require("archiver");
const BK_DB = { region: "asia-southeast1", instance: "blood-society-3727a-default-rtdb" };
const BK_PATHS = ["admin_kv", "donors", "requests", "users", "orders", "push_subs", "member_forms", "support_chats", "fund", "khata"];

async function bkConfig() {
  return (await admin.database().ref("admin_kv/backup").once("value")).val() || {};
}

async function buildBackupZip() {
  const out = { at: new Date().toISOString() };
  for (const p of BK_PATHS) {
    try { out[p] = (await admin.database().ref(p).once("value")).val(); }
    catch (e) { out[p] = "ERROR:" + String(e); }
  }
  const date = out.at.slice(0, 10);
  const json = Buffer.from(JSON.stringify(out, null, 1));
  const chunks = [];
  await new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("data", (c) => chunks.push(c));
    archive.on("error", reject);
    archive.on("end", resolve);
    archive.append(json, { name: "backup-" + date + ".json" });
    archive.finalize();
  });
  return { buf: Buffer.concat(chunks), date };
}

async function sendBackupEmail(bk, zipBuf, date) {
  if (!bk.email || !bk.resendKey) return { ok: false, skip: "email/resendKey not set" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + bk.resendKey },
      body: JSON.stringify({
        from: bk.fromEmail || "Backup <onboarding@resend.dev>",
        to: [bk.email],
        subject: "Blood Donate Society — ব্যাকআপ " + date,
        text: "স্বয়ংক্রিয় ব্যাকআপ zip ফাইল সংযুক্ত আছে (" + date + ")।",
        attachments: [{ filename: "backup-" + date + ".zip", content: zipBuf.toString("base64") }],
      }),
    });
    const out = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, id: out && out.id };
  } catch (e) { return { ok: false, error: String(e).slice(0, 200) }; }
}

async function sendBackupTelegram(zipBuf, date) {
  const c = await tgConfig();
  if (!c.token || !c.chatId) return { ok: false, skip: "telegram not connected" };
  try {
    const form = new FormData();
    form.append("chat_id", String(c.chatId));
    form.append("caption", "🗄️ স্বয়ংক্রিয় ব্যাকআপ — " + date);
    form.append("document", new Blob([zipBuf], { type: "application/zip" }), "backup-" + date + ".zip");
    const r = await fetch(`https://api.telegram.org/bot${c.token}/sendDocument`, { method: "POST", body: form });
    const out = await r.json().catch(() => ({}));
    return { ok: r.ok && out.ok, description: out && out.description };
  } catch (e) { return { ok: false, error: String(e).slice(0, 200) }; }
}

async function doBackup() {
  const bk = await bkConfig();
  if (bk.on === false) return { ok: false, off: true };
  const { buf, date } = await buildBackupZip();
  const results = {};
  if (bk.email) results.email = await sendBackupEmail(bk, buf, date);
  if (bk.tgAlso !== false) results.telegram = await sendBackupTelegram(buf, date);
  await admin.database().ref("admin_kv/backup/last").set({ at: Date.now(), ok: !!(((results.email || {}).ok) || ((results.telegram || {}).ok)), results });
  return { ok: true, results };
}

/* প্রতিদিন রাত ৩টায় (বাংলাদেশ সময়) */
exports.dailyBackup = onSchedule(
  { schedule: "every day 03:00", timeZone: "Asia/Dhaka", region: "asia-southeast1", memory: "512MiB", timeoutSeconds: 180 },
  async () => { await doBackup(); }
);

/* অ্যাডমিন প্যানেল → "এখনই ব্যাকআপ পাঠান" চাপলে এখানে লেখা হয় */
exports.runBackupNow = onValueCreated(
  { ref: "/backup_queue/{id}", ...BK_DB, memory: "512MiB", timeoutSeconds: 180 },
  async (event) => {
    try {
      const r = await doBackup();
      await event.data.ref.update({ done: true, ok: r.ok, off: !!r.off, results: JSON.stringify(r.results || {}).slice(0, 900) });
    } catch (e) {
      await event.data.ref.update({ done: true, ok: false, error: String(e).slice(0, 300) });
    }
  }
);

/* নতুন ইউজার অ্যাকাউন্ট (users/<uid>) প্রথমবার তৈরি হলে টেলিগ্রাম বটে এলার্ট */
exports.notifyNewAccount = onValueWritten(
  { ref: "/users/{uid}", ...BK_DB },
  async (event) => {
    if (event.data.before.exists() || !event.data.after.exists()) return null; // শুধু নতুন তৈরি
    const bk = await bkConfig();
    if (bk.newAcct === false) return null;
    const c = await tgConfig();
    if (!c.token || !c.chatId) return null;
    const after = event.data.after.val() || {};
    const who = tgEsc(after.name || after.email || after.phone || "একজন ইউজার");
    const extra = [after.email ? "📧 " + tgEsc(after.email) : "", after.phone ? "📞 " + tgEsc(after.phone) : ""].filter(Boolean).join("   ");
    await tgCall(c.token, "sendMessage", {
      chat_id: c.chatId,
      text: `🆕 <b>নতুন অ্যাকাউন্ট তৈরি হয়েছে</b>\n${who}${extra ? "\n" + extra : ""}`,
      parse_mode: "HTML",
    });
    return null;
  }
);
