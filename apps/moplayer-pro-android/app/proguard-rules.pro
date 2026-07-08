# ── kotlinx.serialization ─────────────────────────────────────────────
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class ** {
    @kotlinx.serialization.Serializable *;
}
-keep,allowoptimization class com.moalfarras.moplayer.data.network.**Dto { *; }
-keep,allowoptimization class com.moalfarras.moplayer.data.network.**Dto$* { *; }

# ── Retrofit 3 / OkHttp 5 ────────────────────────────────────────────
-keep,allowobfuscation interface com.moalfarras.moplayer.data.network.*Service
-keepclassmembers interface com.moalfarras.moplayer.data.network.*Service {
    <methods>;
}
-dontwarn retrofit2.**
-dontwarn okhttp3.internal.platform.**

# ── WebView JavaScript bridge (trailer preview IFrame) ───────────────
# The trailer WebView's @JavascriptInterface methods (onPlaying/onError) are
# only ever invoked from JS, so shrinking/obfuscation would otherwise drop or
# rename them and the trailer would never reveal or fall back. Keep them intact.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Media3 / ExoPlayer ───────────────────────────────────────────────
-keep class androidx.media3.** { *; }

# ── LibVLC ────────────────────────────────────────────────────────────
-keep class org.videolan.** { *; }
-keep class libcore.io.** { *; }
-dontwarn org.videolan.**
-dontwarn libcore.io.**

# ── TLS / Security providers ─────────────────────────────────────────
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
