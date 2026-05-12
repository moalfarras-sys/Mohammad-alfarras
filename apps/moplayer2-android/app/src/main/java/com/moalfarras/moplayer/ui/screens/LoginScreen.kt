package com.moalfarras.moplayer.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moalfarras.moplayerpro.R
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.DeviceActivationSession
import com.moalfarras.moplayer.domain.model.DeviceActivationStatus
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.ui.components.AnimatedLoginBackground
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.theme.*
import coil3.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalTime

private enum class LoginMode { M3U, XTREAM, FILE, ACTIVATION }

@Composable
private fun LoginBackdropLayer(settings: AppSettings) {
    val epochDay = LocalDate.now().toEpochDay()
    val backdropUrl = remember(
        settings.backgroundMode,
        settings.customBackgroundUrl,
        settings.themePreset,
        epochDay,
    ) {
        resolveHomeBackdropUrl(settings, contentBackdropUrl = null, epochDay = epochDay)
    }
    Box(Modifier.fillMaxSize()) {
        if (backdropUrl != null) {
            AsyncImage(
                model = backdropUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        alpha = 1f
                        scaleX = 1.04f
                        scaleY = 1.04f
                    },
            )
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colorStops = arrayOf(
                                0f to Color(0x18050403),
                                0.35f to Color.Transparent,
                                0.72f to Color(0x28050403),
                                1f to Color(0x55050403),
                            ),
                        ),
                    ),
            )
            AnimatedLoginBackground(Modifier.graphicsLayer { alpha = 0.07f })
        } else {
            Box(Modifier.fillMaxSize().background(Color(0xFF050403)))
            AnimatedLoginBackground()
        }
    }
}

@Composable
fun LoginScreen(
    settings: AppSettings = AppSettings(),
    loading: LoadProgress?,
    error: String?,
    activationSession: DeviceActivationSession?,
    onM3u: (String, String, String) -> Unit,
    onM3uFile: (String, String, String) -> Unit,
    onXtream: (String, String, String, String) -> Unit,
    onActivationCode: (String) -> Unit,
    onRefreshQr: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tv = rememberTvScale()
    var mode by remember { mutableStateOf(LoginMode.XTREAM) }
    var name by remember { mutableStateOf("") }
    var m3u  by remember { mutableStateOf("") }
    var epgUrl by remember { mutableStateOf("") }
    var url  by remember { mutableStateOf("") }
    var user by remember { mutableStateOf("") }
    var pass by remember { mutableStateOf("") }
    var activationCode by remember { mutableStateOf("") }
    var fileMessage by remember { mutableStateOf<String?>(null) }
    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            runCatching {
                val fileName = uri.lastPathSegment?.substringAfterLast('/')?.substringAfterLast(':') ?: "playlist.m3u"
                val text = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }.orEmpty()
                }
                require(text.isNotBlank()) { "الملف فارغ أو غير قابل للقراءة" }
                onM3uFile(name, fileName, text)
            }.onFailure { throwable ->
                fileMessage = throwable.message ?: "تعذر قراءة ملف M3U"
            }
        }
    }

    if (!tv.isTv) {
        CompactLoginScreen(
            settings = settings,
            mode = mode,
            name = name,
            m3u = m3u,
            epgUrl = epgUrl,
            url = url,
            user = user,
            pass = pass,
            activationCode = activationCode,
            loading = loading,
            error = error,
            fileMessage = fileMessage,
            onMode = { mode = it },
            onName = { name = it },
            onM3u = { m3u = it },
            onEpgUrl = { epgUrl = it },
            onUrl = { url = it },
            onUser = { user = it },
            onPass = { pass = it },
            onActivationCode = { activationCode = it.uppercase().filter { char -> char.isLetterOrDigit() || char == '-' }.take(18) },
            submitM3u = { onM3u(name, m3u, epgUrl) },
            submitM3uFile = { fileMessage = null; filePicker.launch(arrayOf("audio/x-mpegurl", "application/vnd.apple.mpegurl", "text/*", "application/octet-stream")) },
            submitXtream = { onXtream(name, url, user, pass) },
            submitActivation = { if (activationCode.isBlank()) onRefreshQr() else onActivationCode(activationCode) },
        )
        return
    }

    Box(Modifier.fillMaxSize()) {
        LoginBackdropLayer(settings)

        // Top status bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = tv.contentPadding, vertical = (24 * tv.factor).dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TopStatusWidget(tv = tv)
            LoginGlassChip(tv = tv)
        }

        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            LoginGlassCard(
                mode = mode, name = name, m3u = m3u, url = url, user = user, pass = pass, activationCode = activationCode,
                epgUrl = epgUrl,
                loading = loading, error = error, fileMessage = fileMessage, activationSession = activationSession, tv = tv,
                onMode = { mode = it }, onName = { name = it }, onM3u = { m3u = it }, onEpgUrl = { epgUrl = it },
                onUrl = { url = it }, onUser = { user = it }, onPass = { pass = it },
                onActivationCode = { activationCode = it.uppercase().filter { char -> char.isLetterOrDigit() || char == '-' }.take(18) },
                submitM3u = { onM3u(name, m3u, epgUrl) },
                submitM3uFile = { fileMessage = null; filePicker.launch(arrayOf("audio/x-mpegurl", "application/vnd.apple.mpegurl", "text/*", "application/octet-stream")) },
                submitXtream = { onXtream(name, url, user, pass) },
                submitActivation = { if (activationCode.isBlank()) onRefreshQr() else onActivationCode(activationCode) },
                submitQrRefresh = { onRefreshQr() },
            )
        }
    }
}


