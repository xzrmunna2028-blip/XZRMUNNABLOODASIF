package com.blooddonatesociety.app

/**
 * OneSignal-এর সব কী এক জায়গায়। পরে বদলাতে চাইলে শুধু এই ফাইলটা বদলান।
 *
 * APP_ID ও PUBLIC_KEY প্রকাশ্য (public) মান, অ্যাপে থাকলে সমস্যা নেই।
 * REST API Key / সিক্রেট কী অ্যাপের কোডে, HTML-এ বা GitHub-এ কখনো রাখবেন না।
 * ওটা শুধু সার্ভারে থাকে: `firebase functions:secrets:set ONESIGNAL_API_KEY` (README দেখুন)।
 */
object OneSignalConfig {
    /** OneSignal App ID (ওয়েব index.html ও _setup/functions/index.js-এও একই মান আছে)। */
    const val APP_ID = "" // TODO: ক্লায়েন্টের OneSignal App ID

    /** আপনার দেওয়া পাবলিক কী (EC P-256)। ইউজার ভেরিফিকেশন (JWT) চালু করলে এটা লাগবে; এখন কোড এটা ব্যবহার করছে না। */
    const val PUBLIC_KEY = ""
}
