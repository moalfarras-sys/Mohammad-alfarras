package com.moalfarras.moplayer.ui.components

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color as AndroidColor
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner

/**
 * A trailer resolved for the item currently under focus. Provided from the app state so
 * [com.moalfarras.moplayer.ui.screens.PreviewPane] can confirm the trailer still belongs to the
 * item it is drawing (focus can move faster than a trailer resolves).
 */
data class PreviewTrailer(
    val itemKey: String = "",
    val youtubeId: String = "",
)

val LocalPreviewTrailer = compositionLocalOf { PreviewTrailer() }

/** Reports (by item key) that the current preview trailer's IFrame could not play, so the app can
 *  retry once with the YouTube-search fallback. Default no-op keeps the surface reusable/testable. */
val LocalTrailerErrorReporter = compositionLocalOf<(String) -> Unit> { {} }

/**
 * A muted, controls-free, inline YouTube trailer for the preview pane.
 *
 * It hosts a [WebView] running YouTube's official IFrame Player API — a ToS-compliant embed — so
 * playback stays inside the app and never hands off to the YouTube app. The surface is:
 *  - non-focusable, so D-pad navigation across the grid is completely unaffected;
 *  - center-cropped to fill the pane the same way the backdrop image it sits over does;
 *  - faded in only once the video is actually playing, so the backdrop shows through while it
 *    buffers and the transition reads as a soft crossfade rather than a black flash;
 *  - fully paused with the lifecycle and destroyed on dispose, so it leaks nothing and stops
 *    the moment focus moves or the screen leaves composition.
 *
 * It only ever talks to YouTube's own hosts, so it can't consume the IPTV provider's live slot.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun YoutubeTrailerSurface(
    itemKey: String,
    youtubeId: String,
    modifier: Modifier = Modifier,
    onError: () -> Unit = {},
) {
    val context = LocalContext.current
    // Ancient system WebViews (e.g. the frozen Chrome 44 on bare AOSP API 23 images) can't run
    // YouTube's modern embed JS, so skip them entirely — the pane just keeps showing its backdrop.
    val supported = remember { isModernWebViewAvailable(context) }
    if (!supported) return
    // Key on the ITEM as well as the video id: moving focus to a different movie always tears the
    // player down and starts fresh, even when two titles happen to resolve to the same trailer —
    // the pane can never keep "the old trailer" across items.
    key(itemKey, youtubeId) {
        TrailerWebView(youtubeId, modifier, onError)
    }
}

/** Best-effort major-version check for the system WebView. Unknown → allow (playback-gated reveal
 *  still keeps a broken player hidden); anything older than Chrome 60 is skipped up front. */
