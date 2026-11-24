# =====================================================================
# FLOVA Android ProGuard / R8 Rules (SEC-09)
# =====================================================================

# 1. Capacitor Core & Bridge Reflection
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public <methods>;
}

# 2. Preserve JavaScript Interface Methods for WebView Bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 3. WebKit & WebView Callbacks
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, java.lang.String);
}

# 4. Capacitor Social Login & Google Credential Manager
-keep class ee.forgr.capacitor.social.login.** { *; }
-keep class com.google.android.gms.auth.api.identity.** { *; }
-keep class com.google.android.gms.common.api.** { *; }
-keep class androidx.credentials.** { *; }

# 5. Native Splash Screen & Core UI
-keep class androidx.core.splashscreen.** { *; }

# 6. Preserve Line Numbers for Debugging Production Stack Traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
