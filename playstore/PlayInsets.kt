package id.alhuda.mobile

import android.app.Activity
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Khusus build Play Store (target Android 16 / API 36).
 * Mulai Android 15 aplikasi selalu tampil "edge-to-edge" (di belakang status bar & tombol navigasi),
 * jadi tampilan dibungkus: pita atas (warna hijau seperti status bar) + WebView + pita bawah (putih).
 * Tinggi pita mengikuti status bar, tombol navigasi, dan keyboard.
 */
object PlayInsets {
    private var top: View? = null

    fun wrap(activity: Activity, content: View): View {
        WindowCompat.setDecorFitsSystemWindows(activity.window, false)
        val ctrl = WindowCompat.getInsetsController(activity.window, activity.window.decorView)
        ctrl.isAppearanceLightStatusBars = false     // ikon status bar putih (latar hijau)
        ctrl.isAppearanceLightNavigationBars = true  // ikon navigasi gelap (latar putih)

        val root = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
        }
        val topBar = View(activity).apply { setBackgroundColor(Color.parseColor("#0F6E4F")) }
        val bottomBar = View(activity).apply { setBackgroundColor(Color.WHITE) }
        top = topBar
        root.addView(topBar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0))
        root.addView(content, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        root.addView(bottomBar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0))

        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, 0, bars.right, 0)
            topBar.layoutParams = (topBar.layoutParams as LinearLayout.LayoutParams).apply { height = bars.top }
            bottomBar.layoutParams = (bottomBar.layoutParams as LinearLayout.LayoutParams).apply { height = maxOf(bars.bottom, ime.bottom) }
            topBar.requestLayout(); bottomBar.requestLayout()
            WindowInsetsCompat.CONSUMED
        }
        return root
    }

    /** Dipanggil dari AndroidBridge.setStatusColor (ganti tema warna). */
    fun setTopColor(color: Int) {
        top?.setBackgroundColor(color)
    }
}
