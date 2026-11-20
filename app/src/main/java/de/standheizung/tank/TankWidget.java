package de.standheizung.tank;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.os.Build;
import android.os.Bundle;
import android.util.SizeF;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/** Widget mit geschätztem Tankstand und Reichweite. */
public class TankWidget extends AppWidgetProvider {
    private static final long DAY = 86_400_000L;

    /** Ab dieser Größe (dp) passt die volle Variante mit vier Zeilen. */
    private static final float FULL_W = 150f, FULL_H = 110f;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, forWidget(context, manager, id));
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle newOptions) {
        manager.updateAppWidget(id, forWidget(context, manager, id)); // Größe wurde geändert
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, TankWidget.class));
        if (ids != null) for (int id : ids) m.updateAppWidget(id, forWidget(c, m, id));
    }

    /** Passende Variante je Größe: ab Android 12 entscheidet das System selbst, davor wir. */
    private static RemoteViews forWidget(Context c, AppWidgetManager m, int id) {
        if (Build.VERSION.SDK_INT >= 31) {
            Map<SizeF, RemoteViews> map = new HashMap<>();
            map.put(new SizeF(40f, 40f), build(c, true));
            map.put(new SizeF(FULL_W, FULL_H), build(c, false));
            return new RemoteViews(map);
        }
        Bundle o = m.getAppWidgetOptions(id);
        int h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);   // Hochformat
        int w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        boolean compact = h > 0 && (h < FULL_H || w < FULL_W);
        return build(c, compact);
    }

    private static RemoteViews build(Context c, boolean compact) {
        RemoteViews v = new RemoteViews(c.getPackageName(), compact ? R.layout.widget_tank_small : R.layout.widget_tank);
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(c, 2, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        JSONObject st = Reminders.state(c);
        JSONObject w = st.optJSONObject("widget");
        JSONObject notify = st.optJSONObject("notify");
        int warnDays = notify != null ? notify.optInt("days", 3) : 3;

        String name = w != null ? w.optString("name", Texts.get(c, "heater.default")) : Texts.get(c, "heater.default");
        v.setTextViewText(R.id.w_name, name);

        if (w == null || !w.optBoolean("hasData", false)) {
            v.setTextViewText(R.id.w_main, "–");
            v.setTextViewText(R.id.w_right, "");
            String hint = Texts.get(c, w == null ? "w.start" : "w.needData");
            v.setTextViewText(R.id.w_sub, hint);
            if (compact) v.setTextViewText(R.id.w_name, name + " · " + hint);
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
            String until = Texts.shortDate(c).format(new Date(now + (long) (daysLeft * DAY)));
            long d = Math.round(daysLeft);

            v.setTextViewText(R.id.w_main, Texts.get(c, compact ? "w.leftShort" : "w.left", Math.round(left)));
            v.setTextViewText(R.id.w_right, Texts.get(c, "w.of", Math.round(cap)));
            v.setTextViewText(R.id.w_sub, (low ? "⚠ " : "") + Texts.get(c, "w.lasts", Texts.days(c, d), until));
            if (compact) {
                // Reichweite in die Namenszeile, weil die Unterzeile fehlt
                v.setTextViewText(R.id.w_name, name + " · " + (low ? "⚠ " : "") + Texts.get(c, "w.daysLeft", Texts.days(c, d)));
            }
            v.setViewVisibility(R.id.w_bar, View.VISIBLE);
            v.setProgressBar(R.id.w_bar, 100, pct, false);
            if (Build.VERSION.SDK_INT >= 31) {
                int col = c.getColor(low ? R.color.w_low : R.color.accent);
                v.setColorStateList(R.id.w_bar, "setProgressTintList", ColorStateList.valueOf(col));
            }
        } else {
            v.setTextViewText(R.id.w_main, Texts.get(c, "w.rate", rate));
            v.setTextViewText(R.id.w_right, "");
            String costLine = Texts.get(c, "w.costDay", w.optDouble("costDay", 0));
            v.setTextViewText(R.id.w_sub, costLine + (cap > 0 ? "" : Texts.get(c, "w.noTank")));
            if (compact) v.setTextViewText(R.id.w_name, name + " · " + costLine);
            v.setViewVisibility(R.id.w_bar, View.GONE);
        }
        return v;
    }
}
