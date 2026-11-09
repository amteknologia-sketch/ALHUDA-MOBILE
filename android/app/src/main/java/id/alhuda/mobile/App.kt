package id.alhuda.mobile

object App {
    const val PREFS = "alhuda"
    @Volatile var foreground = false
    val queueLock = Any()
}
