package com.mo.moplayer.ui.activation

import android.graphics.Bitmap
import android.graphics.Color
import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Base64
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.mo.moplayer.BuildConfig
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ActivityDeviceActivationBinding
import com.mo.moplayer.ui.login.LoginActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.EnumMap
import java.util.Locale

class DeviceActivationActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDeviceActivationBinding
    private lateinit var deviceCode: String
    private val activationBaseUrl = BuildConfig.WEB_API_BASE_URL.trimEnd('/')
    private val activationPrefs by lazy { getSharedPreferences("activation", MODE_PRIVATE) }
    private val pollHandler = Handler(Looper.getMainLooper())
    private val pollRunnable = object : Runnable {
        override fun run() {
            checkActivationStatus(scheduleNext = true)
        }
    }
    private val createRetryRunnable = Runnable { createActivationCode() }
    private var createAttempts = 0
    private var createInFlight = false
    private val codePattern = Regex("^MO-[A-HJ-NP-RT-Z2-46789]{4}$")

    /** True only for a code the website actually registered (never a locally invented one). */
    private fun hasServerCode(): Boolean = ::deviceCode.isInitialized && deviceCode.matches(codePattern)

    override fun attachBaseContext(newBase: android.content.Context) {
        super.attachBaseContext(com.mo.moplayer.util.DisplayScale.wrap(newBase))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        super.onCreate(savedInstanceState)
        // Activation waits on the user scanning a QR code with their phone, which can
        // take a while. Keep the TV awake so the code never disappears behind a dimmed
        // or sleeping screen.
        window.addFlags(
            android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )
        binding = ActivityDeviceActivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.activationBackground.setParticleColor(Color.CYAN)
        binding.activationBackground.setTvOptimizationMode(true)
        binding.activationBackground.setCinematicMode(true)

        binding.tvActivationStatus.setText(R.string.activation_creating)
        binding.tvActivationBody.setText(R.string.activation_creating_body)
        setAddSourceEnabled(false)
        createActivationCode()

        binding.btnCheckStatus.setOnClickListener {
            if (hasServerCode()) checkActivationStatus(scheduleNext = false) else createActivationCode()
        }
        binding.btnAddSource.setOnClickListener {
            if (activationPrefs.getString("activation_status", null) == "activated") {
                openAddSource(finishOnly = false)
            } else {
                Toast.makeText(this, R.string.activation_pending, Toast.LENGTH_SHORT).show()
                binding.btnCheckStatus.requestFocus()
            }
        }
        binding.btnCheckStatus.requestFocus()

        addRemoteFeedback(binding.btnCheckStatus)
        addRemoteFeedback(binding.btnAddSource)
    }

    private fun addRemoteFeedback(view: View) {
        view.setOnFocusChangeListener { focusedView, hasFocus ->
            focusedView.animate()
                .scaleX(if (hasFocus) 1.06f else 1f)
                .scaleY(if (hasFocus) 1.06f else 1f)
                .setDuration(150)
                .start()
        }
    }

    private fun setAddSourceEnabled(enabled: Boolean) {
        binding.btnAddSource.isEnabled = enabled
        binding.btnAddSource.isFocusable = enabled
        binding.btnAddSource.alpha = if (enabled) 1f else 0.45f
    }

    private fun createActivationCode() {
        if (createInFlight) return
        createInFlight = true
        pollHandler.removeCallbacks(createRetryRunnable)
        pollHandler.removeCallbacks(pollRunnable)
        binding.tvActivationStatus.setText(R.string.activation_creating)
        binding.tvActivationBody.setText(R.string.activation_creating_body)
        lifecycleScope.launch {
            // A fresh pull token per QR session: a token that leaked with an old code can never
            // pull the source delivered for a new one.
            rotateSourcePullToken()
            val result = withContext(Dispatchers.IO) {
                runCatching {
                    val body = JSONObject().apply {
                        put("publicDeviceId", getOrCreatePublicDeviceId())
                        put("deviceName", "MoPlayer Android TV")
                        put("deviceType", if (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_TYPE_MASK == android.content.res.Configuration.UI_MODE_TYPE_TELEVISION) "android-tv" else "android")
                        put("platform", "android")
                        put("appVersion", BuildConfig.VERSION_NAME)
                        put("sourcePullToken", getOrCreateSourcePullToken())
                    }.toString()
                    postActivationJson("/api/app/activation/create", body).let { (code, responseText) ->
                        val json = JSONObject(responseText)
                        ActivationCreateResult(code, json.optString("code"), json.optString("expiresAt"))
                    }
                }.getOrElse { ActivationCreateResult(-1, "", "") }
            }

            createInFlight = false
            if (isFinishing || isDestroyed) return@launch
            if (result.code == 200 && result.deviceCode.matches(codePattern)) {
                createAttempts = 0
                deviceCode = result.deviceCode
                binding.tvDeviceCode.text = deviceCode
                val qrUrl = "$activationBaseUrl/activate?code=$deviceCode"
                val qr = withContext(Dispatchers.Default) { createQrBitmap(qrUrl, 640) }
                binding.ivQrCode.setImageBitmap(qr)
                binding.ivQrCode.alpha = 1f
                activationPrefs.edit()
                    .putString("public_device_code", deviceCode)
                    .putLong("public_device_code_created_at", System.currentTimeMillis())
                    .putString("activation_status", "waiting")
                    .remove("source_delivery_done_at")
                    .apply()
                binding.tvActivationStatus.setText(R.string.activation_waiting)
                binding.tvActivationBody.text = getString(R.string.activation_waiting_body_runtime, deviceCode)
                setAddSourceEnabled(false)
                schedulePolling()
            } else {
                // Never show a code the website does not know: it could not be activated.
                binding.tvDeviceCode.text = getString(R.string.activation_code_placeholder)
                binding.ivQrCode.setImageDrawable(null)
                binding.ivQrCode.alpha = 0.22f
                binding.tvActivationStatus.setText(R.string.activation_service_unavailable)
                binding.tvActivationBody.setText(R.string.activation_service_unavailable_body)
                setAddSourceEnabled(false)
                scheduleCreateRetry()
            }
        }
    }

    /** Retries code creation with a growing delay (5 s, 10 s, 20 s, then every 30 s). */
    private fun scheduleCreateRetry() {
        createAttempts += 1
        val delayMs = when (createAttempts) {
            1 -> 5_000L
            2 -> 10_000L
            3 -> 20_000L
            else -> 30_000L
        }
        pollHandler.removeCallbacks(createRetryRunnable)
        pollHandler.postDelayed(createRetryRunnable, delayMs)
    }

    private data class ActivationCreateResult(val code: Int, val deviceCode: String, val expiresAt: String)

    private fun schedulePolling() {
        pollHandler.removeCallbacks(pollRunnable)
        pollHandler.postDelayed(pollRunnable, 4_000)
    }

    private fun checkActivationStatus(scheduleNext: Boolean) {
        if (!hasServerCode()) {
            createActivationCode()
            return
        }
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                runCatching {
                    getActivationJson("/api/app/activation/status?code=$deviceCode").let { (code, response) ->
                        ActivationStatusResult(code, JSONObject(response).optString("status"))
                    }
                }.getOrDefault(ActivationStatusResult(-1, "error"))
            }

            when (result.status) {
                "activated" -> {
                    handleActivated()
                }
                "pending", "waiting" -> {
                    activationPrefs.edit().putString("activation_status", "waiting").apply()
                    binding.tvActivationStatus.setText(R.string.activation_pending)
                    binding.tvActivationBody.text = getString(R.string.activation_waiting_body_runtime, deviceCode)
                    setAddSourceEnabled(false)
                    if (scheduleNext) schedulePolling()
                }
                "expired", "invalid" -> {
                    // The 15-minute code ran out (or the website no longer knows it): replace it
                    // with a fresh one right away instead of leaving a dead QR on screen.
                    pollHandler.removeCallbacks(pollRunnable)
                    activationPrefs.edit().putString("activation_status", "expired").apply()
                    setAddSourceEnabled(false)
                    Toast.makeText(
                        this@DeviceActivationActivity,
                        R.string.activation_expired_renewing,
                        Toast.LENGTH_SHORT
                    ).show()
                    createActivationCode()
                }
                else -> {
                    binding.tvActivationStatus.setText(R.string.activation_backend_waiting)
                    binding.tvActivationBody.setText(R.string.activation_backend_waiting_body)
                    if (scheduleNext) schedulePolling()
                }
            }
        }
    }

    private data class ActivationStatusResult(val code: Int, val status: String)

    private fun postActivationJson(path: String, body: String): Pair<Int, String> {
        var lastError: Throwable? = null
        com.mo.moplayer.util.WebApiEndpoint.candidateUrls(path).forEach { urlString ->
            try {
                val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 8_000
                    readTimeout = 8_000
                    doOutput = true
                    setRequestProperty("content-type", "application/json")
                    setRequestProperty("accept", "application/json")
                }
                connection.outputStream.use { it.write(body.toByteArray()) }
                return readActivationResponse(connection)
            } catch (e: Throwable) {
                lastError = e
            }
        }
        throw lastError ?: IllegalStateException("Activation service unavailable")
    }

    private fun getActivationJson(path: String): Pair<Int, String> {
        var lastError: Throwable? = null
        com.mo.moplayer.util.WebApiEndpoint.candidateUrls(path).forEach { urlString ->
            try {
                val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 6_000
                    readTimeout = 6_000
                    setRequestProperty("accept", "application/json")
                }
                return readActivationResponse(connection)
            } catch (e: Throwable) {
                lastError = e
            }
        }
        throw lastError ?: IllegalStateException("Activation service unavailable")
    }

    private fun readActivationResponse(connection: HttpURLConnection): Pair<Int, String> {
        return try {
            val code = connection.responseCode
            val response = if (code < 400) {
                connection.inputStream.bufferedReader().use { it.readText() }
            } else {
                connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
            }
            code to response
        } finally {
            connection.disconnect()
        }
    }

    private fun handleActivated() {
        pollHandler.removeCallbacks(pollRunnable)
        activationPrefs.edit()
            .putString("activation_status", "activated")
            .putString("activated_device_code", deviceCode)
            .putLong("activated_at", System.currentTimeMillis())
            .remove("source_delivery_done_at")
            .apply()

        binding.tvActivationStatus.setText(R.string.activation_activated)
        binding.tvActivationBody.setText(R.string.activation_activated_body)
        setAddSourceEnabled(true)
        binding.btnAddSource.requestFocus()

        pollHandler.postDelayed({
            openAddSource(finishOnly = false)
        }, 1200)
    }

    private fun openAddSource(finishOnly: Boolean) {
        if (finishOnly) {
            finish()
            return
        }
        val intent = Intent(this, LoginActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra(LoginActivity.EXTRA_ACTIVATION_COMPLETED, true)
        }
        startActivity(intent)
        finish()
    }

    private fun getOrCreatePublicDeviceId(): String {
        activationPrefs.getString("public_device_id", null)?.let { return it }

        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID).orEmpty()
        val seed = "${packageName}:${androidId}:${System.currentTimeMillis()}"
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(seed.toByteArray())
            .joinToString("") { "%02x".format(it) }
            .uppercase(Locale.US)
        val id = "MO-D-${digest.substring(0, 6)}-${digest.substring(6, 12)}-${digest.substring(12, 18)}"
        activationPrefs.edit().putString("public_device_id", id).apply()
        return id
    }

    private suspend fun rotateSourcePullToken() = withContext(Dispatchers.IO) {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        val token = Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
        activationPrefs.edit().putString("source_pull_token", token).commit()
    }

    private fun getOrCreateSourcePullToken(): String {
        activationPrefs.getString("source_pull_token", null)?.let { existing ->
            if (existing.length >= 32) return existing
        }
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        val token = Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
        activationPrefs.edit().putString("source_pull_token", token).apply()
        return token
    }

    private fun createQrBitmap(value: String, size: Int): Bitmap {
        val hints = EnumMap<EncodeHintType, Any>(EncodeHintType::class.java).apply {
            put(EncodeHintType.MARGIN, 1)
            put(EncodeHintType.CHARACTER_SET, "UTF-8")
        }
        val matrix = QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, size, size, hints)
        val pixels = IntArray(size * size)
        for (y in 0 until size) {
            val row = y * size
            for (x in 0 until size) {
                pixels[row + x] = if (matrix[x, y]) Color.BLACK else Color.WHITE
            }
        }
        return Bitmap.createBitmap(pixels, size, size, Bitmap.Config.ARGB_8888)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            finish()
            return true
        }
        return super.onKeyUp(keyCode, event)
    }

    override fun onDestroy() {
        pollHandler.removeCallbacks(pollRunnable)
        pollHandler.removeCallbacks(createRetryRunnable)
        super.onDestroy()
    }
}
