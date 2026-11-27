/*
 * Standheizung Tracker – Wetterdaten von Open-Meteo (https://open-meteo.com, CC BY 4.0).
 * Kein API-Schlüssel nötig. Es werden nur auf 0,1° gerundete Koordinaten (~10 km) gesendet.
 *
 * Speichert je Ort (0,1°-Zelle) Tagesdatensätze mit Heizgraden (siehe Calc.dailyFromHourly):
 *   - jüngste Vergangenheit + 16 Tage Vorhersage (Forecast-API, alle 3 h aktualisiert)
 *   - ältere Tage bei Bedarf aus dem Archiv
 *   - Klima: die letzten 2 Jahre aus dem Archiv, gemittelt je Kalendertag
 */
(function (root) {
  "use strict";
  const C = root.Calc || (typeof require !== "undefined" ? require("./calc.js") : null);
  const KEY = "standheizung-wx";
  const MAX_CELLS = 8;
  const FORECAST_TTL = 3 * 3600 * 1000;
  const CLIMATE_TTL = 120 * 86400 * 1000;

  let store = load();
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { cells: {} }; } catch (e) { return { cells: {} }; }
  }
  function save() {
    // nur die zuletzt benutzten Orte behalten
    const keys = Object.keys(store.cells).sort((a, b) => (store.cells[b].used || 0) - (store.cells[a].used || 0));
    for (const k of keys.slice(MAX_CELLS)) delete store.cells[k];
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* Speicher voll: nur im RAM */ }
  }

  const round1 = (x) => Math.round(x * 10) / 10;
  function cellOf(lat, lon) { return `${round1(lat).toFixed(1)},${round1(lon).toFixed(1)}`; }
  function cell(key) {
    const c = store.cells[key] || (store.cells[key] = { days: {}, fc: 0, clim: null, climAt: 0 });
    c.used = Date.now();
    return c;
  }

  const iso = (d) => { const x = C.dateOf(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };

  async function getJSON(url) {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally { if (timer) clearTimeout(timer); }
  }

  function merge(c, data) {
    const recs = C.dailyFromHourly(data.hourly.time, data.hourly.temperature_2m);
    for (const [d, r] of Object.entries(recs)) c.days[d] = { h: r.h.map((x) => +x.toFixed(3)), tmin: +r.tmin.toFixed(1), tmax: +r.tmax.toFixed(1) };
  }

  /** Vergangenheit ab sinceD (max. 92 Tage) + 16 Tage Vorhersage holen, ältere Tage aus dem Archiv. */
  async function ensureRecent(key, sinceD, force) {
    const c = cell(key); const [lat, lon] = key.split(",").map(Number);
    const today = C.dayIdx(new Date());
    const from = Math.max(sinceD ?? today - 7, today - 730);
    let missingPast = false;
    for (let d = from; d < today - 1; d++) if (!c.days[d]) { missingPast = true; break; }
    if (!force && !missingPast && Date.now() - c.fc < FORECAST_TTL) return false;

    const past = Math.min(92, Math.max(1, today - from));
    const base = `latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto`;
    merge(c, await getJSON(`https://api.open-meteo.com/v1/forecast?${base}&past_days=${past}&forecast_days=16`));
    c.fc = Date.now();
    if (today - from > 92) {
      // Archiv hat einige Tage Verzögerung; alles vor der Forecast-Vergangenheit von dort
      let end = today - 92; let start = from;
      for (; start < end && c.days[start]; start++);
      if (start < end) merge(c, await getJSON(`https://archive-api.open-meteo.com/v1/archive?${base}&start_date=${iso(start)}&end_date=${iso(end)}`));
    }
    save();
    return true;
  }

  /** Klima der letzten 2 Jahre für den Ort (für Tage nach den 16 Vorhersagetagen). */
  async function ensureClimate(key) {
    const c = cell(key);
    if (c.clim && Date.now() - c.climAt < CLIMATE_TTL) return false;
    const [lat, lon] = key.split(",").map(Number);
    const today = C.dayIdx(new Date());
    const end = today - 7, start = end - 730;
    const data = await getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto&start_date=${iso(start)}&end_date=${iso(end)}`);
    const recs = C.dailyFromHourly(data.hourly.time, data.hourly.temperature_2m);
    c.clim = {};
    for (const [d, r] of Object.entries(recs)) c.clim[d] = { h: r.h.map((x) => +x.toFixed(2)) };
    c.climAt = Date.now();
    save();
    return true;
  }

  const climFns = {};
  /** Tagesdatensatz für Ort und Tag: echtes/vorhergesagtes Wetter, sonst Klima (nur Zukunft). */
  function dayRec(key, d) {
    const c = store.cells[key]; if (!c) return null;
    if (c.days[d]) return c.days[d];
    if (d > C.dayIdx(new Date()) && c.clim) {
      if (!climFns[key] || climFns[key].at !== c.climAt) climFns[key] = { at: c.climAt, fn: C.climateFrom(c.clim) };
      return climFns[key].fn(d);
    }
    return null;
  }
  function lastFetch(key) { const c = store.cells[key]; return c ? c.fc : 0; }

  /** Ortssuche (für feste Standorte). */
  async function geocode(name, lang) {
    const data = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=${lang}&format=json`);
    return (data.results || []).map((r) => ({
      name: r.name, region: [r.admin1, r.country].filter(Boolean).join(", "),
      lat: +r.latitude.toFixed(2), lon: +r.longitude.toFixed(2),
    }));
  }

  const Weather = { cellOf, ensureRecent, ensureClimate, dayRec, lastFetch, geocode, _store: () => store };
  if (typeof module !== "undefined" && module.exports) module.exports = Weather;
  else root.Weather = Weather;
})(typeof self !== "undefined" ? self : this);
