package id.alhuda.mobile

import java.net.HttpURLConnection
import java.net.URL

object Http {
    /** GET sederhana yang mengikuti pengalihan Apps Script (script.google.com → script.googleusercontent.com). */
    fun get(u: String): String {
        var url = URL(u)
        repeat(6) {
            val c = url.openConnection() as HttpURLConnection
            c.instanceFollowRedirects = false
            c.connectTimeout = 15000; c.readTimeout = 25000
            val code = c.responseCode
            if (code in 300..399) {
                val loc = c.getHeaderField("Location"); c.disconnect()
                url = URL(url, loc); return@repeat
            }
            if (code !in 200..299) { c.disconnect(); throw IllegalStateException("HTTP $code") }
            return c.inputStream.bufferedReader().use { it.readText() }
        }
        throw IllegalStateException("Terlalu banyak pengalihan")
    }
}
