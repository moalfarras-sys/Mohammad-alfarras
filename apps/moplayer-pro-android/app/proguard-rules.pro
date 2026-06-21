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
