package com.moalfarras.moplayer.ui.i18n

import com.moalfarras.moplayer.data.repository.SyncErrorKind
import java.util.Locale

/**
 * Copy for library/EPG sync: progress phases and the human explanation of every
 * [SyncErrorKind]. Hosts, HTTP codes and counters are LTR data and are isolated with [ltr]
 * so they stay readable inside Arabic sentences.
 */
class SyncStrings(
    val connecting: String,
    val checkingAccount: String,
    val tryingAlternateAddress: String,
    val loadingLive: String,
    val loadingMovies: String,
    val loadingSeries: String,
    val savedLive: String,
    val savedMovies: String,
    val savedSeries: String,
    val downloadingPlaylist: String,
    val readingPlaylist: String,
    val playlistUnchanged: String,
    val savingLibrary: String,
    val alreadyRunning: String,
    val ready: String,
    val readyPartial: String,
    val theServer: String,
    val invalidCredentials: String,
    val accountExpired: String,
    val accountDisabled: String,
    val tooManyConnections: String,
    val rateLimited: String,
    val notIptvApi: String,
    val invalidPlaylist: String,
    val emptyLibrary: String,
    val xtreamLinkIncomplete: String,
    val connectionOk: String,
    val playlistOk: String,
    private val accessDenied: (code: String) -> String,
    private val serverError: (code: String) -> String,
    private val hostNotFound: (host: String) -> String,
    private val serverUnreachable: (host: String) -> String,
    private val timeout: (host: String) -> String,
    private val connectionLost: (host: String) -> String,
    private val tls: (host: String) -> String,
    private val unknown: (host: String) -> String,
) {
    /** A human sentence for [kind]; [host] and [httpCode] are optional context. */
    fun errorMessage(kind: SyncErrorKind, host: String = "", httpCode: Int = 0): String {
        val hostLabel = host.trim().takeIf { it.isNotEmpty() }?.ltr() ?: theServer
        val code = if (httpCode > 0) "HTTP $httpCode".ltr() else "HTTP".ltr()
        return when (kind) {
            SyncErrorKind.INVALID_CREDENTIALS -> invalidCredentials
            SyncErrorKind.ACCOUNT_EXPIRED -> accountExpired
            SyncErrorKind.ACCOUNT_DISABLED -> accountDisabled
            SyncErrorKind.TOO_MANY_CONNECTIONS -> tooManyConnections
            SyncErrorKind.ACCESS_DENIED -> accessDenied(code)
            SyncErrorKind.RATE_LIMITED -> rateLimited
            SyncErrorKind.HOST_NOT_FOUND -> hostNotFound(hostLabel)
            SyncErrorKind.SERVER_UNREACHABLE -> serverUnreachable(hostLabel)
            SyncErrorKind.TIMEOUT -> timeout(hostLabel)
            SyncErrorKind.CONNECTION_LOST -> connectionLost(hostLabel)
            SyncErrorKind.TLS -> tls(hostLabel)
            SyncErrorKind.SERVER_ERROR -> serverError(code)
            SyncErrorKind.NOT_IPTV_API -> notIptvApi
            SyncErrorKind.INVALID_PLAYLIST -> invalidPlaylist
            SyncErrorKind.EMPTY_LIBRARY -> emptyLibrary
            SyncErrorKind.UNKNOWN -> unknown(hostLabel)
        }
    }

    /** "Loading live channels · 12,000"; the count is omitted while it is still zero. */
    fun withCount(label: String, count: Int): String =
        if (count <= 0) label else "$label · ${String.format(Locale.US, "%,d", count).ltr()}"
}

internal val EnSyncStrings = SyncStrings(
    connecting = "Connecting to the server",
    checkingAccount = "Checking the account",
    tryingAlternateAddress = "Trying the alternate server address",
    loadingLive = "Loading live channels",
    loadingMovies = "Loading movies",
    loadingSeries = "Loading series",
    savedLive = "Live channels saved",
    savedMovies = "Movies saved",
    savedSeries = "Series saved",
    downloadingPlaylist = "Downloading the playlist",
    readingPlaylist = "Reading the playlist",
    playlistUnchanged = "Playlist unchanged, using the saved library",
    savingLibrary = "Saving the library",
    alreadyRunning = "An update is already running",
    ready = "Ready",
    readyPartial = "Ready. Some sections could not be updated and will retry later",
    theServer = "the server",
    invalidCredentials = "Wrong username or password. Check the account details from your provider.",
    accountExpired = "This IPTV subscription has expired. Renew it with your provider.",
    accountDisabled = "This IPTV account is disabled or banned by the provider.",
    tooManyConnections = "Too many devices are using this account right now. Stop it on another device and try again.",
    rateLimited = "The provider is limiting requests right now. Wait a minute and try again.",
    notIptvApi = "The server did not answer like an IPTV panel. Check the server address, port, username and password.",
    invalidPlaylist = "This link is not a valid M3U playlist, or it has no channels.",
    emptyLibrary = "The server returned no channels or videos for this account.",
    xtreamLinkIncomplete = "This Xtream link is missing the username or password.",
    connectionOk = "Connection works",
    playlistOk = "Playlist link works",
    accessDenied = { code -> "The provider refused the request ($code). Your IP address, VPN or device may be blocked." },
    serverError = { code -> "The provider's server had an error ($code). Try again later." },
    hostNotFound = { host -> "Server address not found ($host). Check the address and your internet connection." },
    serverUnreachable = { host -> "Can't reach $host. It may be down or blocked on this network." },
    timeout = { host -> "$host is taking too long to respond. Try again in a moment." },
    connectionLost = { host -> "The connection to $host dropped during the download. Try again." },
    tls = { host -> "The secure connection to $host failed. Try the address with http:// or check the device date and time." },
    unknown = { host -> "Sync with $host failed. Try again." },
)

