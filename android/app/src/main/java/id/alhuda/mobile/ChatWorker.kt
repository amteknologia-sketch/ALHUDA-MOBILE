package id.alhuda.mobile

import android.content.Context
import androidx.work.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

/**
 * Memeriksa pesan chat baru di latar belakang (setiap ±15 menit, batas minimum Android)
 * ketika aplikasi tidak sedang dibuka.
 */
class ChatWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

    override fun doWork(): Result {
        if (App.foreground) return Result.success()
        val prefs = applicationContext.getSharedPreferences(App.PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString("token", "") ?: ""
        if (token.isEmpty()) return Result.success()
        return try {
            val base = applicationContext.getString(R.string.web_app_url)
            val json = get(base + "?api=unread&token=" + URLEncoder.encode(token, "UTF-8"))
            val o = JSONObject(json)
            if (!o.optBoolean("ok")) return Result.success()
            val d = o.getJSONObject("data")
            val latest = d.optJSONArray("latest")
            if (d.optInt("count") > 0 && latest != null && latest.length() > 0) {
                val m = latest.getJSONObject(0)
                val id = m.optString("id")
                if (prefs.getString("lastNotif", "") != id) {
                    prefs.edit().putString("lastNotif", id).apply()
                    val count = d.optInt("count")
                    val title = if (count > 1) "$count pesan baru • ${m.optString("nama")}" else "Pesan baru dari ${m.optString("nama")}"
                    Notifier.show(applicationContext, title, m.optString("pesan"))
                }
            }
            Result.success()
        } catch (e: Exception) { Result.retry() }
    }

    private fun get(u: String): String {
        var url = URL(u)
        repeat(5) { // Apps Script mengalihkan ke script.googleusercontent.com
            val c = url.openConnection() as HttpURLConnection
            c.instanceFollowRedirects = false
            c.connectTimeout = 15000; c.readTimeout = 20000
            val code = c.responseCode
            if (code in 300..399) { url = URL(url, c.getHeaderField("Location")); c.disconnect(); return@repeat }
            return c.inputStream.bufferedReader().use { it.readText() }
        }
        throw IllegalStateException("Terlalu banyak pengalihan")
    }

    companion object {
        fun schedule(ctx: Context) {
            val req = PeriodicWorkRequestBuilder<ChatWorker>(15, TimeUnit.MINUTES)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("chat-check", ExistingPeriodicWorkPolicy.KEEP, req)
        }
    }
}
