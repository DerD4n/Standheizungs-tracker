package de.standheizung.tank;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

/** Plant und verschickt die Tankstand-Erinnerungen. Die Daten liefert die Web-Oberfläche. */
final class Reminders {
    static final String CHANNEL = "tank_low";
    static final String ACTION_ALARM = "de.standheizung.tank.REMINDER";
    private static final String PREFS = "app_state";
    private static final long DAY = 86_400_000L;

    private Reminders() { }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void saveState(Context c, String json) {
        prefs(c).edit().putString("state", json).apply();
    }

    static JSONObject state(Context c) {
        try {
            return new JSONObject(prefs(c).getString("state", "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, Texts.get(c, "channel.name"),
                        NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription(Texts.get(c, "channel.desc"));
                nm.createNotificationChannel(ch);
            }
        }
    }

    static boolean canPost(Context c) {
        if (Build.VERSION.SDK_INT >= 33
                && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        return nm != null && nm.areNotificationsEnabled();
    }

    private static PendingIntent alarmIntent(Context c) {
        Intent i = new Intent(c, ReminderReceiver.class).setAction(ACTION_ALARM);
        return PendingIntent.getBroadcast(c, 1, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Nächsten fälligen Zeitpunkt beim AlarmManager anmelden (oder Alarm löschen). */
    static void schedule(Context c) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = alarmIntent(c);
        am.cancel(pi);

        JSONObject st = state(c);
        JSONObject notify = st.optJSONObject("notify");
        if (notify == null || !notify.optBoolean("on", false)) return;
        JSONArray items = st.optJSONArray("items");
        if (items == null) return;

        Set<String> done = prefs(c).getStringSet("notified", new HashSet<>());
        long now = System.currentTimeMillis();
        long next = Long.MAX_VALUE;
        for (int i = 0; i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            if (it == null || done.contains(it.optString("key"))) continue;
            long emptyAt = it.optLong("emptyAt");
            if (emptyAt + 2 * DAY < now) continue; // zu alt, nicht mehr nerven
            long t = Math.max(it.optLong("warnAt"), now + 5_000);
            next = Math.min(next, t);
        }
        if (next != Long.MAX_VALUE) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi);
        }
    }

    /** Vom Alarm aufgerufen: fällige Erinnerungen anzeigen. */
    static void fire(Context c) {
        JSONObject st = state(c);
        JSONObject notify = st.optJSONObject("notify");
        JSONArray items = st.optJSONArray("items");
        if (notify == null || !notify.optBoolean("on", false) || items == null) return;
        if (!canPost(c)) return;

        SharedPreferences p = prefs(c);
        Set<String> done = new HashSet<>(p.getStringSet("notified", new HashSet<>()));
        long now = System.currentTimeMillis();
        for (int i = 0; i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            if (it == null) continue;
            String key = it.optString("key");
            if (done.contains(key) || it.optLong("warnAt") > now + 60_000) continue;
            long emptyAt = it.optLong("emptyAt");
            if (emptyAt + 2 * DAY < now) continue;

            long days = Math.round((emptyAt - now) / (double) DAY);
            String when = Texts.shortDate(c).format(new Date(emptyAt));
            String text = days <= 0
                    ? Texts.get(c, "n.empty")
                    : Texts.get(c, "n.body", Texts.days(c, days), when);
            String heater = it.optString("heater", Texts.get(c, "heater.default"));
            post(c, key.hashCode(), Texts.get(c, "n.title", heater), text);
            done.add(key);
        }
        // nur Schlüssel behalten, die noch aktuell sind
        Set<String> keep = new HashSet<>();
        for (int i = 0; i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            if (it != null && done.contains(it.optString("key"))) keep.add(it.optString("key"));
        }
        p.edit().putStringSet("notified", keep).apply();
    }

    static void post(Context c, int id, String title, String text) {
        ensureChannel(c);
        if (!canPost(c)) return;
        Intent open = new Intent(c, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(c, CHANNEL)
                : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_notification)
                .setColor(c.getColor(R.color.accent))
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true);
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(id, b.build());
    }
}
