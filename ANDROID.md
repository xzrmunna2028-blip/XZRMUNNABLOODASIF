# Android অ্যাপ সেটআপ

কোড চারটা Kotlin ফাইলে আছে: `OneSignalConfig.kt` (App ID ও কী এখানে), `OneSignalManager.kt`, `MyApplication.kt`, `MainActivity.kt`।
চারটাই আপনার অ্যাপের source ফোল্ডারে বসান এবং প্রতিটার প্রথম লাইনের `package` আপনার প্রজেক্টের সাথে মিলিয়ে নিন।

## build.gradle.kts (app)
```kotlin
implementation("com.onesignal:OneSignal:[5.0.0, 5.99.99]")   // সম্ভব হলে https://onesignal.github.io/sdk-releases/releases.json থেকে Stable ভার্সন দেখে এক্স্যাক্ট ভার্সন বসান
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
implementation("androidx.appcompat:appcompat:1.7.0")
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
implementation(platform("com.google.firebase:firebase-bom:35.1.0"))
implementation("com.google.firebase:firebase-analytics")
implementation("com.google.firebase:firebase-auth")
implementation("androidx.credentials:credentials:1.5.0")
implementation("androidx.credentials:credentials-play-services-auth:1.5.0")
implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
```
`minSdk` ২১ বা বেশি, `compileSdk` ৩৩ বা বেশি। Google Services প্লাগিন ও `google-services.json` OneSignal-এর জন্য লাগে না,
এগুলো শুধু Firebase লগইনের (Google / ফোন OTP) জন্য থাকছে।

## Firebase Gradle প্লাগিন (ক্লায়েন্টের প্রজেক্ট: blood-society-3727a)
package name: `com.blooddonatesociety.app`। `google-services.json` এই ফোল্ডারে আছে, সেটা `app/` ফোল্ডারে (build.gradle.kts-এর পাশে) বসান।

Project-level `build.gradle.kts`:
```kotlin
plugins {
    id("com.google.gms.google-services") version "4.5.0" apply false
}
```
App-level `build.gradle.kts`:
```kotlin
plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}
```

## AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<application android:name=".MyApplication" ...>
```

## পুশ পারমিশন ও ভেরিফিকেশন ডায়ালগ
অ্যাপ চালু হলে ডিভাইস OneSignal-এ রেজিস্টার হয়। রেজিস্টার সম্পূর্ণ হলে একবার "Your OneSignal SDK integration is complete!" ডায়ালগ আসে (`MainActivity.onCreate()`-এ `OneSignalManager.setupPushSubscriptionObserver(this)`)।
**Got it** চাপলে তবেই সিস্টেমের "Allow" বক্স আসে, পারমিশন আর কোথাও চাওয়া হয় না। ডায়ালগ আসা মানে সাবস্ক্রিপশন সফল।
টেস্টের সময় অ্যাপ আনইনস্টল বা ডেটা ক্লিয়ার করবেন না, করলে OneSignal-এ ডুপ্লিকেট সাবস্ক্রিপশন তৈরি হয়।

## কী বদলাবেন কোথায় (পরে এপিআই/কী বদলালে)
| কী | কোথায় |
|---|---|
| App ID | `OneSignalConfig.kt` (Android), `index.html`-এর `APP_ID` (ওয়েব), `_setup/functions/index.js`-এর `APP_ID` (সার্ভার) |
| পাবলিক কী | `OneSignalConfig.kt` |
| REST API Key (সিক্রেট) | শুধু Firebase Secret: `firebase functions:secrets:set ONESIGNAL_API_KEY` |

## Firebase লগইন (গুগল ও ফোন OTP)
Firebase Console-এ অ্যাপের SHA-1 ও SHA-256 যোগ করে নতুন `google-services.json` বসান।
