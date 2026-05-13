plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.devtools.ksp")
}

import java.util.Properties

val localProperties = Properties().apply {
    val localFile = rootProject.file("local.properties")
    if (localFile.isFile) {
        localFile.inputStream().use(::load)
    }
}

val releaseSigningProperties = Properties().apply {
    val signingFile = rootProject.file("../moplayer-android/keystore.properties")
    if (signingFile.isFile) {
        signingFile.inputStream().use(::load)
    }
}

fun secretProperty(name: String): String =
    (providers.gradleProperty(name).orNull
        ?: localProperties.getProperty(name)
        ?: System.getenv(name)
        ?: "")
        .trim()
        .trim('"')
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")

fun secretPropertyAny(vararg names: String): String =
    names.firstNotNullOfOrNull { name ->
        secretProperty(name).takeIf { it.isNotBlank() }
    }.orEmpty()

android {
    namespace = "com.moalfarras.moplayerpro"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.moalfarras.moplayerpro"
        minSdk = 23
        targetSdk = 36
        versionCode = 6
        versionName = "2.1.2"
        val activationUrl = secretProperty("ACTIVATION_URL").ifBlank {
            secretPropertyAny("NEXT_PUBLIC_WEB_APP_URL", "NEXT_PUBLIC_ADMIN_APP_URL")
                .trimEnd('/')
                .takeIf { it.isNotBlank() }
                ?.let { "$it/activate?product=moplayer2" }
                ?: "https://moalfarras.space/activate?product=moplayer2"
        }
        buildConfigField("String", "SUPABASE_URL", "\"${secretPropertyAny("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${secretPropertyAny("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", "EXPO_PUBLIC_SUPABASE_KEY")}\"")
        buildConfigField("String", "WEATHER_API_KEY", "\"${secretProperty("WEATHER_API_KEY")}\"")
        buildConfigField("String", "FOOTBALL_API_KEY", "\"${secretPropertyAny("FOOTBALL_API_KEY", "API_FOOTBALL_KEY", "RAPIDAPI_FOOTBALL_KEY")}\"")
        buildConfigField("String", "ACTIVATION_URL", "\"$activationUrl\"")
        val webApiBaseUrl = secretProperty("WEB_API_BASE_URL").ifBlank { "https://moalfarras.space" }
        val appProductSlug = secretProperty("APP_PRODUCT_SLUG").ifBlank { "moplayer2" }
        buildConfigField("String", "WEB_API_BASE_URL", "\"$webApiBaseUrl\"")
        buildConfigField("String", "APP_PRODUCT_SLUG", "\"$appProductSlug\"")

        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            if (releaseSigningProperties.isNotEmpty()) {
                keyAlias = releaseSigningProperties.getProperty("keyAlias")
                keyPassword = releaseSigningProperties.getProperty("keyPassword")
                storeFile = rootProject.file("../moplayer-android/moplayer-release.keystore")
                storePassword = releaseSigningProperties.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            if (releaseSigningProperties.isNotEmpty()) {
                signingConfig = signingConfigs.getByName("release")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    kotlin {
        jvmToolchain(17)
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a")
            isUniversalApk = true
        }
    }

    packaging {
        resources {
            excludes += setOf(
                "/META-INF/{AL2.0,LGPL2.1}",
                "META-INF/INDEX.LIST",
                "META-INF/io.netty.versions.properties",
            )
        }
        jniLibs {
            useLegacyPackaging = true
            excludes += setOf(
                "**/x86/**",
                "**/x86_64/**",
            )
        }
    }
}

ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.02.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.activity:activity-compose:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.10.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.10.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.10.0")
    implementation("androidx.navigation:navigation-compose:2.9.8")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.tv:tv-material:1.1.0-rc01")
    implementation("androidx.leanback:leanback:1.2.0")

    implementation("androidx.media3:media3-exoplayer:1.10.0")
    implementation("androidx.media3:media3-exoplayer-hls:1.10.0")
    implementation("androidx.media3:media3-exoplayer-dash:1.10.0")
    implementation("androidx.media3:media3-exoplayer-smoothstreaming:1.10.0")
    implementation("androidx.media3:media3-exoplayer-rtsp:1.10.0")
    implementation("androidx.media3:media3-ui:1.10.0")
    implementation("androidx.media3:media3-session:1.10.0")
    implementation("androidx.media3:media3-datasource-okhttp:1.10.0")
    implementation("org.videolan.android:libvlc-all:3.6.2")
    implementation("com.google.android.gms:play-services-cast-framework:22.1.0")

    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:3.0.0")
    implementation("com.squareup.okhttp3:okhttp:5.3.0")
    implementation("com.squareup.okhttp3:logging-interceptor:5.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.7.1")

    implementation("androidx.paging:paging-runtime-ktx:3.4.0")
    implementation("androidx.paging:paging-compose:3.4.0")
    implementation("androidx.room:room-runtime:2.8.4")
    implementation("androidx.room:room-ktx:2.8.4")
    implementation("androidx.room:room-paging:2.8.4")

    implementation("io.coil-kt.coil3:coil-compose:3.3.0")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.3.0")
    implementation("com.airbnb.android:lottie-compose:6.7.1")
    implementation("androidx.palette:palette-ktx:1.0.0")
    implementation("androidx.datastore:datastore-preferences:1.2.0")
    implementation("androidx.work:work-runtime-ktx:2.11.0")
    ksp("androidx.room:room-compiler:2.8.4")
    implementation("androidx.profileinstaller:profileinstaller:1.4.1")
    implementation("com.google.zxing:core:3.5.3")
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
