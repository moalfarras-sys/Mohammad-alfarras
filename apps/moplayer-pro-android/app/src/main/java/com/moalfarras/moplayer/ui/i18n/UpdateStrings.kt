package com.moalfarras.moplayer.ui.i18n

import com.moalfarras.moplayer.data.repository.UpdateError

/**
 * In-app update, forced-update/maintenance screen and About copy. Versions, sizes, codes and
 * URLs are LTR data and are isolated with [ltr] inside Arabic sentences.
 */
class UpdateStrings(
    // Block screen
    val blockUpdateTitle: String,
    val blockUpdateBody: String,
    val blockMaintenanceTitle: String,
    val blockMaintenanceBody: String,
    val blockDisabledTitle: String,
    val blockDisabledBody: String,
    val blockTryAgain: String,
    val blockChecking: String,
    val blockStillBlocked: String,
    val blockUnreachable: String,
    val blockExit: String,
    // Versions and notes
    val versions: (installed: String, latest: String) -> String,
    val whatsNew: String,
    val lastChecked: (time: String) -> String,
    val downloadedOf: (done: String, total: String) -> String,
    // Status lines
    val statusIdle: String,
    val statusCheckFailed: String,
    val statusReconnecting: String,
    val statusVerifying: String,
    val statusReady: String,
    val statusInstallerOpened: String,
    val statusInstalling: String,
    val statusInstalled: String,
    val statusNeedsPermission: String,
    // Buttons
    val updateNow: String,
    val cancelDownload: String,
    val installNow: String,
    val allowInstalls: String,
    val working: String,
    // Fallback install paths
    val otherWaysTitle: String,
    val downloaderHint: (code: String) -> String,
    val qrHint: String,
    val openDownloadPageFailed: String,
    // Unknown-sources permission dialog
    val permissionTitle: String,
    val permissionBody: String,
    val permissionOpenSettings: String,
    val permissionNoScreen: String,
    val permissionStepsTitle: String,
    val permissionStepsAndroidTv: String,
    val permissionStepsFireTv: String,
    // Errors
    private val errNetwork: String,
    private val errServer: (code: String) -> String,
    private val errStalled: String,
    private val errStorage: String,
    private val errChecksum: String,
    private val errInvalidApk: String,
    private val errInstallCancelled: String,
    private val errInstallBlocked: String,
    private val errInstallConflict: String,
    private val errInstallIncompatible: String,
    private val errInstallStorage: String,
    private val errInstallerUnavailable: String,
    private val errInstallFailed: String,
    private val errUnknown: String,
    // About
    val aboutDeviceProfile: String,
    val aboutSystem: String,
    val aboutAndroid: (release: String, sdk: Int) -> String,
    val aboutRam: (gigabytes: String) -> String,
    val aboutLicenses: String,
    val licensesTitle: String,
    val licensesClose: String,
    val licensesIntro: String,
    val licensesFooter: String,
) {
    fun error(error: UpdateError, detail: String = ""): String = when (error) {
        UpdateError.NETWORK -> errNetwork
        UpdateError.SERVER -> errServer(detail.ifBlank { "HTTP" }.ltr())
        UpdateError.STALLED -> errStalled
        UpdateError.STORAGE -> errStorage
        UpdateError.CHECKSUM -> errChecksum
        UpdateError.INVALID_APK -> errInvalidApk
        UpdateError.INSTALL_CANCELLED -> errInstallCancelled
        UpdateError.INSTALL_BLOCKED -> errInstallBlocked
        UpdateError.INSTALL_CONFLICT -> errInstallConflict
        UpdateError.INSTALL_INCOMPATIBLE -> errInstallIncompatible
        UpdateError.INSTALL_STORAGE -> errInstallStorage
        UpdateError.INSTALLER_UNAVAILABLE -> errInstallerUnavailable
        UpdateError.INSTALL_FAILED -> errInstallFailed
        UpdateError.UNKNOWN -> errUnknown
    }
}

/** Library list for the built-in notice (names and licenses stay in English in both languages). */
internal const val BUILT_IN_LICENSE_LIST =
    "• AndroidX Media3 (ExoPlayer) — Apache License 2.0\n" +
        "• LibVLC for Android (VideoLAN) — GNU LGPL 2.1 or later\n" +
        "• FFmpeg (inside LibVLC) — GNU LGPL 2.1 or later\n" +
        "• ZXing — Apache License 2.0\n" +
        "• Coil — Apache License 2.0\n" +
        "• OkHttp, Okio and Retrofit (Square) — Apache License 2.0\n" +
        "• Lottie for Android (Airbnb) — Apache License 2.0\n" +
        "• Jetpack Compose and AndroidX — Apache License 2.0\n" +
        "• Kotlin, kotlinx.coroutines and kotlinx.serialization — Apache License 2.0"

