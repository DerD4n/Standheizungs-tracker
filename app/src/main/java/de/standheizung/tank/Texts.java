package de.standheizung.tank;

import android.content.Context;

import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Texte für Benachrichtigungen, Widget und Hinweise – Deutsch und Englisch.
 * Die Sprache kommt aus der App-Einstellung (setAppState "lang"), sonst aus dem Handy.
 * Neue Texte immer in BEIDEN Sprachen eintragen.
 */
final class Texts {
    private static final Map<String, String> DE = new HashMap<>();
    private static final Map<String, String> EN = new HashMap<>();

    private static void put(String key, String de, String en) { DE.put(key, de); EN.put(key, en); }

    static {
        put("channel.name", "Tankstand-Erinnerung", "Low tank reminder");
        put("channel.desc", "Hinweis, bevor der Tank der Standheizung leer ist", "Notice before the heater's tank runs dry");
        put("heater.default", "Standheizung", "Parking heater");
        put("n.title", "%s: Tank bald leer", "%s: tank running low");
        put("n.empty", "Laut Schätzung ist der Tank jetzt leer. Zeit zum Tanken!", "The tank is estimated to be empty now. Time to refill!");
        put("n.body", "Laut Schätzung reicht der Tank noch ca. %s (bis %s). Zeit zum Tanken!", "Estimated range: about %s left (until %s). Time to refill!");
        put("day", "Tag", "day");
        put("days", "Tage", "days");
        put("w.start", "App öffnen, um zu starten", "Open the app to get started");
        put("w.needData", "Ab der 2. Vollbetankung", "From the 2nd full fill-up");
        put("w.left", "ca. %d l", "approx. %d L");
        put("w.of", "von %d l", "of %d L");
        put("w.lasts", "reicht noch ca. %s · %s", "lasts approx. %s · %s");
        put("w.rate", "%.1f l/Tag", "%.1f L/day");
        put("w.costDay", "%.2f € pro Tag", "€%.2f per day");
        put("w.noTank", " · Tankgröße fehlt", " · tank size missing");
        put("t.allowInstall", "Bitte „Apps aus dieser Quelle zulassen“ einschalten und dann erneut tippen",
                "Please enable “Allow from this source”, then tap again");
        put("t.installFail", "Installation konnte nicht gestartet werden", "Couldn't start the installer");
        put("t.exportFail", "Export fehlgeschlagen", "Export failed");
    }

    private Texts() { }

    static String lang(Context c) {
        String l = Reminders.state(c).optString("lang", "");
        if ("de".equals(l) || "en".equals(l)) return l;
        return "de".equals(Locale.getDefault().getLanguage()) ? "de" : "en";
    }

    static Locale locale(Context c) {
        return "de".equals(lang(c)) ? Locale.GERMANY : Locale.UK;
    }

    static String get(Context c, String key, Object... args) {
        Map<String, String> m = "de".equals(lang(c)) ? DE : EN;
        String s = m.containsKey(key) ? m.get(key) : DE.get(key);
        if (s == null) s = key;
        return args.length == 0 ? s : String.format(locale(c), s, args);
    }

    static String days(Context c, long n) {
        return n + " " + get(c, n == 1 ? "day" : "days");
    }

    /** Kurzes Datum mit Wochentag: "Mi, 19.11." bzw. "Wed 19 Nov". */
    static SimpleDateFormat shortDate(Context c) {
        return "de".equals(lang(c))
                ? new SimpleDateFormat("EEE, dd.MM.", Locale.GERMANY)
                : new SimpleDateFormat("EEE d MMM", Locale.UK);
    }
}
