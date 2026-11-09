package id.alhuda.mobile

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
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
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File

/**
 * ALHUDA MOBILE — pembungkus WebView untuk Web App Google Apps Script.
 * Fitur native: notifikasi chat, tombol kembali, unggah foto, simpan PDF, warna status bar.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private lateinit var swipe: SwipeRefreshLayout
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    @Volatile private var backPending = false
    private val main = Handler(Looper.getMainLooper())

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res.resultCode, res.data))
        fileCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Notifier.createChannel(this)

        web = WebView(this)
        swipe = SwipeRefreshLayout(this).apply {
            addView(web)
            setColorSchemeColors(Color.parseColor("#0F6E4F"))
            setOnRefreshListener { web.reload() }
        }
        setContentView(swipe)
        swipe.isEnabled = false // diaktifkan hanya pada halaman offline

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(false)
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)
        web.addJavascriptInterface(Bridge(), "AndroidBridge")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val host = req.url.host ?: return false
                val allowed = host.endsWith("google.com") || host.endsWith("googleusercontent.com") || host.endsWith("gstatic.com")
                if (allowed) return false
                try { startActivity(Intent(Intent.ACTION_VIEW, req.url)) } catch (_: Exception) {}
                return true
            }
            override fun onReceivedError(view: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) showOffline()
            }
            override fun onPageFinished(view: WebView?, url: String?) { swipe.isRefreshing = false }
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
                // Halaman web mengambil sinyal ini lewat AndroidBridge.takeBack()
                backPending = true
                main.postDelayed({
                    if (backPending) { // halaman tidak merespons → perilaku standar
                        backPending = false
                        if (web.canGoBack()) web.goBack() else finish()
                    }
                }, 700)
            }
        })

        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            registerForActivityResult(ActivityResultContracts.RequestPermission()) {}.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        ChatWorker.schedule(this)

        if (savedInstanceState != null) web.restoreState(savedInstanceState) else web.loadUrl(getString(R.string.web_app_url))
    }

    override fun onSaveInstanceState(outState: Bundle) { super.onSaveInstanceState(outState); web.saveState(outState) }
    override fun onResume() { super.onResume(); App.foreground = true }
    override fun onPause() { super.onPause(); App.foreground = false }

    private fun showOffline() {
        swipe.isEnabled = true
        web.loadDataWithBaseURL(null, """
            <html><body style="font-family:sans-serif;background:#f1f1f1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;color:#374151;text-align:center;padding:20px">
            <div style="font-size:48px">📶</div><h3 style="color:#0f6e4f">Tidak ada koneksi internet</h3>
            <p>Periksa koneksi Anda lalu tarik layar ke bawah atau ketuk tombol di bawah.</p>
            <button onclick="location.href='${getString(R.string.web_app_url)}'" style="background:#0f6e4f;color:#fff;border:0;padding:12px 22px;border-radius:12px;font-size:15px">Coba Lagi</button>
            </body></html>""".trimIndent(), "text/html", "utf-8", null)
    }

    /** Fungsi yang bisa dipanggil dari JavaScript: window.AndroidBridge.xxx() */
    inner class Bridge {
        private val prefs get() = getSharedPreferences(App.PREFS, MODE_PRIVATE)

        @JavascriptInterface fun takeBack(): Boolean { if (backPending) { backPending = false; return true }; return false }
        @JavascriptInterface fun exitApp() { main.post { finish() } }
        @JavascriptInterface fun getToken(): String = prefs.getString("token", "") ?: ""
        @JavascriptInterface fun setToken(t: String) { prefs.edit().putString("token", t).apply(); main.post { swipe.isEnabled = false } }

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
                val safe = name.replace(Regex("[^A-Za-z0-9._-]"), "_")
                val file = File(dir, safe)
                file.writeBytes(Base64.decode(base64, Base64.DEFAULT))
                val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", file)
                val open = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/pdf")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
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
