# ক্লায়েন্টকে সাইট বিক্রি/হ্যান্ডওভারের সম্পূর্ণ গাইডলাইন

এই সাইটের **সব ডেটা ক্লায়েন্টের নিজের Firebase প্রজেক্টে** থাকবে। তাই নতুন ক্লায়েন্টের জন্য আলাদা Firebase, OneSignal ও হোস্টিং খুলতে হবে। আপনার (বিক্রেতার) অ্যাকাউন্টের কোনো কী ক্লায়েন্টকে দেবেন না।

---

## ক) ক্লায়েন্টের কাছ থেকে যা যা নিতে হবে (চেকলিস্ট)

| # | কী লাগবে | কোথায় বসবে |
|---|---|---|
| 1 | সংস্থার নাম (বাংলা + ইংরেজি), প্রতিষ্ঠাতা/ফাউন্ডারের নাম, লোগো (PNG, বর্গাকার) | অ্যাডমিন → Settings; ফাউন্ডারের নাম `index.html`-এ `Founder : ...` লেখা |
| 2 | ডোমেইন (যেমন `example.org`) বা হোস্টিং অ্যাকাউন্ট (Vercel / Netlify / GitHub Pages / Firebase Hosting) | হোস্টিং |
| 3 | Google অ্যাকাউন্ট দিয়ে খোলা **নিজস্ব Firebase প্রজেক্ট** | নিচে ধাপ ১ |
| 4 | অ্যাডমিনের ইমেইল ও পাসওয়ার্ড (সে নিজে বানাবে) | Firebase Authentication |
| 5 | **OneSignal** অ্যাকাউন্ট: App ID ও REST API Key | নিচে ধাপ ৫ |
| 6 | ফেসবুক পেজ/গ্রুপের লিংক | অ্যাডমিন → Settings; `index.html`-এ ফেসবুক বাটনের লিংক (`aiFb`) |
| 7 | জরুরি হটলাইন নম্বর, ইমেইল, ঠিকানা, শহর (নামাজের সময়ের জন্য) | অ্যাডমিন → Settings |
| 8 | বিকাশ/নগদ নম্বর (ডোনেশন ও শপের জন্য) | অ্যাডমিন → Shop / Donation পেজ |
| 9 | Google Play Developer অ্যাকাউন্ট (অ্যাপ লাগলে) ও অ্যাপের package name | নিচে ধাপ ৭ |
| 10 | Firebase **Blaze** (বিলিং) প্ল্যান, পুশ ফাংশন ও আসল নম্বরে OTP-র জন্য | Firebase কনসোল |
| 11 | (ঐচ্ছিক) ব্যাকআপ ইমেইলের জন্য resend.com API key, ব্যাকআপ পাঠানোর ইমেইল ঠিকানা | অ্যাডমিন → System → Auto backup & alerts |

---

## খ) ধাপে ধাপে সেটআপ

### ধাপ ১: Firebase প্রজেক্ট তৈরি
1. https://console.firebase.google.com → Add project।
2. **Build → Realtime Database → Create database**। Location বেছে নিন (বাংলাদেশের জন্য `asia-southeast1` ভালো)।
3. **Build → Authentication → Get started**। Sign-in method-এ চালু করুন: **Email/Password**, **Google**, **Phone**, **Anonymous** (Anonymous বাধ্যতামূলক, QR ভেরিফাই ও সদস্য ফর্ম এটা ছাড়া চলবে না)।
4. Project settings → General → Your apps → **Web app (</>)** যোগ করুন। যে `firebaseConfig` পাবেন সেটা কপি করুন।

### ধাপ ২: কোডে নতুন Firebase কনফিগ বসানো
`firebaseConfig` দুই ফাইলেই আছে। **দুই জায়গাতেই একই মান** বসান:
- `index.html`
- `admin.html`

বদলাতে হবে: `apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`।

আরও বদলান:
- `.firebaserc` → `"default": "নতুন-project-id"`
- `_setup/functions/index.js` → প্রতিটি `instance: "xxxx-default-rtdb"` এবং `region` (ডাটাবেসের লোকেশনের সাথে মিলিয়ে)

