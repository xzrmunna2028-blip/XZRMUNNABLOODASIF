# ব্লাড ডোনেট সোসাইটি বাংলাদেশ — সম্পূর্ণ প্যাকেজ

`index.html` (ওয়েবসাইট) ও `admin.html` (অ্যাডমিন) দুটোই জিপের ভেতরে আছে, অর্ডার/শপ সিস্টেমসহ।

`admin.html` এখন জিপের ভেতরেই আছে (ঢুকতে Firebase অ্যাডমিন লগইন লাগে)। চাইলে ওটা আলাদা গোপন জায়গায় হোস্ট করুন।

## ফোল্ডার
| কী | কোথায় |
|---|---|
| ওয়েবসাইট (হোস্টে যা যাবে) | `index.html`, `package.json`, `OneSignalSDKWorker.js`, `push/`, `.nojekyll`, `vercel.json`, `_headers` |
| Android অ্যাপের Kotlin কোড + গাইড | `_setup/android/` |
| Firebase রুলস (Realtime Database ও Firestore) | `_setup/firebase/` |
| অ্যাডমিন থেকে পুশ পাঠানোর ফাংশন | `_setup/functions/` |

`_setup` ফোল্ডারটা সাইটে আপলোড না করলেও চলবে, ওটা শুধু সেটআপের জন্য।

## ১) হোস্ট করা (GitHub Pages / Vercel / Netlify / নিজের .com)
`package.json`-এ আর `engines.node` নেই (স্ট্যাটিক সাইটে Node লাগে না), তাই Node ভার্সনের কারণে ডিপ্লয় ফেল হবে না।
1. `index.html`, `OneSignalSDKWorker.js`, `push` ফোল্ডার, `.nojekyll` (আর Vercel/Netlify হলে `vercel.json`/`_headers`) আপলোড করুন।
2. সাইট https-এ খুলুন। `file://` এ গুগল/ফোন লগইন ও পুশ চলবে না।
3. Firebase → Authentication → Settings → **Authorized domains**-এ আপনার ডোমেইন যোগ করুন।
4. OneSignal ড্যাশবোর্ড → Settings → Push & In-App → **Web** → Site URL-এ ওই একই ডোমেইন দিন।

## ২) Firebase সেটআপ (একবার)
1. Authentication → Sign-in method: Email/Password, Google, Phone চালু। SMS region policy-তে Bangladesh।
2. Authentication → Users → Add user: অ্যাডমিনের ইমেইল ও পাসওয়ার্ড দিন। UID কপি করুন।
3. Realtime Database → Data: `admins` → `<UID>` = `true`।
4. রুলস: Realtime Database → Rules-এ `_setup/firebase/database.rules.json` পেস্ট করে Publish। Firestore → Rules-এ `_setup/firebase/firestore.rules`।
   অথবা CLI দিয়ে: `firebase deploy --only database,firestore:rules`।
5. আসল নাম্বারে OTP পাঠাতে Blaze প্ল্যান (বিলিং) লাগতে পারে।

## ৩) পুশ নোটিফিকেশন
- সাইটে বা অ্যাপে ঢুকলেই ব্রাউজার/সিস্টেমের "Allow" বক্স আসে। Allow দিলে নিজে থেকে সাবস্ক্রাইব হয়। iPhone-এ সাইটটা "Add to Home Screen" করা থাকতে হবে, আর প্রথম ট্যাপে বক্স আসে।
- OneSignal → Settings → Push & In-App → **Google Android (FCM)**-এ Firebase-এর service account JSON আপলোড করুন (Firebase → Project settings → Service accounts → Generate new private key)।
- অ্যাডমিন থেকে পাঠাতে (Blaze প্ল্যান লাগবে):
```
npm i -g firebase-tools
firebase login
cd _setup/functions && npm install && cd ../..
firebase functions:secrets:set ONESIGNAL_API_KEY
firebase deploy --only functions
```
REST API Key কখনো HTML-এ বা GitHub-এ রাখবেন না। Blaze না নিলে OneSignal ড্যাশবোর্ড → Messages → New Push থেকে হাতে পাঠানো যায়।

