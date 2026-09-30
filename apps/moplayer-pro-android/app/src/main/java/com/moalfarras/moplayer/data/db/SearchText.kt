package com.moalfarras.moplayer.data.db

import java.text.Normalizer
import java.util.Locale

/**
 * One normalization for both sides of search: the text stored in `media_search` (and indexed by
 * the FTS4 table) and the text the user types. Case, Latin accents, Arabic alef/hamza/madda forms,
 * taa marbuta, alef maqsura, tashkeel, tatweel, Persian letter variants, presentation forms and
 * Arabic-Indic digits all fold to one form, and anything that is not a letter or digit becomes a
 * single space. The result only contains letters, digits and single spaces, so it is safe inside
 * LIKE patterns and FTS MATCH expressions without escaping.
 */
object SearchText {
    // Longest first so "وال" wins over "ال". A proclitic is only stripped when the article follows,
    // because a bare و/ب/ل/ك/ف is often part of the word itself (لبنان, بيروت).
    private val arabicArticlePrefixes = listOf("وال", "بال", "فال", "كال", "لل", "ال")
    private const val MIN_STRIPPED_TOKEN = 2
    private const val MAX_QUERY_TOKENS = 8

    fun normalize(input: String): String {
        if (input.isEmpty()) return ""
        val decomposed = Normalizer.normalize(input.lowercase(Locale.ROOT), Normalizer.Form.NFKD)
        val out = StringBuilder(decomposed.length)
        var pendingSpace = false
        for (ch in decomposed) {
            val folded = fold(ch)
            when {
                folded == DROP -> Unit
                folded == ' ' -> pendingSpace = out.isNotEmpty()
                else -> {
                    if (pendingSpace) out.append(' ')
                    pendingSpace = false
                    out.append(folded)
                }
            }
        }
        return out.toString()
    }

    fun tokens(normalized: String): List<String> =
        if (normalized.isEmpty()) emptyList() else normalized.split(' ').filter { it.isNotEmpty() }

    /**
     * Text stored in `media_search.searchText`: every searchable field, normalized, followed by extra
     * tokens that let a prefix MATCH find words the user types differently: the Arabic word without
     * its article ("الجزيرة" is also indexed as "جزيره") and glued letter/digit runs split apart
     * ("mbc1" is also indexed as "mbc" and "1").
     */
    fun indexText(vararg fields: String): String {
        val base = normalize(fields.filter { it.isNotBlank() }.joinToString(" "))
        val baseTokens = tokens(base)
        if (baseTokens.isEmpty()) return base
        val present = baseTokens.toHashSet()
        val extras = LinkedHashSet<String>()
        baseTokens.forEach { token ->
            stripArabicArticle(token)?.let(extras::add)
            splitLetterDigitRuns(token).forEach(extras::add)
        }
        extras.removeAll(present)
        return if (extras.isEmpty()) base else base + " " + extras.joinToString(" ")
    }

    /**
     * Query tokens for FTS prefix matching. Article-stripped so "الجزيرة" and "جزيرة" find the same
     * channels (both forms are indexed); duplicates removed; capped to keep MATCH cheap.
     */
    fun queryTokens(query: String): List<String> =
        tokens(normalize(query))
            .map { stripArabicArticle(it) ?: it }
            .distinct()
            .take(MAX_QUERY_TOKENS)

    /** FTS4 MATCH expression: every token as a prefix term, implicitly AND-ed. Empty when nothing is searchable. */
    fun matchExpression(queryTokens: List<String>): String =
        queryTokens.joinToString(" ") { "$it*" }

    internal fun stripArabicArticle(token: String): String? {
        val prefix = arabicArticlePrefixes.firstOrNull { token.startsWith(it) } ?: return null
        val rest = token.substring(prefix.length)
        return rest.takeIf { it.length >= MIN_STRIPPED_TOKEN }
    }

    internal fun splitLetterDigitRuns(token: String): List<String> {
        if (token.length < 2) return emptyList()
        val runs = mutableListOf<String>()
        var start = 0
        for (index in 1 until token.length) {
            if (token[index].isDigit() != token[index - 1].isDigit()) {
                runs += token.substring(start, index)
                start = index
            }
        }
        if (runs.isEmpty()) return emptyList()
        runs += token.substring(start)
        return runs
    }

    private const val DROP = '\u0000'

    private fun fold(ch: Char): Char {
        when (ch) {
            'ة' -> return 'ه'
            'ى', 'ی', 'ې', 'ۍ' -> return 'ي'
            'ک' -> return 'ك'
            'ٱ', 'ٲ', 'ٳ' -> return 'ا'
            'ـ' -> return DROP
        }
        if (ch in '٠'..'٩') return '0' + (ch - '٠')
        if (ch in '۰'..'۹') return '0' + (ch - '۰')
        return when (Character.getType(ch).toByte()) {
            Character.NON_SPACING_MARK,
            Character.ENCLOSING_MARK,
            Character.COMBINING_SPACING_MARK,
            Character.FORMAT,
            -> DROP
            else -> if (Character.isLetterOrDigit(ch)) ch else ' '
        }
    }
}
