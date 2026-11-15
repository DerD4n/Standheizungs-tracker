package de.standheizung.tank;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarm (Erinnerung fällig) sowie Neustart/Update/Zeitänderung: neu planen. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Reminders.ACTION_ALARM.equals(intent.getAction())) {
            Reminders.fire(context);
        }
        Reminders.schedule(context);
        TankWidget.updateAll(context);
    }
}
