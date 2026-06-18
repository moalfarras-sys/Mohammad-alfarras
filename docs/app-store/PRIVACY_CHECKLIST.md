# App Privacy Checklist

Use this checklist before answering App Store Connect privacy questions.

## Data Used By The App

- Device identifier or generated device ID: used for activation, device support, and optional sync.
- Product interaction data: favorites, history, continue-watching, source status, and support diagnostics.
- User-provided provider credentials: stored locally in iOS Keychain through Flutter secure storage. Do not send to analytics or log files.
- Support request data: only when the user submits support through the website or copies support details manually.

## Tracking

- No advertising tracking is implemented.
- No cross-app tracking is intended.
- `NSPrivacyTracking` is false in `ios/Runner/PrivacyInfo.xcprivacy`.

## App Store Connect Answers To Confirm

- Data Linked to User: Device ID and product interaction may be linked when Supabase sync is enabled.
- Data Used for Tracking: No.
- Data Collection Purpose: App Functionality and Customer Support.
- Sensitive data: Do not collect provider passwords in support forms.
- Third-party SDKs: review Flutter plugins and generated privacy reports on Mac before submission.

## Privacy Manifest

The app includes `ios/Runner/PrivacyInfo.xcprivacy` with:

- Tracking disabled.
- Device ID/product interaction collection for app functionality.
- Required reason API declaration for UserDefaults.

Before submission on Mac:

1. Open Xcode.
2. Archive the app.
3. Generate the privacy report.
4. Compare the generated report with App Store Connect answers.
5. Update this checklist if any dependency adds new required disclosures.

Primary references:

- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple Required Reason APIs: https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api
