import java.util.Properties

plugins {
    id("com.android.application")
}

// Fester Signaturschlüssel, damit Updates über die installierte App passen.
// Der Schlüssel liegt NICHT im Repository: Der GitHub-Workflow erzeugt
// keystore.properties und release.keystore aus den Secrets KEYSTORE_BASE64
// und KEYSTORE_PASSWORD. Lokal ohne diese Dateien wird mit Debug-Schlüssel signiert.
val keystoreFile = file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystoreFile.exists()) keystoreFile.inputStream().use { load(it) }
}

android {
    namespace = "de.standheizung.tank"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.standheizung.tank"
        minSdk = 26
        targetSdk = 35
        versionCode = 5
        versionName = "1.4"
    }

    signingConfigs {
        if (keystoreFile.exists()) create("release") {
            storeFile = file(keystoreProps.getProperty("storeFile", "release.keystore"))
            storePassword = keystoreProps.getProperty("storePassword")
            keyAlias = keystoreProps.getProperty("keyAlias")
            keyPassword = keystoreProps.getProperty("keyPassword")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
