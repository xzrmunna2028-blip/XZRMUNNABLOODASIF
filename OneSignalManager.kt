package com.blooddonatesociety.app

import android.app.Activity
import android.content.Context
import androidx.appcompat.app.AlertDialog
import com.onesignal.OneSignal
import com.onesignal.debug.LogLevel
import com.onesignal.user.subscriptions.IPushSubscriptionObserver
import com.onesignal.user.subscriptions.PushSubscriptionChangedState
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

/**
 * OneSignal-এর সব কল এই একটা ক্লাসের ভেতর দিয়ে যায়। অ্যাপের অন্য কোথাও সরাসরি OneSignal ডাকবেন না।
 * কী/App ID আছে OneSignalConfig.kt-তে।
 */
object OneSignalManager {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val ready = CompletableDeferred<Unit>()
    private var initialized = false

    /** ডায়ালগ একবারই দেখাবে। */
    private val dialogShown = AtomicBoolean(false)

    /** OneSignal অবজারভার দুর্বল রেফারেন্সে রাখে, তাই নিজে শক্ত রেফারেন্স ধরে রাখতে হয়। */
    private var pushSubscriptionObserver: IPushSubscriptionObserver? = null

    /** MyApplication.onCreate()-এ একবার ডাকুন। */
    fun initialize(context: Context) {
        if (initialized) return
        if (OneSignalConfig.APP_ID.isBlank()) return // App ID বসানো না হলে পুশ বন্ধ
        initialized = true
        val app = context.applicationContext
        scope.launch {
            OneSignal.Debug.logLevel = LogLevel.VERBOSE // শুধু ডিবাগে; প্রোডাকশনে সরিয়ে দিন
            OneSignal.initWithContext(app, OneSignalConfig.APP_ID)
            ready.complete(Unit)
        }
    }

    fun login(externalId: String) { scope.launch { ready.await(); OneSignal.login(externalId) } }
    fun logout() { scope.launch { ready.await(); OneSignal.logout() } }
    fun setEmail(email: String) { scope.launch { ready.await(); OneSignal.User.addEmail(email) } }
    fun setSmsNumber(number: String) { scope.launch { ready.await(); OneSignal.User.addSms(number) } }
    fun setTag(key: String, value: String) { scope.launch { ready.await(); OneSignal.User.addTag(key, value) } }
    fun setLogLevel(level: LogLevel) { OneSignal.Debug.logLevel = level }

    /** সার্ভার-দেওয়া আসল ID: ফাঁকা নয় এবং "local-" দিয়ে শুরু নয়। */
    private fun isRegistered(id: String?): Boolean = !id.isNullOrEmpty() && !id.startsWith("local-")

    /**
     * MainActivity.onCreate()-এ ডাকুন। ডিভাইস সত্যিই রেজিস্টার হলে একবার "Your OneSignal SDK integration is complete!"
     * ডায়ালগ আসবে, আর "Got it" চাপলে তবেই পুশ পারমিশনের বক্স আসবে (পারমিশন শুধু এখানেই চাওয়া হয়)।
     */
    fun setupPushSubscriptionObserver(activity: Activity) {
        if (!initialized) return // OneSignal চালু না থাকলে কিছু করবে না
        scope.launch {
            ready.await()
            val check = { id: String? ->
                if (isRegistered(id) && dialogShown.compareAndSet(false, true)) {
                    activity.runOnUiThread { if (!activity.isFinishing) showIntegrationCompleteDialog(activity) }
                }
            }
            val observer = object : IPushSubscriptionObserver {
                override fun onPushSubscriptionChange(state: PushSubscriptionChangedState) = check(state.current.id)
            }
            pushSubscriptionObserver = observer
            OneSignal.User.pushSubscription.addObserver(observer)
            // অবজারভার বসানোর আগেই ID পেয়ে গেলে ধরার জন্য এখনই একবার দেখে নিই
            check(OneSignal.User.pushSubscription.id)
        }
    }

    private fun showIntegrationCompleteDialog(activity: Activity) {
        AlertDialog.Builder(activity)
            .setTitle("Your OneSignal SDK integration is complete!")
            .setMessage("You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.")
            .setPositiveButton("Got it") { _, _ -> requestPushPermission() }
            .setCancelable(false)
            .show()
    }

    /** শুধু ডায়ালগের "Got it"-এ ডাকা হয়। (Android 13+ এ POST_NOTIFICATIONS বক্স আসে।) */
    private fun requestPushPermission() {
        scope.launch {
            ready.await()
            withContext(Dispatchers.Main) {
                val granted = OneSignal.Notifications.requestPermission(true)
                if (granted || OneSignal.Notifications.permission) OneSignal.User.pushSubscription.optIn()
            }
        }
    }
}