### ধাপ ৩: রুলস পাবলিশ
- Realtime Database → Rules → `_setup/firebase/database.rules.json`-এর লেখা পেস্ট → Publish।
- Firestore ব্যবহার হয় না। চালু করলে `_setup/firebase/firestore.rules` (সব বন্ধ) পেস্ট করুন।
- অথবা CLI: `firebase deploy --only database,firestore:rules`।

### ধাপ ৪: অ্যাডমিন বানানো (সবচেয়ে গুরুত্বপূর্ণ)
1. Authentication → Users → **Add user**: অ্যাডমিনের ইমেইল + পাসওয়ার্ড।
2. ওই ইউজারের **UID** কপি করুন।
3. Realtime Database → Data → নতুন নোড: `admins` → তার নিচে `<UID>` = `true` (Boolean)।
4. `admin.html` খুলে ওই ইমেইল-পাসওয়ার্ডে লগইন করুন। অ্যাডমিন থেকে সব নিয়ন্ত্রণ হবে।
5. Authentication → Settings → **Authorized domains**-এ ক্লায়েন্টের ডোমেইন যোগ করুন (`index.html` ও `admin.html` যেখানে হোস্ট হবে)।

> `admin.html` আলাদা গোপন ঠিকানায় হোস্ট করুন (যেমন `panel-xyz123.example.org`)। সবাই ঢুকতে পারলেও `admins/<UID>` না থাকলে ডেটা পড়া যায় না, তবু ঠিকানা গোপন রাখা ভালো।

### ধাপ ৫: OneSignal (পুশ নোটিফিকেশন)
1. https://onesignal.com → New App → Web (এবং লাগলে Android)।
2. Web Site URL = ক্লায়েন্টের ডোমেইন।
3. Android-এর জন্য: OneSignal → Settings → Google Android (FCM) → Firebase service account JSON আপলোড (Firebase → Project settings → Service accounts → Generate new private key)।
4. নিজের **App ID** দিয়ে বদলান:
   - `index.html` → `var APP_ID="..."` (প্রায় লাইন ৮২৮)
   - `_setup/functions/onesignal.config.js` → `APP_ID`
   - `_setup/android/OneSignalConfig.kt` → `APP_ID` (অ্যাপ করলে)
5. **REST API Key** কখনো HTML বা GitHub-এ রাখবেন না:
```
npm i -g firebase-tools
firebase login
cd _setup/functions && npm install && cd ../..
firebase functions:secrets:set ONESIGNAL_API_KEY
firebase deploy --only functions
```
(Blaze প্ল্যান লাগবে।) `onesignal.config.js`-এর পুরনো `PUBLIC_KEY` ক্লায়েন্টের নিজের কী দিয়ে বদলান বা ব্যবহার না করলে ফাঁকা রাখুন।

### ধাপ ৬: হোস্টিং
আপলোড করুন: `index.html`, `nashid-player.js`, `OneSignalSDKWorker.js`, `push/` ফোল্ডার, `.nojekyll`, এবং হোস্ট অনুযায়ী `vercel.json` / `_headers` / `_redirects`। `_setup` ফোল্ডার আপলোড না করলেও চলবে। সাইট অবশ্যই **https**-এ খুলতে হবে।

### ধাপ ৭: অ্যান্ড্রয়েড অ্যাপ (ঐচ্ছিক)
`_setup/android/ANDROID.md` দেখুন। নিজের package name, নিজের OneSignal App ID ও নিজের Play Console কী ব্যবহার করবেন। বিক্রেতার সাইনিং কী ক্লায়েন্টকে দেবেন না, ক্লায়েন্টের নিজের কী বানাতে হবে।

---

## গ) ক্লায়েন্ট নিজে অ্যাডমিন প্যানেল থেকে যা যা চালাবে