private val EnUpdateStrings = UpdateStrings(
    blockUpdateTitle = "Update required",
    blockUpdateBody = "This version of MoPlayer Pro is no longer supported. Install the latest version to keep watching.",
    blockMaintenanceTitle = "Under maintenance",
    blockMaintenanceBody = "We are improving MoPlayer Pro right now. Please try again in a few minutes.",
    blockDisabledTitle = "Temporarily unavailable",
    blockDisabledBody = "MoPlayer Pro is not available right now. Please try again later.",
    blockTryAgain = "Try again",
    blockChecking = "Checking…",
    blockStillBlocked = "Still unavailable. The app keeps checking automatically.",
    blockUnreachable = "Couldn't reach the server. Check your connection and try again.",
    blockExit = "Exit",
    versions = { installed, latest -> "Installed $installed  •  Latest $latest" },
    whatsNew = "What's new",
    lastChecked = { time -> "Last checked $time" },
    downloadedOf = { done, total -> "$done of $total" },
    statusIdle = "Check whether a newer version is available.",
    statusCheckFailed = "Couldn't check for updates. Check your connection and try again.",
    statusReconnecting = "Connection interrupted — resuming the download…",
    statusVerifying = "Verifying the download…",
    statusReady = "Download complete and verified. Ready to install.",
    statusInstallerOpened = "The installer was opened. Didn't finish? Choose Install now again.",
    statusInstalling = "Opening the installer… confirm the installation on screen.",
    statusInstalled = "Update installed.",
    statusNeedsPermission = "Allow MoPlayer Pro to install apps to finish the update.",
    updateNow = "Update now",
    cancelDownload = "Cancel download",
    installNow = "Install now",
    allowInstalls = "Allow installs",
    working = "Please wait…",
    otherWaysTitle = "Other ways to update",
    downloaderHint = { code -> "In the Downloader app, enter code $code" },
    qrHint = "Or scan with your phone to get the APK",
    openDownloadPageFailed = "No browser is available on this device. Use the Downloader code instead.",
    permissionTitle = "Allow app installs",
    permissionBody = "Android asks once before MoPlayer Pro can install its own updates. Choose Open settings, turn on \"Allow from this source\" for MoPlayer Pro, then press Back. The update continues by itself.",
    permissionOpenSettings = "Open settings",
    permissionNoScreen = "This device has no shortcut to that setting. Turn it on manually:",
    permissionStepsTitle = "If the setting does not open:",
    permissionStepsAndroidTv = "Android TV / Google TV: Settings › Apps › Security & restrictions › Unknown sources › MoPlayer Pro",
    permissionStepsFireTv = "Fire TV: Settings › My Fire TV › Developer options › Install unknown apps › MoPlayer Pro",
    errNetwork = "No internet connection, or the server did not answer. Try again.",
    errServer = { code -> "The download server returned an error ($code). Try again later." },
    errStalled = "The download stopped responding. Try again.",
    errStorage = "Not enough free storage for the update.",
    errChecksum = "The downloaded file is damaged (checksum mismatch). Try again.",
    errInvalidApk = "The downloaded file is not a valid MoPlayer Pro update.",
    errInstallCancelled = "Installation was cancelled.",
    errInstallBlocked = "This device blocked the installation.",
    errInstallConflict = "The update does not match the installed app's signature. Uninstall MoPlayer Pro, then install the new version.",
    errInstallIncompatible = "This update is not compatible with this device.",
    errInstallStorage = "Not enough storage to install the update.",
    errInstallerUnavailable = "No app installer is available on this device. Use the Downloader code below.",
    errInstallFailed = "The installation failed. Try again.",
    errUnknown = "Something went wrong with the update. Try again.",
    aboutDeviceProfile = "Device profile",
    aboutSystem = "System",
    aboutAndroid = { release, sdk -> "Android $release (API $sdk)" },
    aboutRam = { gigabytes -> "$gigabytes GB RAM" },
    aboutLicenses = "Open-source licenses",
    licensesTitle = "Open-source licenses",
    licensesClose = "Close",
    licensesIntro = "MoPlayer Pro is built with these open-source libraries:",
    licensesFooter = "License texts: apache.org/licenses/LICENSE-2.0 and gnu.org/licenses/lgpl-2.1",
)

