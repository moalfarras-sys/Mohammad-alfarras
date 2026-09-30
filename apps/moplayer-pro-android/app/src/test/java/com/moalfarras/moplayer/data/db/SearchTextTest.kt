package com.moalfarras.moplayer.data.db

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SearchTextTest {
    @Test
    fun latinIsCaseAndAccentInsensitive() {
        assertEquals("bein sports 1 hd", SearchText.normalize("beIN SPORTS 1 HD"))
        assertEquals("cafe creme", SearchText.normalize("Café Crème"))
        assertEquals("i", SearchText.normalize("İ"))
    }

    @Test
    fun punctuationAndSymbolsBecomeSingleSpaces() {
        assertEquals("mbc 2 fhd", SearchText.normalize("  MBC-2 | [FHD]  "))
        assertEquals("king 2001", SearchText.normalize("King (2001)"))
        assertEquals("", SearchText.normalize("|| -- ||"))
    }

    @Test
    fun arabicAlefHamzaFormsFoldToBareAlef() {
        assertEquals(SearchText.normalize("اخبار"), SearchText.normalize("أخبار"))
        assertEquals(SearchText.normalize("اسلام"), SearchText.normalize("إسلام"))
        assertEquals(SearchText.normalize("امن"), SearchText.normalize("آمن"))
        assertEquals("الله", SearchText.normalize("ٱلله"))
    }

    @Test
    fun arabicTaaMarbutaAlefMaqsuraAndPersianLettersFold() {
        assertEquals("الجزيره", SearchText.normalize("الجزيرة"))
        assertEquals("مصطفي", SearchText.normalize("مصطفى"))
        assertEquals("ايران كيش", SearchText.normalize("ایران کیش"))
        assertEquals(SearchText.normalize("مسؤول"), SearchText.normalize("مسوول"))
        assertEquals(SearchText.normalize("شاطئ"), SearchText.normalize("شاطي"))
    }

    @Test
    fun arabicDiacriticsTatweelAndDirectionMarksAreRemoved() {
        assertEquals("محمد", SearchText.normalize("مُحَمَّد"))
        assertEquals("قناه", SearchText.normalize("قنـــاة"))
        assertEquals("mbc مصر", SearchText.normalize("‏MBC‎ مصر⁦"))
    }

    @Test
    fun arabicIndicDigitsBecomeAsciiDigits() {
        assertEquals("mbc 3", SearchText.normalize("MBC ٣"))
        assertEquals("2024", SearchText.normalize("۲۰۲۴"))
    }

    @Test
    fun indexTextAddsArticleFreeAndSplitDigitTokens() {
        val text = SearchText.indexText("والحياة الجزيرة MBC1", "رياضة", "", "", "")
        val tokens = SearchText.tokens(text).toSet()
        assertTrue(tokens.containsAll(listOf("والحياه", "حياه", "الجزيره", "جزيره", "mbc1", "mbc", "1", "رياضه")))
        assertEquals("each token is stored once", SearchText.tokens(text).size, tokens.size)
    }

    @Test
    fun indexTextKeepsShortWordsIntact() {
        // Stripping must leave at least two letters, and a bare proclitic is never stripped.
        val tokens = SearchText.tokens(SearchText.indexText("لله لبنان بيروت", "", "", "", "")).toSet()
        assertEquals(setOf("لله", "لبنان", "بيروت"), tokens)
    }

    @Test
    fun queryTokensMatchWithOrWithoutTheArabicArticle() {
        assertEquals(listOf("جزيره"), SearchText.queryTokens("الجزيرة"))
        assertEquals(listOf("جزيره"), SearchText.queryTokens("جزيرة"))
        assertEquals(listOf("اخبار"), SearchText.queryTokens("الأخبار"))
        assertEquals(listOf("bein", "2"), SearchText.queryTokens("beIN 2 bein"))
    }

    @Test
    fun matchExpressionIsPrefixTermsWithoutOperators() {
        assertEquals("bein* sports*", SearchText.matchExpression(SearchText.queryTokens("beIN Sports")))
        // Upper-case OR/AND/NOT would be FTS operators; normalized tokens are always lower case.
        val expression = SearchText.matchExpression(SearchText.queryTokens("NEWS OR SPORT NOT \"x\""))
        assertFalse(expression.contains("OR") || expression.contains("NOT") || expression.contains("\""))
        assertEquals("", SearchText.matchExpression(SearchText.queryTokens("  ...  ")))
    }

    @Test
    fun letterDigitRunsSplitOnlyAtBoundaries() {
        assertEquals(listOf("s", "01", "e", "02"), SearchText.splitLetterDigitRuns("s01e02"))
        assertEquals(emptyList<String>(), SearchText.splitLetterDigitRuns("sports"))
        assertEquals(emptyList<String>(), SearchText.splitLetterDigitRuns("2024"))
    }
}
