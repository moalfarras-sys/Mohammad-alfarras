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
    private val allowedCodeChars = "ABCDEFGHJKLMNPQRTUVWXYZ2346789"
    private val activationPrefs by lazy { getSharedPreferences("activation", MODE_PRIVATE) }
    private val pollHandler = Handler(Looper.getMainLooper())
    private val pollRunnable = object : Runnable {
        override fun run() {
            checkActivationStatus(scheduleNext = true)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        super.onCreate(savedInstanceState)
        binding = ActivityDeviceActivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.activationBackground.setParticleColor(Color.CYAN)
        binding.activationBackground.setTvOptimizationMode(true)
        binding.activationBackground.setCinematicMode(true)

        binding.tvActivationStatus.setText(R.string.activation_creating)
        binding.tvActivationBody.setText(R.string.activation_creating_body)
        createActivationCode()

        binding.btnCheckStatus.setOnClickListener { checkActivationStatus(scheduleNext = false) }
        binding.btnAddSource.setOnClickListener { openAddSource(finishOnly = false) }
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

    private fun createActivationCode() {
        lifecycleScope.launch {
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
                    val connection = (URL("$activationBaseUrl/api/app/activation/create").openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        connectTimeout = 8_000
                        readTimeout = 8_000
                        doOutput = true
                        setRequestProperty("content-type", "application/json")
                    }
                    connection.outputStream.use { it.write(body.toByteArray()) }
                    val responseText = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseText)
                    ActivationCreateResult(connection.responseCode, json.optString("code"), json.optString("expiresAt"))
                }.getOrElse { ActivationCreateResult(-1, "", "") }
            }

            if (result.code == 200 && result.deviceCode.matches(Regex("^MO-[A-HJ-NP-RT-Z2-46789]{4}$"))) {
                deviceCode = result.deviceCode
                binding.tvDeviceCode.text = deviceCode
                binding.ivQrCode.setImageBitmap(createQrBitmap("$activationBaseUrl/activate?code=$deviceCode", 720))
                activationPrefs.edit()
                    .putString("public_device_code", deviceCode)
                    .putLong("public_device_code_created_at", System.currentTimeMillis())
                    .putString("activation_status", "waiting")
                    .apply()
                binding.tvActivationStatus.setText(R.string.activation_waiting)
                binding.tvActivationBody.text = getString(R.string.activation_waiting_body_runtime, deviceCode)
                schedulePolling()
            } else {
                deviceCode = getLocalFallbackCode()
                binding.tvDeviceCode.text = deviceCode
                binding.ivQrCode.setImageBitmap(createQrBitmap("$activationBaseUrl/activate?code=$deviceCode", 720))
                binding.tvActivationStatus.setText(R.string.activation_service_unavailable)
                binding.tvActivationBody.setText(R.string.activation_service_unavailable_body)
            }
        }
    }

    private data class ActivationCreateResult(val code: Int, val deviceCode: String, val expiresAt: String)

    private fun schedulePolling() {
        pollHandler.removeCallbacks(pollRunnable)
        pollHandler.postDelayed(pollRunnable, 4_000)
    }

    private fun checkActivationStatus(scheduleNext: Boolean) {
        if (!::deviceCode.isInitialized) {
            createActivationCode()
            return
        }
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                runCatching {
                    val url = URL("$activationBaseUrl/api/app/activation/status?code=$deviceCode")
                    val connection = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "GET"
                        connectTimeout = 6_000
                        readTimeout = 6_000
                    }
                    val response = if (connection.responseCode < 400) {
                        connection.inputStream.bufferedReader().use { it.readText() }
                    } else {
                        connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                    }
                    ActivationStatusResult(connection.responseCode, JSONObject(response).optString("status"))
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
                    if (scheduleNext) schedulePolling()
                }
                "expired" -> {
                    pollHandler.removeCallbacks(pollRunnable)
                    activationPrefs.edit().putString("activation_status", "expired").apply()
                    binding.tvActivationStatus.setText(R.string.activation_expired)
                    binding.tvActivationBody.setText(R.string.activation_expired_body)
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

    private fun handleActivated() {
        pollHandler.removeCallbacks(pollRunnable)
        activationPrefs.edit()
            .putString("activation_status", "activated")
            .putString("activated_device_code", deviceCode)
            .putLong("activated_at", System.currentTimeMillis())
            .apply()

        binding.tvActivationStatus.setText(R.string.activation_activated)
        binding.tvActivationBody.setText(R.string.activation_activated_body)
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

    private fun getLocalFallbackCode(): String {
        val now = System.currentTimeMillis()
        val createdAt = activationPrefs.getLong("public_device_code_created_at", 0L)
        val existing = activationPrefs.getString("public_device_code", null)
        val isFresh = now - createdAt < 15 * 60 * 1000L
        if (existing?.matches(Regex("^MO-[A-HJ-NP-RT-Z2-46789]{4}$")) == true && isFresh) {
            return existing
        }

        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID).orEmpty()
        val seed = "${packageName}:${androidId}:$now"
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(seed.toByteArray())
        val shortCode = buildString {
            repeat(4) { index ->
                val value = digest[index].toInt() and 0xFF
                append(allowedCodeChars[value % allowedCodeChars.length])
            }
        }.uppercase(Locale.US)
        val code = "MO-$shortCode"
        activationPrefs.edit()
            .putString("public_device_code", code)
            .putLong("public_device_code_created_at", now)
            .putString("activation_status", "local_fallback")
            .apply()
        return code
    }

    private fun createQrBitmap(value: String, size: Int): Bitmap {
        val hints = EnumMap<EncodeHintType, Any>(EncodeHintType::class.java).apply {
            put(EncodeHintType.MARGIN, 1)
            put(EncodeHintType.CHARACTER_SET, "UTF-8")
        }
        val matrix = QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, size, size, hints)
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        for (x in 0 until size) {
            for (y in 0 until size) {
                bitmap.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
            }
        }
        return bitmap
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
        super.onDestroy()
    }
}
