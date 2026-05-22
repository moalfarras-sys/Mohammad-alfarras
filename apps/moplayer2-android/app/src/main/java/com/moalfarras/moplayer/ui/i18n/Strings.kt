package com.moalfarras.moplayer.ui.i18n

import androidx.compose.runtime.staticCompositionLocalOf
import java.util.Locale

/**
 * Bilingual (English-base + Arabic) string system for MoPlayer Pro.
 *
 * English is the source/base language. Arabic is a full first-class translation.
 * Language is driven by [AppSettings.languageTag] ("system" | "en" | "ar"); when
 * "system", the device locale decides (Arabic device -> Arabic, otherwise English).
 *
 * UI code reads strings via [LocalStrings].current; non-Composable code (ViewModels,
 * repositories) reads via [I18n].strings.
 */
enum class AppLanguage(val isRtl: Boolean, val tag: String) {
    EN(false, "en"),
    AR(true, "ar");

    companion object {
        fun resolve(languageTag: String?): AppLanguage = when (languageTag?.lowercase(Locale.US)) {
            "ar" -> AR
            "en" -> EN
            else -> if (Locale.getDefault().language == "ar") AR else EN
        }
    }
}

/** Global access for non-Composable layers (ViewModels/repositories). Kept in sync by the theme. */
object I18n {
    @Volatile
    var current: AppLanguage = AppLanguage.EN
    val strings: Strings get() = stringsFor(current)
}

fun stringsFor(language: AppLanguage): Strings = if (language == AppLanguage.AR) ArStrings else EnStrings

val LocalStrings = staticCompositionLocalOf { EnStrings }

/**
 * Every user-facing string. Add new fields here and fill both [EnStrings] and [ArStrings].
 */
class Strings(
    // ── Navigation / common ──────────────────────────────────────────
    val navSearch: String,
    val navHome: String,
    val navLive: String,
    val navMovies: String,
    val navSeries: String,
    val navFavorites: String,
    val navSettings: String,
    val ready: String,
    val cancel: String,
    val back: String,
    val retry: String,
    val premiumUi: String,
    val liveNow: String,
    // ── Login ────────────────────────────────────────────────────────
    val loginSubtitleActivation: String,
    val loginSubtitleXtream: String,
    val loginSubtitleM3u: String,
    val loginSubtitleFile: String,
    val loginChooseMethod: String,
    val loginTabM3u: String,
    val loginTabXtream: String,
    val loginTabFile: String,
    val loginTabCode: String,
    val loginName: String,
    val loginPlaylistName: String,
    val loginM3uUrl: String,
    val loginEpgUrlOptional: String,
    val loginServerUrl: String,
    val loginUser: String,
    val loginUsername: String,
    val loginPassword: String,
    val loginPasswordShort: String,
    val loginEnter: String,
    val loginPickM3uFile: String,
    val loginFileHintTv: String,
    val loginFileHintMobile: String,
    val loginActivationCode: String,
    val loginActivationHint: String,
    val loginActivateDevice: String,
    val loginManualCode: String,
    val loginUseCode: String,
    val loginRefreshQr: String,
    val loginCreateQrHint: String,
    val loginTagline: String,
    val loginShowPassword: String,
    val loginHidePassword: String,
    val loginFileEmpty: String,
    val loginFileUnreadable: String,
    val activationWaiting: String,
    val activationActivated: String,
    val activationExpired: String,
    val activationErrorGeneric: String,
    val secondsShort: String,
    // ── Settings: language ───────────────────────────────────────────
    val settingsLanguageTitle: String,
    val settingsLanguageHint: String,
    val langSystem: String,
    val langEnglish: String,
    val langArabic: String,
)

