package com.moalfarras.moplayer.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Border
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.Surface

/** Shared media action: explicit TV state colors keep the existing product theme coherent.
 * Labels remain visible before focus; mobile retains the tested touch/remote click guard.
 */
@Composable
internal fun MediaActionButton(
    label: String,
    icon: ImageVector,
    accent: Color,
    isTv: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    marked: Boolean = false,
) {
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(14.dp)
    val ink = Color(0xFF171310)
    val resting = Color(0xFF202633)
    val content: @Composable () -> Unit = {
        val highlight = if (isTv) focused else LocalFocusGlowFocused.current
        Row(Modifier.padding(horizontal = 14.dp, vertical = 12.dp).heightIn(min = 24.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(icon, null, tint = if (highlight) ink else accent, modifier = Modifier.size(20.dp))
            Text(label, color = if (highlight) ink else Color(0xFFFBF9F4),
                style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold,
                maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
    if (isTv) {
        Surface(onClick = onClick, modifier = modifier.heightIn(min = 48.dp), interactionSource = interaction,
            shape = ClickableSurfaceDefaults.shape(shape = shape),
            colors = ClickableSurfaceDefaults.colors(containerColor = resting, contentColor = Color.White,
                focusedContainerColor = Color(0xFFFFF1E4), focusedContentColor = ink,
                pressedContainerColor = accent, pressedContentColor = ink),
            scale = ClickableSurfaceDefaults.scale(focusedScale = if (LocalReduceControlMotion.current) 1f else 1.03f),
            border = ClickableSurfaceDefaults.border(
                border = Border(BorderStroke(1.dp, if (marked) accent else Color.White.copy(alpha = 0.16f)), shape = shape),
                focusedBorder = Border(BorderStroke(2.dp, accent), shape = shape)),
        ) { content() }
    } else {
        FocusGlow(modifier = modifier.heightIn(min = 48.dp), cornerRadius = 14.dp, onClick = onClick) {
            content()
        }
    }
}
