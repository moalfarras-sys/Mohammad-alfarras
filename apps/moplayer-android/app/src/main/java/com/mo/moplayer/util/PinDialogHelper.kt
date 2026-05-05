package com.mo.moplayer.util

import android.app.AlertDialog
import android.content.Context
import android.text.InputFilter
import android.text.InputType
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.mo.moplayer.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Helper class for showing PIN dialogs throughout the app.
 * Used to prompt for PIN when accessing adult content or locked features.
 */
class PinDialogHelper(
    private val context: Context,
    private val parentalLockManager: ParentalLockManager,
    private val scope: CoroutineScope
) {

    /**
     * Show PIN dialog for verifying access to protected content.
     * 
     * @param title Dialog title
     * @param message Dialog message
     * @param onPinVerified Callback when PIN is verified successfully
     * @param onCancel Callback when dialog is cancelled
     */
    fun showPinVerificationDialog(
        title: String = context.getString(R.string.parental_pin_required),
        message: String = context.getString(R.string.parental_enter_pin),
        onPinVerified: () -> Unit,
        onCancel: () -> Unit = {}
    ) {
        val layout = createPinInputLayout()
        val pinInput = layout.findViewWithTag<EditText>("pin_input")

        val dialog = AlertDialog.Builder(context, R.style.AlertDialogTheme)
            .setTitle(title)
            .setMessage(message)
            .setView(layout)
            .setPositiveButton(R.string.verify) { dialogInterface, _ ->
                val pin = pinInput?.text?.toString() ?: ""
                scope.launch {
                    val isValid = parentalLockManager.verifyPin(pin)
                    withContext(Dispatchers.Main) {
                        if (isValid) {
                            dialogInterface.dismiss()
                            onPinVerified()
                        } else {
                            Toast.makeText(
                                context,
                                R.string.parental_pin_incorrect,
                                Toast.LENGTH_SHORT
                            ).show()
                            pinInput?.text?.clear()
                            pinInput?.requestFocus()
                        }
                    }
                }
            }
            .setNegativeButton(R.string.cancel) { dialogInterface, _ ->
                dialogInterface.dismiss()
                onCancel()
            }
            .setCancelable(false)
            .create()

        dialog.setOnShowListener {
            pinInput?.requestFocus()
            
            // Handle D-pad navigation for TV
            pinInput?.setOnKeyListener { _, keyCode, event ->
                if (event.action == KeyEvent.ACTION_UP) {
                    when (keyCode) {
                        KeyEvent.KEYCODE_DPAD_DOWN -> {
                            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.requestFocus()
                            true
                        }
                        else -> false
                    }
                } else false
            }
        }

        dialog.show()
        
        // Style the dialog buttons for TV
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.apply {
            isFocusable = true
            isFocusableInTouchMode = true
        }
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.apply {
            isFocusable = true
            isFocusableInTouchMode = true
        }
    }

    /**
     * Show PIN setup dialog for first-time PIN creation
     */
    fun showPinSetupDialog(
        onPinSet: () -> Unit,
        onCancel: () -> Unit = {}
    ) {
        val layout = createPinInputLayout()
        val pinInput = layout.findViewWithTag<EditText>("pin_input")

        val dialog = AlertDialog.Builder(context, R.style.AlertDialogTheme)
            .setTitle(R.string.parental_set_pin)
            .setMessage(R.string.parental_set_pin_message)
            .setView(layout)
            .setPositiveButton(R.string.save) { dialogInterface, _ ->
                val pin = pinInput?.text?.toString() ?: ""
                if (pin.length == 4) {
                    scope.launch {
                        val success = parentalLockManager.setPin(pin)
                        withContext(Dispatchers.Main) {
                            if (success) {
                                Toast.makeText(
                                    context,
                                    R.string.parental_pin_set_success,
                                    Toast.LENGTH_SHORT
                                ).show()
                                dialogInterface.dismiss()
                                onPinSet()
                            } else {
                                Toast.makeText(
                                    context,
                                    R.string.parental_pin_invalid,
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    }
                } else {
                    Toast.makeText(
                        context,
                        R.string.parental_pin_invalid,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
            .setNegativeButton(R.string.cancel) { dialogInterface, _ ->
                dialogInterface.dismiss()
                onCancel()
            }
            .setCancelable(false)
            .create()

        dialog.setOnShowListener {
            pinInput?.requestFocus()
        }

        dialog.show()
    }

    /**
     * Check if adult content should be accessible.
     * If parental lock is enabled, shows PIN dialog.
     * 
     * @param onAccessGranted Callback when access is granted
     * @param onAccessDenied Callback when access is denied
     */
    fun checkAdultContentAccess(
        onAccessGranted: () -> Unit,
        onAccessDenied: () -> Unit = {}
    ) {
        scope.launch {
            val isParentalEnabled = parentalLockManager.isParentalEnabled.first()
            val isAdultLocked = parentalLockManager.isAdultContentLocked.first()
            
            withContext(Dispatchers.Main) {
                if (isParentalEnabled && isAdultLocked) {
                    showPinVerificationDialog(
                        title = context.getString(R.string.parental_adult_content),
                        message = context.getString(R.string.parental_adult_content_message),
                        onPinVerified = onAccessGranted,
                        onCancel = onAccessDenied
                    )
                } else {
                    onAccessGranted()
                }
            }
        }
    }

    /**
     * Create a styled PIN input layout for dialogs
     */
    private fun createPinInputLayout(): LinearLayout {
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 24, 48, 24)

            // PIN input field
            val pinInput = EditText(context).apply {
                tag = "pin_input"
                hint = "• • • •"
                textAlignment = View.TEXT_ALIGNMENT_CENTER
                inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
                filters = arrayOf(InputFilter.LengthFilter(4))
                setTextColor(ContextCompat.getColor(context, R.color.htc_text_primary))
                setHintTextColor(ContextCompat.getColor(context, R.color.htc_text_tertiary))
                textSize = 24f
                letterSpacing = 0.5f
                isFocusable = true
                isFocusableInTouchMode = true
                
                // Style for TV
                setBackgroundColor(ContextCompat.getColor(context, R.color.htc_medium_gray))
                setPadding(32, 24, 32, 24)
            }

            val params = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 16
            }

            addView(pinInput, params)
        }
    }
}
