@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
package com.moalfarras.moplayer.ui.player

import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayer.domain.model.AppSettings
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

/** Exercises the asynchronous Compose owner, including engine enable/disable transitions. */
class Media3CompositionInstrumentedTest {
    @get:Rule val compose = createComposeRule()

    @Test fun asyncPreparationRetainsSessionAcrossRecompositionAndRecreatesAfterDisable() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val policy = Adaptive.performancePolicy(AppSettings(), Adaptive.performanceInfo(context))
        val enabled = mutableStateOf(true)
        val generation = mutableStateOf(0)
        var current: Media3Engine? = null
        val callbacks = Media3Callbacks({}, {}, {}, {}, {}, { _, _ -> }, {}, { _, _, _ -> })
        compose.setContent {
            current = rememberMedia3Engine(enabled.value, false, policy, generation.value, callbacks)
        }
        compose.waitUntil(20_000) { current != null }
        val first = requireNotNull(current)
        compose.runOnIdle { enabled.value = false }
        compose.waitUntil { current == null }
        compose.runOnIdle { enabled.value = true }
        compose.waitUntil(20_000) { current != null }
        val second = requireNotNull(current)
        assertNotSame(first, second)
        // Surface retry must replace the engine even after native preparation is cached.
        compose.runOnIdle { generation.value += 1 }
        compose.waitUntil(20_000) { current != null && current !== second }
        compose.runOnIdle { enabled.value = false }
        compose.waitUntil { current == null }
    }
}
