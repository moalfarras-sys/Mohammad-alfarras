-keep class kotlinx.serialization.** { *; }
-keepclassmembers class ** {
    @kotlinx.serialization.Serializable *;
}
-keep class androidx.media3.** { *; }
-keep class org.videolan.** { *; }
-keep class libcore.io.** { *; }
-dontwarn org.videolan.**
-dontwarn libcore.io.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
