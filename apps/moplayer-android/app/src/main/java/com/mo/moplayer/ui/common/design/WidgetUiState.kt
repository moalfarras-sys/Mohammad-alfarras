package com.mo.moplayer.ui.common.design

sealed interface WidgetUiState<out T> {
    data object Loading : WidgetUiState<Nothing>
    data class Ready<T>(val data: T) : WidgetUiState<T>
    data class Empty(val message: String) : WidgetUiState<Nothing>
    data class Error(val message: String) : WidgetUiState<Nothing>
}
