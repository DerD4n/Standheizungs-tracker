package de.standheizung.tank;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationManager;
import android.provider.Settings;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private static final int REQ_NOTIF = 42;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Reminders.ensureChannel(this);

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        setupEdgeToEdge(root);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // localStorage = Speicher der Tankfüllungen
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);       // Assets funktionieren trotzdem
        s.setAllowContentAccess(false);
        s.setTextZoom(100);

        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme())) return false;
                // Externe Links im Browser öffnen
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    /** Inhalte nicht unter Status- und Navigationsleiste zeichnen. */
    private void setupEdgeToEdge(View root) {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            w.setDecorFitsSystemWindows(false);
        } else {
            w.getDecorView().setSystemUiVisibility(
                    w.getDecorView().getSystemUiVisibility()
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left, top, right, bottom;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                Insets ime = insets.getInsets(WindowInsets.Type.ime());
                left = bars.left; top = bars.top; right = bars.right;
                bottom = Math.max(bars.bottom, ime.bottom);
            } else {
                left = insets.getSystemWindowInsetLeft();
                top = insets.getSystemWindowInsetTop();
                right = insets.getSystemWindowInsetRight();
                bottom = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(left, top, right, bottom);
            return insets;
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        // z. B. nach Rückkehr aus den Android-Einstellungen den Status neu anzeigen
        if (webView != null) webView.evaluateJavascript("window.__onResume && window.__onResume()", null);
    }

    private String notificationStatus() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return getSharedPreferences("app_state", MODE_PRIVATE).getBoolean("asked", false) ? "denied" : "default";
        }
        NotificationManager nm = getSystemService(NotificationManager.class);
        return nm != null && nm.areNotificationsEnabled() ? "granted" : "denied";
    }

    private void js(String code) {
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript(code, null);
        });
    }

    private void permissionResult(String status) {
        if (webView != null) {
            webView.evaluateJavascript("window.__onNotifPerm && window.__onNotifPerm('" + status + "')", null);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_NOTIF) {
            getSharedPreferences("app_state", MODE_PRIVATE).edit().putBoolean("asked", true).apply();
            permissionResult(notificationStatus());
            Reminders.schedule(this);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // Zuerst der App die Chance geben (Formular schließen, zur Übersicht wechseln)
        webView.evaluateJavascript(
                "(window.__handleBack && window.__handleBack()) ? '1' : '0'",
                result -> {
                    if (!"\"1\"".equals(result)) finish();
                });
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    /** Wird aus JavaScript als window.AndroidBridge aufgerufen. */
    private class Bridge {
        @JavascriptInterface
        public void share(String text, String title, String fileName) {
            runOnUiThread(() -> shareAsFile(text, title, fileName));
        }

        /** Aktueller Stand für Erinnerungen und Widget (JSON aus der Web-Oberfläche). */
        @JavascriptInterface
        public void setAppState(String json) {
            Context c = getApplicationContext();
            Reminders.saveState(c, json);
            Reminders.schedule(c);
            TankWidget.updateAll(c);
        }

        @JavascriptInterface
        public String notificationStatus() {
            return MainActivity.this.notificationStatus();
        }

        @JavascriptInterface
        public void requestNotifications() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33
                        && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
                } else {
                    permissionResult(MainActivity.this.notificationStatus());
                }
            });
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            runOnUiThread(() -> {
                Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
                try {
                    startActivity(i);
                } catch (ActivityNotFoundException e) {
                    startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                            Uri.parse("package:" + getPackageName())));
                }
            });
        }

        @JavascriptInterface
        public String appVersion() {
            return Updater.installedName(getApplicationContext());
        }

        /** Prüft im Hintergrund auf ein neues Release, Ergebnis an window.__onUpdate(json). */
        @JavascriptInterface
        public void checkUpdate() {
            new Thread(() -> {
                String json = Updater.check(getApplicationContext()).toString();
                js("window.__onUpdate && window.__onUpdate(" + json + ")");
            }).start();
        }

        /** Lädt die neue APK und öffnet die Android-Installation. */
        @JavascriptInterface
        public void installUpdate(String url) {
            if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this,
                            "Bitte „Apps aus dieser Quelle zulassen“ einschalten und dann erneut tippen",
                            Toast.LENGTH_LONG).show();
                    try {
                        startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:" + getPackageName())));
                    } catch (ActivityNotFoundException ignored) { }
                });
                js("window.__onUpdateProgress && window.__onUpdateProgress(-2)");
                return;
            }
            new Thread(() -> {
                try {
                    File apk = Updater.download(getApplicationContext(), url,
                            pct -> js("window.__onUpdateProgress && window.__onUpdateProgress(" + pct + ")"));
                    js("window.__onUpdateProgress && window.__onUpdateProgress(100)");
                    runOnUiThread(() -> {
                        Intent i = new Intent(Intent.ACTION_VIEW)
                                .setDataAndType(ExportProvider.uriFor(MainActivity.this, apk),
                                        "application/vnd.android.package-archive")
                                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        try {
                            startActivity(i);
                        } catch (ActivityNotFoundException e) {
                            Toast.makeText(MainActivity.this, "Installation konnte nicht gestartet werden", Toast.LENGTH_LONG).show();
                        }
                    });
                } catch (Exception e) {
                    js("window.__onUpdateProgress && window.__onUpdateProgress(-1)");
                }
            }).start();
        }

        @JavascriptInterface
        public void openUrl(String url) {
            if (!url.toLowerCase(java.util.Locale.ROOT).startsWith("https://github.com/")) return;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (ActivityNotFoundException ignored) { }
            });
        }

        @JavascriptInterface
        public void testNotification(String title, String text) {
            Reminders.post(getApplicationContext(), 7001, title, text);
        }
    }

    private void shareAsFile(String text, String title, String fileName) {
        try {
            String safeName = (fileName == null || fileName.isEmpty()) ? "export.txt"
                    : fileName.replaceAll("[^A-Za-z0-9._-]", "_");
            File dir = new File(getCacheDir(), "exports");
            if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("no dir");
            File f = new File(dir, safeName);
            try (FileOutputStream out = new FileOutputStream(f)) {
                // BOM, damit Excel Umlaute in der CSV richtig erkennt
                if (safeName.endsWith(".csv")) out.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
                out.write(text.getBytes(StandardCharsets.UTF_8));
            }
            Uri uri = ExportProvider.uriFor(this, f);

            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(safeName.endsWith(".csv") ? "text/csv" : "application/json");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_SUBJECT, title);
            send.putExtra(Intent.EXTRA_TEXT, text.length() < 50000 ? text : title);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(send, title));
        } catch (Exception e) {
            Toast.makeText(this, "Export fehlgeschlagen", Toast.LENGTH_SHORT).show();
        }
    }
}