ঢুকে নিচের সবকিছু **কোড না ছুঁয়ে** বদলানো যায়:
- ওয়েবসাইটের নাম, লোগো, ফেসবুক লিংক, হটলাইন, ইমেইল (Settings)
- হোম স্লাইডার ও ব্যানার
- ডোনেশন (বিকাশ/নগদ নম্বর, QR, বিবরণ) ও শপ (পণ্য, দাম, ডেলিভারি চার্জ, পেমেন্ট নম্বর)
- অর্ডার দেখা ও স্ট্যাটাস বদলানো (প্রেরক নম্বর ও TrxID সহ)
- রক্তদাতা তালিকা, রক্তের অনুরোধ, ইউজার, পুশ সাবস্ক্রাইবার, সদস্য ফর্ম (সিরিয়াল, PDF/প্রিন্ট)
- পুলিশ, অ্যাম্বুলেন্স, হাসপাতাল, ডাক্তার, কুরিয়ার, টিম
- নাশিদ/গজল ও সূরা তিলাওয়াত (ধরন বেছে YouTube লিংক বা mp3 দেওয়া)
- নোটিফিকেশন পাঠানো (সবাইকে বা নির্দিষ্ট ইউজারকে)
- ফান্ড ড্যাশবোর্ড (আয়, ব্যয়, কাজ)

শপে অ্যাডমিন কিছু যোগ না করা পর্যন্ত **ডেমো পণ্য ও ডেমো পেমেন্ট নম্বর (01712-345678)** দেখায়। ডেলিভারির আগে অ্যাডমিন থেকে আসল নম্বর বসাবেন এবং ডেমো মুছবেন।

## ঘ) রক্তদাতা কীভাবে রিয়েল টাইমে দেখা যায়
ইউজার সাইন আপে নাম, রক্তের গ্রুপ, নম্বর, ঠিকানা, ছবি দিলে তথ্য `donors` নোডে সেভ হয় এবং **রক্ত প্রয়োজন / রক্তদাতা** পেজে সাথে সাথে দেখা যায়। নমুনা (ডেমো) ডোনার বন্ধ করা আছে (`SHOW_SAMPLES=false`)। তালিকা দেখতে লগইন লাগে, এটা রুলসে নির্ধারিত।

## ঙ) QR কার্ড যাচাই
কার্ডের QR স্ক্যান করলে সাইটে যাচাই পেজ খোলে। এটা `donors/<মোবাইল নম্বর>` লাইভ খুঁজে নাম ও গ্রুপ মেলায়। মিললে সবুজ "ভেরিফাইড"; না মিললে লাল। কাজ করতে Anonymous Auth চালু থাকতে হবে।

## চ) লঞ্চের আগের টেস্ট তালিকা
1. নতুন ইউজার সাইন আপ → রক্তদাতা তালিকায় দেখা যায় কিনা।
2. অ্যাডমিন লগইন → ডোনার/ইউজার তালিকা আসে কিনা।
3. অ্যাডমিন থেকে টেস্ট নোটিফিকেশন → ফোনে পৌঁছায় কিনা।
4. শপে একটা টেস্ট অর্ডার → অ্যাডমিনে আসে কিনা।
5. কার্ড বানিয়ে QR স্ক্যান → ভেরিফাইড দেখায় কিনা।
6. গজল প্লেয়ার চালিয়ে ব্যাক চাপলে মিনি প্লেয়ারে চলে কিনা।
7. ফোনের ব্যাক বাটন ধাপে ধাপে কাজ করে কিনা।

## ছ) নিরাপত্তা
- `apiKey` ওয়েব কনফিগে থাকা স্বাভাবিক; আসল সুরক্ষা রুলস ও `admins` নোড। রুলস কখনো খোলা (`true`) রাখবেন না।
- REST API Key ও Firebase service account JSON কোথাও আপলোড করবেন না।
- ক্লায়েন্টকে দেওয়ার আগে নিজের পরীক্ষার ডেটা ও অ্যাডমিন ইউজার মুছে দিন।

## অ্যাকাউন্ট ব্লক / রিমুভ (নতুন)
1. Firebase Console → Realtime Database → Rules-এ `_setup/firebase/database.rules.json` পেস্ট করে Publish করুন (নতুন `account_status` অংশ আছে)।
2. Admin → People → Members: ছবি, নাম, ফোন, ইমেইল সহ সব মেম্বার। **Block** = ডিফল্ট ১ ঘণ্টা (বেছে নেওয়া যায়), **Remove** = চিরতরে বন্ধ (ডেটা মোছে না)।
3. Blocked accounts পেজে **Unblock**, Removed accounts পেজে **Unremove** — সাথে সাথে ইউজার ঢুকতে পারে।
