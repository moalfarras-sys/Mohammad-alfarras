package com.mo.moplayer.ui.login

import android.app.Application
import android.net.Uri
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.R
import com.mo.moplayer.data.remote.dto.AuthResponse
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.data.util.ProviderSourceUrlParser
import androidx.annotation.StringRes
import com.mo.moplayer.util.DisplayScale
import com.mo.moplayer.util.Resource
import com.mo.moplayer.worker.ServerSyncWorker
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val repository: IptvRepository,
    private val okHttpClient: OkHttpClient,
    private val application: Application,
    private val xmltvEpgRepository: com.mo.moplayer.data.epg.XmltvEpgRepository
) : ViewModel() {
    
    private val _loginState = MutableLiveData<LoginState>(LoginState.Idle)
    val loginState: LiveData<LoginState> = _loginState
    
    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _loadingMessage = MutableLiveData<String>()
    val loadingMessage: LiveData<String> = _loadingMessage
    
    // Track which tab is active
    private val _activeTab = MutableLiveData(LoginTab.XTREAM)
    val activeTab: LiveData<LoginTab> = _activeTab
    
    init {
        checkExistingLogin()
    }
    
    private fun checkExistingLogin() {
        viewModelScope.launch {
            val activeServer = repository.getActiveServerSync()
            if (activeServer != null) {
                _loginState.value = LoginState.AlreadyLoggedIn(activeServer.id)
            }
        }
    }
    
    fun setActiveTab(tab: LoginTab) {
        _activeTab.value = tab
    }
    
    fun login(serverUrl: String, username: String, password: String) {
        // Validate inputs
        if (serverUrl.isBlank() || username.isBlank() || password.isBlank()) {
            _loginState.value = LoginState.Error(str(R.string.login_error_empty))
            return
        }
        
        // Validate URL format
        val cleanUrl = ProviderSourceUrlParser.normalizeServerUrl(serverUrl)
        if (!isValidUrl(cleanUrl)) {
            _loginState.value = LoginState.Error(str(R.string.login_error_invalid_url))
            return
        }
        
        _isLoading.value = true
        _loadingMessage.value = str(R.string.login_connecting)
        
        viewModelScope.launch {
            val result = repository.authenticateXtream(cleanUrl, username, password)
            
            when (result) {
                is Resource.Success -> {
                    val authResponse = result.data!!
                    val serverName = extractServerName(cleanUrl)
                    
                    // Save server to database
                    val serverId = repository.saveServer(
                        name = serverName,
                        serverUrl = cleanUrl,
                        username = username,
                        password = password,
                        serverType = "xtream",
                        authResponse = authResponse
                    )

                    // Sync content in background (prevents heavy login-time work / OOM on low-RAM TVs)
                    ServerSyncWorker.syncNow(application)
                    
                    _isLoading.value = false
                    _loginState.value = LoginState.Success(serverId, authResponse)
                }
                is Resource.Error -> {
                    _isLoading.value = false
                    _loginState.value = LoginState.Error(localizeRepositoryError(result.message, R.string.error_unknown))
                }
                is Resource.Loading -> {
                    // Already handled
                }
            }
        }
    }
    
    private suspend fun loadServerData() {
        val server = repository.getActiveServerSync() ?: return
        
        _loadingMessage.postValue(str(R.string.login_loading_categories))
        repository.fetchAndSaveCategories(server)
        
        _loadingMessage.postValue(str(R.string.login_loading_channels))
        repository.fetchAndSaveChannels(server)
        
        _loadingMessage.postValue(str(R.string.login_loading_movies))
        repository.fetchAndSaveMovies(server)
        
        _loadingMessage.postValue(str(R.string.login_loading_series))
        repository.fetchAndSaveSeries(server)
    }
    
    /**
     * Import M3U playlist from URL
     */
    fun importM3uFromUrl(url: String, playlistName: String, epgUrl: String? = null) {
        if (url.isBlank()) {
            _loginState.value = LoginState.Error(str(R.string.login_error_enter_playlist_url))
            return
        }
        
        val name = playlistName.ifBlank { extractPlaylistName(url) }
        
        _isLoading.value = true
        _loadingMessage.value = str(R.string.login_downloading_playlist)
        
        viewModelScope.launch {
            try {
                // Check if it's an Xtream API URL
                if (ProviderSourceUrlParser.isXtreamUrl(url)) {
                    handleXtreamUrl(url, name)
                    return@launch
                }
                
                importM3uFromNetwork(url, name, epgUrl)
            } catch (e: Exception) {
                _isLoading.value = false
                _loginState.value = LoginState.Error(str(R.string.login_error_detail, e.message ?: ""))
            }
        }
    }
    
    /**
     * Import M3U from local file
     */
    fun importM3uFromFile(uri: Uri, playlistName: String) {
        _isLoading.value = true
        _loadingMessage.value = str(R.string.login_reading_file)
        
        viewModelScope.launch {
            try {
                val inputStream = application.contentResolver.openInputStream(uri)
                if (inputStream != null) {
                    val name = playlistName.ifBlank { str(R.string.login_local_playlist_name) }
                    _loadingMessage.value = str(R.string.login_parsing_playlist)
                    val result = repository.importM3uPlaylist(inputStream, name) { imported ->
                        _loadingMessage.postValue(
                            str(R.string.login_parsing_playlist_progress, imported)
                        )
                    }
                    handleM3uImportResult(result)
                } else {
                    _isLoading.value = false
                    _loginState.value = LoginState.Error(str(R.string.login_error_read_file_failed))
                }
            } catch (e: Exception) {
                _isLoading.value = false
                _loginState.value = LoginState.Error(str(R.string.login_error_reading_file, e.message ?: ""))
            }
        }
    }
    
    /**
     * Import M3U content directly (from file)
     */
    fun importM3u(content: String, name: String) {
        _isLoading.value = true
        _loadingMessage.value = str(R.string.login_parsing_playlist)
        
        viewModelScope.launch {
            val result = repository.importM3uPlaylist(content, name)
            handleM3uImportResult(result)
        }
    }
    
    /**
     * Read content from Uri
     */
    private suspend fun readFileContent(uri: Uri): String? = withContext(Dispatchers.IO) {
        try {
            val inputStream = application.contentResolver.openInputStream(uri)
            if (inputStream == null) {
                android.util.Log.e("LoginViewModel", "Failed to open input stream for URI: $uri")
                return@withContext null
            }
            
            inputStream.use { stream ->
                stream.bufferedReader().use { reader ->
                    val content = reader.readText()
                    if (content.isBlank()) {
                        android.util.Log.w("LoginViewModel", "File content is empty")
                        return@withContext null
                    }
                    content
                }
            }
        } catch (e: SecurityException) {
            android.util.Log.e("LoginViewModel", "Security exception reading file: ${e.message}", e)
            null
        } catch (e: java.io.FileNotFoundException) {
            android.util.Log.e("LoginViewModel", "File not found: ${e.message}", e)
            null
        } catch (e: Exception) {
            android.util.Log.e("LoginViewModel", "Error reading file: ${e.message}", e)
            null
        }
    }
    
    private fun handleM3uImportResult(result: Resource<Long>) {
        when (result) {
            is Resource.Success -> {
                _isLoading.value = false
                _loginState.value = LoginState.M3uImported(result.data!!)
            }
            is Resource.Error -> {
                _isLoading.value = false
                _loginState.value = LoginState.Error(localizeRepositoryError(result.message, R.string.login_error_import_m3u_failed))
            }
            is Resource.Loading -> { }
        }
    }

    private suspend fun importM3uFromNetwork(url: String, name: String, epgUrl: String?) = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
            .url(url)
            .header("User-Agent", "MoPlayer/1.0")
            .build()
            
            okHttpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful && response.body != null) {
                    _loadingMessage.postValue(str(R.string.login_parsing_playlist))
                    val result = repository.importM3uPlaylist(
                        inputStream = response.body!!.byteStream(),
                        serverName = name,
                        playlistUrl = url,
                        epgUrl = epgUrl
                    ) { imported ->
                        _loadingMessage.postValue(
                            str(R.string.login_parsing_playlist_progress, imported)
                        )
                    }
                    when (result) {
                        is Resource.Success -> {
                            xmltvEpgRepository.refreshInBackground(result.data!!, force = true)
                            _isLoading.postValue(false)
                            _loginState.postValue(LoginState.M3uImported(result.data))
                        }
                        is Resource.Error -> {
                            _isLoading.postValue(false)
                            _loginState.postValue(LoginState.Error(localizeRepositoryError(result.message, R.string.login_error_import_m3u_failed)))
                        }
                        is Resource.Loading -> { }
                    }
                } else {
                    _isLoading.postValue(false)
                    _loginState.postValue(LoginState.Error(str(R.string.login_error_download_playlist_failed)))
                }
            }
        } catch (e: Exception) {
            _isLoading.postValue(false)
            _loginState.postValue(LoginState.Error(str(R.string.login_error_detail, e.message ?: "")))
        }
    }
    
    /**
     * Parse Xtream URL and login
     */
    private suspend fun handleXtreamUrl(url: String, name: String) {
        try {
            val credentials = ProviderSourceUrlParser.parseXtream(url)
            if (credentials == null) {
                _isLoading.value = false
                _loginState.value = LoginState.Error(str(R.string.login_error_invalid_xtream_url))
                return
            }
            val baseUrl = credentials.serverUrl
            val username = credentials.username
            val password = credentials.password
            
            // Use normal login flow
            _loadingMessage.postValue(str(R.string.login_connecting))
            
            val result = repository.authenticateXtream(baseUrl, username, password)
            
            when (result) {
                is Resource.Success -> {
                    val authResponse = result.data!!
                    
                    val serverId = repository.saveServer(
                        name = name,
                        serverUrl = baseUrl,
                        username = username,
                        password = password,
                        serverType = "xtream",
                        authResponse = authResponse,
                        preferredOutputFormat = credentials.preferredOutputFormat
                    )

                    ServerSyncWorker.syncNow(application)
                    
                    _isLoading.value = false
                    _loginState.value = LoginState.Success(serverId, authResponse)
                }
                is Resource.Error -> {
                    _isLoading.value = false
                    _loginState.value = LoginState.Error(localizeRepositoryError(result.message, R.string.error_unknown))
                }
                is Resource.Loading -> { }
            }
        } catch (e: Exception) {
            _isLoading.value = false
            _loginState.value = LoginState.Error(str(R.string.login_error_source_link_unreadable))
        }
    }
    
    /** Resolves a string in the in-app language (the application context keeps the system locale). */
    private fun str(@StringRes id: Int, vararg args: Any): String =
        DisplayScale.localized(application).getString(id, *args)

    /**
     * Maps the known English messages from [IptvRepository] to localized text.
     * Unknown messages (e.g. a provider's own text) are shown as they are.
     */
    private fun localizeRepositoryError(message: String?, @StringRes fallback: Int): String {
        if (message.isNullOrBlank()) return str(fallback)
        fun detailAfter(prefix: String) = message.removePrefix(prefix).trim()
        return when {
            message == "Authentication failed: Invalid credentials" -> str(R.string.login_error_invalid_credentials)
            message.startsWith("Authentication failed: ") ->
                str(R.string.login_error_auth_failed, detailAfter("Authentication failed: "))
            message.startsWith("Server error: ") ->
                str(R.string.login_error_server_code, detailAfter("Server error: "))
            message.startsWith("Connection error: ") ->
                str(R.string.login_error_connection_detail, detailAfter("Connection error: "))
            message.startsWith("Failed to import M3U: ") ->
                str(R.string.login_error_import_m3u_detail, detailAfter("Failed to import M3U: "))
            message.startsWith("Playlist did not contain playable items") -> str(R.string.login_error_playlist_no_items)
            else -> message
        }
    }

    fun clearError() {
        if (_loginState.value is LoginState.Error) {
            _loginState.value = LoginState.Idle
        }
    }
    
    private fun isValidUrl(url: String): Boolean {
        return try {
            val uri = java.net.URI(url)
            uri.host != null && uri.scheme != null
        } catch (e: Exception) {
            false
        }
    }
    
    private fun extractServerName(url: String): String {
        return try {
            val uri = java.net.URI(url)
            uri.host ?: str(R.string.source_default_server_name)
        } catch (e: Exception) {
            str(R.string.source_default_server_name)
        }
    }
    
    private fun extractPlaylistName(url: String): String {
        return try {
            val uri = java.net.URI(url)
            val path = uri.path ?: ""
            val fileName = path.substringAfterLast('/').substringBeforeLast('.')
                .replace("_", " ").replace("-", " ").trim()
            ProviderSourceUrlParser.displayName(fileName, url)
        } catch (e: Exception) {
            str(R.string.source_default_playlist_name)
        }
    }

    private val _detectedCredentials = MutableLiveData<DetectedCredentials>()
    val detectedCredentials: LiveData<DetectedCredentials> = _detectedCredentials

    fun detectLoginType(input: String) {
        if (input.isBlank()) return

        // Check for M3U URL
        if (input.endsWith(".m3u") || input.endsWith(".m3u8")) {
            if (_activeTab.value != LoginTab.M3U) { 
                 _detectedCredentials.value = DetectedCredentials.M3u(input)
            }
            return
        }

        // Check for Xtream Codes URL (username=...&password=...)
        if (ProviderSourceUrlParser.isXtreamUrl(input)) {
            ProviderSourceUrlParser.parseXtream(input)?.let { credentials ->
                _detectedCredentials.value = DetectedCredentials.Xtream(
                    credentials.serverUrl,
                    credentials.username,
                    credentials.password
                )
            }
        }
    }

    sealed class DetectedCredentials {
        data class Xtream(val url: String, val username: String, val password: String) : DetectedCredentials()
        data class M3u(val url: String) : DetectedCredentials()
    }
    
    enum class LoginTab {
        XTREAM, M3U
    }
    
    sealed class LoginState {
        object Idle : LoginState()
        data class AlreadyLoggedIn(val serverId: Long) : LoginState()
        data class LoadingData(val message: String) : LoginState()
        data class Success(val serverId: Long, val authResponse: AuthResponse) : LoginState()
        data class M3uImported(val serverId: Long) : LoginState()
        data class Error(val message: String) : LoginState()
    }
}
