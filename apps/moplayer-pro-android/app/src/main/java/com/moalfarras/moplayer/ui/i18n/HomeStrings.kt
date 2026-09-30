package com.moalfarras.moplayer.ui.i18n

import java.util.Locale

/**
 * Strings for Home, the browse screens (Live / Movies / Series / Favorites / series details),
 * the shared cards, the dock and the Smart picks assistant.
 *
 * Numbers, dates and times that are embedded in Arabic sentences are wrapped with [ltr] so the
 * bidi algorithm cannot reorder them ("0/2", "2026-11-14", "00:00 - 01:00").
 */
class HomeStrings(
    /** Locale used for month names in dates ("29 Sep" / "29 سبتمبر"). */
    val locale: Locale,
    // ── Home rows ──────────────────────────────────────────────────────
    val rowContinueLive: String,
    val rowFavoriteChannels: String,
    val rowLiveTv: String,
    val rowNewChannels: String,
    val rowResumeVod: String,
    // ── Hero ───────────────────────────────────────────────────────────
    val heroWelcome: String,
    val heroWelcomeHint: String,
    val kickerLive: String,
    val kickerMovie: String,
    val kickerSeries: String,
    val kickerEpisode: String,
    val accountActive: String,
    val accountExpired: String,
    val accountDisabled: String,
    val accountExpiresOn: (date: String) -> String,
    val accountDaysLeft: (days: Long) -> String,
    val accountConnections: (active: Int, max: Int) -> String,
    // ── Football widget ────────────────────────────────────────────────
    val footballTitle: String,
    val footballLive: String,
    val footballVersus: String,
    val footballFullTime: String,
    // ── Campaign (admin-driven home notification) ─────────────────────
    val campaignDefaultTitle: String,
    val campaignWorldCupTitle: String,
    val campaignLiveNow: String,
    val campaignStartsIn: (days: Long) -> String,
    val campaignDaysUnit: String,
    // ── Cards ──────────────────────────────────────────────────────────
    val typeLive: String,
    val typeMovie: String,
    val typeSeries: String,
    val typeEpisode: String,
    val favoriteAdded: String,
    val favoriteRemoved: String,
    val channelNumber: (number: Int) -> String,
    // ── Live / preview ─────────────────────────────────────────────────
    val allCategories: String,
    val allChannels: String,
    val epgNow: String,
    val epgNext: String,
    val epgNone: String,
    val previewNoDescription: String,
    val minutesLeft: (minutes: Long) -> String,
    // ── Favorites ──────────────────────────────────────────────────────
    val favoritesSubtitle: String,
    val favoritesEmptyHint: String,
    val itemsCount: (count: Int) -> String,
    // ── Series details ─────────────────────────────────────────────────
    val episodesNotLoadedTitle: String,
    val episodesNotLoadedBody: String,
    val noEpisodesInSeasonTitle: (season: Int) -> String,
    val noEpisodesInSeasonBody: String,
    val episodeTitle: (number: Int) -> String,
    val episodeReady: String,
    val episodesCount: (count: Int) -> String,
    val durationHoursMinutes: (hours: Long, minutes: Long) -> String,
    val durationMinutes: (minutes: Long) -> String,
    // ── Smart picks assistant ──────────────────────────────────────────
    val smartPicksTitle: String,
    val smartPicksSubtitle: String,
    val assistantTitle: String,
    val assistantSubtitle: String,
    val assistantTvHeadline: String,
    val assistantTvHint: String,
    val assistantMovies: String,
    val assistantSeries: String,
    val assistantAll: String,
    val assistantLive: String,
    val assistantSports: String,
    val assistantContinue: String,
    val assistantSurprise: String,
    val assistantClose: String,
    val assistantInputHint: String,
    val assistantSuggestionsFor: (mode: String) -> String,
    val assistantNewBoth: (movie: String, series: String) -> String,
    val assistantLatestMovie: (title: String) -> String,
    val assistantLatestSeries: (title: String) -> String,
    val assistantLibraryInfo: String,
    val assistantTodayMatches: (matches: String) -> String,
    val assistantIntro: (count: Int, hasMatches: Boolean) -> String,
    val assistantNoMatches: String,
    val assistantTopMatches: (matches: String) -> String,
    val assistantSuggest: (title: String, reason: String) -> String,
    val assistantNotFound: String,
    val reasonRating: (rating: String) -> String,
    val reasonRecent: String,
    val reasonCategory: (category: String) -> String,
    val reasonLibrary: String,
)