private val ArUpdateStrings = UpdateStrings(
    blockUpdateTitle = "يلزم التحديث",
    blockUpdateBody = "لم يعد هذا الإصدار من MoPlayer Pro مدعومًا. ثبّت أحدث إصدار لمتابعة المشاهدة.",
    blockMaintenanceTitle = "التطبيق قيد الصيانة",
    blockMaintenanceBody = "نعمل الآن على تحسين MoPlayer Pro. يُرجى المحاولة بعد دقائق.",
    blockDisabledTitle = "غير متاح مؤقتًا",
    blockDisabledBody = "MoPlayer Pro غير متاح حاليًا. يُرجى المحاولة لاحقًا.",
    blockTryAgain = "حاول مرة أخرى",
    blockChecking = "جارٍ التحقق…",
    blockStillBlocked = "ما زال غير متاح. يواصل التطبيق التحقق تلقائيًا.",
    blockUnreachable = "تعذّر الوصول إلى الخادم. تحقّق من الاتصال وحاول مرة أخرى.",
    blockExit = "خروج",
    versions = { installed, latest -> "المثبّت ${installed.ltr()}  •  الأحدث ${latest.ltr()}" },
    whatsNew = "الجديد في هذا الإصدار",
    lastChecked = { time -> "آخر فحص ${time.ltr()}" },
    downloadedOf = { done, total -> "${done.ltr()} من ${total.ltr()}" },
    statusIdle = "تحقّق من توفّر إصدار أحدث.",
    statusCheckFailed = "تعذّر البحث عن تحديثات. تحقّق من الاتصال وحاول مرة أخرى.",
    statusReconnecting = "انقطع الاتصال — جارٍ استئناف التنزيل…",
    statusVerifying = "جارٍ التحقق من الملف…",
    statusReady = "اكتمل التنزيل وتم التحقق منه. جاهز للتثبيت.",
    statusInstallerOpened = "تم فتح المثبّت. إن لم يكتمل التثبيت فاختر «ثبّت الآن» مجددًا.",
    statusInstalling = "جارٍ فتح المثبّت… أكّد التثبيت على الشاشة.",
    statusInstalled = "تم تثبيت التحديث.",
    statusNeedsPermission = "اسمح لـ MoPlayer Pro بتثبيت التطبيقات لإكمال التحديث.",
    updateNow = "حدّث الآن",
    cancelDownload = "إلغاء التنزيل",
    installNow = "ثبّت الآن",
    allowInstalls = "السماح بالتثبيت",
    working = "يُرجى الانتظار…",
    otherWaysTitle = "طرق أخرى للتحديث",
    downloaderHint = { code -> "في تطبيق Downloader أدخل الرمز ${code.ltr()}" },
    qrHint = "أو امسح الرمز بهاتفك للحصول على ملف APK",
    openDownloadPageFailed = "لا يوجد متصفح على هذا الجهاز. استخدم رمز Downloader بدلًا من ذلك.",
    permissionTitle = "السماح بتثبيت التطبيقات",
    permissionBody = "يطلب أندرويد إذنك مرة واحدة قبل أن يثبّت MoPlayer Pro تحديثاته. اختر «فتح الإعدادات»، وفعّل «السماح من هذا المصدر» لـ MoPlayer Pro، ثم اضغط رجوع. سيكمل التحديث تلقائيًا.",
    permissionOpenSettings = "فتح الإعدادات",
    permissionNoScreen = "لا يوفّر هذا الجهاز اختصارًا لهذا الإعداد. فعّله يدويًا:",
    permissionStepsTitle = "إذا لم يُفتح الإعداد:",
    permissionStepsAndroidTv = "Android TV / Google TV: الإعدادات › التطبيقات › الأمان والقيود › مصادر غير معروفة › MoPlayer Pro",
    permissionStepsFireTv = "Fire TV: الإعدادات › My Fire TV › خيارات المطوّر › تثبيت تطبيقات غير معروفة › MoPlayer Pro",
    errNetwork = "لا يوجد اتصال بالإنترنت أو لم يستجب الخادم. حاول مرة أخرى.",
    errServer = { code -> "أعاد خادم التنزيل خطأً ($code). حاول لاحقًا." },
    errStalled = "توقّف التنزيل عن الاستجابة. حاول مرة أخرى.",
    errStorage = "لا توجد مساحة تخزين كافية للتحديث.",
    errChecksum = "الملف الذي تم تنزيله تالف (البصمة غير مطابقة). حاول مرة أخرى.",
    errInvalidApk = "الملف الذي تم تنزيله ليس تحديثًا صالحًا لـ MoPlayer Pro.",
    errInstallCancelled = "تم إلغاء التثبيت.",
    errInstallBlocked = "منع هذا الجهاز التثبيت.",
    errInstallConflict = "توقيع التحديث لا يطابق التطبيق المثبّت. أزل MoPlayer Pro ثم ثبّت الإصدار الجديد.",
    errInstallIncompatible = "هذا التحديث غير متوافق مع هذا الجهاز.",
    errInstallStorage = "لا توجد مساحة كافية لتثبيت التحديث.",
    errInstallerUnavailable = "لا يتوفر مثبّت تطبيقات على هذا الجهاز. استخدم رمز Downloader أدناه.",
    errInstallFailed = "فشل التثبيت. حاول مرة أخرى.",
    errUnknown = "حدث خطأ أثناء التحديث. حاول مرة أخرى.",
    aboutDeviceProfile = "فئة الجهاز",
    aboutSystem = "النظام",
    aboutAndroid = { release, sdk -> "أندرويد ${release.ltr()} (API ${sdk.toString().ltr()})" },
    aboutRam = { gigabytes -> "ذاكرة ${"$gigabytes GB".ltr()}" },
    aboutLicenses = "تراخيص المصادر المفتوحة",
    licensesTitle = "تراخيص المصادر المفتوحة",
    licensesClose = "إغلاق",
    licensesIntro = "بُني MoPlayer Pro باستخدام هذه المكتبات مفتوحة المصدر:",
    licensesFooter = "نصوص التراخيص: ${"apache.org/licenses/LICENSE-2.0".ltr()} و ${"gnu.org/licenses/lgpl-2.1".ltr()}",
)

val Strings.update: UpdateStrings get() = if (this === ArStrings) ArUpdateStrings else EnUpdateStrings
