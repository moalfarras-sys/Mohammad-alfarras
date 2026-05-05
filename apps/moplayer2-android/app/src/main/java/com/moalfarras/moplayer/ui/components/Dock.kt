package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.ui.AppSection
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale

private data class DockItem(val section: AppSection, val label: String, val icon: ImageVector)

@Composable
fun BottomDock(
    selected: AppSection,
    onSelect: (AppSection) -> Unit,
    onSearch: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tv = rememberTvScale()
    val scrollState = rememberScrollState()
    val items = listOf(
        DockItem(AppSection.HOME, "الرئيسية", Icons.Rounded.Home),
        DockItem(AppSection.LIVE, "بث مباشر", Icons.Rounded.LiveTv),
        DockItem(AppSection.MOVIES, "أفلام", Icons.Rounded.Movie),
        DockItem(AppSection.SERIES, "مسلسلات", Icons.Rounded.VideoLibrary),
        DockItem(AppSection.FAVORITES, "مفضلتي", Icons.Rounded.Favorite),
        DockItem(AppSection.SETTINGS, "الإعدادات", Icons.Rounded.Settings),
    )

    GlassPanel(
        modifier = modifier.fillMaxWidth(if (tv.isLowHeightLandscape) 0.68f else if (tv.isCompact) 0.86f else 0.72f),
        radius = 999.dp,
        highlighted = true,
        contentAlignment = Alignment.Center,
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy((6 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                    .then(if (tv.isCompact) Modifier.horizontalScroll(scrollState) else Modifier)
                .padding(horizontal = ((if (tv.isCompact) 10f else 14f) * tv.factor).dp, vertical = (5 * tv.factor).dp),
        ) {
            items.forEach { item ->
                val active = when (item.section) {
                    AppSection.SERIES -> selected == AppSection.SERIES || selected == AppSection.SERIES_DETAIL
                    AppSection.FAVORITES -> selected == AppSection.FAVORITES
                    else -> selected == item.section
                }
                DockButton(item, active, tv.factor) { onSelect(item.section) }
            }
            // Search button
            DockButton(DockItem(AppSection.SEARCH, "بحث", Icons.Rounded.Search), selected == AppSection.SEARCH, tv.factor, onSearch)
        }
    }
}

@Composable
private fun DockButton(item: DockItem, active: Boolean, factor: Float, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    val activeWidth = if (factor < 1f) 96f else 112f * factor
    val idleWidth = if (factor < 1f) 42f else 48f * factor
    val buttonHeight = if (factor < 1f) 42f else 46f * factor
    val width by animateDpAsState(
        if (active) activeWidth.dp else idleWidth.dp,
        animationSpec = spring(dampingRatio = 0.62f, stiffness = 340f),
        label = "dock-w",
    )
    val lift by animateDpAsState(
        if (active) (-8 * factor).dp else 0.dp,
        animationSpec = spring(dampingRatio = 0.62f, stiffness = 340f),
        label = "dock-lift",
    )
    val scale by animateFloatAsState(
        if (active) 1.08f else 1f,
        animationSpec = spring(dampingRatio = 0.60f, stiffness = 340f),
        label = "dock-scale",
    )

    FocusGlow(
        modifier = Modifier
            .width(width)
            .height(buttonHeight.dp)
            .graphicsLayer { translationY = lift.toPx(); scaleX = scale; scaleY = scale }
            .clip(RoundedCornerShape(999.dp)),
        cornerRadius = 999.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    if (active) Brush.linearGradient(listOf(visuals.accent.copy(alpha = 0.30f), visuals.accent.copy(alpha = 0.12f)))
                    else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
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
                        tint = if (active) visuals.accent else Color(0xCCFFFFFF),
                        modifier = Modifier.size((18 * factor).dp),
                    )
                    if (active) {
                        Spacer(Modifier.width((6 * factor).dp))
                        Text(
                            item.label,
                            color = Color.White,
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold),
                        )
                    }
                }
                // Active indicator dot
                if (active) {
                    Box(Modifier.width((20 * factor).dp).height((3 * factor).dp).clip(RoundedCornerShape(999.dp)).background(visuals.accent)) {}
                }
            }
        }
    }
}
