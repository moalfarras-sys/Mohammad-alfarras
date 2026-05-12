package com.moalfarras.moplayer.core

import android.content.Context
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider
import com.google.android.gms.cast.framework.media.CastMediaOptions
import com.google.android.gms.cast.framework.media.MediaIntentReceiver

class MoCastOptionsProvider : OptionsProvider {
    override fun getCastOptions(context: Context): CastOptions =
        CastOptions.Builder()
            .setReceiverApplicationId(com.google.android.gms.cast.CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID)
            .setCastMediaOptions(
                CastMediaOptions.Builder()
                    .setMediaIntentReceiverClassName(MediaIntentReceiver::class.java.name)
                    .build(),
            )
            .build()

    override fun getAdditionalSessionProviders(context: Context): List<SessionProvider> = emptyList()
}