val EnStrings = Strings(
    navSearch = "Search",
    navHome = "Home",
    navLive = "Live TV",
    navMovies = "Movies",
    navSeries = "Series",
    navFavorites = "Favorites",
    navSettings = "Settings",
    ready = "Ready",
    cancel = "Cancel",
    back = "Back",
    retry = "Retry",
    premiumUi = "Premium UI",
    liveNow = "Live now",
    loginSubtitleActivation = "Scan the QR code or enter the code to link this device",
    loginSubtitleXtream = "Enter your Xtream server details to sign in",
    loginSubtitleM3u = "Enter an M3U playlist URL to sign in",
    loginSubtitleFile = "Pick an M3U file from your device",
    loginChooseMethod = "Choose a sign-in method",
    loginTabM3u = "M3U",
    loginTabXtream = "Xtream",
    loginTabFile = "File",
    loginTabCode = "Code",
    loginName = "Name",
    loginPlaylistName = "Playlist name",
    loginM3uUrl = "M3U URL",
    loginEpgUrlOptional = "XMLTV URL (optional)",
    loginServerUrl = "Server URL",
    loginUser = "Username",
    loginUsername = "Username",
    loginPassword = "Password",
    loginPasswordShort = "Password",
    loginEnter = "Sign in",
    loginPickM3uFile = "Pick M3U file",
    loginFileHintTv = "Choose an M3U or M3U8 file from the device. It is parsed and stored locally without uploading to any server.",
    loginFileHintMobile = "Choose an M3U file from the device to parse and store it locally.",
    loginActivationCode = "Activation code",
    loginActivationHint = "Enter the code from the MoPlayer Pro Control panel to link this device without typing server details on the TV.",
    loginActivateDevice = "Activate device",
    loginManualCode = "Manual activation code",
    loginUseCode = "Use code",
    loginRefreshQr = "Refresh QR",
    loginCreateQrHint = "Create a temporary QR code to link this TV.",
    loginTagline = "IPTV for TV and mobile",
    loginShowPassword = "Show password",
    loginHidePassword = "Hide password",
    loginFileEmpty = "The file is empty or unreadable",
    loginFileUnreadable = "Could not read the M3U file",
    activationWaiting = "Waiting for activation",
    activationActivated = "Activated. Starting sync…",
    activationExpired = "The code expired. Refresh the QR.",
    activationErrorGeneric = "Activation failed right now.",
    secondsShort = "s",
    settingsLanguageTitle = "Language",
    settingsLanguageHint = "Choose the app language. \"System\" follows your device language.",
    langSystem = "System",
    langEnglish = "English",
    langArabic = "العربية",
)

val ArStrings = Strings(
    navSearch = "بحث",
    navHome = "الرئيسية",
    navLive = "بث مباشر",
    navMovies = "أفلام",
    navSeries = "مسلسلات",
    navFavorites = "مفضلتي",
    navSettings = "الإعدادات",
    ready = "جاهز",
    cancel = "إلغاء",
    back = "رجوع",
    retry = "إعادة",
    premiumUi = "Premium UI",
    liveNow = "مباشر الآن",
    loginSubtitleActivation = "امسح رمز QR أو أدخل الكود لربط الجهاز",
    loginSubtitleXtream = "أدخل بيانات سيرفر Xtream للدخول",
    loginSubtitleM3u = "أدخل رابط قائمة M3U للدخول",
    loginSubtitleFile = "اختر ملف M3U من جهازك",
    loginChooseMethod = "اختر طريقة الدخول",
    loginTabM3u = "M3U",
    loginTabXtream = "Xtream",
    loginTabFile = "File",
    loginTabCode = "Code",
    loginName = "الاسم",
    loginPlaylistName = "اسم القائمة",
    loginM3uUrl = "رابط M3U",
    loginEpgUrlOptional = "رابط XMLTV اختياري",
    loginServerUrl = "رابط السيرفر",
    loginUser = "يوزر",
    loginUsername = "اسم المستخدم",
    loginPassword = "باسورد",
    loginPasswordShort = "كلمة المرور",
    loginEnter = "دخول",
    loginPickM3uFile = "اختيار ملف M3U",
    loginFileHintTv = "اختر ملف M3U أو M3U8 من الجهاز. سيتم تحليله وحفظه محليًا بدون رفعه لأي خادم.",
    loginFileHintMobile = "اختر ملف M3U من الجهاز لتحليله وحفظه محليًا.",
    loginActivationCode = "كود التفعيل",
    loginActivationHint = "أدخل الكود من لوحة MoPlayer Pro Control لربط الجهاز بدون كتابة بيانات السيرفر على التلفزيون.",
    loginActivateDevice = "تفعيل الجهاز",
    loginManualCode = "كود التفعيل اليدوي",
    loginUseCode = "استخدام الكود",
    loginRefreshQr = "تحديث QR",
    loginCreateQrHint = "أنشئ كود QR مؤقت لربط هذا التلفزيون.",
    loginTagline = "IPTV for TV and mobile",
    loginShowPassword = "إظهار كلمة المرور",
    loginHidePassword = "إخفاء كلمة المرور",
    loginFileEmpty = "الملف فارغ أو غير قابل للقراءة",
    loginFileUnreadable = "تعذر قراءة ملف M3U",
    activationWaiting = "بانتظار التفعيل",
    activationActivated = "تم التفعيل. بدء المزامنة...",
    activationExpired = "انتهت صلاحية الكود. حدّث QR.",
    activationErrorGeneric = "تعذر التفعيل الآن.",
    secondsShort = "ث",
    settingsLanguageTitle = "اللغة",
    settingsLanguageHint = "اختر لغة التطبيق. «النظام» يتبع لغة جهازك.",
    langSystem = "النظام",
    langEnglish = "English",
    langArabic = "العربية",
)