### Web-to-APK
| অ্যাপের ধরন | ওয়েব OneSignal কোড | পুশ কীভাবে চলবে |
|---|---|---|
| Median.co (GoNative) | বন্ধ, কোড Median-এর `median.onesignal.login`-এ ইউজার যুক্ত করে | Median-এর OneSignal সেটিংসে App ID বসান |
| অন্য সাধারণ Web-to-APK (WebView) | বন্ধ থাকে | কনভার্টারে OneSignal App ID-এর ঘর থাকলে `<ক্লায়েন্টের OneSignal App ID>` বসান। ঘর না থাকলে পুশ সম্ভব নয় |
| PWABuilder / Bubblewrap (TWA) | চলে | আলাদা কিছু লাগে না, তবে PWA manifest লাগবে |
| Android Studio-র নেটিভ অ্যাপ | বন্ধ, নেটিভ চলে | `_setup/android/` |

সাধারণ WebView-তে গুগল লগইন আটকে যায় (গুগল এমবেডেড ব্রাউজারে OAuth দেয় না), ফোন OTP-র রিক্যাপচাও ভরসাযোগ্য নয়।

## ৪) একবার আপডেট, ওয়েব ও অ্যাপ দুই জায়গায়
অ্যাপ (WebView/TWA) হোস্ট করা https লিংক খুললে, ফাইল বদলালে দুই জায়গাতেই বদলে যায়। `vercel.json` ও `_headers` ক্যাশ বন্ধ রাখে। `index.html` অ্যাপের ভেতরে ভরে দেবেন না।

## ৫) পুশ পাঠানোর সঠিক নিয়ম (এটা না মানলে "No recipients" আসে)
মেসেজের পাশে "No recipients" মানে বাছা অডিয়েন্সে কেউ নেই। কোড বা ডিভাইসের দোষ নয়।
1. **আগে দেখুন সাবস্ক্রাইবার আছে কিনা:** OneSignal → বাঁ মেনু **Audience → Users & subscriptions**। কমপক্ষে একটা সারিতে স্ট্যাটাস **Subscribed** থাকতে হবে। খালি থাকলে সাইটে/অ্যাপে গিয়ে আবার Allow দিন (F12 → Console-এ `[push] subscription id` দেখাবে)।
2. **পাঠানোর সময়:** Messages → New Push → Audience-এ **Subscribed Users** বাছুন (কাস্টম সেগমেন্ট বা Test Users নয়)। প্রিভিউয়ে recipient সংখ্যা ১ বা বেশি দেখাচ্ছে কিনা দেখে তারপর Send।
3. **পাঠানোর পর:** মেসেজ খুলে Sent ও Delivered দেখুন।
4. **দ্রুত টেস্ট:** Users & subscriptions-এ আপনার সাবস্ক্রিপশনে ক্লিক করে **Add to Test Subscriptions** দিন, তারপর মেসেজ পাঠানোর সময় Audience-এ Test Subscriptions বাছুন।
5. **Android অ্যাপে:** OneSignal → Settings → Push & In-App → **Google Android (FCM)**-এ Firebase service account JSON আপলোড করা না থাকলে অ্যাপের কোনো সাবস্ক্রিপশন তৈরিই হয় না।
6. Windows Chrome-এ ডেলিভারি না এলে: Windows Notifications-এ Chrome চালু, Focus assist বন্ধ, আর Chrome Settings → System → "Continue running background apps when Chrome is closed" চালু।
7. APK (WebView কনভার্টার) এর ভেতরে ওয়েব পুশ আসে না, কনভার্টারের নিজের OneSignal ঘরে App ID বসাতে হয়।

