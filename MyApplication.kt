package com.blooddonatesociety.app

import android.app.Application

/**
 * AndroidManifest.xml-এর <application android:name=".MyApplication" ...> এ বসাতে হবে।
 * আপনার যদি আগে থেকেই Application ক্লাস থাকে, তাহলে নতুন বানাবেন না,
 * ওটার onCreate()-এ শুধু OneSignalManager.initialize(this) লাইনটা যোগ করুন।
 */
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        OneSignalManager.initialize(this)
    }
}
