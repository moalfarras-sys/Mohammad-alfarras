package com.moalfarras.moplayer.core

import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext

object Adaptive {
    val isTv: Boolean
        @Composable
        @ReadOnlyComposable
        get() {
            val context = LocalContext.current
            val configuration = LocalConfiguration.current
            val modeType = configuration.uiMode and Configuration.UI_MODE_TYPE_MASK
            val uiModeManager = context.getSystemService(Context.UI_MODE_SERVICE) as android.app.UiModeManager
            val packageManager = context.packageManager
            return modeType == Configuration.UI_MODE_TYPE_TELEVISION ||
                uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION ||
                packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK) ||
                packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK_ONLY) ||
                !packageManager.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN)
        }

    val isMobile: Boolean
        @Composable
        @ReadOnlyComposable
        get() = !isTv

    val isTablet: Boolean
        @Composable
        @ReadOnlyComposable
        get() {
            val config = LocalConfiguration.current
            return config.smallestScreenWidthDp >= 600 && !isTv
        }
}