## ৬) নতুন: বেল আইকন, রিয়েল টাইম সাবস্ক্রাইবার কাউন্ট (এই আপডেটে যা বদলেছে)
- হোমের উপরে **বেল আইকন** আছে। চাপলে অনুমতি না থাকলে ব্রাউজারের Allow বক্স আসে, Allow দিলে নিজে থেকে সাবস্ক্রাইব হয়। বেলের ভেতরে পাঠানো নোটিশের তালিকা (রিয়েল টাইম) দেখা যায়, নতুন নোটিশে লাল সংখ্যা আসে।
- প্রতিটি লগইন করা ইউজার OneSignal-এ `external id = Firebase uid` দিয়ে যুক্ত হয়, আর তার সাবস্ক্রিপশন অবস্থা Realtime Database-এর `push_subs/<uid>`-এ নিজে থেকে লেখা হয় (`oid`, `optedIn`, `perm`, `email`, `name`, `ts`)।
- অ্যাডমিনে কাউন্ট দেখাতে `_setup/admin-snippet.js` দেখুন। মোট অ্যাকাউন্ট = `users`, সাবস্ক্রাইব করা = `push_subs`-এ `optedIn === true`।
- সীমা: যে ইউজার ব্রাউজারে Allow দেননি (বা Block করেছেন), তাকে কোনো সিস্টেমেই পুশ পাঠানো যায় না। তারা অ্যাকাউন্ট কাউন্টে থাকবে, সাবস্ক্রাইবার কাউন্টে না।
- ফাংশন এখন OneSignal-এর উত্তরে সত্যিকারের `id` আছে কিনা দেখে। আগে কেউ না পেলেও "সফল" ধরা হতো। `push_queue/<id>`-এ `done`, `status`, `segment`, `error` দেখলে বোঝা যায় কী হয়েছে।
- নাম/ছবি: গুগল বা ইমেইল দিয়ে ঢুকলে ছবি বসে না, অ্যাকাউন্টের নামের প্রথম ৫ অক্ষর ও প্রথম অক্ষরের গোল আইকন দেখায়। আগের অ্যাকাউন্টের নাম/ছবি এখন লগআউট ও নতুন লগইনে মুছে যায়।
- রুলস বদলেছে: `database.rules.json`-এ `push_subs` ও `push_log` যোগ হয়েছে। নতুন রুলস Publish করতে ভুলবেন না। Firestore ব্যবহার হয় না, তাই `firestore.rules` সব বন্ধই আছে।

## ৭) নতুন: স্বয়ংক্রিয় ব্যাকআপ ও নতুন অ্যাকাউন্ট এলার্ট (অ্যাডমিন → "Auto backup & alerts")