private val EnHomeStrings = HomeStrings(
    locale = Locale.ENGLISH,
    rowContinueLive = "Continue watching",
    rowFavoriteChannels = "Favorite channels",
    rowLiveTv = "Live TV",
    rowNewChannels = "Recently added channels",
    rowResumeVod = "Resume movies & series",
    heroWelcome = "Welcome back",
    heroWelcomeHint = "Pick a channel, movie or series below.",
    kickerLive = "LIVE TV",
    kickerMovie = "MOVIE",
    kickerSeries = "SERIES",
    kickerEpisode = "EPISODE",
    accountActive = "Active",
    accountExpired = "Expired",
    accountDisabled = "Disabled",
    accountExpiresOn = { date -> "Expires ${date.ltr()}" },
    accountDaysLeft = { days ->
        when {
            days <= 0L -> "Expires today"
            days == 1L -> "1 day left"
            else -> "$days days left"
        }
    },
    accountConnections = { active, max -> "Connections ${"$active/$max".ltr()}" },
    footballTitle = "Football",
    footballLive = "LIVE",
    footballVersus = "VS",
    footballFullTime = "FT",
    campaignDefaultTitle = "Featured event",
    campaignWorldCupTitle = "FIFA World Cup",
    campaignLiveNow = "Live now",
    campaignStartsIn = { days -> if (days == 1L) "Starts tomorrow" else "Starts in $days days" },
    campaignDaysUnit = "DAYS",
    typeLive = "LIVE",
    typeMovie = "MOVIE",
    typeSeries = "SERIES",
    typeEpisode = "EPISODE",
    favoriteAdded = "Added to favorites",
    favoriteRemoved = "Removed from favorites",
    channelNumber = { number -> "Channel $number" },
    allCategories = "All",
    allChannels = "All channels",
    epgNow = "Now",
    epgNext = "Next",
    epgNone = "No programme guide for this channel yet.",
    previewNoDescription = "No description available.",
    minutesLeft = { minutes -> "$minutes min left" },
    favoritesSubtitle = "Your saved channels, movies and series.",
    favoritesEmptyHint = "Hold OK on any channel, movie or series to add it here.",
    itemsCount = { count -> if (count == 1) "1 item" else "$count items" },
    episodesNotLoadedTitle = "Episodes aren't loaded yet",
    episodesNotLoadedBody = "Open the series again after the library sync finishes.",
    noEpisodesInSeasonTitle = { season -> "No episodes in Season $season" },
    noEpisodesInSeasonBody = "Choose another season above.",
    episodeTitle = { number -> "Episode $number" },
    episodeReady = "Ready to play",
    episodesCount = { count -> if (count == 1) "1 episode" else "$count episodes" },
    durationHoursMinutes = { hours, minutes -> "${hours}h ${minutes}m" },
    durationMinutes = { minutes -> "$minutes min" },
    smartPicksTitle = "Smart picks",
    smartPicksSubtitle = "Instant picks from your library",
    assistantTitle = "Smart assistant",
    assistantSubtitle = "Suggestions · Chat",
    assistantTvHeadline = "Latest picks from your library",
    assistantTvHint = "Choose an action with the remote",
    assistantMovies = "Movies",
    assistantSeries = "Series",
    assistantAll = "All",
    assistantLive = "Live",
    assistantSports = "Sports",
    assistantContinue = "Continue",
    assistantSurprise = "Surprise me",
    assistantClose = "Close",
    assistantInputHint = "Ask about a movie or series…",
    assistantSuggestionsFor = { mode -> "Smart suggestions · $mode" },
    assistantNewBoth = { movie, series -> "New: $movie · $series" },
    assistantLatestMovie = { title -> "Latest movie: $title" },
    assistantLatestSeries = { title -> "Latest series: $title" },
    assistantLibraryInfo = "MoPlayer Pro works with your playlists and private server library.",
    assistantTodayMatches = { matches -> "Today's matches: $matches" },
    assistantIntro = { count, hasMatches ->
        val matchLine = if (hasMatches) " I can also show today's matches." else ""
        "Hi, I'm your smart assistant. I read your local library and can suggest from $count items.$matchLine"
    },
    assistantNoMatches = "No matches right now. Try the sports channels or say: surprise me.",
    assistantTopMatches = { matches -> "Today's top matches: $matches" },
    assistantSuggest = { title, reason -> "I suggest: $title. $reason" },
    assistantNotFound = "I couldn't find a clear match. Try: movie, series, sports channel, or surprise me.",
    reasonRating = { rating -> "Top pick, rated $rating" },
    reasonRecent = "Because you watched something similar recently",
    reasonCategory = { category -> "From $category" },
    reasonLibrary = "Suggested from your library",
)

