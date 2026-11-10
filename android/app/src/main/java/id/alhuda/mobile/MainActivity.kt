package id.alhuda.mobile

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.content.pm.PackageInfoCompat
import org.json.JSONObject
import java.io.File

/**
 * ALHUDA MOBILE
 * Tampilan aplikasi (index.html) dimuat LANGSUNG di WebView — tidak lewat iframe Google —
 * sehingga tampil penuh di semua HP. Data diambil dari Web App Apps Script lewat fetch (doPost).
 * Tampilan terbaru diunduh otomatis dari server (?app=html) dan dipakai saat aplikasi dibuka berikutnya.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    @Volatile private var backPending = false
    @Volatile private var pageReady = false
    private val main = Handler(Looper.getMainLooper())

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res.resultCode, res.data))
        fileCallback = null
    }
    private val askNotif = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Notifier.createChannel(this)

        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#F1F1F1"))
        setContentView(web)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            textZoom = 100                 // ukuran huruf tidak ikut setelan sistem → tata letak tetap rapi
            setSupportZoom(false)
            builtInZoomControls = false
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
        }
        CookieManager.getInstance().setAcceptCookie(true)
        web.addJavascriptInterface(Bridge(), "AndroidBridge")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                // tautan keluar (mis. Google Drive) dibuka di aplikasi lain
                if (req.url.host == ORIGIN_HOST) return false
                try { startActivity(Intent(Intent.ACTION_VIEW, req.url)) } catch (_: Exception) {}
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = cb
                return try { pickFile.launch(params.createIntent()); true } catch (e: Exception) { fileCallback = null; false }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                backPending = true // diambil halaman lewat AndroidBridge.takeBack()
                main.postDelayed({ if (backPending) { backPending = false; finish() } }, 700)
            }
        })

        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            askNotif.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        ChatWorker.schedule(this)
        loadApp()
    }

    override fun onResume() { super.onResume(); App.foreground = true; web.onResume() }
    override fun onPause() {
        super.onPause(); App.foreground = false; web.onPause()
        // masih ada perubahan offline? kirim di latar belakang begitu internet tersedia
        val q = getSharedPreferences(App.PREFS, Context.MODE_PRIVATE).getString("queue", "[]") ?: "[]"
        if (q.length > 2) SyncWorker.schedule(this)
    }

    /** Tampilan asli ALHUDA (bukan halaman bingkai/error Google) selalu memuat penanda ini apa adanya. */
    private fun valid(html: String) = html.length > 5000 && html.contains("<meta name=\"alhuda-app\"") && html.contains("AndroidBridge")

    private fun bundled() = assets.open("index.html").bufferedReader().use { it.readText() }

    /** Muat tampilan: versi tersimpan (cache) yang valid → bila tidak ada, versi bawaan APK. Lalu perbarui cache di latar belakang. */
    private fun loadApp() {
        val cache = File(filesDir, "index.html")
        val prefs = getSharedPreferences(App.PREFS, Context.MODE_PRIVATE)
        val ver = try { PackageInfoCompat.getLongVersionCode(packageManager.getPackageInfo(packageName, 0)) } catch (e: Exception) { 0L }
        if (prefs.getLong("apkVersion", -1L) != ver) { cache.delete(); prefs.edit().putLong("apkVersion", ver).apply() } // APK baru → buang cache lama

        var fromCache = false
        val html = try {
            val c = if (cache.exists()) cache.readText() else ""
            if (valid(c)) { fromCache = true; c } else { cache.delete(); bundled() }
        } catch (e: Exception) { "<h3 style='font-family:sans-serif;padding:20px'>Gagal memuat aplikasi</h3>" }
        pageReady = false
        web.loadDataWithBaseURL(ORIGIN, html, "text/html", "utf-8", null)

        // Pengaman: bila tampilan dari cache tidak berjalan dalam 8 detik → hapus cache & pakai versi bawaan
        if (fromCache) main.postDelayed({
            if (!pageReady) { cache.delete(); web.loadDataWithBaseURL(ORIGIN, bundled(), "text/html", "utf-8", null) }
        }, 8000)

        Thread {
            try {
                val fresh = Http.get(getString(R.string.web_app_url) + "?app=html")
                if (valid(fresh) && fresh != html) cache.writeText(fresh)
            } catch (_: Exception) { /* offline / server lama: pakai versi yang ada */ }
        }.start()
    }

    companion object {
        const val ORIGIN_HOST = "appassets.androidplatform.net"
        const val ORIGIN = "https://$ORIGIN_HOST/"
    }

    /** Fungsi yang dipanggil dari JavaScript: window.AndroidBridge.xxx() */
    inner class Bridge {
        private val prefs get() = getSharedPreferences(App.PREFS, Context.MODE_PRIVATE)

        @JavascriptInterface fun apiUrl(): String = getString(R.string.web_app_url)
        @JavascriptInterface fun ready() { pageReady = true }

        // ---- mode offline ----
        @JavascriptInterface fun isOnline(): Boolean {
            val cm = getSystemService(ConnectivityManager::class.java) ?: return true
            val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
            return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        }
        // ---- data tersimpan di sistem HP ----
        @JavascriptInterface fun cacheGet(key: String): String? = CacheStore.get(this@MainActivity, key)
        @JavascriptInterface fun cacheSet(key: String, json: String, action: String, params: String) = CacheStore.put(this@MainActivity, key, json, action, params)
        @JavascriptInterface fun cacheKeys(prefix: String): String = CacheStore.keys(this@MainActivity, prefix)
        @JavascriptInterface fun setUser(u: String) { prefs.edit().putString("uname", u).apply() }

        @JavascriptInterface fun getQueue(): String = synchronized(App.queueLock) { prefs.getString("queue", "[]") ?: "[]" }
        @JavascriptInterface fun setQueue(json: String) {
            synchronized(App.queueLock) { prefs.edit().putString("queue", json).apply() }
            if (json.length > 2) SyncWorker.schedule(this@MainActivity)
        }

        /** Kirim permintaan API dari aplikasi (bukan dari WebView) → bebas masalah CORS. Hasil dikembalikan ke window.__nativeRes(id, teks). */
        @JavascriptInterface fun call(id: String, body: String) {
            Thread {
                val res = try { Http.post(getString(R.string.web_app_url), body) }
                          catch (e: Exception) { JSONObject().put("ok", false).put("error", "NET:" + (e.message ?: "")).toString() }
                main.post { web.evaluateJavascript("window.__nativeRes(" + JSONObject.quote(id) + "," + JSONObject.quote(res) + ")", null) }
            }.start()
        }
        @JavascriptInterface fun takeBack(): Boolean { if (backPending) { backPending = false; return true }; return false }
        @JavascriptInterface fun exitApp() { main.post { finish() } }
        @JavascriptInterface fun getToken(): String = prefs.getString("token", "") ?: ""
        @JavascriptInterface fun setToken(t: String) { prefs.edit().putString("token", t).apply() }

        @JavascriptInterface fun notify(title: String, body: String, id: String) {
            if (id.isNotEmpty() && prefs.getString("lastNotif", "") == id) return
            prefs.edit().putString("lastNotif", id).apply()
            Notifier.show(this@MainActivity, title, body)
        }

        @JavascriptInterface fun setStatusColor(hex: String) {
            main.post { try { window.statusBarColor = Color.parseColor(hex.trim()) } catch (_: Exception) {} }
        }

        @JavascriptInterface fun savePdf(base64: String, name: String) {
            try {
                val dir = File(getExternalFilesDir(null), "Documents").apply { mkdirs() }
                val file = File(dir, name.replace(Regex("[^A-Za-z0-9._-]"), "_"))
                file.writeBytes(Base64.decode(base64, Base64.DEFAULT))
                val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", file)
                val open = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/pdf")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                main.post {
                    try { startActivity(Intent.createChooser(open, "Buka / Bagikan PDF")) }
                    catch (e: Exception) { Toast.makeText(this@MainActivity, "PDF tersimpan: ${file.name}", Toast.LENGTH_LONG).show() }
                }
            } catch (e: Exception) {
                main.post { Toast.makeText(this@MainActivity, "Gagal menyimpan PDF: ${e.message}", Toast.LENGTH_LONG).show() }
            }
        }
    }
}
