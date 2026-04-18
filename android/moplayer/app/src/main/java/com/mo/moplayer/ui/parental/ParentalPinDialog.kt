package com.mo.moplayer.ui.parental

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.KeyEvent
import android.view.LayoutInflater
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.mo.moplayer.R
import com.mo.moplayer.data.parental.ParentalControlManager
import com.mo.moplayer.databinding.DialogParentalPinBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * PIN Dialog for Parental Controls
 * Premium UI with 4-digit PIN input
 */
class ParentalPinDialog(
    context: Context,
    private val parentalManager: ParentalControlManager,
    private val mode: Mode,
    private val onSuccess: () -> Unit,
    private val onCancel: (() -> Unit)? = null
) : Dialog(context, R.style.Theme_MoPlayer_Dialog) {

    private lateinit var binding: DialogParentalPinBinding
    private val pinDigits = mutableListOf<EditText>()
    
    enum class Mode {
        SET_PIN,        // Set new PIN
        VERIFY_PIN,     // Verify existing PIN
        CHANGE_PIN      // Change PIN (verify old, then set new)
    }
    
    private var isChangingPin = false
    private var oldPinVerified = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DialogParentalPinBinding.inflate(LayoutInflater.from(context))
        setContentView(binding.root)
        
        setupUI()
        setupPinInput()
        setupButtons()
    }

    private fun setupUI() {
        // Set title based on mode
        binding.tvTitle.text = when (mode) {
            Mode.SET_PIN -> context.getString(R.string.parental_set_pin)
            Mode.VERIFY_PIN -> context.getString(R.string.parental_pin_required)
            Mode.CHANGE_PIN -> if (oldPinVerified) {
                context.getString(R.string.parental_set_new_pin)
            } else {
                context.getString(R.string.parental_enter_current_pin)
            }
        }
        
        // Set message
        binding.tvMessage.text = when (mode) {
            Mode.SET_PIN -> context.getString(R.string.parental_set_pin_message)
            Mode.VERIFY_PIN -> context.getString(R.string.parental_enter_pin)
            Mode.CHANGE_PIN -> if (oldPinVerified) {
                context.getString(R.string.parental_set_pin_message)
            } else {
                context.getString(R.string.parental_enter_pin)
            }
        }
    }

    private fun setupPinInput() {
        pinDigits.clear()
        pinDigits.addAll(
            listOf(
                binding.etDigit1,
                binding.etDigit2,
                binding.etDigit3,
                binding.etDigit4
            )
        )
        
        // Setup each digit input
        pinDigits.forEachIndexed { index, editText ->
            editText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                
                override fun afterTextChanged(s: Editable?) {
                    if (s?.length == 1) {
                        // Move to next digit
                        if (index < pinDigits.size - 1) {
                            pinDigits[index + 1].requestFocus()
                        } else {
                            // Last digit entered, auto-submit
                            handlePinComplete()
                        }
                    }
                }
            })
            
            // Handle backspace to move to previous digit
            editText.setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_DEL && event.action == KeyEvent.ACTION_DOWN) {
                    if (editText.text.isEmpty() && index > 0) {
                        pinDigits[index - 1].requestFocus()
                        pinDigits[index - 1].text.clear()
                        return@setOnKeyListener true
                    }
                }
                false
            }
        }
        
        // Focus first digit
        pinDigits[0].requestFocus()
    }

    private fun setupButtons() {
        binding.btnVerify.setOnClickListener {
            handlePinComplete()
        }
        
        binding.btnCancel.setOnClickListener {
            onCancel?.invoke()
            dismiss()
        }
    }

    private fun handlePinComplete() {
        val pin = pinDigits.joinToString("") { it.text.toString() }
        
        if (pin.length != 4) {
            showError(context.getString(R.string.parental_pin_invalid))
            return
        }
        
        // Disable input while processing
        setInputEnabled(false)
        
        CoroutineScope(Dispatchers.Main).launch {
            when (mode) {
                Mode.SET_PIN -> handleSetPin(pin)
                Mode.VERIFY_PIN -> handleVerifyPin(pin)
                Mode.CHANGE_PIN -> handleChangePin(pin)
            }
        }
    }

    private suspend fun handleSetPin(pin: String) {
        val success = withContext(Dispatchers.IO) {
            parentalManager.setPin(pin)
        }
        
        if (success) {
            showSuccess(context.getString(R.string.parental_pin_set_success))
            onSuccess()
            dismiss()
        } else {
            showError(context.getString(R.string.parental_pin_invalid))
            setInputEnabled(true)
        }
    }

    private suspend fun handleVerifyPin(pin: String) {
        val verified = withContext(Dispatchers.IO) {
            parentalManager.verifyPin(pin)
        }
        
        if (verified) {
            onSuccess()
            dismiss()
        } else {
            showError(context.getString(R.string.parental_pin_incorrect))
            clearPin()
            setInputEnabled(true)
        }
    }

    private suspend fun handleChangePin(pin: String) {
        if (!oldPinVerified) {
            // First step: verify old PIN
            val verified = withContext(Dispatchers.IO) {
                parentalManager.verifyPin(pin)
            }
            
            if (verified) {
                oldPinVerified = true
                clearPin()
                setupUI() // Update UI for new PIN entry
                setInputEnabled(true)
            } else {
                showError(context.getString(R.string.parental_pin_incorrect))
                clearPin()
                setInputEnabled(true)
            }
        } else {
            // Second step: set new PIN
            handleSetPin(pin)
        }
    }

    private fun clearPin() {
        pinDigits.forEach { it.text.clear() }
        pinDigits[0].requestFocus()
    }

    private fun setInputEnabled(enabled: Boolean) {
        pinDigits.forEach { it.isEnabled = enabled }
        binding.btnVerify.isEnabled = enabled
    }

    private fun showError(message: String) {
        binding.tvError.text = message
        binding.tvError.visibility = TextView.VISIBLE
        
        // Shake animation
        binding.pinContainer.animate()
            .translationX(10f)
            .setDuration(50)
            .withEndAction {
                binding.pinContainer.animate()
                    .translationX(-10f)
                    .setDuration(50)
                    .withEndAction {
                        binding.pinContainer.animate()
                            .translationX(0f)
                            .setDuration(50)
                            .start()
                    }
                    .start()
            }
            .start()
    }

    private fun showSuccess(message: String) {
        binding.tvError.text = message
        binding.tvError.setTextColor(context.getColor(R.color.htc_accent_gold))
        binding.tvError.visibility = TextView.VISIBLE
    }

    companion object {
        /**
         * Show PIN dialog for setting new PIN
         */
        fun showSetPinDialog(
            context: Context,
            parentalManager: ParentalControlManager,
            onSuccess: () -> Unit,
            onCancel: (() -> Unit)? = null
        ) {
            ParentalPinDialog(context, parentalManager, Mode.SET_PIN, onSuccess, onCancel).show()
        }
        
        /**
         * Show PIN dialog for verification
         */
        fun showVerifyPinDialog(
            context: Context,
            parentalManager: ParentalControlManager,
            onSuccess: () -> Unit,
            onCancel: (() -> Unit)? = null
        ) {
            ParentalPinDialog(context, parentalManager, Mode.VERIFY_PIN, onSuccess, onCancel).show()
        }
        
        /**
         * Show PIN dialog for changing PIN
         */
        fun showChangePinDialog(
            context: Context,
            parentalManager: ParentalControlManager,
            onSuccess: () -> Unit,
            onCancel: (() -> Unit)? = null
        ) {
            ParentalPinDialog(context, parentalManager, Mode.CHANGE_PIN, onSuccess, onCancel).show()
        }
    }
}
