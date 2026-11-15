# Standheizung Tracker – Android-App bauen

Dieses Projekt enthält die komplette App. Damit daraus eine installierbare **APK** wird, muss sie einmal „gebaut“ werden. Am einfachsten lässt du das kostenlos von GitHub erledigen. Du musst dafür nichts installieren.

## Weg A: Bauen lassen auf GitHub (empfohlen, ca. 10 Minuten)

1. **GitHub-Konto anlegen** auf https://github.com (kostenlos), falls du noch keins hast.
2. **Neues Repository erstellen:** oben rechts **+ → New repository**.
   - Name z. B. `standheizung-app`
   - **Private** auswählen (wichtig, der Signaturschlüssel der App liegt im Projekt)
   - **Create repository**
3. **Dateien hochladen:** Klicke auf der leeren Repository-Seite auf **„uploading an existing file“**. Entpacke die ZIP-Datei und ziehe **den Inhalt** des Ordners `StandheizungApp` (also `app`, `gradle`, `gradlew`, `.github` …) in das Browserfenster. Dann **Commit changes** klicken.
4. **Bau abwarten:** Oben auf den Reiter **Actions** wechseln. Dort läuft „APK bauen“ (dauert ca. 3–5 Minuten). Wenn ein grüner Haken erscheint, ist sie fertig.
5. **APK herunterladen:** Den fertigen Lauf anklicken, ganz unten unter **Artifacts** auf **Standheizung-APK** klicken. Du bekommst eine ZIP mit der Datei `app-release.apk`.
6. **Installieren:** Die APK aufs Handy bringen (am einfachsten: Schritt 5 direkt im Handy-Browser machen) und antippen. Android fragt einmalig, ob du Apps aus dieser Quelle erlauben willst → erlauben.

> **Unter „Actions“ passiert nichts?** Der versteckte Ordner `.github` wurde beim Hochladen nicht mitgenommen (passiert z. B. auf dem Mac). Dann im Repository **Add file → Create new file** wählen, als Namen `.github/workflows/build.yml` eintippen, den Inhalt der Datei `build.yml` aus der ZIP hineinkopieren und speichern. Der Bau startet dann automatisch.

## Weg B: Mit Android Studio

Projektordner in Android Studio öffnen (**File → Open**), warten bis Gradle fertig ist, dann **Build → Build App Bundle(s) / APK(s) → Build APK(s)**. Oder das Handy per USB anschließen und auf ▶ drücken.

## Gut zu wissen

- **Updates kommen direkt in der App:** Bei jeder neuen Version erstellt GitHub automatisch ein Release. Die App zeigt dann oben „Update verfügbar“. Ein Tippen auf *Installieren* genügt, deine Daten bleiben erhalten. Unter *Einstellungen → App* kannst du auch selbst nach Updates suchen.
- **Neue Version veröffentlichen:** In `app/build.gradle.kts` `versionCode` um 1 und `versionName` erhöhen (z. B. 1.3 → 1.4), dann hochladen/pushen.
- **Signaturschlüssel:** Er liegt nicht im Code, sondern als GitHub-Secrets `KEYSTORE_BASE64` und `KEYSTORE_PASSWORD` (Repository → Settings → Secrets and variables → Actions). Diese Secrets nie löschen und den Schlüssel gut aufheben. Ohne ihn lassen sich Updates nicht mehr über die installierte App installieren.
- **Deine Daten liegen auf dem Handy** (nicht im Repository). Unter *Einstellungen → Datensicherung → Backup exportieren* kannst du zusätzlich ein Backup per Mail, Drive o. Ä. speichern.
