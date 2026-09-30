package com.moalfarras.moplayer.ui.components

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color as AndroidColor
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.annotation.RequiresApi
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.delay

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

private val YoutubeIdPattern = Regex("^[A-Za-z0-9_-]{11}$")

/** Destroy the WebView (and its renderer process) after this long without a trailer to show. */
private const val TRAILER_IDLE_RELEASE_MS = 25_000L

/** Set when the WebView renderer crashed or was killed: trailers stay off for the rest of the session. */
@Volatile
private var trailerRendererLost = false

/** True when [id] is a well-formed YouTube video id (never mount the player with e.g. "null"). */
internal fun isValidYoutubeId(id: String): Boolean = YoutubeIdPattern.matches(id)

/**
 * The muted, controls-free, inline YouTube trailer of one preview pane.
 *
 * One WebView running YouTube's official IFrame Player API (a ToS-compliant embed) is created
 * lazily for the first trailer and then reused: switching titles calls `loadVideoById` instead of
 * rebuilding the WebView and re-downloading the player, and the HTTP/V8 caches stay warm. When no
 * trailer is requested the video is stopped and faded out; after [TRAILER_IDLE_RELEASE_MS] the
 * WebView is destroyed so its renderer process does not hold RAM on weak boxes.
 *
 * The surface is non-focusable (D-pad navigation is unaffected), fades in only once the video
 * actually plays, and only ever talks to YouTube's hosts — never to the IPTV provider.
 */
@Composable
fun PreviewTrailerHost(
    trailer: PreviewTrailer?,
    modifier: Modifier = Modifier,
    onError: (itemKey: String) -> Unit = {},
) {
    val context = LocalContext.current
    // Ancient system WebViews (e.g. the frozen Chrome 44 on bare AOSP API 23 images) can't run
    // YouTube's modern embed JS, so skip them entirely — the pane just keeps showing its art.
    val supported = remember { isModernWebViewAvailable(context) }
    if (!supported || trailerRendererLost) return
    val requested = trailer?.takeIf { isValidYoutubeId(it.youtubeId) }
    var active by remember { mutableStateOf(false) }
    LaunchedEffect(requested != null) {
        if (requested != null) {
            active = true
        } else {
            delay(TRAILER_IDLE_RELEASE_MS)
            active = false
        }
    }
    if (active || requested != null) {
        TrailerWebView(requested, modifier, onError, onRendererLost = { active = false })
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
private fun TrailerWebView(
    trailer: PreviewTrailer?,
    modifier: Modifier,
    onError: (String) -> Unit,
    onRendererLost: () -> Unit,
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    var webView by remember { mutableStateOf<WebView?>(null) }
    var pageLoaded by remember { mutableStateOf(false) }
    // The video id the IFrame last reported as PLAYING; the surface is revealed only when it
    // matches the requested trailer, so a late callback of the previous title can't flash it.
    var playingId by remember { mutableStateOf<String?>(null) }
    val currentTrailer by rememberUpdatedState(trailer)
    val currentOnError by rememberUpdatedState(onError)
    val currentOnRendererLost by rememberUpdatedState(onRendererLost)
    val visible = trailer != null && playingId == trailer.youtubeId
    val alpha by animateFloatAsState(if (visible) 1f else 0f, tween(if (visible) 550 else 180), label = "trailerFade")

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE -> webView?.onPause()
                Lifecycle.Event.ON_RESUME -> webView?.onResume()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Switch, stop or first-load the video whenever the requested trailer changes.
    LaunchedEffect(webView, trailer?.youtubeId) {
        val web = webView ?: return@LaunchedEffect
        val id = trailer?.youtubeId
        // Hide until the new request reports PLAYING: re-requesting a video that played before
        // (back to the same title after a stop) must not reveal the stopped player right away.
        playingId = null
        if (id == null) {
            web.evaluateJavascript("window.moStop&&moStop()", null)
            return@LaunchedEffect
        }
        if (!pageLoaded) {
            pageLoaded = true
            // Base URL must be a REAL registered https origin (not a youtube.com spoof) or YouTube's
            // IFrame origin check rejects playback with error 150/152.
            web.loadDataWithBaseURL(TRAILER_ORIGIN, trailerHtml(id), "text/html", "utf-8", null)
        } else {
            web.evaluateJavascript("window.moLoad&&moLoad('$id')", null)
        }
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
                    if (Build.VERSION.SDK_INT >= 26) {
                        // Under memory pressure the system kills this renderer, never the app.
                        setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_WAIVED, true)
                    }
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        // The single most important flag: allow the muted trailer to autoplay.
                        mediaPlaybackRequiresUserGesture = false
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        // The page itself is inline HTML and the title→video mapping is resolved
                        // outside the WebView, so the normal HTTP cache is safe and keeps the
                        // player scripts (and their compiled code) warm between titles.
                        cacheMode = WebSettings.LOAD_DEFAULT
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

                        // Without this the whole app dies when the renderer crashes or the low-memory
                        // killer reclaims it. Drop the WebView and keep trailers off for the session.
                        @RequiresApi(26)
                        override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                            trailerRendererLost = true
                            view?.let { gone ->
                                (gone.parent as? ViewGroup)?.removeView(gone)
                                runCatching { gone.destroy() }
                            }
                            webView = null
                            currentOnRendererLost()
                            return true
                        }
                    }
                    addJavascriptInterface(
                        object {
                            // Called from the JS bridge thread. post() targets the WebView's main-thread
                            // handler, so the Compose state is only ever touched on the main thread.
                            @JavascriptInterface
                            fun onPlaying(videoId: String?) {
                                post { playingId = videoId }
                            }

                            // The IFrame reported it cannot play (embedding disabled / removed / etc.).
                            @JavascriptInterface
                            fun onError(videoId: String?) {
                                post {
                                    val current = currentTrailer
                                    if (current != null && current.youtubeId == videoId) currentOnError(current.itemKey)
                                }
                            }
                        },
                        "MoTrailerBridge",
                    )
                }
            }.getOrNull() ?: return@AndroidView View(ctx)
            webView = view
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
            webView = null
            pageLoaded = false
            playingId = null
        },
    )
}

