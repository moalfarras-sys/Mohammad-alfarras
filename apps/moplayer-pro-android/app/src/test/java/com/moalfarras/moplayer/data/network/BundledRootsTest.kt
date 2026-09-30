package com.moalfarras.moplayer.data.network

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.security.MessageDigest
import java.security.cert.CertificateException
import java.security.cert.X509Certificate

class BundledRootsTest {
    private fun X509Certificate.sha256(): String =
        MessageDigest.getInstance("SHA-256").digest(encoded).joinToString("") { "%02x".format(it) }

    @Test
    fun bundledRootsAreTheGenuineIsrgRoots() {
        val roots = BundledRoots.certificates

        assertEquals(2, roots.size)
        assertTrue(roots[0].subjectX500Principal.name.contains("ISRG Root X1"))
        assertEquals("96bcec06264976f37460779acf28c5a7cfe8a3c0aae11a8ffcee05c0bddf08c6", roots[0].sha256())
        assertTrue(roots[1].subjectX500Principal.name.contains("ISRG Root X2"))
        assertEquals("69729b8e15a86efc177a57afb7171dfc64add28c2fca8cf1507e34453ccb1470", roots[1].sha256())
    }

    @Test
    fun trustManagerAddsTheBundledRootsAndRejectsUnknownChains() {
        val trustManager = PlatformPlusBundledTrustManager()

        val issuers = trustManager.acceptedIssuers.map { it.sha256() }.toSet()
        BundledRoots.certificates.forEach { assertTrue(it.sha256() in issuers) }

        try {
            // A self-signed leaf that is neither a platform nor a bundled root must be refused.
            trustManager.checkServerTrusted(arrayOf(SELF_SIGNED), "ECDHE_ECDSA")
            fail("an unknown self-signed chain must not be trusted")
        } catch (_: CertificateException) {
            // expected: never trust-all
        }
    }

    private companion object {
        /** A throwaway self-signed certificate (CN=untrusted.test), not issued by any real CA. */
        val SELF_SIGNED: X509Certificate by lazy {
            java.security.cert.CertificateFactory.getInstance("X.509").generateCertificate(
                """
                -----BEGIN CERTIFICATE-----
                MIIBhzCCAS2gAwIBAgIUUw37wtpra42Z6VMn3rWICnH+RAUwCgYIKoZIzj0EAwIw
                GTEXMBUGA1UEAwwOdW50cnVzdGVkLnRlc3QwHhcNMjYwOTMwMDE1NzI1WhcNNDYw
                OTI1MDE1NzI1WjAZMRcwFQYDVQQDDA51bnRydXN0ZWQudGVzdDBZMBMGByqGSM49
                AgEGCCqGSM49AwEHA0IABFc6ZWPnObqDA5rEtLAng0c7Gkk0b8b/srlmfi4P0wMS
                mUCXfMmxk8MRGhd6OIz9aRafnycE7+taBwdXK6Qoe4ejUzBRMB0GA1UdDgQWBBRc
                SDibnDzCALQyzaZ0dFH/gT88mDAfBgNVHSMEGDAWgBRcSDibnDzCALQyzaZ0dFH/
                gT88mDAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIDDWgJNs8E90
                kdq6UGHZwtsM/JyGMDShIPCHNLa02k/KAiEA7HITGh2IPcyXrG+2xePEeR0nFtIH
                aF4m+Xx81hP5xYw=
                -----END CERTIFICATE-----
                """.trimIndent().byteInputStream(),
            ) as X509Certificate
        }
    }
}