private val ArHomeStrings = HomeStrings(
    locale = Locale.forLanguageTag("ar"),
    rowContinueLive = "تابع المشاهدة",
    rowFavoriteChannels = "القنوات المفضّلة",
    rowLiveTv = "البث المباشر",
    rowNewChannels = "قنوات أُضيفت حديثاً",
    rowResumeVod = "استكمل الأفلام والمسلسلات",
    heroWelcome = "أهلاً بعودتك",
    heroWelcomeHint = "اختر قناة أو فيلماً أو مسلسلاً من الأسفل.",
    kickerLive = "بث مباشر",
    kickerMovie = "فيلم",
    kickerSeries = "مسلسل",
    kickerEpisode = "حلقة",
    accountActive = "نشط",
    accountExpired = "منتهٍ",
    accountDisabled = "معطّل",
    accountExpiresOn = { date -> "ينتهي في ${date.ltr()}" },
    accountDaysLeft = { days ->
        when {
            days <= 0L -> "ينتهي اليوم"
            days == 1L -> "متبقٍّ يوم واحد"
            days == 2L -> "متبقٍّ يومان"
            days in 3L..10L -> "متبقٍّ ${days.toString().ltr()} أيام"
            else -> "متبقٍّ ${days.toString().ltr()} يوماً"
        }
    },
    accountConnections = { active, max -> "الاتصالات ${"$active/$max".ltr()}" },
    footballTitle = "كرة القدم",
    footballLive = "مباشر",
    footballVersus = "ضد",
    footballFullTime = "انتهت",
    campaignDefaultTitle = "حدث مميز",
    campaignWorldCupTitle = "كأس العالم",
    campaignLiveNow = "مباشر الآن",
    campaignStartsIn = { days ->
        when {
            days == 1L -> "يبدأ غداً"
            days == 2L -> "يبدأ بعد يومين"
            days in 3L..10L -> "يبدأ بعد ${days.toString().ltr()} أيام"
            else -> "يبدأ بعد ${days.toString().ltr()} يوماً"
        }
    },
    campaignDaysUnit = "يوم",
    typeLive = "مباشر",
    typeMovie = "فيلم",
    typeSeries = "مسلسل",
    typeEpisode = "حلقة",
    favoriteAdded = "أُضيف إلى المفضّلة",
    favoriteRemoved = "أُزيل من المفضّلة",
    channelNumber = { number -> "القناة ${number.toString().ltr()}" },
    allCategories = "الكل",
    allChannels = "كل القنوات",
    epgNow = "الآن",
    epgNext = "التالي",
    epgNone = "لا يتوفر دليل برامج لهذه القناة بعد.",
    previewNoDescription = "لا يتوفر وصف.",
    minutesLeft = { minutes -> "متبقٍّ ${minutes.toString().ltr()} د" },
    favoritesSubtitle = "قنواتك وأفلامك ومسلسلاتك المحفوظة.",
    favoritesEmptyHint = "اضغط مطوّلاً على زر OK فوق أي قناة أو فيلم أو مسلسل لإضافته هنا.",
    itemsCount = { count ->
        when {
            count == 1 -> "عنصر واحد"
            count == 2 -> "عنصران"
            count in 3..10 -> "${count.toString().ltr()} عناصر"
            else -> "${count.toString().ltr()} عنصراً"
        }
    },
    episodesNotLoadedTitle = "لم تُحمَّل الحلقات بعد",
    episodesNotLoadedBody = "افتح المسلسل مجدداً بعد انتهاء مزامنة المكتبة.",
    noEpisodesInSeasonTitle = { season -> "لا توجد حلقات في الموسم ${season.toString().ltr()}" },
    noEpisodesInSeasonBody = "اختر موسماً آخر من الأعلى.",
    episodeTitle = { number -> "الحلقة ${number.toString().ltr()}" },
    episodeReady = "جاهزة للتشغيل",
    episodesCount = { count ->
        when {
            count == 1 -> "حلقة واحدة"
            count == 2 -> "حلقتان"
            count in 3..10 -> "${count.toString().ltr()} حلقات"
            else -> "${count.toString().ltr()} حلقة"
        }
    },
    durationHoursMinutes = { hours, minutes -> "${hours.toString().ltr()} س ${minutes.toString().ltr()} د" },
    durationMinutes = { minutes -> "${minutes.toString().ltr()} دقيقة" },
    smartPicksTitle = "اقتراحات ذكية",
    smartPicksSubtitle = "اختيارات فورية من مكتبتك",
    assistantTitle = "المساعد الذكي",
    assistantSubtitle = "اقتراحات · محادثة",
    assistantTvHeadline = "أحدث الاقتراحات من مكتبتك",
    assistantTvHint = "اختر إجراءً بجهاز التحكم",
    assistantMovies = "أفلام",
    assistantSeries = "مسلسلات",
    assistantAll = "الكل",
    assistantLive = "مباشر",
    assistantSports = "رياضة",
    assistantContinue = "المتابعة",
    assistantSurprise = "فاجئني",
    assistantClose = "إغلاق",
    assistantInputHint = "اسأل عن فيلم أو مسلسل…",
    assistantSuggestionsFor = { mode -> "اقتراحات ذكية · $mode" },
    assistantNewBoth = { movie, series -> "الجديد: ${movie.isolate()} · ${series.isolate()}" },
    assistantLatestMovie = { title -> "أحدث فيلم: ${title.isolate()}" },
    assistantLatestSeries = { title -> "أحدث مسلسل: ${title.isolate()}" },
    assistantLibraryInfo = "يعمل MoPlayer Pro مع قوائم التشغيل ومكتبة خادمك الخاص.",
    assistantTodayMatches = { matches -> "مباريات اليوم: $matches" },
    assistantIntro = { count, hasMatches ->
        val matchLine = if (hasMatches) " ويمكنني أيضاً عرض مباريات اليوم." else ""
        "مرحباً، أنا مساعدك الذكي. أقرأ مكتبتك المحلية وأقترح عليك من بين ${count.toString().ltr()} عنصراً.$matchLine"
    },
    assistantNoMatches = "لا توجد مباريات الآن. جرّب القنوات الرياضية أو قل: فاجئني.",
    assistantTopMatches = { matches -> "أبرز مباريات اليوم: $matches" },
    assistantSuggest = { title, reason -> "أقترح عليك: ${title.isolate()}. $reason" },
    assistantNotFound = "لم أجد نتيجة واضحة. جرّب: فيلم، مسلسل، قناة رياضية، أو فاجئني.",
    reasonRating = { rating -> "اختيار مميز بتقييم ${rating.ltr()}" },
    reasonRecent = "لأنك شاهدت شيئاً مشابهاً مؤخراً",
    reasonCategory = { category -> "من قسم ${category.isolate()}" },
    reasonLibrary = "مقترح من مكتبتك",
)

val Strings.home: HomeStrings get() = if (this === ArStrings) ArHomeStrings else EnHomeStrings
