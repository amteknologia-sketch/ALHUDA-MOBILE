package id.alhuda.mobile

import android.content.Context
import androidx.work.*
import org.json.JSONArray
import org.json.JSONObject

/**
 * Mengirim ANTREAN OFFLINE ke server di latar belakang begitu internet tersambung,
 * walaupun aplikasi sedang ditutup. Setiap item membawa _cid unik sehingga server
 * tidak mencatat dua kali bila aplikasi juga ikut mengirim.
 */
class SyncWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

    override fun doWork(): Result {
        if (App.foreground) return Result.success() // saat aplikasi terbuka, halaman yang mengirim
        val prefs = applicationContext.getSharedPreferences(App.PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString("token", "") ?: ""
        if (token.isEmpty()) return Result.success()
        val url = applicationContext.getString(R.string.web_app_url)
        var sent = 0
        return synchronized(App.queueLock) {
            val queue = try { JSONArray(prefs.getString("queue", "[]")) } catch (e: Exception) { JSONArray() }
            val keep = JSONArray()
            var stop = false
            for (i in 0 until queue.length()) {
                val it = queue.getJSONObject(i)
                // biodata (bisa mengganti username/token) dikirim oleh aplikasi saat dibuka
                if (stop || it.has("err") || it.optString("action") == "profil.save") { keep.put(it); continue }
                try {
                    val body = JSONObject().put("token", token).put("action", it.getString("action")).put("params", it.getJSONObject("params"))
                    val res = JSONObject(Http.post(url, body.toString()))
                    if (res.optBoolean("ok")) sent++
                    else if (res.optString("error") == "SESSION") { stop = true; keep.put(it) }
                    else { it.put("err", res.optString("error", "Ditolak server")); keep.put(it) }
                } catch (e: Exception) { stop = true; keep.put(it) } // jaringan putus lagi → coba nanti
            }
            prefs.edit().putString("queue", keep.toString()).apply()
            if (sent > 0) Notifier.show(applicationContext, "ALHUDA MOBILE", "$sent perubahan offline berhasil dikirim ke server.")
            val pending = (0 until keep.length()).any { !keep.getJSONObject(it).has("err") && keep.getJSONObject(it).optString("action") != "profil.save" }
            if (stop && pending) Result.retry() else Result.success()
        }
    }

    companion object {
        fun schedule(ctx: Context) {
            val req = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, java.util.concurrent.TimeUnit.SECONDS)
                .build()
            WorkManager.getInstance(ctx).enqueueUniqueWork("offline-sync", ExistingWorkPolicy.KEEP, req)
        }
    }
}
