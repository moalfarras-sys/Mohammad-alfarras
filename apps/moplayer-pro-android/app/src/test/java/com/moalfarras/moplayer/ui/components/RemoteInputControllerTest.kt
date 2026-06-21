package com.moalfarras.moplayer.ui.components

import org.junit.Assert.assertEquals
import org.junit.Test

class RemoteInputControllerTest {
    @Test
    fun threeFastOkPressesTriggerTripleOk() {
        val controller = RemoteInputController()

        controller.onOkDown(1_000)
        assertEquals(RemoteInputAction.Click, controller.onOkUp(1_080))
        controller.onOkDown(1_250)
        assertEquals(RemoteInputAction.Click, controller.onOkUp(1_320))
        controller.onOkDown(1_500)
        assertEquals(RemoteInputAction.TripleOk, controller.onOkUp(1_580))
    }

    @Test
    fun longOkPressTriggersOptionsAction() {
        val controller = RemoteInputController()

        controller.onOkDown(5_000)

        assertEquals(RemoteInputAction.LongOk, controller.onOkUp(8_100))
    }

    @Test
    fun okUpWithoutMatchingDownStillRegistersClick() {
        val controller = RemoteInputController()
        assertEquals(RemoteInputAction.Click, controller.onOkUp(20_000))
    }

    @Test
    fun slowOkPressesDoNotCountAsTriple() {
        val controller = RemoteInputController()

        controller.onOkDown(10_000)
        assertEquals(RemoteInputAction.Click, controller.onOkUp(10_050))
        controller.onOkDown(11_000)
        assertEquals(RemoteInputAction.Click, controller.onOkUp(11_050))
        controller.onOkDown(12_000)
        assertEquals(RemoteInputAction.Click, controller.onOkUp(12_050))
    }
}
