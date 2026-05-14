# ── MoPlayer Pro ProGuard Rules ──────────────────────────────────────
# Kotlin Serialization
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class ** {
    @kotlinx.serialization.Serializable *;
}

# Media3 / ExoPlayer — keep all player internals
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# LibVLC — keep ALL native loading paths and JNI bridge
-keep class org.videolan.** { *; }
-keep class org.videolan.libvlc.** { *; }
-keep class org.videolan.libvlc.util.** { *; }
-keep class org.videolan.libvlc.interfaces.** { *; }
-keepclassmembers class org.videolan.libvlc.** {
    native <methods>;
}

# Keep native method declarations that load libc++_shared.so
-keep class libcore.io.** { *; }

# Suppress warnings from VLC internals and crypto libs
-dontwarn org.videolan.**
-dontwarn libcore.io.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# Retrofit + OkHttp
-keep class com.moalfarras.moplayer.data.network.** { *; }
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses

# Room
-keep class com.moalfarras.moplayer.data.db.** { *; }
-keep class * extends androidx.room.RoomDatabase { *; }

# Coil
-keep class coil3.** { *; }
-dontwarn coil3.**

# ZXing (QR codes)
-keep class com.google.zxing.** { *; }

# Prevent R8 from removing the native library loading class
-keep class java.lang.System { native *** load*(...); }
