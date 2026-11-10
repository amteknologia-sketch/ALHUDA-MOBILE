package id.alhuda.mobile

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest

/**
 * Penyimpanan data aplikasi di SISTEM HP (folder data aplikasi).
 * Setiap data (mis. daftar chat, beranda, saldo) disimpan sebagai file JSON,
 * sehingga halaman langsung tampil tanpa menunggu server.
 * index.json mencatat kunci → {a: aksi, p: parameter, t: terakhir dipakai} untuk pembaruan di latar belakang.
 */
object CacheStore {
    private var index: JSONObject? = null

    private fun dir(ctx: Context) = File(ctx.filesDir, "datacache").apply { mkdirs() }
    private fun file(ctx: Context, key: String): File {
        val h = MessageDigest.getInstance("SHA-1").digest(key.toByteArray()).joinToString("") { "%02x".format(it) }
        return File(dir(ctx), "$h.json")
    }
    private fun idx(ctx: Context): JSONObject {
        index?.let { return it }
        val f = File(dir(ctx), "index.json")
        val o = try { if (f.exists()) JSONObject(f.readText()) else JSONObject() } catch (e: Exception) { JSONObject() }
        index = o; return o
    }
    private fun saveIdx(ctx: Context) { try { File(dir(ctx), "index.json").writeText(idx(ctx).toString()) } catch (_: Exception) {} }

    @Synchronized fun get(ctx: Context, key: String): String? {
        val f = file(ctx, key)
        return try { if (f.exists()) f.readText() else null } catch (e: Exception) { null }
    }

    /** touch=true → catat sebagai baru dipakai (dari aplikasi); worker latar belakang memakai touch=false. */
    @Synchronized fun put(ctx: Context, key: String, json: String, action: String, params: String, touch: Boolean = true) {
        try { file(ctx, key).writeText(json) } catch (_: Exception) { return }
        val ix = idx(ctx)
        val e = ix.optJSONObject(key) ?: JSONObject()
        if (action.isNotEmpty()) e.put("a", action)
        if (params.isNotEmpty()) e.put("p", params)
        if (touch || !e.has("t")) e.put("t", System.currentTimeMillis())
        ix.put(key, e)
        saveIdx(ctx)
    }

    @Synchronized fun keys(ctx: Context, prefix: String): String {
        val arr = JSONArray()
        val it = idx(ctx).keys()
        while (it.hasNext()) { val k = it.next(); if (k.startsWith(prefix)) arr.put(k) }
        return arr.toString()
    }

    /** Daftar data yang paling sering/baru dipakai untuk diperbarui di latar belakang. */
    @Synchronized fun recent(ctx: Context, prefix: String, maxAgeMs: Long, limit: Int): List<Triple<String, String, String>> {
        val now = System.currentTimeMillis()
        val out = mutableListOf<Pair<Long, Triple<String, String, String>>>()
        val ix = idx(ctx); val it = ix.keys()
        while (it.hasNext()) {
            val k = it.next(); if (!k.startsWith(prefix)) continue
            val e = ix.optJSONObject(k) ?: continue
            val a = e.optString("a"); val t = e.optLong("t")
            if (a.isEmpty() || now - t > maxAgeMs) continue
            out.add(t to Triple(k, a, e.optString("p", "{}")))
        }
        return out.sortedByDescending { it.first }.take(limit).map { it.second }
    }
}