- প্রতি রাতে (বাংলাদেশ সময় ৩টায়) পুরো ডেটাবেস (ডোনার, রিকোয়েস্ট, ইউজার, অর্ডার, চ্যাট, ফান্ড, খাতা ইত্যাদি) একটা zip ফাইলে পাঠানো হয় — অ্যাডমিন যে ইমেইল ও/অথবা যে Telegram বট কানেক্ট করেছেন সেখানে। ডোমেইন/হোস্টিং নষ্ট হলেও ডেটা হাতে থাকে।
- কেউ নতুন অ্যাকাউন্ট খুললে একই Telegram বটে সাথে সাথে জানানো হয়।
- **এটা সম্পূর্ণ অ্যাডমিন প্যানেল থেকে নিয়ন্ত্রিত ও দৃশ্যমান** — ইমেইল ঠিকানা, API key, চালু/বন্ধ সবকিছু Admin → System → **Auto backup & alerts** পেজে। কোথাও কোডে হার্ডকোড বা লুকানো নেই; যে অ্যাডমিন লগইন করতে পারে সে এটা দেখতে, বদলাতে বা বন্ধ করতে পারে।
- সেটআপ:
  1. ইমেইল ব্যাকআপ চাইলে [resend.com](https://resend.com)-এ একটা ফ্রি অ্যাকাউন্ট খুলে API Keys থেকে একটা কী বানান, অ্যাডমিন প্যানেলে পেস্ট করুন।
  2. Telegram ব্যাকআপ/এলার্ট চাইলে আগে Admin → People → **Telegram bot** পেজ থেকে বট কানেক্ট করুন (উপরে ধাপ অনুযায়ী); "Auto backup & alerts" পেজ সেই একই বট ব্যবহার করে।
  3. Cloud Functions ডিপ্লয় করুন (ধাপ ৩ দেখুন) — `dailyBackup`, `runBackupNow`, `notifyNewAccount` ফাংশনসহ।
  4. অ্যাডমিন প্যানেলে "Send backup now" চেপে টেস্ট করুন।

## ৮) সাবস্ক্রাইব কাউন্ট না হলে ক্রমানুসারে দেখুন (Vercel + GitHub)
1. Vercel → Deployments: সর্বশেষ কমিটের পাশে **Ready** আছে কিনা। Error থাকলে নতুন ফাইল লাইভ হয়নি। `package.json`-এর `engines.node` Vercel না মানলে `>=22` লিখুন।
2. সাইটে বেলে চাপুন → "পরীক্ষা তথ্য" খুলুন: `site`, `permission`, `subscription id`, `error`, `service workers` দেখাবে। `site`-এর ঠিকানা OneSignal → Settings → Web-এর Site URL-এর সাথে হুবহু মিলতে হবে (https সহ, শেষে / ছাড়া, www থাকলে www সহ)।
3. `subscription id` ফাঁকা থাকলে সাবস্ক্রিপশন তৈরিই হয়নি। তখন OneSignal-এ কাউন্ট হবে না।
4. OneSignal → Audience → Users & subscriptions-এ সেই ID খুঁজুন।
5. OneSignal-এর কোনো **Public Key/VAPID কী** কোডে বসাতে হয় না। OneSignal নিজে সামলায়। শুধু App ID পেজে থাকে (এটা গোপন নয়)। REST API Key কখনো পেজে বা GitHub-এ দেবেন না, ওটা Firebase Secret-এ থাকে।
6. ফোনের সিস্টেম নোটিফিকেশন বন্ধ থাকলে ওয়েবসাইট সেটিংস নিজে খুলতে পারে না। ব্রাউজার বা ফোনের Settings → Notifications থেকে চালু করতে হয়।

## ৮) নতুন (v2): অ্যাডমিন → সাইট/অ্যাপ লাইভ সিঙ্ক
- অ্যাডমিনে Save চাপলেই Firebase Realtime Database-এ `admin_kv/...`-এ যায়, সাইট/অ্যাপ `onValue` দিয়ে সাথে সাথে বদলায় (রিলোড লাগে না)।
- **এটা কাজ করার শর্ত:** `_setup/firebase/database.rules.json` Firebase-এ Publish করা, আর `admins/<আপনার UID> = true`। না হলে অ্যাডমিনে "Cloud save failed" দেখাবে।
- **স্লাইডার ব্যানার:** অ্যাডমিনে প্রতিটি স্লাইডে `Link` ঘরে `#register`, `#donors`, `#ambulance`, `#doctor`, `#hospital`, `#police`, `#islamic`, বা পুরো `https://…`/`tel:…` দিন। ছবির স্লাইডেও এখন ট্যাপে লিংক খোলে।
- **নামাজের সময়:** অ্যাডমিন → নামাজের সময়-এ শহর, অক্ষাংশ/দ্রাঘিমাংশ ও প্রতি ওয়াক্তে ± মিনিট দিন; হোম পেজের কার্ড ও নামাজ পেজ দুটোই বদলায়।
- **আজান:** অ্যাডমিন → আজান ও ঘোষণা। ওয়াক্ত হলে সাইট/অ্যাপ **খোলা থাকলে** আজান বাজে ও "এখন … নামাজের সময়" দেখায়/বলে। ব্রাউজার বন্ধ থাকলে ওয়েবসাইট আজান বাজাতে পারে না (ব্রাউজারের নিয়ম)। নিজের `.mp3` লিংক দেওয়াই ভালো।
- **নাশিদ/গজল:** অ্যাডমিন → নাশিদ/গজল-এ ইউটিউব লিংক দিলে ইউজার প্যানেলে ইউটিউব প্লেয়ারসহ লিরিক্স স্ক্রিন খোলে। লিরিক্স ঘরে প্রতি লাইনে `00:12 | আরবি | বাংলা অর্থ` লিখুন; বাংলা ফাঁকা থাকলে সাইট আরবি থেকে অনুবাদ করে (মেশিন অনুবাদ, ভুল হতে পারে)। ইউটিউবের অডিও থেকে নিজে নিজে আরবি লেখা তৈরি করা ব্রাউজার থেকে সম্ভব নয়।

## ৯) v3: ইসলামিক কর্নার ও লগইন
- মসজিদের ব্যানারে তারা, মেঘ, পাখি, জ্বলজ্বলে আলো ও চাঁদের অ্যানিমেশন আছে। আজানের সময় ব্যানারের ভেতরে "আজান হচ্ছে — এখন … নামাজের সময়" লেখা ওঠে। আসল ভিডিও চাইলে অ্যাডমিন → আজান ও ঘোষণা → "ইসলামিক কর্নারের ব্যাকগ্রাউন্ড ভিডিও লিংক"-এ `.mp4` লিংক দিন।
- কুরআন পেজে আয়াত ধরে প্লে করলে হলুদ ব্যানারে চলমান আয়াতের আরবি অ্যানিমেশনসহ ওঠে ও পড়ার সাথে শব্দ জ্বলে।
- অডিও না চললে এখন স্বয়ংক্রিয়ভাবে বিকল্প সার্ভারে চেষ্টা করে।
- লগইন পেজে ইনপুট ফোকাসে জুম/ধাক্কা ও ফাঁকা ব্যাকগ্রাউন্ড ঠিক করা হয়েছে।
- ব্লাড ডোনার কার্ড এখন জরুরি হটলাইনের পাশে অর্ধেক চওড়া বাটন।


## ৬) ডেমো ডেটা (অ্যাডমিন → System → Demo data)
- **Load all demo** চাপলে নোটিফিকেশন, রক্তদাতাগণ, পুলিশ, অ্যাম্বুলেন্স, হাসপাতাল, ডাক্তার, দোয়া, লাইব্রেরি, শপ পণ্য, জরুরি রিকোয়েস্ট, ডোনার, মেম্বার, শপ অর্ডার ও সাপোর্ট চ্যাটের ডেমো যোগ হয়।
- প্রতিটি সেকশনের আলাদা **Load / Delete demo** আছে, আর **Delete ALL demo** এক চাপে সব ডেমো মোছে। নিজের ডেটা মোছে না।
- জরুরি রিকোয়েস্ট, ডোনার, মেম্বার ও অর্ডারের ডেমোর জন্য Firebase অ্যাডমিন দিয়ে লগইন থাকতে হবে।
- নতুন `database.rules.json` আবার Publish করুন (শপ অর্ডার ও `admin_kv/shop` এর রুলস যোগ হয়েছে)।

## ৭) লগইন পেজ
লগইন পেজের স্টাইল এখন `<head>`-এ, তাই সাইট খোলার প্রথম মুহূর্ত থেকেই পুরো স্ক্রিন জুড়ে স্থির থাকে, জুম বা পাশের ফাঁকা দেখা যায় না।


## ৮) সাবস্ক্রাইব পপআপ ও শপ ডিজাইন
- সাইটে ঢুকে ওয়েলকাম বক্স বন্ধ করলে "ওয়েবসাইটের ইমার্জেন্সি সকল রক্তের আপডেট পেতে সাবস্ক্রাইব করুন" পপআপ আসে। **সাবস্ক্রাইব করুন** চাপলে ব্রাউজারের Allow বক্স আসে, Allow দিলে সাথে সাথে OneSignal-এ সাবস্ক্রাইব হয় ও `push_subs`-এ জমা হয়।
- অ্যাডমিন → ড্যাশবোর্ড ও নোটিফিকেশন পেজে **Push subscribers** সংখ্যা রিয়েল টাইমে দেখা যায়।
- বেল আইকনের নোটিশ তালিকা (অ্যাডমিন নোটিফিকেশন) আর এই সাবস্ক্রাইব আলাদা।
- হোম থেকে প্রোফাইল (M) বাটন, "See how to enable notifications" বার ও গুড আফটারনুন কার্ড সরানো হয়েছে।
- শপ, চেকআউট ও অর্ডার পেজে ব্যানার, আসল টি-শার্ট/ক্যাপের ছবি, bKash/Nagad লোগো ও নিচে ধন্যবাদ বার যোগ হয়েছে। অ্যাডমিনে System → Demo data থেকে শপের ডেমো আবার লোড বা মুছে ফেলা যায়।


## ৮) নতুন: নাশিদ প্লেয়ার ও অ্যাডমিন লিংক
- `index.html`-এর ভেতরেই কাস্টম প্লেয়ার আছে (ভিডিও/অডিও টগল, প্লেলিস্ট, অটো-প্লে, রিকানেকশন)। আলাদা ফাইল আপলোড লাগে না। `nashid-player.js` শুধু রেফারেন্স কপি।
- অ্যাডমিন → ইসলামিক কর্নার → নাশিদ/গজল-এ YouTube লিংক পেস্ট করুন, ওয়েব ও অ্যাপে সবাই দেখবে।
- `/admin` এখন Vercel-এ `admin.html` খোলে (`vercel.json`-এ rewrites ও cleanUrls)। Netlify-র জন্য `_redirects`।
- Android WebView-এ `mediaPlaybackRequiresUserGesture=false` দিন।


## ৯) অর্ডার ঠিকানা, কুরিয়ার, সিকিউরিটি
- চেকআউটে: বিভাগ → জেলা → থানা → সেই এলাকার কুরিয়ার (অটো) → পূর্ণ ঠিকানা। অ্যাডমিন → শপ → কুরিয়ার সার্ভিস থেকে কুরিয়ার ও কভারেজ (all/districts/thanas) বদলানো যায়। খালি থাকলে ডিফল্ট জাতীয় তালিকা চলে।
- Realtime Database Rules নতুন করে Publish করুন (`couriers` ও অর্ডার ভ্যালিডেশন যোগ হয়েছে)।
- `.vercelignore` দিয়ে `_setup`, README ইত্যাদি সাইটে যায় না। ব্রাউজারে HTML/JS দেখা আটকানো যায় না; আসল সুরক্ষা Firebase রুলস ও অ্যাডমিন লগইন।
- Google Cloud Console → APIs & Services → Credentials-এ Firebase API key-তে HTTP referrer (আপনার ডোমেইন) সীমা দিন।


## ১০) অর্ডার: নাম/ইমেইল, বাতিল, অ্যাডমিন কন্ট্রোল
- চেকআউটে প্রথম নাম, শেষ নাম, ইমেইল, ফোন, বিভাগ→জেলা→থানা→কুরিয়ার, পূর্ণ ঠিকানা।
- ইউজার "আমার অর্ডার"-এ পেমেন্ট প্রসেসিং/নিশ্চিত/অর্ডার প্রসেসিং অবস্থায় অর্ডার বাতিল করতে পারে; ইতিহাসে "বাতিল" দেখায়।
- অ্যাডমিন → শপ → অর্ডার: সার্চ, কাস্টমার প্রোফাইল/অর্ডার ফিল্টার, পেমেন্ট যাচাই, স্ট্যাটাস + কাস্টমারকে বার্তা।
- Realtime Database Rules আবার Publish করুন। Firestore ব্যবহার হয় না।


## ১১) কুরিয়ার পয়েন্ট
অ্যাডমিন → শপ → কুরিয়ার সার্ভিস-এ প্রতি ব্রাঞ্চের জন্য সার্ভিসের নাম, ডেলিভারি পয়েন্ট, জেলা ও থানা দিন। আপনি যোগ না করলে চেকআউটে কোনো কুরিয়ার দেখাবে না (ডিফল্ট তালিকা সরানো হয়েছে)।

## আপডেট (v12)
- **ইউটিউব প্লেয়ার**: লিংক দিলে শুধু ভিডিও দেখায় (ইউটিউবের টাইটেল, লোগো, শেয়ার, More videos ঢাকা)। অডিও মোডে ছবি + তরঙ্গ। `⌄` চাপলে মিনি প্লেয়ার হয়ে নিচে চলতে থাকে, বাকি সাইট ব্যবহার করা যায়।
- **চেকআউট**: নাম্বার ঠিক থাকা সত্ত্বেও "Enter a valid mobile number" আসার সমস্যা ঠিক; +880/880 ফরম্যাটও চলে।
- **নিচের বক্স**: হোয়াটসঅ্যাপ লোগো, সমস্যা হলে ট্রানজেকশন আইডি পাঠানোর নির্দেশ।
- **অ্যাডমিন → Shop → Orders**: "ট্রানজেকশন আইডি দিয়ে ট্র্যাক" বক্স; স্ট্যাটাস কার্ডের স্ক্রিনশট কাস্টমারকে পাঠানো যায়।
- **ডোনেশন অ্যানিমেশন**: পাখির বদলে হাত টাকা নিচ্ছে। আসল মানুষের হাতের ভিডিও চাইলে `donate-hand.mp4` নামে `index.html`-এর পাশে রাখুন, নিজে থেকেই সেটা চলবে।

## OneSignal কী কোথায়
Android: `_setup/android/OneSignalConfig.kt`। ওয়েব: `index.html`-এর `APP_ID`। সার্ভার: `_setup/functions/index.js`-এর `APP_ID`। তিন জায়গাতেই একই App ID `<ক্লায়েন্টের OneSignal App ID>`।
REST API Key (সিক্রেট) কোডে নেই, থাকবেও না: `firebase functions:secrets:set ONESIGNAL_API_KEY` দিয়ে বসান।

## OneSignal: সব ইনপুট এক জায়গায় (v14)
- সাইটে ঢুকলেই ব্রাউজারের "Get notifications? Allow" বক্স আসে, Allow দিলে নিজে থেকে সাবস্ক্রাইব হয় (বেল বাটনও আছে)।
- সার্ভার ফাংশনের সব OneSignal তথ্য `_setup/functions/onesignal.config.js`-এ: `APP_ID` বসানো আছে, `REST_API_KEY` ফাঁকা। কী পেলে শুধু ওখানে বসিয়ে `firebase deploy --only functions` দিন।
- অ্যাডমিন থেকে পুশ পাঠাতে এই ফাংশন ডিপ্লয় (Blaze প্ল্যান) লাগে; শুধু স্ট্যাটিক হোস্টিংয়ে আপলোড করলে সাইট ও সাবস্ক্রাইব চলবে, কিন্তু অ্যাডমিন থেকে পাঠানো চলবে না।

## Live support AI (real-time, Gemini)
The chat bot and the translate bar call `/api/support` (file `api/support.js`, Vercel serverless).
1. Get a Gemini API key (Google AI Studio).
2. Vercel -> Project -> Settings -> Environment Variables: add `GEMINI_API_KEY`. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash`), `GEMINI_SEARCH=0` to turn off live web search.
3. Redeploy. Without the key the bot falls back to built-in FAQ answers and translation falls back to a free service.

## Telegram bot for live support
Admin panel -> People -> "Telegram bot". Needs the Cloud Functions to be deployed once:
`firebase deploy --only functions` (adds `tgForward` and `telegramWebhook`).
Then paste the BotFather token + your Chat ID in the admin page and press "Save & connect".
Every user message arrives in Telegram with the user's name; tap Reply on it to answer the user.

## Hosting (works on any host)
- Website files (index.html, admin.html) are static: they work on Vercel, Netlify, Firebase Hosting, GitHub Pages, cPanel, etc.
- AI chat + translate: the site first tries `/api/support` (Vercel). If that does not exist (any other host, or the Android app), it automatically uses the Firebase function `supportAI`.
- One-time, from this folder: `firebase deploy --only functions` (deploys supportAI, Telegram bridge and push functions).
