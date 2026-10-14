package host.lambert.newsdevice

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.view.WindowManager
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Local Expo module: Android framework APIs, not a WebView JavaScript bridge. */
class NewsDeviceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NewsDevice")

    // Small synchronous read. Do not put networking or disk work in a Function.
    Function("getSnapshot") {
      val context = appContext.reactContext ?: error("React context unavailable")
      val battery = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
      val level = battery?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
      val scale = battery?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
      val batteryPercent = if (level >= 0 && scale > 0) (level * 100 / scale) else null
      val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      val memory = ActivityManager.MemoryInfo()
      (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memory)
      mapOf(
        "manufacturer" to Build.MANUFACTURER,
        "model" to Build.MODEL,
        "androidVersion" to Build.VERSION.RELEASE,
        "sdk" to Build.VERSION.SDK_INT,
        "batteryPercent" to batteryPercent,
        "powerSaveMode" to power.isPowerSaveMode,
        "availableMemoryMb" to memory.availMem / (1024 * 1024),
        "totalMemoryMb" to memory.totalMem / (1024 * 1024)
      )
    }

    // Window changes must run on Android's UI thread.
    AsyncFunction("setKeepScreenOn") { enabled: Boolean ->
      val activity = appContext.currentActivity ?: error("No foreground Activity")
      if (enabled) activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      else activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("openAppSettings") {
      val context = appContext.reactContext ?: error("React context unavailable")
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", context.packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }.runOnQueue(Queues.MAIN)

    OnDestroy {
      val activity = appContext.currentActivity
      activity?.runOnUiThread {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }
}
