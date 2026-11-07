package com.mo.moplayer.ui.common.background

internal object BackgroundMotionPolicy {
    fun shouldAnimate(userEnabled: Boolean, lowTier: Boolean, systemMotion: Boolean, reducedMode: Boolean): Boolean =
        userEnabled && !lowTier && systemMotion && !reducedMode
}
