package id.alhuda.mobile

import java.net.HttpURLConnection
import java.net.URL

object Http {
    private fun open(url: URL, method: String): HttpURLConnection =
        (url.openConnection() as HttpURLConnection).apply {
            requestMethod = method
            instanceFollowRedirects = false
            connectTimeout = 20000
            readTimeout = 45000
            setRequestProperty("User-Agent", "AlhudaMobile-Android")
        }

    private fun body(c: HttpURLConnection): String {
        val s = if (c.responseCode >= 400) c.errorStream else c.inputStream
        return s?.bufferedReader()?.use { it.readText() } ?: ""
    }

    /** GET yang mengikuti pengalihan Apps Script (script.google.com → script.googleusercontent.com). */
    fun get(u: String): String {
        var url = URL(u)
        repeat(6) {
            val c = open(url, "GET")
            val code = c.responseCode
            if (code in 300..399) {
                val loc = c.getHeaderField("Location"); c.disconnect()
                url = URL(url, loc); return@repeat
            }
            return body(c).also { c.disconnect() }
        }
        throw IllegalStateException("Terlalu banyak pengalihan")
    }

    /** POST teks ke Web App. Apps Script membalas 302 → hasilnya diambil dengan GET. */
    fun post(u: String, data: String): String {
        val c = open(URL(u), "POST")
        c.doOutput = true
        c.setRequestProperty("Content-Type", "text/plain;charset=utf-8")
        c.outputStream.use { it.write(data.toByteArray(Charsets.UTF_8)) }
        val code = c.responseCode
        if (code in 300..399) {
            val loc = c.getHeaderField("Location"); c.disconnect()
            return get(URL(URL(u), loc).toString())
        }
        return body(c).also { c.disconnect() }
    }
}
