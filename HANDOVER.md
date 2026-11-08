# হস্তান্তর নথি: Blood Society

## ১) এই প্রজেক্টে এখন যা সেট করা আছে (কোডে)

| বিষয় | মান |
|---|---|
| Firebase প্রজেক্ট ID | `blood-society-3727a` |
| Web App ID | `1:566602962813:web:d8f092943db257796d5e14` |
| Android App ID | `1:566602962813:android:afd1edcbfa75cf4c6d5e14` |
| Android package name | `com.blooddonatesociety.app` |
| ডাটাবেজ (ধরে নেওয়া) | `https://blood-society-3727a-default-rtdb.asia-southeast1.firebasedatabase.app` |
| Cloud Functions instance | `blood-society-3727a-default-rtdb` (region: `asia-southeast1`) |

- `index.html` ও `admin.html`-এ শুধু এই প্রজেক্টের কনফিগ আছে।
- আগের বিক্রেতার Firebase ও OneSignal-এর কোনো তথ্য কোডে নেই।
- রেজিস্ট্রেশন, রক্তদাতা, অর্ডার, সদস্য ফর্ম সব এই প্রজেক্টের ডাটাবেজে জমা হবে।
- Firestore ও Storage এই সাইট ব্যবহার করে না। কালেকশন বানাতে হবে না।

## ২) ক্লায়েন্টকে নিজের Firebase কনসোলে যা যা করতে হবে (ক্রম ধরে)

1. **Realtime Database বানান:** Build → Realtime Database → Create database → লোকেশন `asia-southeast1` (সিঙ্গাপুর)।
   - Data ট্যাবের উপরের URL কোডের `databaseURL`-এর সাথে মেলে কিনা দেখুন। না মিললে আসল URL ডেভেলপারকে দিন।
2. **রুলস পাবলিশ:** Realtime Database → Rules → `_setup/firebase/database.rules.json`-এর পুরো লেখা পেস্ট → Publish।
3. **Authentication চালু:** Build → Authentication → Get started → Sign-in method-এ চারটাই Enable: Email/Password, Google, Phone, Anonymous।
4. **Authorized domains:** Authentication → Settings → Authorized domains-এ সাইটের ডোমেইন (এবং অ্যাডমিন প্যানেলের ডোমেইন) যোগ করুন।
5. **অ্যাডমিন ইউজার:** Authentication → Users → Add user → নিজের ইমেইল ও শক্ত পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)। তারপর ওই ইউজারের **User UID** কপি করুন।
6. **`admins` নোড:** Realtime Database → Data → `+` → Name: `admins`, Value ফাঁকা → ভেতরে `+` → Name: UID (পুরোটা, স্পেস ছাড়া), Value: `true` → Add।
7. **অ্যাডমিন প্যানেলে ঢুকুন:** `/admin` ঠিকানায় (বা `admin.html`) ইমেইল-পাসওয়ার্ডে লগইন। "Login OK but not admin" এলে ধাপ ৬ আবার মিলিয়ে দেখুন।
8. **Blaze প্ল্যান:** Phone OTP (আসল নম্বরে) ও Cloud Functions-এর জন্য বিলিং প্ল্যান Blaze করতে হবে।

## ৩) অ্যাডমিন প্যানেল থেকে ক্লায়েন্ট যা দেখতে ও চালাতে পারবে

রক্তদাতা তালিকা, রক্তের অনুরোধ, সব ইউজার (ছবি, নাম, ফোন, ইমেইল), সদস্য ফর্ম, শপ অর্ডার, ডোনেশন, ফান্ড ও খাতা, সাপোর্ট চ্যাট, পুশ সাবস্ক্রাইবার, ব্লক/রিমুভ করা অ্যাকাউন্ট। সেটিংস, স্লাইডার, শপ, নাশিদ/দোয়া, পুলিশ/অ্যাম্বুলেন্স/হাসপাতাল তালিকাও এখান থেকেই বদলানো যায়।

