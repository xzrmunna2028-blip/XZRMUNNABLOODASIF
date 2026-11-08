package com.blooddonatesociety.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * আপনার যদি নিজের MainActivity থাকে, তাহলে ফাইল বদলাবেন না। শুধু নিচের তিনটা জিনিস কপি করুন:
 *  (১) onCreate-এ OneSignalManager.setupPushSubscriptionObserver(this)
 *  (২) addJavascriptInterface(Bridge(), "AndroidBridge")
 *  (৩) inner class Bridge
 * দরকার: Activity অবশ্যই AppCompatActivity হতে হবে (গুগল লগইনের lifecycleScope-এর জন্য)।
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(web)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.addJavascriptInterface(Bridge(), "AndroidBridge")
        web.webViewClient = WebViewClient()
        web.loadUrl(SITE_URL)

        OneSignalManager.setupPushSubscriptionObserver(this)
    }

    private fun js(code: String) = runOnUiThread { web.evaluateJavascript(code, null) }

    inner class Bridge {
        /** ওয়েব লগইনের পর ডিভাইসকে ইউজারের সাথে যুক্ত করে, যাতে নির্দিষ্ট ইউজারকে পুশ পাঠানো যায়। */
        @JavascriptInterface fun oneSignalLogin(uid: String) = OneSignalManager.login(uid)

        @JavascriptInterface fun oneSignalLogout() = OneSignalManager.logout()

        @JavascriptInterface fun googleSignIn() {
            val option = GetGoogleIdOption.Builder()
                .setServerClientId(WEB_CLIENT_ID)
                .setFilterByAuthorizedAccounts(false)
                .build()
            val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
            lifecycleScope.launch {
                try {
                    val result = CredentialManager.create(this@MainActivity).getCredential(this@MainActivity, request)
                    val token = GoogleIdTokenCredential.createFrom(result.credential.data).idToken
                    js("window.onNativeGoogle('$token')")
                } catch (e: Exception) {
                    js("window.onNativeGoogleError()")
                }
            }
        }

        @JavascriptInterface fun sendOtp(phone: String) {
            val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                override fun onVerificationCompleted(credential: PhoneAuthCredential) {}
                override fun onVerificationFailed(e: FirebaseException) {
                    val code = (e as? FirebaseAuthException)?.errorCode ?: "native"
                    js("window.onNativeOtpError('$code')")
                }
                override fun onCodeSent(id: String, token: PhoneAuthProvider.ForceResendingToken) {
                    js("window.onNativeOtpSent('$id')")
                }
            }
            runOnUiThread {
                PhoneAuthProvider.verifyPhoneNumber(
                    PhoneAuthOptions.newBuilder(FirebaseAuth.getInstance())
                        .setPhoneNumber(phone)
                        .setTimeout(60L, TimeUnit.SECONDS)
                        .setActivity(this@MainActivity)
                        .setCallbacks(callbacks)
                        .build()
                )
            }
        }
    }

    companion object {
        const val SITE_URL = "https://YOUR-SITE-URL/"   // <-- আপনার হোস্ট করা সাইটের আসল লিংক
        const val WEB_CLIENT_ID = "PASTE_CLIENT_WEB_CLIENT_ID_HERE" // Firebase > Authentication > Sign-in method > Google > Web SDK configuration > Web client ID
    }
}
