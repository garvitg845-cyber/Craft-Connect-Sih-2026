# V29.1 Language Fix

- Fixed the Settings language selector so it applies the selected language to the complete SPA.
- Uses Google Translate's `googtrans` cookie and reloads the app after selection for reliable full-page translation.
- Supported: English, Hindi, Punjabi, Gujarati, Marathi, Bengali, Tamil, Telugu.
- Reset Settings clears the translation cookie and returns to English.


V29.2: Google Translate banner/frame is aggressively hidden via CSS and MutationObserver while retaining automatic translation.
