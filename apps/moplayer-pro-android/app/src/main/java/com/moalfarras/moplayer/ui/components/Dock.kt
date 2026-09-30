package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.LiveTv
import androidx.compose.material.icons.rounded.Movie
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.VideoLibrary
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.ui.AppSection
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.theme.DOCK_BUTTON_HEIGHT
import com.moalfarras.moplayer.ui.theme.DOCK_ROW_VERTICAL_PADDING
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale

private data class DockItem(val section: AppSection, val label: String, val icon: ImageVector)

/**
 * Floating navigation dock. Entering it with the D-pad always lands on the current section
 * (never on the geometrically nearest button). Exactly one pill is expanded at a time — the
 * focused button while the dock has focus, otherwise the current section — so the centered dock
 * never shifts while moving.
 */
@Composable
fun BottomDock(
    selected: AppSection,
    restoreFocusSection: AppSection? = null,
    onSelect: (AppSection) -> Unit,
    onSearch: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tv = rememberTvScale()
    val scrollState = rememberScrollState()
    val s = LocalStrings.current
    val items = listOf(
        DockItem(AppSection.SEARCH, s.navSearch, Icons.Rounded.Search),
        DockItem(AppSection.HOME, s.navHome, Icons.Rounded.Home),
        DockItem(AppSection.LIVE, s.navLive, Icons.Rounded.LiveTv),
        DockItem(AppSection.MOVIES, s.navMovies, Icons.Rounded.Movie),
        DockItem(AppSection.SERIES, s.navSeries, Icons.Rounded.VideoLibrary),
        DockItem(AppSection.FAVORITES, s.navFavorites, Icons.Rounded.Favorite),
        DockItem(AppSection.SETTINGS, s.navSettings, Icons.Rounded.Settings),
    )
    val requesters = remember { AppSection.entries.associateWith { FocusRequester() } }
    fun focusRequesterFor(section: AppSection): FocusRequester = when (section) {
        AppSection.SERIES_DETAIL -> requesters.getValue(AppSection.SERIES)
        AppSection.PLAYER -> requesters.getValue(AppSection.HOME)
        else -> requesters.getValue(section)
    }
    var dockHasFocus by remember { mutableStateOf(false) }

    LaunchedEffect(restoreFocusSection) {
        restoreFocusSection?.let {
            kotlinx.coroutines.delay(80)
            runCatching { focusRequesterFor(it).requestFocus() }
        }
    }

    val visuals = LocalMoVisuals.current
    GlassPanel(
        modifier = modifier.fillMaxWidth(if (tv.isLowHeightLandscape) 0.68f else if (tv.isCompact) 0.86f else 0.72f),
        radius = 999.dp,
        highlighted = true,
        glow = visuals.accent.copy(alpha = 0.08f),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy((6 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .onFocusChanged { dockHasFocus = it.hasFocus }
                .focusProperties {
                    onEnter = { runCatching { focusRequesterFor(selected).requestFocus() } }
                }
                .focusGroup()
                .then(if (tv.isCompact) Modifier.horizontalScroll(scrollState) else Modifier)
                .padding(
                    horizontal = ((if (tv.isCompact) 10f else 14f) * tv.factor).dp,
                    vertical = (DOCK_ROW_VERTICAL_PADDING * tv.factor).coerceAtLeast(7f).dp,
                ),
        ) {
            items.forEach { item ->
                val active = when (item.section) {
                    AppSection.SERIES -> selected == AppSection.SERIES || selected == AppSection.SERIES_DETAIL
                    else -> selected == item.section
                }
                DockButton(
                    item = item,
                    active = active,
                    dockHasFocus = dockHasFocus,
                    factor = tv.factor,
                    focusRequester = focusRequesterFor(item.section),
                ) { if (item.section == AppSection.SEARCH) onSearch() else onSelect(item.section) }
            }
        }
    }
}

@Composable
private fun DockButton(
    item: DockItem,
    active: Boolean,
    dockHasFocus: Boolean,
    factor: Float,
    focusRequester: FocusRequester,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    var focused by remember { mutableStateOf(false) }
    val expanded = if (dockHasFocus) focused else active
    val expandedWidth = if (factor < 1f) 104f else 118f * factor
    val idleWidth = if (factor < 1f) 44f else 48f * factor
    val buttonHeight = if (factor < 1f) 42f else DOCK_BUTTON_HEIGHT * factor
    val width by animateDpAsState(
        if (expanded) expandedWidth.dp else idleWidth.dp,
        animationSpec = spring(dampingRatio = 0.8f, stiffness = 420f),
        label = "dock-w",
    )

    FocusGlow(
        modifier = Modifier
            .onFocusChanged { focused = it.isFocused }
            .width(width)
            .height(buttonHeight.dp),
        cornerRadius = 999.dp,
        focusRequester = focusRequester,
        onClick = onClick,
        focusedScale = FocusScale.Button,
        glowElevation = 10.dp,
    ) {
        val hasFocus = LocalFocusGlowFocused.current
        val contentColor = when {
            hasFocus -> Color(0xFF15110D)
            active -> visuals.accent
            else -> Color(0xCCFFFFFF)
        }
        Box(
            modifier = Modifier
                .matchParentSize()
                .clip(RoundedCornerShape(999.dp))
                .background(
                    when {
                        hasFocus -> Color.White.copy(alpha = 0.94f)
                        active -> visuals.accent.copy(alpha = 0.16f)
                        else -> Color.Transparent
                    },
                ),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                    Icon(
                        item.icon,
                        contentDescription = item.label,
                        tint = contentColor,
                        modifier = Modifier.size(maxOf(18f, 20 * factor).dp),
                    )
                    if (expanded) {
                        Spacer(Modifier.width(6.dp))
                        Text(
                            item.label,
                            color = contentColor,
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold),
                            maxLines = 1,
                        )
                    }
                }
                // Current-section indicator; stays on the active button while focus moves.
                if (active && !hasFocus) {
                    Box(Modifier.width(16.dp).height(3.dp).clip(RoundedCornerShape(999.dp)).background(visuals.accent))
                }
            }
        }
    }
}
