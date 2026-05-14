# MoPlayer ProGuard Rules
# Comprehensive rules for production release

#===============================================================================
# General Android and Kotlin
#===============================================================================

# Keep attributes for proper reflection and serialization
-keepattributes Signature
-keepattributes Exceptions
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes InnerClasses,EnclosingMethod

# Kotlin specific
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

#===============================================================================
# VLC Media Player - Enhanced rules for 4K/8K playback stability
#===============================================================================

# Keep all VLC classes and interfaces
-keep class org.videolan.** { *; }
-keep interface org.videolan.** { *; }
-keepclassmembers class org.videolan.** { *; }
-dontwarn org.videolan.**

# Preserve VLC event listeners and callbacks (critical for playback)
-keep class * implements org.videolan.libvlc.interfaces.IVLCEvent { *; }
-keep class * implements org.videolan.libvlc.interfaces.IVLCVout$* { *; }
-keep class org.videolan.libvlc.MediaPlayer$Event { *; }
-keep class org.videolan.libvlc.Media$* { *; }

# Keep VLC enums (used in when expressions)
-keepclassmembers enum org.videolan.libvlc.** {
    <fields>;
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Preserve native methods for JNI (critical for VLC)
-keepclasseswithmembernames class org.videolan.** {
    native <methods>;
}

# Keep VLC VideoLayout (used in XML layouts)
-keep class org.videolan.libvlc.util.VLCVideoLayout { *; }
-keep class org.videolan.libvlc.util.VLCVideoLayout$* { *; }

# Preserve lambda classes used in event listeners
-keepclassmembers class * {
    private static synthetic *** lambda$*(...);
}

# Keep classes that might be accessed via reflection
-keepclassmembers class org.videolan.libvlc.** {
    public <methods>;
    public <fields>;
}

#===============================================================================
# Retrofit & OkHttp
#===============================================================================

-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*

# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okio.** { *; }

#===============================================================================
# Gson
#===============================================================================

-keep class com.google.gson.stream.** { *; }
-keep class com.mo.moplayer.data.remote.dto.** { *; }
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

#===============================================================================
# Room Database
#===============================================================================

-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-keep @androidx.room.Dao class *
-dontwarn androidx.room.paging.**

# Keep Room generated code
-keep class * extends androidx.room.RoomDatabase { *; }
-keep class * implements androidx.room.RoomDatabase$Callback { *; }

#===============================================================================
# Glide Image Loading
#===============================================================================

-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
    <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
    **[] $VALUES;
    public *;
}
-keep class com.bumptech.glide.load.data.ParcelFileDescriptorRewinder$InternalRewinder {
    *** rewind();
}

#===============================================================================
# Hilt Dependency Injection
#===============================================================================

-keepclasseswithmembers class * {
    @dagger.hilt.* <methods>;
}
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ComponentSupplier { *; }
-keep class * implements dagger.hilt.internal.GeneratedComponent { *; }
-keep class **_HiltModules { *; }
-keep class **_HiltModules$* { *; }

#===============================================================================
# Entity and DTO Classes
#===============================================================================

-keep class com.mo.moplayer.data.local.entity.** { *; }
-keep class com.mo.moplayer.data.remote.dto.** { *; }

#===============================================================================
# Lottie Animation
#===============================================================================

-dontwarn com.airbnb.lottie.**
-keep class com.airbnb.lottie.** { *; }

#===============================================================================
# Google Cast (Chromecast)
#===============================================================================

-keep class com.google.android.gms.cast.** { *; }
-keep class com.google.android.gms.cast.framework.** { *; }
-dontwarn com.google.android.gms.cast.**

# MediaRouter
-keep class androidx.mediarouter.** { *; }
-dontwarn androidx.mediarouter.**

#===============================================================================
# WorkManager
#===============================================================================

-keep class * extends androidx.work.Worker
-keep class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keep class androidx.work.** { *; }
-dontwarn androidx.work.**

# Hilt WorkManager integration
-keep class * extends androidx.hilt.work.HiltWorkerFactory { *; }

#===============================================================================
# Navigation Component
#===============================================================================

-keepnames class androidx.navigation.fragment.NavHostFragment
-keep class * extends androidx.navigation.Navigator { *; }
-dontwarn androidx.navigation.**

#===============================================================================
# Coroutines
#===============================================================================

-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}
-dontwarn kotlinx.coroutines.**

#===============================================================================
# DataStore Preferences
#===============================================================================

-keep class androidx.datastore.** { *; }
-keepclassmembers class * extends com.google.protobuf.GeneratedMessageLite {
    <fields>;
}

#===============================================================================
# Android TV Leanback
#===============================================================================

-keep class androidx.leanback.** { *; }
-dontwarn androidx.leanback.**

# Keep focus and presenter classes
-keep class * extends androidx.leanback.widget.Presenter { *; }
-keep class * extends androidx.leanback.widget.PresenterSelector { *; }

#===============================================================================
# Lifecycle Components
#===============================================================================

-keep class * extends androidx.lifecycle.ViewModel { *; }
-keep class * extends androidx.lifecycle.AndroidViewModel { *; }
-keepclassmembers class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}

#===============================================================================
# Paging 3
#===============================================================================

-keep class androidx.paging.** { *; }
-dontwarn androidx.paging.**

#===============================================================================
# App-specific keeps
#===============================================================================

# Keep all Activities, Fragments, Services, BroadcastReceivers
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends androidx.fragment.app.Fragment

# Keep custom views
-keep class com.mo.moplayer.ui.widgets.** { *; }

# Keep ViewBinding generated classes
-keep class com.mo.moplayer.databinding.** { *; }

#===============================================================================
# Media3 / ExoPlayer
#===============================================================================

-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-dontwarn androidx.media3.**

# Keep MediaSession callbacks
-keep class * extends android.support.v4.media.session.MediaSessionCompat$Callback { *; }

#===============================================================================
# AndroidX Lifecycle / Media (for MediaSession)
#===============================================================================

-keep class android.support.v4.media.** { *; }
-keep class android.support.v4.media.session.** { *; }
-dontwarn android.support.v4.media.**

-keep class androidx.media.** { *; }
-keep class androidx.media.session.** { *; }
-dontwarn androidx.media.**

#===============================================================================
# Suppress warnings
#===============================================================================

-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn sun.misc.Unsafe
