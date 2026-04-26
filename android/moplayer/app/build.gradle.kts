import java.util.Properties
import java.util.Collections
import java.io.FileInputStream
import java.util.Locale
import java.util.zip.ZipFile

// Workaround for R.jar file lock on Windows when building from Android Studio.
// Output to build-output/ to avoid IDE and daemon holding files in app/build/
layout.buildDirectory.set(file("${rootProject.projectDir}/build-output/app"))

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

// Load keystore properties if available
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

// Load local.properties for API keys (gitignored)
val localPropertiesFile = rootProject.file("local.properties")
val localProperties = Properties()
if (localPropertiesFile.exists()) {
    localProperties.load(FileInputStream(localPropertiesFile))
}
val tmdbApiKey = localProperties.getProperty("tmdb.api.key", "")
val tvdbApiKey = localProperties.getProperty("tvdb.api.key", "")
val webApiBaseUrl = localProperties.getProperty("web.api.base.url", "https://moalfarras.space")
val isPlayBundleBuild = gradle.startParameter.taskNames.any { it.contains("bundleplay", ignoreCase = true) }
val includeX86Abis = providers.gradleProperty("includeX86Abis").orNull?.toBoolean() ?: false
val sideloadAbis = mutableListOf("armeabi-v7a", "arm64-v8a").apply {
    if (includeX86Abis) {
        add("x86")
        add("x86_64")
    }
}

android {
    namespace = "com.mo.moplayer"
    compileSdk = 35
    flavorDimensions += "distribution"

    defaultConfig {
        applicationId = "com.mo.moplayer"
        minSdk = 24
        targetSdk = 35
        versionCode = 2
        versionName = "2.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // Vector drawable support for older APIs
        vectorDrawables.useSupportLibrary = true
        
        // Public website API proxy. Weather and sports provider keys stay server-side.
        buildConfigField("String", "WEB_API_BASE_URL", "\"${webApiBaseUrl.trimEnd('/')}\"")
        buildConfigField("String", "TMDB_API_KEY", "\"$tmdbApiKey\"")
        buildConfigField("String", "TVDB_API_KEY", "\"$tvdbApiKey\"")
    }

    // Signing configuration for release builds
    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            isDebuggable = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Use release signing config if available
            if (keystorePropertiesFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    productFlavors {
        create("play") {
            dimension = "distribution"
        }
        create("sideload") {
            dimension = "distribution"
        }
    }

    // ABI splits for optimized APK sizes per architecture
    splits {
        abi {
            isEnable = !isPlayBundleBuild
            reset()
            include(*sideloadAbis.toTypedArray())
            isUniversalApk = false
        }
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
    
    // Lint options for release
    lint {
        abortOnError = false
        checkReleaseBuilds = true
    }
    
    // Packaging options to avoid conflicts
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/DEPENDENCIES"
        }
    }
}

dependencies {
    // Core Android
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.recyclerview)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.fragment)

    // Android TV Leanback
    implementation(libs.androidx.leanback)

    // Lifecycle
    implementation(libs.androidx.lifecycle.viewmodel)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.lifecycle.livedata)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    implementation(libs.androidx.room.paging)
    ksp(libs.androidx.room.compiler)

    // Paging 3
    implementation(libs.androidx.paging.runtime)
    implementation(libs.androidx.paging.common)

    // Retrofit & Networking
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.gson)

    // Hilt DI
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    
    // WorkManager with Hilt
    implementation(libs.work.runtime)
    implementation(libs.hilt.work)
    ksp(libs.hilt.compiler.androidx)

    // Coroutines
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)

    // Image Loading
    implementation(libs.glide)
    ksp(libs.glide.compiler)

    // Lottie Animation
    implementation(libs.lottie)

    // VLC Player
    implementation(libs.vlc.android)

    // Navigation
    implementation(libs.androidx.navigation.fragment)
    implementation(libs.androidx.navigation.ui)

    // DataStore
    implementation(libs.androidx.datastore)
    
    // Google Cast (Chromecast)
    implementation(libs.google.cast.framework)
    implementation(libs.androidx.mediarouter)

    // Security - Encrypted credentials storage
    implementation(libs.androidx.security.crypto)

    // Splash Screen API
    implementation(libs.androidx.splashscreen)

    // Website activation QR code
    implementation(libs.zxing.core)

    // Testing
    testImplementation(libs.junit)
    testImplementation("io.mockk:mockk:1.13.13")
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.kotlinx.coroutines.test)
}