private fun isModernWebViewAvailable(context: Context): Boolean {
    val major = runCatching {
        val versionName = if (Build.VERSION.SDK_INT >= 26) {
            WebView.getCurrentWebViewPackage()?.versionName
        } else {
            runCatching { context.packageManager.getPackageInfo("com.google.android.webview", 0).versionName }.getOrNull()
                ?: runCatching { context.packageManager.getPackageInfo("com.android.webview", 0).versionName }.getOrNull()
        }
        versionName?.substringBefore('.')?.toIntOrNull()
    }.getOrNull()
    return major == null || major >= 60
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun TrailerWebView(youtubeId: String, modifier: Modifier, onError: () -> Unit) {
    val playing = remember { mutableStateOf(false) }
    val alpha by animateFloatAsState(if (playing.value) 1f else 0f, tween(650), label = "trailerFade")
    val lifecycleOwner = LocalLifecycleOwner.current
    val webViewRef = remember { mutableStateOf<WebView?>(null) }
    // Keep the latest onError without recreating the WebView (the bridge reads it live).
    val onErrorState = rememberUpdatedState(onError)

    // The surface is only ever revealed once the IFrame reports it is actually PLAYING (via the JS
    // bridge). If the video is unavailable/embedding-disabled or the engine can't play it, no
    // reveal happens and the backdrop underneath stays — a broken player is never shown.

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE -> webViewRef.value?.onPause()
                Lifecycle.Event.ON_RESUME -> webViewRef.value?.onResume()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    AndroidView(
        modifier = modifier.fillMaxSize().alpha(alpha),
        factory = { ctx ->
            val view = runCatching {
                WebView(ctx).apply {
                    setBackgroundColor(AndroidColor.TRANSPARENT)
                    isFocusable = false
                    isFocusableInTouchMode = false
                    descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        // The single most important flag: allow the muted trailer to autoplay.
                        mediaPlaybackRequiresUserGesture = false
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        cacheMode = WebSettings.LOAD_NO_CACHE
                    }
                    webViewClient = object : WebViewClient() {
                        private fun keepInside(url: String): Boolean = !(
                            url.startsWith("https://www.youtube.com") ||
                                url.startsWith("https://youtube.com") ||
                                url.startsWith("https://www.youtube-nocookie.com") ||
                                url.startsWith("https://www.google.com") ||
                                url.startsWith("https://moalfarras.space") ||
                                url.startsWith("about:") ||
                                url.startsWith("data:")
                            )

                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean =
                            keepInside(request?.url?.toString().orEmpty())

                        @Deprecated("Kept for API < 24 which calls the String overload")
                        override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean =
                            keepInside(url.orEmpty())
                    }
                    addJavascriptInterface(
                        object {
                            // Called from the JS bridge thread. post() targets the WebView's main-thread
                            // handler, so the Compose state is only ever touched on the main thread.
                            @JavascriptInterface
                            fun onPlaying() {
                                post { playing.value = true }
                            }

                            // The IFrame reported it cannot play (embedding disabled / removed / etc.).
                            @JavascriptInterface
                            fun onError() {
                                post { onErrorState.value() }
                            }
                        },
                        "MoTrailerBridge",
                    )
                }
            }.getOrNull() ?: return@AndroidView View(ctx)
            webViewRef.value = view
            // Automatic cache hygiene: once per app session, drop any WebView disk cache left over
            // from older sessions/versions so the player never replays stale cached state. The
            // trailer WebViews are the app's only WebViews, so this is always safe.
            if (!trailerWebCacheCleared) {
                trailerWebCacheCleared = true
                runCatching { view.clearCache(true) }
            }
            // Base URL must be a REAL registered https origin (not a youtube.com spoof) or YouTube's
            // IFrame origin check rejects playback with error 150/152. Use the app's own domain and
            // pass the same value as the player `origin` so the enablejsapi handshake matches.
            view.loadDataWithBaseURL(TRAILER_ORIGIN, trailerHtml(youtubeId), "text/html", "utf-8", null)
            view
        },
        onRelease = { released ->
            (released as? WebView)?.let { web ->
                runCatching {
                    web.stopLoading()
                    web.loadUrl("about:blank")
                    // Per-instance onPause() + destroy() fully stop THIS WebView. Never call
                    // pauseTimers() here — it is process-GLOBAL and unpaired resumeTimers() would
                    // freeze JS timers for every later trailer's player (PLAYING would never fire).
                    web.onPause()
                    web.removeAllViews()
                    (web.parent as? ViewGroup)?.removeView(web)
                    web.destroy()
                }
            }
            webViewRef.value = null
        },
    )
}

/** A real registered https origin used as the WebView base URL AND the IFrame `origin` playerVar.
 *  YouTube rejects playback (error 150/152) when the page origin is a youtube.com spoof. */
private const val TRAILER_ORIGIN = "https://moalfarras.space"

/** One-shot per process: the first trailer WebView clears any stale disk cache automatically. */
private var trailerWebCacheCleared = false

/** Self-contained IFrame Player API page. Center-cropped (cover) to match the backdrop's crop. */
private fun trailerHtml(youtubeId: String): String {
    val safeId = youtubeId.filter { it.isLetterOrDigit() || it == '_' || it == '-' }.take(16)
    return """
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html,body{margin:0;padding:0;height:100%;width:100%;background:#000;overflow:hidden}
  /* 16:9 player sized to cover an arbitrary pane, centered — same crop feel as the backdrop image. */
  #p{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
     height:100%;width:177.78vh;min-width:100%;min-height:56.25vw;
     border:0;pointer-events:none}
</style>
</head>
<body>
<div id="p"></div>
<script>
  var tag=document.createElement('script');
  tag.src="https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  var player;
  function onYouTubeIframeAPIReady(){
    player=new YT.Player('p',{
      videoId:'$safeId',
      playerVars:{autoplay:1,mute:1,controls:0,rel:0,modestbranding:1,playsinline:1,
        fs:0,disablekb:1,iv_load_policy:3,loop:1,playlist:'$safeId',origin:'$TRAILER_ORIGIN'},
      events:{
        'onReady':function(e){ console.log('MOTRAILER ready'); try{e.target.mute();e.target.playVideo();}catch(err){} },
        'onStateChange':function(e){
          console.log('MOTRAILER state='+e.data);
          if(e.data===YT.PlayerState.PLAYING && window.MoTrailerBridge){
            try{MoTrailerBridge.onPlaying();}catch(err){}
          }
        },
        'onError':function(e){
          console.log('MOTRAILER error='+e.data);
          if(window.MoTrailerBridge){ try{MoTrailerBridge.onError();}catch(err){} }
        }
      }
    });
  }
</script>
</body>
</html>
""".trimIndent()
}
