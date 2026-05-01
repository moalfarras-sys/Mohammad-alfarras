package com.mo.moplayer.util

import android.content.Context
import android.os.Build
import android.util.Log
import java.io.File

object NativeVlcLoader {
    data class Result(
        val available: Boolean,
        val message: String = ""
    )

    @Volatile
    private var cachedResult: Result? = null

    fun ensureAvailable(context: Context): Result {
        cachedResult?.let { return it }

        val result = synchronized(this) {
            cachedResult ?: loadNativeLibraries(context.applicationContext).also {
                cachedResult = it
            }
        }
        return result
    }

    private fun loadNativeLibraries(context: Context): Result {
        val nativeDir = context.applicationInfo.nativeLibraryDir.orEmpty()
        val abiList = Build.SUPPORTED_ABIS.joinToString()

        return try {
            System.loadLibrary("c++_shared")
            System.loadLibrary("vlc")
            System.loadLibrary("vlcjni")
            Log.i("NativeVlcLoader", "LibVLC native libraries loaded for ABI=$abiList dir=$nativeDir")
            Result(available = true)
        } catch (error: UnsatisfiedLinkError) {
            val expected = listOf("libc++_shared.so", "libvlc.so", "libvlcjni.so")
            val missing = expected.filterNot { File(nativeDir, it).exists() }
            val detail = buildString {
                append("LibVLC native library load failed for ABI=")
                append(abiList)
                append(". ")
                if (missing.isNotEmpty()) {
                    append("Missing from native dir: ")
                    append(missing.joinToString())
                    append(". ")
                }
                append(error.message ?: "Unknown native loader error.")
            }
            Log.e("NativeVlcLoader", detail, error)
            Result(available = false, message = detail)
        } catch (error: SecurityException) {
            val detail = "LibVLC native library load blocked: ${error.message ?: "security error"}"
            Log.e("NativeVlcLoader", detail, error)
            Result(available = false, message = detail)
        }
    }
}