@Composable
private fun TopStatusWidget(tv: TvScale, modifier: Modifier = Modifier) {
    val accent = LocalMoVisuals.current.accent
    GlassPanel(modifier = modifier, radius = 999.dp, blur = 12.dp) {
        Row(
            modifier = Modifier.padding(horizontal = (20 * tv.factor).dp, vertical = (10 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
        ) {
            Icon(Icons.Rounded.WifiTethering, null, tint = accent, modifier = Modifier.size((18 * tv.factor).dp))
            Text(LocalTime.now().withSecond(0).withNano(0).toString(), color = Color.White, fontSize = (15 * tv.factor).sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width((1 * tv.factor).dp).height((16 * tv.factor).dp).background(Color(0x33FFFFFF)))
            Text("MoPlayer Pro", color = Color(0xCCE3BC78), fontSize = (13 * tv.factor).sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun LoginGlassChip(tv: TvScale) {
    val accent = LocalMoVisuals.current.accent
    GlassPanel(radius = 999.dp, blur = 12.dp) {
        Row(
            modifier = Modifier.padding(horizontal = (18 * tv.factor).dp, vertical = (10 * tv.factor).dp),
            horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Rounded.Verified, null, tint = accent, modifier = Modifier.size((18 * tv.factor).dp))
            Text("Premium UI", color = Color.White, fontSize = (14 * tv.factor).sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun LoginGlassCard(
    mode: LoginMode, name: String, m3u: String, url: String, user: String, pass: String, activationCode: String,
    epgUrl: String,
    loading: LoadProgress?, error: String?, fileMessage: String?, activationSession: DeviceActivationSession?,
    tv: TvScale,
    onMode: (LoginMode) -> Unit,
    onName: (String) -> Unit, onM3u: (String) -> Unit, onEpgUrl: (String) -> Unit, onUrl: (String) -> Unit,
    onUser: (String) -> Unit, onPass: (String) -> Unit,
    onActivationCode: (String) -> Unit,
    submitM3u: () -> Unit, submitM3uFile: () -> Unit, submitXtream: () -> Unit, submitActivation: () -> Unit, submitQrRefresh: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    GlassPanel(
        modifier = if (tv.isTv) {
            Modifier.width((460 * tv.factor).dp)
        } else {
            Modifier.fillMaxWidth().padding(horizontal = tv.contentPadding)
        },
        radius = (32 * tv.factor).dp,
        blur = 24.dp,
        glow = visuals.accent.copy(alpha = 0.15f),
    ) {
        Column(
            modifier = Modifier.padding(tv.panelPadding),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
        ) {
            PulsingLogo(tv, loading != null)
            Text(
                "MoPlayer Pro",
                color = Color.White,
                fontSize = (28 * tv.factor).sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 2.sp,
            )

            Spacer(Modifier.height((4 * tv.factor).dp))
            ModeDock(mode, tv, onMode)
            if (mode == LoginMode.ACTIVATION) {
                QrActivationPanel(
                    session = activationSession,
                    manualCode = activationCode,
                    tv = tv,
                    onManualCode = onActivationCode,
                    onRefresh = submitQrRefresh,
                    onSubmitManual = submitActivation,
                )
            }

            if (mode != LoginMode.ACTIVATION) when (mode) {
                LoginMode.M3U -> {
                    GlassTextField(name, onName, "الاسم", tv, Icons.Rounded.Person)
                    GlassTextField(m3u,  onM3u,  "رابط M3U", tv, Icons.Rounded.Link, KeyboardType.Uri)
                    GlassTextField(epgUrl, onEpgUrl, "رابط XMLTV اختياري", tv, Icons.Rounded.EventNote, KeyboardType.Uri)
                    GlassActionButton("دخول", Icons.Rounded.RocketLaunch, loading == null && m3u.isNotBlank(), tv, submitM3u)
                }
                LoginMode.XTREAM -> {
                    GlassTextField(name, onName, "الاسم",        tv, Icons.Rounded.Person)
                    GlassTextField(url,  onUrl,  "رابط السيرفر", tv, Icons.Rounded.Public, KeyboardType.Uri)
                    GlassTextField(user, onUser, "يوزر",         tv, Icons.Rounded.Person)
                    GlassPasswordField(pass, onPass, "باسورد", tv)
                    GlassActionButton("دخول", Icons.Rounded.RocketLaunch, loading == null && url.isNotBlank() && user.isNotBlank(), tv, submitXtream)
                }
                LoginMode.FILE -> {
                    GlassTextField(name, onName, "اسم القائمة", tv, Icons.Rounded.Person)
                    Text(
                        "اختر ملف M3U أو M3U8 من الجهاز. سيتم تحليله وحفظه محليًا بدون رفعه لأي خادم.",
                        color = Color(0xAAE3BC78),
                        fontSize = (12 * tv.factor).sp,
                        textAlign = TextAlign.Center,
                    )
                    GlassActionButton("اختيار ملف M3U", Icons.Rounded.FolderOpen, loading == null, tv, submitM3uFile)
                }
                LoginMode.ACTIVATION -> {
                    GlassTextField(
                        value = activationCode,
                        onValue = onActivationCode,
                        label = "كود التفعيل",
                        tv = tv,
                        icon = Icons.Rounded.Key,
                    )
                    Text(
                        "أدخل الكود من لوحة MoPlayer Pro Control لربط الجهاز بدون كتابة بيانات السيرفر على التلفزيون.",
                        color = Color(0xAAE3BC78),
                        fontSize = (12 * tv.factor).sp,
                        textAlign = TextAlign.Center,
                    )
                    GlassActionButton("تفعيل الجهاز", Icons.Rounded.Verified, loading == null && activationCode.length >= 6, tv, submitActivation)
                }
            }

            if (loading != null) FluidLoadingBar(loading, tv)
            if (error   != null) ErrorGlassCard(error, tv)
            if (fileMessage != null) ErrorGlassCard(fileMessage, tv)
        }
    }
}

@Composable
private fun CompactLoginScreen(
    settings: AppSettings,
    mode: LoginMode,
    name: String,
    m3u: String,
    epgUrl: String,
    url: String,
    user: String,
    pass: String,
    activationCode: String,
    loading: LoadProgress?,
    error: String?,
    fileMessage: String?,
    onMode: (LoginMode) -> Unit,
    onName: (String) -> Unit,
    onM3u: (String) -> Unit,
    onEpgUrl: (String) -> Unit,
    onUrl: (String) -> Unit,
    onUser: (String) -> Unit,
    onPass: (String) -> Unit,
    onActivationCode: (String) -> Unit,
    submitM3u: () -> Unit,
    submitM3uFile: () -> Unit,
    submitXtream: () -> Unit,
    submitActivation: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val useWideLayout = !tv.isTv && tv.maxOfWidthHeightDp >= 560
    val logoSize = when {
        tv.isLowHeightLandscape -> 44.dp
        tv.isCompact -> 52.dp
        else -> 72.dp
    }
    val fieldHeight = when {
        tv.isLowHeightLandscape -> 40.dp
        tv.isCompact -> 44.dp
        else -> 48.dp
    }
    val outerPadH = when {
        tv.isLowHeightLandscape -> 10.dp
        tv.isCompact -> 12.dp
        else -> 18.dp
    }
    val outerPadV = when {
        tv.isLowHeightLandscape -> 6.dp
        tv.isCompact -> 10.dp
        else -> 14.dp
    }
    val formSpacing = if (tv.isLowHeightLandscape) 6.dp else if (tv.isCompact) 8.dp else 12.dp

    @Composable
    fun LoginFields(modifier: Modifier = Modifier) {
        Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(formSpacing)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                CompactModeButton("M3U", mode == LoginMode.M3U, Modifier.weight(1f)) { onMode(LoginMode.M3U) }
                CompactModeButton("Xtream", mode == LoginMode.XTREAM, Modifier.weight(1f)) { onMode(LoginMode.XTREAM) }
                CompactModeButton("File", mode == LoginMode.FILE, Modifier.weight(1f)) { onMode(LoginMode.FILE) }
                CompactModeButton("Code", mode == LoginMode.ACTIVATION, Modifier.weight(1f)) { onMode(LoginMode.ACTIVATION) }
            }
            if (mode != LoginMode.ACTIVATION) {
                CompactTextField(name, onName, "الاسم", Icons.Rounded.Person)
            }
            when (mode) {
                LoginMode.M3U -> {
                    CompactTextField(m3u, onM3u, "رابط M3U", Icons.Rounded.Link, KeyboardType.Uri)
                    CompactTextField(epgUrl, onEpgUrl, "XMLTV اختياري", Icons.Rounded.EventNote, KeyboardType.Uri)
                    Button(
                        onClick = submitM3u,
                        enabled = loading == null && m3u.isNotBlank(),
                        modifier = Modifier.fillMaxWidth().height(fieldHeight),
                    ) { Text(if (loading == null) "دخول" else loading.phase) }
                }
                LoginMode.XTREAM -> {
                    CompactTextField(url, onUrl, "رابط السيرفر", Icons.Rounded.Public, KeyboardType.Uri)
                    CompactTextField(user, onUser, "اسم المستخدم", Icons.Rounded.Person)
                    CompactPasswordField(pass, onPass)
                    Button(
                        onClick = submitXtream,
                        enabled = loading == null && url.isNotBlank() && user.isNotBlank() && pass.isNotBlank(),
                        modifier = Modifier.fillMaxWidth().height(fieldHeight),
                    ) { Text(if (loading == null) "دخول" else loading.phase) }
                }
                LoginMode.FILE -> {
                    Text("اختر ملف M3U من الجهاز لتحليله وحفظه محليًا.", color = Color(0xAAE3BC78), style = MaterialTheme.typography.bodySmall)
                    Button(
                        onClick = submitM3uFile,
                        enabled = loading == null,
                        modifier = Modifier.fillMaxWidth().height(fieldHeight),
                    ) { Text(if (loading == null) "اختيار ملف M3U" else loading.phase) }
                }
                LoginMode.ACTIVATION -> {
                    CompactTextField(activationCode, onActivationCode, "كود التفعيل", Icons.Rounded.Key)
                    Button(
                        onClick = submitActivation,
                        enabled = loading == null && activationCode.length >= 6,
                        modifier = Modifier.fillMaxWidth().height(fieldHeight),
                    ) { Text(if (loading == null) "تفعيل الجهاز" else loading.phase) }
                }
            }
            if (error != null) {
                Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, maxLines = 4)
            }
            if (fileMessage != null) {
                Text(fileMessage, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, maxLines = 4)
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        LoginBackdropLayer(settings)
        Box(
            Modifier
                .fillMaxSize()
                .padding(horizontal = outerPadH, vertical = outerPadV),
        ) {
        if (useWideLayout) {
            Row(
                Modifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Column(
                    Modifier
                        .weight(0.32f)
                        .fillMaxHeight(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Image(
                        painter = painterResource(R.drawable.ic_splash_logo),
                        contentDescription = "MoPlayer Pro",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.size(logoSize + 10.dp),
                    )
                    Text("MoPlayer Pro", color = Color.White, style = MaterialTheme.typography.headlineSmall)
                    if (!tv.isLowHeightLandscape) {
                        Text(
                            "IPTV for TV and mobile",
                            color = visuals.accent,
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 2,
                        )
                    }
                }
                Column(
                    Modifier
                        .weight(0.68f)
                        .fillMaxHeight()
                        .verticalScroll(rememberScrollState()),
                ) {
                    LoginFields(Modifier.fillMaxWidth())
                }
            }
        } else {
            Column(
                Modifier
                    .fillMaxSize()
                    .widthIn(max = 560.dp)
                    .align(Alignment.Center)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(formSpacing, Alignment.CenterVertically),
            ) {
                Image(
                    painter = painterResource(R.drawable.ic_splash_logo),
                    contentDescription = "MoPlayer Pro",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.size(logoSize),
                )
                Text(
                    "MoPlayer Pro",
                    color = Color.White,
                    style = if (tv.isLowHeightLandscape) MaterialTheme.typography.titleLarge else MaterialTheme.typography.headlineLarge,
                )
                if (!(tv.isLowHeightLandscape && tv.isCompact)) {
                    Text("IPTV for TV and mobile", color = visuals.accent, style = MaterialTheme.typography.bodySmall, maxLines = 1)
                }
                LoginFields(Modifier.fillMaxWidth())
            }
        }
        }
    }
}

@Composable
private fun CompactModeButton(text: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (selected) visuals.accent.copy(alpha = 0.18f) else Color.Transparent,
            contentColor = if (selected) visuals.accent else Color.White,
        ),
    ) { Text(text) }
}

@Composable
private fun CompactTextField(
    value: String,
    onValue: (String) -> Unit,
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val visuals = LocalMoVisuals.current
    OutlinedTextField(
        value = value,
        onValueChange = onValue,
        label = { Text(label) },
        leadingIcon = { Icon(icon, null) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        visualTransformation = visualTransformation,
        modifier = Modifier.fillMaxWidth(),
        textStyle = LocalTextStyle.current.copy(color = Color.White, fontWeight = FontWeight.SemiBold),
        colors = TextFieldDefaults.colors(
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White,
            focusedContainerColor = Color(0x332A2723),
            unfocusedContainerColor = Color(0x222A2723),
            focusedLabelColor = visuals.accent,
            unfocusedLabelColor = Color(0xDDE3BC78),
            focusedIndicatorColor = visuals.accent,
            unfocusedIndicatorColor = Color(0x66E3BC78),
            cursorColor = visuals.accent,
        ),
    )
}

@Composable
private fun ModeDock(mode: LoginMode, tv: TvScale, onMode: (LoginMode) -> Unit) {
    GlassLoginPanel(radius = 999.dp) {
        Row(Modifier.padding(5.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            ModeTab("M3U",    mode == LoginMode.M3U,    tv) { onMode(LoginMode.M3U) }
            ModeTab("Xtream", mode == LoginMode.XTREAM, tv) { onMode(LoginMode.XTREAM) }
            ModeTab("File", mode == LoginMode.FILE, tv) { onMode(LoginMode.FILE) }
            ModeTab("Code", mode == LoginMode.ACTIVATION, tv) { onMode(LoginMode.ACTIVATION) }
        }
    }
}

@Composable
private fun ModeTab(text: String, selected: Boolean, tv: TvScale, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val scale by animateFloatAsState(
        targetValue = if (focused) 1.14f else if (selected) 1.04f else 1f,
        animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMediumLow),
        label = "tab",
    )
    val accent = LocalMoVisuals.current.accent
    val bg by animateColorAsState(
        if (selected || focused) accent.copy(alpha = 0.22f) else Color.Transparent, label = "tab-bg"
    )
    Box(
        modifier = Modifier
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .clip(RoundedCornerShape(999.dp))
            .background(bg)
            .clickable(interactionSource = interaction, indication = null, onClick = onClick)
            .focusable(interactionSource = interaction)
            .padding(horizontal = (20 * tv.factor).dp, vertical = (11 * tv.factor).dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text, color = if (selected || focused) accent else Color(0xAAFFFFFF),
            fontSize = (13 * tv.factor).sp, fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun GlassTextField(
    value: String, onValue: (String) -> Unit, label: String,
    tv: TvScale, icon: androidx.compose.ui.graphics.vector.ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val visuals = LocalMoVisuals.current
    val accent = visuals.accent
    val border by animateColorAsState(if (focused) accent else Color(0x33E3BC78), label = "field-border")
    val scale  by animateFloatAsState(
        if (focused) 1.025f else 1f,
        spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMedium), label = "field-scale"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height((56 * tv.factor).dp)
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .shadow(if (focused) 24.dp else 0.dp, RoundedCornerShape(999.dp), clip = false,
                ambientColor = accent.copy(alpha = 0.3f), spotColor = accent.copy(alpha = 0.3f)),
        shape  = RoundedCornerShape(999.dp),
        color  = if (focused) Color(0x552A2723) else Color(0x44312D28),
        border = BorderStroke(if (focused) 1.5.dp else 1.dp, border),
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = (26 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
        ) {
            Icon(icon, null, tint = if (focused) accent else Color(0xAAE3BC78), modifier = Modifier.size((28 * tv.factor).dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                if (value.isNotBlank()) {
                    Text(
                        label,
                        color = if (focused) accent else Color(0xDDE3BC78),
                        fontSize = (13 * tv.factor).sp,
                        lineHeight = (17 * tv.factor).sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                    )
                }
                BasicTextField(
                    value = value,
                    onValueChange = onValue,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    interactionSource = interaction,
                    keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
                    visualTransformation = visualTransformation,
                    textStyle = TextStyle(
                        color = visuals.textPrimary,
                        fontSize = (16 * tv.factor).sp,
                        lineHeight = (22 * tv.factor).sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.sp,
                    ),
                    cursorBrush = SolidColor(accent),
                    decorationBox = { innerTextField ->
                        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                            if (value.isBlank()) {
                                Text(
                                    label,
                                    color = Color(0x88E3BC78),
                                    fontSize = (16 * tv.factor).sp,
                                    lineHeight = (22 * tv.factor).sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                )
                            }
                            innerTextField()
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun GlassPasswordField(
    value: String, onValue: (String) -> Unit, label: String, tv: TvScale,
) {
    var visible by remember { mutableStateOf(false) }
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val visuals = LocalMoVisuals.current
    val accent = visuals.accent
    val border by animateColorAsState(if (focused) accent else Color(0x33E3BC78), label = "pw-border")
    val scale by animateFloatAsState(
        if (focused) 1.025f else 1f,
        spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMedium), label = "pw-scale",
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height((56 * tv.factor).dp)
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .shadow(if (focused) 24.dp else 0.dp, RoundedCornerShape(999.dp), clip = false,
                ambientColor = accent.copy(alpha = 0.3f), spotColor = accent.copy(alpha = 0.3f)),
        shape = RoundedCornerShape(999.dp),
        color = if (focused) Color(0x552A2723) else Color(0x44312D28),
        border = BorderStroke(if (focused) 1.5.dp else 1.dp, border),
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = (26 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
        ) {
            Icon(Icons.Rounded.Lock, null, tint = if (focused) accent else Color(0xAAE3BC78), modifier = Modifier.size((28 * tv.factor).dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                if (value.isNotBlank()) {
                    Text(
                        label,
                        color = if (focused) accent else Color(0xDDE3BC78),
                        fontSize = (13 * tv.factor).sp,
                        lineHeight = (17 * tv.factor).sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                    )
                }
                BasicTextField(
                    value = value,
                    onValueChange = onValue,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    interactionSource = interaction,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
                    textStyle = TextStyle(
                        color = visuals.textPrimary,
                        fontSize = (16 * tv.factor).sp,
                        lineHeight = (22 * tv.factor).sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.sp,
                    ),
                    cursorBrush = SolidColor(accent),
                    decorationBox = { innerTextField ->
                        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                            if (value.isBlank()) {
                                Text(
                                    label,
                                    color = Color(0x88E3BC78),
                                    fontSize = (16 * tv.factor).sp,
                                    lineHeight = (22 * tv.factor).sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                )
                            }
                            innerTextField()
                        }
                    },
                )
            }
            IconButton(onClick = { visible = !visible }) {
                Icon(
                    if (visible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                    contentDescription = if (visible) "إخفاء كلمة المرور" else "إظهار كلمة المرور",
                    tint = if (focused) accent else Color(0xAAE3BC78),
                )
            }
        }
    }
}

@Composable
private fun CompactPasswordField(value: String, onValue: (String) -> Unit) {
    var visible by remember { mutableStateOf(false) }
    val visuals = LocalMoVisuals.current
    OutlinedTextField(
        value = value,
        onValueChange = onValue,
        label = { Text("كلمة المرور") },
        leadingIcon = { Icon(Icons.Rounded.Lock, null) },
        trailingIcon = {
            IconButton(onClick = { visible = !visible }) {
                Icon(
                    if (visible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                    contentDescription = if (visible) "Hide" else "Show",
                )
            }
        },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        modifier = Modifier.fillMaxWidth(),
        textStyle = LocalTextStyle.current.copy(color = Color.White, fontWeight = FontWeight.SemiBold),
        colors = TextFieldDefaults.colors(
            focusedTextColor = Color.White, unfocusedTextColor = Color.White,
            focusedContainerColor = Color(0x332A2723), unfocusedContainerColor = Color(0x222A2723),
            focusedLabelColor = visuals.accent, unfocusedLabelColor = Color(0xDDE3BC78),
            focusedIndicatorColor = visuals.accent, unfocusedIndicatorColor = Color(0x66E3BC78),
            cursorColor = visuals.accent,
        ),
    )
}

@Composable
private fun GlassActionButton(
    text: String, icon: androidx.compose.ui.graphics.vector.ImageVector,
    enabled: Boolean, tv: TvScale, onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val accent = visuals.accent
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val scale by animateFloatAsState(
        if (focused) 1.06f else 1f,
        spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMediumLow), label = "btn-scale"
    )
    val alpha = if (enabled) 1f else 0.40f
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height((48 * tv.factor).dp)
            .graphicsLayer { scaleX = scale; scaleY = scale; this.alpha = alpha }
            .shadow(if (focused) 40.dp else 12.dp, RoundedCornerShape(999.dp), clip = false,
                ambientColor = accent.copy(alpha = 0.5f), spotColor = accent.copy(alpha = 0.5f))
            .clip(RoundedCornerShape(999.dp))
            .background(
                Brush.horizontalGradient(listOf(accent, visuals.accentB))
            )
            .clickable(enabled = enabled, interactionSource = interaction, indication = null, onClick = onClick)
            .focusable(enabled = enabled, interactionSource = interaction),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp)) {
            Icon(icon, null, tint = Color.White, modifier = Modifier.size((21 * tv.factor).dp))
            Text(text, color = Color.White, fontSize = (16 * tv.factor).sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

// ── Local glass panel (self-contained, no dependency on GlassPanel component) ─
@Composable
private fun GlassLoginPanel(
    modifier: Modifier = Modifier,
    radius: Dp = 24.dp,
    glow: Color = Color(0x1AE3BC78),
    content: @Composable () -> Unit,
) {
    Surface(
        modifier = modifier
            .shadow(28.dp, RoundedCornerShape(radius), clip = false, ambientColor = glow, spotColor = glow),
        shape  = RoundedCornerShape(radius),
        color  = Color(0x881E1A16),
        border = BorderStroke(
            1.dp,
            Brush.linearGradient(
                listOf(
                    Color(0x33E3BC78),
                    Color(0x1AFF5252),
                    Color(0x22FFB366),
                    Color(0x1AE3BC78),
                ),
                start = Offset(0f, 0f),
                end   = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY),
            )
        ),
        content = content,
    )
}

@Composable
private fun PulsingLogo(tv: TvScale, active: Boolean) {
    val transition = rememberInfiniteTransition(label = "logo-pulse")
    val pulse by transition.animateFloat(
        initialValue = 0.88f, targetValue = 1.08f,
        animationSpec = infiniteRepeatable(tween(1400, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    val accent = LocalMoVisuals.current.accent
    val accentB = LocalMoVisuals.current.accentB
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size((140 * tv.factor).dp)) {
        if (active) {
            Canvas(Modifier.fillMaxSize()) {
                drawCircle(accent.copy(alpha = 0.15f), radius = size.minDimension * 0.48f * pulse)
                drawCircle(accentB.copy(alpha = 0.10f), radius = size.minDimension * 0.34f * pulse)
            }
        }
        Image(
            painter = painterResource(R.drawable.ic_splash_logo),
            contentDescription = null,
            modifier = Modifier
                .width((130 * tv.factor).dp)
                .height((82 * tv.factor).dp)
                .graphicsLayer { scaleX = if (active) pulse else 1f; scaleY = if (active) pulse else 1f },
        )
    }
}

@Composable
private fun FluidLoadingBar(progress: LoadProgress, tv: TvScale) {
    val transition = rememberInfiniteTransition(label = "fluid-loading")
    val wave by transition.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(1600, easing = LinearEasing)),
        label = "wave",
    )
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp)) {
        Text(progress.phase, color = Color(0xCCE3BC78), fontSize = (13 * tv.factor).sp, fontWeight = FontWeight.SemiBold)
        val accent = LocalMoVisuals.current.accent
        val accentB = LocalMoVisuals.current.accentB
        Canvas(
            Modifier.fillMaxWidth().height((10 * tv.factor).dp).clip(RoundedCornerShape(999.dp))
        ) {
            drawRoundRect(Color(0x222A231E), cornerRadius = androidx.compose.ui.geometry.CornerRadius(size.height))
            val filled = size.width * progress.percent.coerceIn(0f, 1f)
            drawRoundRect(
                brush = Brush.linearGradient(
                    listOf(accent.copy(alpha = 0.5f), accent, accentB.copy(alpha = 0.8f)),
                    start = Offset(size.width * wave - size.width, 0f),
                    end   = Offset(size.width * wave, size.height),
                ),
                size = Size(filled, size.height),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(size.height),
            )
        }
    }
}

@Composable
private fun ErrorGlassCard(error: String, tv: TvScale) {
    GlassLoginPanel(radius = (18 * tv.factor).dp, glow = Color(0x44FF4D6D)) {
        Text(
            text = error,
            color = Color(0xFFFF8FA3),
            fontSize = (13 * tv.factor).sp,
            lineHeight = (18 * tv.factor).sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding((14 * tv.factor).dp),
        )
    }
}

@Composable
private fun QrActivationPanel(
    session: DeviceActivationSession?,
    manualCode: String,
    tv: TvScale,
    onManualCode: (String) -> Unit,
    onRefresh: () -> Unit,
    onSubmitManual: () -> Unit,
) {
    LaunchedEffect(Unit) {
        if (session == null) onRefresh()
    }
    val panelSpacing = if (tv.isTv) (8 * tv.factor).dp else (12 * tv.factor).dp
    val qrSize = if (tv.isTv) (180 * tv.factor).dp else (210 * tv.factor).dp
    val qrPadding = if (tv.isTv) (8 * tv.factor).dp else (10 * tv.factor).dp
    val codeFont = if (tv.isTv) (26 * tv.factor).sp else (30 * tv.factor).sp
    val smallFont = if (tv.isTv) (11 * tv.factor).sp else (12 * tv.factor).sp
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(panelSpacing),
    ) {
        if (session?.verificationUrlComplete?.isNotBlank() == true) {
            Image(
                bitmap = remember(session.verificationUrlComplete) { qrBitmap(session.verificationUrlComplete, 360).asImageBitmap() },
                contentDescription = "QR activation code",
                modifier = Modifier
                    .size(qrSize)
                    .clip(RoundedCornerShape((18 * tv.factor).dp))
                    .background(Color.White)
                    .padding(qrPadding),
            )
            Text(session.userCode, color = Color.White, fontSize = codeFont, fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp)
            Text(session.verificationUrl, color = Color(0xCCE3BC78), fontSize = smallFont, textAlign = TextAlign.Center, maxLines = 2)
            val statusText = when (session.status) {
                DeviceActivationStatus.WAITING -> "بانتظار التفعيل - ${session.secondsRemaining} ث"
                DeviceActivationStatus.ACTIVATED -> "تم التفعيل. بدء المزامنة..."
                DeviceActivationStatus.EXPIRED -> "انتهت صلاحية الكود. حدّث QR."
                DeviceActivationStatus.ERROR -> session.error.ifBlank { "تعذر التفعيل الآن." }
            }
            Text(
                statusText,
                color = if (session.status == DeviceActivationStatus.ERROR) Color(0xFFFF8FA3) else Color(0xAAFFFFFF),
                fontSize = smallFont,
                textAlign = TextAlign.Center,
            )
        } else {
            Text("أنشئ كود QR مؤقت لربط هذا التلفزيون.", color = Color(0xAAFFFFFF), fontSize = (13 * tv.factor).sp, textAlign = TextAlign.Center)
        }
        GlassActionButton("تحديث QR", Icons.Rounded.Refresh, true, tv, onRefresh)
        if (!tv.isTv) {
            GlassTextField(
                value = manualCode,
                onValue = onManualCode,
                label = "كود التفعيل اليدوي",
                tv = tv,
                icon = Icons.Rounded.Key,
            )
            GlassActionButton("استخدام الكود", Icons.Rounded.Verified, manualCode.length >= 6, tv, onSubmitManual)
        }
    }
}

private fun qrBitmap(value: String, size: Int): android.graphics.Bitmap {
    val matrix = QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, size, size)
    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    for (x in 0 until size) {
        for (y in 0 until size) {
            bitmap.setPixel(x, y, if (matrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
        }
    }
    return bitmap
}

@Preview(name = "Login Glass TV 1080p", device = "spec:width=1920dp,height=1080dp,dpi=320", showBackground = true)
@Composable
private fun LoginScreenPreview1080() {
    MoTheme {
        LoginScreen(
            loading = LoadProgress("جاري التحميل", 62, 100),
            error = null,
            activationSession = null,
            onM3u = { _, _, _ -> },
            onM3uFile = { _, _, _ -> },
            onXtream = { _, _, _, _ -> },
            onActivationCode = {},
            onRefreshQr = {},
        )
    }
}

@Preview(name = "Login Glass TV 720p", device = "spec:width=1280dp,height=720dp,dpi=213", showBackground = true)
@Composable
private fun LoginScreenPreview720() {
    MoTheme {
        LoginScreen(
            loading = null,
            error = "Server is reachable, but credentials were rejected.",
            activationSession = null,
            onM3u = { _, _, _ -> },
            onM3uFile = { _, _, _ -> },
            onXtream = { _, _, _, _ -> },
            onActivationCode = {},
            onRefreshQr = {},
        )
    }
}
