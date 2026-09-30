package com.moalfarras.moplayer.data.repository

import java.util.Locale

/**
 * A provider rating ready to show: blank when missing or not above zero (panels send "0" for
 * "unrated"), numbers kept to one decimal ("6.838" -> "6.8", "7.0" -> "7"). Other text is kept.
 */
internal fun String.cleanRating(): String {
    val text = trim()
    val value = text.toDoubleOrNull() ?: return text
    if (value.isNaN() || value <= 0.0) return ""
    return String.format(Locale.US, "%.1f", value).removeSuffix(".0")
}

/**
 * A provider plot ready to show. Many panels double-escape line breaks, so the text arrives as
 * literal "\r\n" (or "\\\\r\\\\n") sequences; those become real line breaks.
 */
internal fun String.cleanPlot(): String {
    if ('\\' !in this) return trim()
    return replace(ESCAPED_LINE_BREAK, "\n")
        .replace(ESCAPED_TAB, " ")
        .replace(EXTRA_BLANK_LINES, "\n\n")
        .trim()
}

private val ESCAPED_LINE_BREAK = Regex("""\\+r\\+n|\\+n|\\+r""")
private val ESCAPED_TAB = Regex("""\\+t""")
private val EXTRA_BLANK_LINES = Regex("""\n[ \t]*(\n[ \t]*){2,}""")
