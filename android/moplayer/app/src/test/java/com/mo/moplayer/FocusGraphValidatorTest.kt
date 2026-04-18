package com.mo.moplayer

import com.mo.moplayer.ui.common.utils.FocusGraphValidator
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FocusGraphValidatorTest {

    @Test
    fun validate_validMap_passes() {
        val result =
            FocusGraphValidator.validate(
                listOf(
                    FocusGraphValidator.Node(id = "dock_home", right = "dock_live"),
                    FocusGraphValidator.Node(id = "dock_live", left = "dock_home", right = "dock_movies"),
                    FocusGraphValidator.Node(id = "dock_movies", left = "dock_live")
                )
            )

        assertTrue(result.isValid)
    }

    @Test
    fun validate_selfLoopAndUnknownAndDeadEnd_fails() {
        val result =
            FocusGraphValidator.validate(
                listOf(
                    FocusGraphValidator.Node(id = "a", right = "a"),
                    FocusGraphValidator.Node(id = "b", left = "missing"),
                    FocusGraphValidator.Node(id = "c")
                )
            )

        assertFalse(result.isValid)
        assertTrue(result.selfLoops.isNotEmpty())
        assertTrue(result.unknownTargets.isNotEmpty())
        assertTrue(result.deadEnds.contains("c"))
    }
}
