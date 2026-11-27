package de.standheizung.tank;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

/** Ungefährer Standort (nur ACCESS_COARSE_LOCATION, ca. 1–3 km genau) – reicht fürs Wetter. */
final class Locator {
    private static final long FRESH_MS = 6 * 3600 * 1000L;
    private static final long TIMEOUT_MS = 20_000L;

    private Locator() { }

    static boolean hasPermission(Context c) {
        return c.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    static boolean enabled(Context c) {
        LocationManager lm = c.getSystemService(LocationManager.class);
        if (lm == null) return false;
        if (Build.VERSION.SDK_INT >= 28) return lm.isLocationEnabled();
        return lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) || lm.isProviderEnabled(LocationManager.GPS_PROVIDER);
    }

    @SuppressWarnings("MissingPermission")
    private static Location lastKnown(LocationManager lm) {
        Location best = null;
        for (String p : lm.getProviders(true)) {
            try {
                Location l = lm.getLastKnownLocation(p);
                if (l != null && (best == null || l.getTime() > best.getTime())) best = l;
            } catch (SecurityException ignored) { }
        }
        return best;
    }

    /** Liefert genau einmal eine Position (oder null) an done – auf dem Hauptthread. */
    @SuppressWarnings({"MissingPermission", "deprecation"})
    static void get(Context c, Consumer<Location> done) {
        Handler main = new Handler(Looper.getMainLooper());
        if (!hasPermission(c)) { main.post(() -> done.accept(null)); return; }
        LocationManager lm = c.getSystemService(LocationManager.class);
        if (lm == null) { main.post(() -> done.accept(null)); return; }

        Location last = lastKnown(lm);
        if (last != null && System.currentTimeMillis() - last.getTime() < FRESH_MS) {
            main.post(() -> done.accept(last));
            return;
        }
        AtomicBoolean finished = new AtomicBoolean(false);
        Consumer<Location> once = (l) -> { if (finished.compareAndSet(false, true)) done.accept(l != null ? l : last); };
        main.postDelayed(() -> once.accept(null), TIMEOUT_MS);

        String provider = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) ? LocationManager.NETWORK_PROVIDER
                : lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ? LocationManager.GPS_PROVIDER : null;
        if (provider == null) { main.post(() -> once.accept(null)); return; }
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                lm.getCurrentLocation(provider, new CancellationSignal(), c.getMainExecutor(), once::accept);
            } else {
                lm.requestSingleUpdate(provider, new LocationListener() {
                    @Override public void onLocationChanged(Location l) { once.accept(l); }
                    @Override public void onProviderDisabled(String p) { once.accept(null); }
                    @Override public void onProviderEnabled(String p) { }
                    @Override public void onStatusChanged(String p, int s, android.os.Bundle b) { }
                }, Looper.getMainLooper());
            }
        } catch (SecurityException | IllegalArgumentException e) {
            main.post(() -> once.accept(null));
        }
    }
}