tasks.register("buildPlayRelease") {
    group = "distribution"
    description = "Build Play Store artifact (AAB only)"
    dependsOn("bundlePlayRelease")
}

tasks.register("buildSideloadRelease") {
    group = "distribution"
    description = "Build sideload release split APKs"
    dependsOn("assembleSideloadRelease")
}

tasks.register("reportArtifactSizes") {
    group = "distribution"
    description = "Report artifact sizes and top entries for APK/AAB files"
    doLast {
        val outputsDir = file("${rootProject.projectDir}/build-output/app/outputs")
        if (!outputsDir.exists()) {
            println("No outputs found at ${outputsDir.absolutePath}")
            return@doLast
        }
        val artifacts = outputsDir.walkTopDown()
            .filter { it.isFile && (it.extension == "apk" || it.extension == "aab") }
            .sortedByDescending { it.length() }
            .toList()
        if (artifacts.isEmpty()) {
            println("No APK/AAB artifacts found.")
            return@doLast
        }
        artifacts.forEach { artifact ->
            val sizeMb = artifact.length() / (1024.0 * 1024.0)
            println("${artifact.name}: ${"%.2f".format(Locale.US, sizeMb)} MB")
            if (artifact.extension == "apk") {
                ZipFile(artifact).use { zip ->
                    println("  Top 20 entries:")
                    Collections.list(zip.entries()).asSequence()
                        .sortedByDescending { it.size }
                        .take(20)
                        .forEach { entry ->
                            val entryMb = entry.size / (1024.0 * 1024.0)
                            println("    ${entry.name}: ${"%.2f".format(Locale.US, entryMb)} MB")
                        }
                }
            }
        }
    }
}

tasks.register("checkArtifactSizeLimits") {
    group = "verification"
    description = "Fail build if release artifacts exceed size limits"
    doLast {
        val apkLimitMb = 55.0
        val aabLimitMb = 90.0
        val outputsDir = file("${rootProject.projectDir}/build-output/app/outputs")
        val allFiles = outputsDir.takeIf { it.exists() }?.walkTopDown()?.filter { it.isFile }?.toList().orEmpty()

        val arm64SideloadApk = allFiles.firstOrNull {
            it.extension == "apk" &&
                it.name.contains("arm64-v8a", ignoreCase = true) &&
                it.name.contains("sideload", ignoreCase = true) &&
                it.name.contains("release", ignoreCase = true)
        }
        val playAab = allFiles.firstOrNull {
            it.extension == "aab" &&
                it.name.contains("play", ignoreCase = true) &&
                it.name.contains("release", ignoreCase = true)
        }

        if (arm64SideloadApk != null) {
            val sizeMb = arm64SideloadApk.length() / (1024.0 * 1024.0)
            if (sizeMb > apkLimitMb) {
                throw GradleException("arm64 sideload release APK is ${"%.2f".format(Locale.US, sizeMb)} MB, limit is ${apkLimitMb} MB")
            }
        } else {
            throw GradleException("arm64 sideload release APK not found. Run assembleSideloadRelease first.")
        }

        if (playAab != null) {
            val sizeMb = playAab.length() / (1024.0 * 1024.0)
            if (sizeMb > aabLimitMb) {
                throw GradleException("play release AAB is ${"%.2f".format(Locale.US, sizeMb)} MB, limit is ${aabLimitMb} MB")
            }
        } else {
            throw GradleException("play release AAB not found. Run bundlePlayRelease first.")
        }
    }
}

// KSP inspects the generated R.jar. With the custom Windows-friendly build
// output directory, Gradle can otherwise start KSP before the matching
// process<Variant>Resources task has materialized that jar.
tasks.matching { it.name.startsWith("ksp") && it.name.endsWith("Kotlin") }.configureEach {
    val variant = name.removePrefix("ksp").removeSuffix("Kotlin")
    if (!variant.endsWith("UnitTest") && !variant.endsWith("AndroidTest")) {
        dependsOn("process${variant}Resources")
    }
}
