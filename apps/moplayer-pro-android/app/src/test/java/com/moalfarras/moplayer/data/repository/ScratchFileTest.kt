package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Files

class ScratchFileTest {
    @Test
    fun reusesOneFixedFileAndDropsTheLeftoverOfAKilledRun() {
        val dir = Files.createTempDirectory("scratch-test").toFile()
        try {
            val leftover = File(dir, "epg-7.tmp").apply { writeText("half a guide from a killed process") }

            val file = scratchFile("epg-7.tmp", dir)

            assertEquals(leftover.absolutePath, file.absolutePath)
            assertFalse(file.exists())
            file.writeText("<tv/>")
            assertEquals(listOf("epg-7.tmp"), dir.list()!!.toList())
        } finally {
            dir.deleteRecursively()
        }
    }

    @Test
    fun createsTheCacheDirectoryWhenItWasCleared() {
        val parent = Files.createTempDirectory("scratch-test").toFile()
        try {
            val dir = File(parent, "cache")

            val file = scratchFile("m3u-3.tmp", dir)

            assertTrue(dir.isDirectory)
            assertEquals(File(dir, "m3u-3.tmp"), file)
        } finally {
            parent.deleteRecursively()
        }
    }
}
