package com.moalfarras.moplayer.data.repository

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.security.KeyStore
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class KeystoreSourceInstrumentedTest {
    @Test
    fun sourceCanBeRecoveredByANewSealerAndTamperingIsRejected() {
        val alias = "moplayer-qa-${UUID.randomUUID()}"
        try {
            val plain = "synthetic source credential for local QA".toByteArray()
            val sealed = requireNotNull(KeystoreSourceSealer(alias).seal(plain))
            assertFalse(sealed.contains("synthetic"))
            assertArrayEquals(plain, KeystoreSourceSealer(alias).open(sealed))
            val index = sealed.length / 2
            val tampered = sealed.replaceRange(index, index + 1, if (sealed[index] == 'A') "B" else "A")
            assertNull(KeystoreSourceSealer(alias).open(tampered))
        } finally {
            KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.deleteEntry(alias)
        }
    }
}
