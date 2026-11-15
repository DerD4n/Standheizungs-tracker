package de.standheizung.tank;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Sucht auf GitHub nach einer neueren Version und lädt die APK herunter. */
final class Updater {
    static final String REPO = "DerD4n/standheizungs-tracker";
    private static final Pattern ASSET = Pattern.compile("standheizung-(\\d+)\\.apk");

    interface Progress { void onProgress(int percent); }

    private Updater() { }

    static long installedCode(Context c) {
        try {
            PackageInfo pi = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    static String installedName(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "?";
        }
    }

    private static HttpURLConnection open(String url) throws Exception {
        HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
        con.setConnectTimeout(15000);
        con.setReadTimeout(30000);
        con.setInstanceFollowRedirects(true);
        con.setRequestProperty("User-Agent", "Standheizung-App");
        return con;
    }

    /** Liefert JSON für die Oberfläche: {ok, available, code, name, url, notes, current, currentName}. */
    static JSONObject check(Context c) {
        JSONObject out = new JSONObject();
        try {
            out.put("current", installedCode(c));
            out.put("currentName", installedName(c));
            HttpURLConnection con = open("https://api.github.com/repos/" + REPO + "/releases/latest");
            con.setRequestProperty("Accept", "application/vnd.github+json");
            int status = con.getResponseCode();
            if (status == 404) { out.put("ok", true); out.put("available", false); return out; }
            if (status != 200) throw new IllegalStateException("HTTP " + status);
            String body;
            try (InputStream in = con.getInputStream()) {
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] b = new byte[8192]; int n;
                while ((n = in.read(b)) > 0) buf.write(b, 0, n);
                body = buf.toString(StandardCharsets.UTF_8.name());
            }
            JSONObject rel = new JSONObject(body);
            JSONArray assets = rel.optJSONArray("assets");
            long best = 0; String url = null;
            if (assets != null) {
                for (int i = 0; i < assets.length(); i++) {
                    JSONObject a = assets.getJSONObject(i);
                    Matcher m = ASSET.matcher(a.optString("name"));
                    if (m.matches()) {
                        long code = Long.parseLong(m.group(1));
                        if (code > best) { best = code; url = a.optString("browser_download_url"); }
                    }
                }
            }
            String name = rel.optString("tag_name", "").replaceFirst("^v", "");
            out.put("ok", true);
            out.put("available", url != null && best > installedCode(c));
            out.put("code", best);
            out.put("name", name);
            out.put("url", url == null ? "" : url);
            out.put("notes", rel.optString("body", ""));
            out.put("page", rel.optString("html_url", ""));
        } catch (Exception e) {
            try { out.put("ok", false); out.put("error", String.valueOf(e.getMessage())); } catch (Exception ignored) { }
        }
        return out;
    }

    /** Lädt die APK nach cache/exports (dort gibt ExportProvider sie zum Installieren frei). */
    static File download(Context c, String url, Progress p) throws Exception {
        // GitHub schreibt den Repository-Namen mal groß, mal klein – deshalb ohne Groß/Klein vergleichen
        String expected = ("https://github.com/" + REPO + "/releases/download/").toLowerCase(Locale.ROOT);
        if (!url.toLowerCase(Locale.ROOT).startsWith(expected)) {
            throw new SecurityException("Unerwartete Download-Adresse");
        }
        File dir = new File(c.getCacheDir(), "exports");
        if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("no dir");
        File[] old = dir.listFiles((d, n) -> n.endsWith(".apk"));
        if (old != null) for (File f : old) //noinspection ResultOfMethodCallIgnored
            f.delete();
        File out = new File(dir, "standheizung-update.apk");
        HttpURLConnection con = open(url);
        int status = con.getResponseCode();
        if (status != 200) throw new IllegalStateException("HTTP " + status);
        long total = con.getContentLengthLong();
        try (InputStream in = con.getInputStream(); FileOutputStream fo = new FileOutputStream(out)) {
            byte[] b = new byte[16384]; int n; long done = 0; int last = -1;
            while ((n = in.read(b)) > 0) {
                fo.write(b, 0, n); done += n;
                if (total > 0) {
                    int pct = (int) (done * 100 / total);
                    if (pct != last) { last = pct; p.onProgress(pct); }
                }
            }
        }
        return out;
    }
}