/** A real registered https origin used as the WebView base URL AND the IFrame `origin` playerVar.
 *  YouTube rejects playback (error 150/152) when the page origin is a youtube.com spoof. */
private const val TRAILER_ORIGIN = "https://moalfarras.space"

/**
 * Self-contained IFrame Player API page. Center-cropped (cover) to match the art it sits over.
 * `moLoad(id)` switches the video in place, `moStop()` stops it; every bridge callback carries
 * the video id so the app can ignore callbacks that belong to a previous title.
 */
private fun trailerHtml(youtubeId: String): String {
    val safeId = youtubeId.filter { it.isLetterOrDigit() || it == '_' || it == '-' }.take(16)
    return """
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html,body{margin:0;padding:0;height:100%;width:100%;background:#000;overflow:hidden}
  #p{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
     height:100%;width:177.78vh;min-width:100%;min-height:56.25vw;
     border:0;pointer-events:none}
</style>
</head>
<body>
<div id="p"></div>
<script>
  var player=null, ready=false, wanted='$safeId';
  function currentId(){
    try{ var d=player&&player.getVideoData&&player.getVideoData(); if(d&&d.video_id){ return d.video_id; } }catch(e){}
    return wanted;
  }
  function moLoad(id){
    wanted=id;
    if(ready&&player){ try{ player.mute(); player.loadVideoById(id); }catch(e){} }
  }
  function moStop(){
    if(ready&&player){ try{ player.stopVideo(); }catch(e){} }
  }
  var tag=document.createElement('script');
  tag.src="https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  function onYouTubeIframeAPIReady(){
    player=new YT.Player('p',{
      videoId:wanted,
      playerVars:{autoplay:1,mute:1,controls:0,rel:0,modestbranding:1,playsinline:1,
        fs:0,disablekb:1,iv_load_policy:3,origin:'$TRAILER_ORIGIN'},
      events:{
        'onReady':function(e){
          ready=true;
          try{ e.target.mute(); if(currentId()!==wanted){ e.target.loadVideoById(wanted); } else { e.target.playVideo(); } }catch(err){}
        },
        'onStateChange':function(e){
          if(e.data===YT.PlayerState.PLAYING && window.MoTrailerBridge){
            try{ MoTrailerBridge.onPlaying(currentId()); }catch(err){}
          }
          if(e.data===YT.PlayerState.ENDED){
            try{ e.target.seekTo(0); e.target.playVideo(); }catch(err){}
          }
        },
        'onError':function(e){
          if(window.MoTrailerBridge){ try{ MoTrailerBridge.onError(currentId()); }catch(err){} }
        }
      }
    });
  }
</script>
</body>
</html>
""".trimIndent()
}
