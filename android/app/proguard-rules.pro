# -------------------------------------------------------------
# Inbox Companion - Android R8 / ProGuard Optimization Rules
# -------------------------------------------------------------

# Flutter Engine & Wrapper Preservation
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Drift & SQLite3 Native Bindings
-keep class sqlite3.** { *; }
-keep class org.sqlite.** { *; }
-keepclasseswithmembernames class * {
    native <methods>;
}

# Android Biometrics / Local Authentication
-dontwarn androidx.biometric.**
-keep class androidx.biometric.** { *; }

# Security & Crypto (flutter_secure_storage / EncryptedSharedPreferences)
-keep class androidx.security.crypto.** { *; }
-dontwarn androidx.security.crypto.**

# Kotlin Coroutines & Reflection
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory { *; }
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler { *; }
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# Preserve Line Numbers and Attributes for Crash Reporting
-keepattributes SourceFile,LineNumberTable,EnclosingMethod,InnerClasses
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
