package de.standheizung.tank;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Widget mit geschätztem Tankstand und Reichweite. */
public class TankWidget extends AppWidgetProvider {
    private static final long DAY = 86_400_000L;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, TankWidget.class));
        if (ids != null && ids.length > 0) {
            RemoteViews v = build(c);
            for (int id : ids) m.updateAppWidget(id, v);
        }
    }

    private static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_tank);
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(c, 2, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        JSONObject st = Reminders.state(c);
        JSONObject w = st.optJSONObject("widget");
        JSONObject notify = st.optJSONObject("notify");
        int warnDays = notify != null ? notify.optInt("days", 3) : 3;

        String name = w != null ? w.optString("name", "Standheizung") : "Standheizung";
        v.setTextViewText(R.id.w_name, name);

        if (w == null || !w.optBoolean("hasData", false)) {
            v.setTextViewText(R.id.w_main, "–");
            v.setTextViewText(R.id.w_right, "");
            v.setTextViewText(R.id.w_sub, w == null ? "App öffnen, um zu starten" : "Ab der 2. Vollbetankung");
            v.setViewVisibility(R.id.w_bar, View.GONE);
            return v;
        }

        double rate = w.optDouble("rate", 0);
        double cap = w.optDouble("cap", 0);
        long fillTime = w.optLong("fillTime", 0);
        boolean lastFull = w.optBoolean("lastFull", false);
        long now = System.currentTimeMillis();

        if (cap > 0 && lastFull && rate > 0) {
            double daysSince = Math.max(0, (now - fillTime) / (double) DAY);
            double left = Math.max(0, cap - rate * daysSince);
            double daysLeft = left / rate;
            int pct = (int) Math.round(Math.max(0, Math.min(100, left / cap * 100)));
            boolean low = daysLeft <= Math.max(warnDays, 2) || pct < 20;
            String until = new SimpleDateFormat("EEE, dd.MM.", Locale.GERMANY)
                    .format(new Date(now + (long) (daysLeft * DAY)));
            long d = Math.round(daysLeft);

            v.setTextViewText(R.id.w_main, "ca. " + Math.round(left) + " l");
            v.setTextViewText(R.id.w_right, "von " + Math.round(cap) + " l");
            v.setTextViewText(R.id.w_sub, (low ? "⚠ " : "") + "reicht noch ca. " + d + (d == 1 ? " Tag" : " Tage") + " · " + until);
            v.setViewVisibility(R.id.w_bar, View.VISIBLE);
            v.setProgressBar(R.id.w_bar, 100, pct, false);
            if (Build.VERSION.SDK_INT >= 31) {
                int col = c.getColor(low ? R.color.w_low : R.color.accent);
                v.setColorStateList(R.id.w_bar, "setProgressTintList", ColorStateList.valueOf(col));
            }
        } else {
            v.setTextViewText(R.id.w_main, String.format(Locale.GERMANY, "%.1f l/Tag", rate));
            v.setTextViewText(R.id.w_right, "");
            v.setTextViewText(R.id.w_sub, String.format(Locale.GERMANY, "%.2f € pro Tag", w.optDouble("costDay", 0))
                    + (cap > 0 ? "" : " · Tankgröße fehlt"));
            v.setViewVisibility(R.id.w_bar, View.GONE);
        }
        return v;
    }
}
