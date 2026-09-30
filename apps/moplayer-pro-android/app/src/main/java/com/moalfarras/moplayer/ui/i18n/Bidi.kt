package com.moalfarras.moplayer.ui.i18n

/**
 * Bidirectional-text helpers for Arabic (RTL) screens.
 *
 * Latin data embedded in Arabic copy (URLs, hosts, usernames, dates, times, scores,
 * "3/10" counters, version names) gets reordered by the Unicode bidi algorithm, e.g.
 * "de**" renders as "**de" and "(44 days)" as "(days 44)". Wrapping the run in an
 * isolate keeps its internal order without affecting the surrounding sentence.
 */

/** Left-to-right isolate (LRI…PDI): for data that is always LTR (URLs, dates, numbers, usernames). */
fun String.ltr(): String = if (isEmpty()) this else "⁦$this⁩"

/** First-strong isolate (FSI…PDI): for free text that may be Arabic or Latin (channel or movie titles). */
fun String.isolate(): String = if (isEmpty()) this else "⁨$this⁩"
