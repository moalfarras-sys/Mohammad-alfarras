package com.mo.moplayer.ui.login

import android.app.Application
import android.net.Uri
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.remote.dto.AuthResponse
import com.mo.moplayer.data.repository.IptvRepository
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
    private val application: Application
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
            _loginState.value = LoginState.Error("Please fill in all fields")
            return
        }
        
        // Validate URL format
        val cleanUrl = normalizeServerUrl(serverUrl)
        if (!isValidUrl(cleanUrl)) {
            _loginState.value = LoginState.Error("Invalid server URL format")
            return
        }
        
        _isLoading.value = true
        _loadingMessage.value = "Connecting to server..."
        
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
                    _loginState.value = LoginState.Error(result.message ?: "Unknown error")
                }
                is Resource.Loading -> {
                    // Already handled
                }
            }
        }
    }
    
    private suspend fun loadServerData() {
        val server = repository.getActiveServerSync() ?: return
        
        _loadingMessage.postValue("Loading categories...")
        repository.fetchAndSaveCategories(server)
        
        _loadingMessage.postValue("Loading channels...")
        repository.fetchAndSaveChannels(server)
        
        _loadingMessage.postValue("Loading movies...")
        repository.fetchAndSaveMovies(server)
        
        _loadingMessage.postValue("Loading series...")
        repository.fetchAndSaveSeries(server)
    }
    
    /**
     * Import M3U playlist from URL
     */
    fun importM3uFromUrl(url: String, playlistName: String) {
        if (url.isBlank()) {
            _loginState.value = LoginState.Error("Please enter a playlist URL")
            return
        }
        
        val name = playlistName.ifBlank { extractPlaylistName(url) }
        
        _isLoading.value = true
        _loadingMessage.value = "Downloading playlist..."
        
        viewModelScope.launch {
            try {
                // Check if it's an Xtream API URL
                if (isXtreamUrl(url)) {
                    handleXtreamUrl(url, name)
                    return@launch
                }
                
                // Download M3U content
                val content = downloadM3uContent(url)
                
                if (content != null) {
                    _loadingMessage.value = "Parsing playlist..."
                    val result = repository.importM3uPlaylist(content, name)
                    
                    when (result) {
                        is Resource.Success -> {
                            _isLoading.value = false
                            _loginState.value = LoginState.M3uImported(result.data!!)
                        }
                        is Resource.Error -> {
                            _isLoading.value = false
                            _loginState.value = LoginState.Error(result.message ?: "Failed to import M3U")
                        }
                        is Resource.Loading -> { }
                    }
                } else {
                    _isLoading.value = false
                    _loginState.value = LoginState.Error("Failed to download playlist")
                }
            } catch (e: Exception) {
                _isLoading.value = false
                _loginState.value = LoginState.Error("Error: ${e.message}")
            }
        }
    }
    
    /**
     * Import M3U from local file
     */
    fun importM3uFromFile(uri: Uri, playlistName: String) {
        _isLoading.value = true
        _loadingMessage.value = "Reading file..."
        
        viewModelScope.launch {
            try {
                val content = readFileContent(uri)
                if (content != null) {
                    val name = playlistName.ifBlank { "Local Playlist" }
                    importM3u(content, name)
                } else {
                    _isLoading.value = false
                    _loginState.value = LoginState.Error("Failed to read file")
                }
            } catch (e: Exception) {
                _isLoading.value = false
                _loginState.value = LoginState.Error("Error reading file: ${e.message}")
            }
        }
    }
    
    /**
     * Import M3U content directly (from file)
     */
    fun importM3u(content: String, name: String) {
        _isLoading.value = true
        _loadingMessage.value = "Parsing playlist..."
        
        viewModelScope.launch {
            val result = repository.importM3uPlaylist(content, name)
            
            when (result) {
                is Resource.Success -> {
                    _isLoading.value = false
                    _loginState.value = LoginState.M3uImported(result.data!!)
                }
                is Resource.Error -> {
                    _isLoading.value = false
                    _loginState.value = LoginState.Error(result.message ?: "Failed to import M3U")
                }
                is Resource.Loading -> { }
            }
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
    
    private suspend fun downloadM3uContent(url: String): String? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
            .url(url)
            .header("User-Agent", "MoPlayer/1.0")
            .build()
            
            val response = okHttpClient.newCall(request).execute()
            
            if (response.isSuccessful) {
                response.body?.string()
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Check if URL is an Xtream Codes API URL
     */
    private fun isXtreamUrl(url: String): Boolean {
        // Common Xtream patterns
        return url.contains("get.php?") || 
               url.contains("player_api.php") ||
               (url.contains("username=") && url.contains("password="))
    }
    
    /**
     * Parse Xtream URL and login
     */
    private suspend fun handleXtreamUrl(url: String, name: String) {
        try {
            val uri = java.net.URI(url)
            val query = uri.query ?: ""
            val params = query.split("&").associate {
                val parts = it.split("=", limit = 2)
                parts[0] to (parts.getOrNull(1) ?: "")
            }
            
            val username = params["username"] ?: ""
            val password = params["password"] ?: ""
            
            if (username.isBlank() || password.isBlank()) {
                _isLoading.value = false
                _loginState.value = LoginState.Error("Invalid Xtream URL format")
                return
            }
            
            // Build base URL
            val baseUrl = "${uri.scheme}://${uri.host}${if (uri.port != -1) ":${uri.port}" else ""}"
            
            // Use normal login flow
            _loadingMessage.postValue("Connecting to server...")
            
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
                        authResponse = authResponse
                    )

                    ServerSyncWorker.syncNow(application)
                    
                    _isLoading.value = false
                    _loginState.value = LoginState.Success(serverId, authResponse)
                }
                is Resource.Error -> {
                    _isLoading.value = false
                    _loginState.value = LoginState.Error(result.message ?: "Unknown error")
                }
                is Resource.Loading -> { }
            }
        } catch (e: Exception) {
            _isLoading.value = false
            _loginState.value = LoginState.Error("Failed to parse Xtream URL: ${e.message}")
        }
    }
    
    fun clearError() {
        if (_loginState.value is LoginState.Error) {
            _loginState.value = LoginState.Idle
        }
    }
    
    private fun normalizeServerUrl(url: String): String {
        var cleanUrl = url.trim()
        
        // Add protocol if missing
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "http://$cleanUrl"
        }
        
        // Remove trailing slash
        cleanUrl = cleanUrl.trimEnd('/')
        
        return cleanUrl
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
            uri.host ?: "Server"
        } catch (e: Exception) {
            "Server"
        }
    }
    
    private fun extractPlaylistName(url: String): String {
        return try {
            val uri = java.net.URI(url)
            val path = uri.path ?: ""
            val fileName = path.substringAfterLast('/')
            if (fileName.isNotBlank()) {
                fileName.substringBeforeLast('.').replace("_", " ").replace("-", " ")
            } else {
                uri.host ?: "My Playlist"
            }
        } catch (e: Exception) {
            "My Playlist"
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
        if (input.contains("username=") && input.contains("password=")) {
            try {
                val uri = Uri.parse(input)
                val username = uri.getQueryParameter("username") ?: ""
                val password = uri.getQueryParameter("password") ?: ""
                
                // Extract base URL (scheme://host:port)
                val port = if (uri.port != -1) ":${uri.port}" else ""
                val baseUrl = "${uri.scheme}://${uri.host}$port"

                if (username.isNotBlank() && password.isNotBlank()) {
                     _detectedCredentials.value = DetectedCredentials.Xtream(baseUrl, username, password)
                }
            } catch (e: Exception) {
                // Ignore parse errors
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