internal val ArSyncStrings = SyncStrings(
    connecting = "جارٍ الاتصال بالخادم",
    checkingAccount = "جارٍ التحقق من الحساب",
    tryingAlternateAddress = "جارٍ تجربة عنوان بديل للخادم",
    loadingLive = "جارٍ تحميل القنوات المباشرة",
    loadingMovies = "جارٍ تحميل الأفلام",
    loadingSeries = "جارٍ تحميل المسلسلات",
    savedLive = "تم حفظ القنوات المباشرة",
    savedMovies = "تم حفظ الأفلام",
    savedSeries = "تم حفظ المسلسلات",
    downloadingPlaylist = "جارٍ تنزيل قائمة التشغيل",
    readingPlaylist = "جارٍ قراءة قائمة التشغيل",
    playlistUnchanged = "القائمة لم تتغيّر، يُستخدم المحتوى المحفوظ",
    savingLibrary = "جارٍ حفظ المكتبة",
    alreadyRunning = "التحديث قيد التشغيل بالفعل",
    ready = "جاهز",
    readyPartial = "جاهز. تعذّر تحديث بعض الأقسام وستُعاد المحاولة لاحقًا",
    theServer = "الخادم",
    invalidCredentials = "اسم المستخدم أو كلمة المرور غير صحيحة. تحقّق من بيانات الحساب لدى مزوّد الخدمة.",
    accountExpired = "انتهى اشتراك IPTV هذا. جدّده لدى مزوّد الخدمة.",
    accountDisabled = "هذا الحساب معطّل أو محظور من مزوّد الخدمة.",
    tooManyConnections = "عدد الأجهزة التي تستخدم هذا الحساب تجاوز الحد المسموح. أوقفه على جهاز آخر ثم أعد المحاولة.",
    rateLimited = "المزوّد يحدّ من الطلبات حاليًا. انتظر دقيقة ثم أعد المحاولة.",
    notIptvApi = "لم يستجب الخادم كخادم IPTV. تحقّق من العنوان والمنفذ واسم المستخدم وكلمة المرور.",
    invalidPlaylist = "هذا الرابط ليس قائمة M3U صالحة أو لا يحتوي على قنوات.",
    emptyLibrary = "لم يُرجِع الخادم أي قنوات أو فيديوهات لهذا الحساب.",
    xtreamLinkIncomplete = "رابط Xtream هذا ينقصه اسم المستخدم أو كلمة المرور.",
    connectionOk = "الاتصال يعمل",
    playlistOk = "رابط القائمة يعمل",
    accessDenied = { code -> "رفض المزوّد الطلب ($code). قد يكون عنوان IP أو الـ VPN أو الجهاز محظورًا." },
    serverError = { code -> "حدث خطأ في خادم المزوّد ($code). أعد المحاولة لاحقًا." },
    hostNotFound = { host -> "تعذّر العثور على عنوان الخادم ($host). تحقّق من العنوان ومن اتصال الإنترنت." },
    serverUnreachable = { host -> "تعذّر الوصول إلى $host. قد يكون متوقفًا أو محجوبًا على هذه الشبكة." },
    timeout = { host -> "يستغرق $host وقتًا طويلًا في الاستجابة. أعد المحاولة بعد قليل." },
    connectionLost = { host -> "انقطع الاتصال بـ $host أثناء التنزيل. أعد المحاولة." },
    tls = { host -> "فشل الاتصال الآمن بـ $host. جرّب العنوان مع http:// أو تحقّق من تاريخ الجهاز ووقته." },
    unknown = { host -> "فشلت المزامنة مع $host. أعد المحاولة." },
)

val Strings.sync: SyncStrings get() = if (this === ArStrings) ArSyncStrings else EnSyncStrings