**ডেটার আসল কপি থাকে Firebase কনসোলে:** Realtime Database → Data ট্যাবে সব তথ্য দেখা যায়। ব্যাকআপের জন্য ডানদিকের ⋮ মেনু → **Export JSON** নিয়মিত চালান, অথবা অ্যাডমিন প্যানেল → System → **Auto backup & alerts**-এ ইমেইল/Telegram বসিয়ে প্রতি রাতে অটো-ব্যাকআপ চালু করুন (README ধাপ ৭ দেখুন) — এটা অ্যাডমিন প্যানেলেই দৃশ্যমান একটা সেটিং, গোপন কিছু নেই।

## ৪) যে তথ্যগুলো এখনো বসানো বাকি (পুশ নোটিফিকেশন ও অ্যাপ লগইন)

| কী | কোথায় বসবে | অবস্থা |
|---|---|---|
| OneSignal App ID | `index.html` (`var APP_ID=""`), `_setup/functions/onesignal.config.js`, `_setup/android/OneSignalConfig.kt` | ফাঁকা। পুশ বন্ধ আছে |
| OneSignal REST API Key | `firebase functions:secrets:set ONESIGNAL_API_KEY`, তারপর `firebase deploy --only functions` | বাকি |
| Android SHA-1 ও SHA-256 | Firebase → Project settings → Android অ্যাপ → Add fingerprint | বাকি |
| নতুন `google-services.json` | অ্যাপের `app/` ফোল্ডারে | SHA যোগের পর নতুন করে ডাউনলোড |
| Android `WEB_CLIENT_ID` | `_setup/android/MainActivity.kt` | প্লেসহোল্ডার আছে |

Web client ID পাওয়ার জায়গা: Authentication → Sign-in method → Google → Web SDK configuration।

## ৫) লঞ্চের আগে টেস্ট (সবগুলো পাস হলে তবেই লাইভ)

1. নতুন ইউজার সাইন আপ করুন, তারপর Firebase Authentication-এ ইউজার এসেছে কিনা দেখুন।
2. রক্তদাতা হিসেবে তথ্য দিন, তারপর Realtime Database-এ `donors` নোড তৈরি হয়েছে কিনা দেখুন।
3. অ্যাডমিন লগইন করে ডোনার ও ইউজার তালিকা দেখুন।
4. শপে টেস্ট অর্ডার দিন, তারপর অ্যাডমিনে আসে কিনা দেখুন।
5. সদস্য ফর্ম জমা দিন ও QR ভেরিফাই করুন।
6. (OneSignal বসানোর পর) অ্যাডমিন থেকে টেস্ট নোটিফিকেশন পাঠান।
7. (অ্যাপ বানানোর পর) অ্যাপে Google ও ফোন OTP লগইন চেষ্টা করুন।
8. টেস্ট শেষে নিজের টেস্ট ইউজার ও টেস্ট ডেটা মুছে দিন।

## ৬) ডেলিভারির আগে মনে রাখার বিষয়

- শপে অ্যাডমিন কিছু যোগ না করা পর্যন্ত **ডেমো পণ্য ও ডেমো পেমেন্ট নম্বর (01712-345678)** দেখায়। আসল বিকাশ/নগদ নম্বর অ্যাডমিন থেকে বসান।
- ফাউন্ডারের নাম `index.html`-এ `প্রতিষ্ঠাতা : NA Asif` / `Founder : NA Asif` লেখা আছে। ক্লায়েন্টের নাম দিয়ে বদলান।
- সাইটের ভেতরে পুলিশ-ডিরেক্টরির কিছু ডিফল্ট তথ্যে ১৯টা ছবির লিংক আছে। সেগুলো সরকারি পোর্টালের বাইরের সার্ভার থেকে লোড হয়। লিংক নষ্ট হলে ছবি আসবে না। চাইলে অ্যাডমিন থেকে নিজের তালিকা বসিয়ে ডিফল্টটা বাদ দিন।
- REST API Key ও Firebase service account JSON কোথাও আপলোড করবেন না।
- `_setup` ফোল্ডার, `README.md`, `CLIENT-GUIDE.md`, `HANDOVER.md` সাইটে আপলোড হয় না (hosting ignore করা আছে)।
