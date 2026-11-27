// Tests für die wetterbasierte Prognose: Heizgrade, Lernen, Pausen, Tank-Simulation.
process.env.TZ = "Europe/Berlin";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../app/src/main/assets/calc.js");

const near = (a, b, eps = 1e-6, msg) =>
  assert.ok(Math.abs(a - b) <= eps, `${msg || ""} erwartet ${b}, erhalten ${a}`);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const rec = (hdd16) => ({ h: C.BASES.map((b) => Math.max(0, hdd16 + (b - 16))) }); // vereinfachter Datensatz

/* ---------- Heizgrade aus Stundenwerten ---------- */
test("Gradtage: konstant 6 °C → bei Basis 16 genau 10", () => {
  const times = [], temps = [];
  for (let h = 0; h < 24; h++) { times.push(`2026-12-01T${String(h).padStart(2, "0")}:00`); temps.push(6); }
  const d = C.dailyFromHourly(times, temps)[C.dayIdx(new Date(2026, 11, 1))];
  near(C.hddAt(d, 16), 10); near(C.hddAt(d, 12), 6); near(C.hddAt(d, 20), 14);
  near(C.hddAt(d, 15), 9, 1e-9, "zwischen den Basen interpoliert");
  assert.equal(d.tmin, 6); assert.equal(d.tmax, 6);
});

test("Gradtage: warme Stunden zählen nicht negativ", () => {
  const times = [], temps = [];
  for (let h = 0; h < 24; h++) { times.push(`2026-05-01T${String(h).padStart(2, "0")}:00`); temps.push(h < 12 ? 8 : 24); }
  const d = Object.values(C.dailyFromHourly(times, temps))[0];
  near(C.hddAt(d, 16), 4); // halber Tag 8 Grad unter Basis
});

test("Gradtage: Tage mit Lücken (< 20 Stunden) werden verworfen", () => {
  const times = [], temps = [];
  for (let h = 0; h < 10; h++) { times.push(`2026-12-02T${String(h).padStart(2, "0")}:00`); temps.push(0); }
  assert.deepEqual(C.dailyFromHourly(times, temps), {});
});

/* ---------- Pausen ---------- */
test("Pausen: Ende exklusiv, offene Pause läuft weiter", () => {
  const p = [{ from: 100, to: 105 }, { from: 200, to: null }];
  assert.equal(C.isPaused(p, 99), false); assert.equal(C.isPaused(p, 100), true);
  assert.equal(C.isPaused(p, 104), true); assert.equal(C.isPaused(p, 105), false);
  assert.equal(C.isPaused(p, 5000), true); assert.equal(C.isPaused([], 1), false);
});

/* ---------- Lernen ---------- */
function synth(a, b, base, n, seedTemps) {
  // n Abschnitte à 7 Tage, Temperaturen variieren; Liter genau nach Modell
  const ivs = [], recs = {}; let d0 = 20000;
  for (let i = 0; i < n; i++) {
    let L = 0;
    for (let d = d0; d < d0 + 7; d++) {
      const t = seedTemps(d);
      const r = { h: C.BASES.map((bb) => Math.max(0, bb - t)) };
      recs[d] = r; L += a + b * C.hddAt(r, base);
    }
    ivs.push({ fromD: d0, toD: d0 + 7, liters: L }); d0 += 7;
  }
  return { ivs, recs };
}

test("Lernen: findet Grundlast und Liter je Heizgrad wieder", () => {
  const { ivs, recs } = synth(0.4, 0.15, 16, 8, (d) => 6 + 8 * Math.sin(d / 5));
  const m = C.fitWeather(C.weatherSamples(ivs, { dayRec: (d) => recs[d] }));
  near(m.a, 0.4, 1e-6); near(m.b, 0.15, 1e-6); assert.equal(m.base, 16); assert.equal(m.n, 8);
});

test("Lernen: wählt bei genug Daten die passende Basistemperatur", () => {
  // Temperaturen auch über 16 °C, sonst sind Basis 18 und Basis 16 + Grundlast nicht unterscheidbar
  const { ivs, recs } = synth(0, 0.2, 18, 8, (d) => 11 + 9 * Math.sin(d / 4));
  const m = C.fitWeather(C.weatherSamples(ivs, { dayRec: (d) => recs[d] }));
  assert.equal(m.base, 18); near(m.b, 0.2, 1e-6);
});

test("Lernen: immer unter 12 °C → bleibt bei Basis 16 ohne erfundene Grundlast", () => {
  // Basis 12 + 0,56 l Grundlast würde hier genauso gut passen, im Sommer aber falsch rechnen
  const { ivs, recs } = synth(0, 0.14, 16, 8, (d) => 2 + 5 * Math.sin(d / 3));
  ivs.forEach((iv) => { iv.liters = Math.round(iv.liters * 100) / 100; }); // gerundet wie echte Eingaben
  const m = C.fitWeather(C.weatherSamples(ivs, { dayRec: (d) => recs[d] }));
  assert.equal(m.base, 16); near(m.b, 0.14, 0.003); assert.ok(m.a < 0.05, `Grundlast ${m.a}`);
});

test("Lernen: mit 1–2 Abschnitten nur Liter je Heizgrad, Basis 16", () => {
  const { ivs, recs } = synth(0, 0.25, 16, 2, () => 4);
  const m = C.fitWeather(C.weatherSamples(ivs, { dayRec: (d) => recs[d] }));
  assert.equal(m.a, 0); near(m.b, 0.25); assert.equal(m.base, 16);
});

test("Lernen: alte Abschnitte (vor 'since') werden ignoriert", () => {
  const { ivs, recs } = synth(0, 0.25, 16, 4, () => 4);
  ivs[0].liters = 999; // Ausreißer vor dem Start
  const m = C.fitWeather(C.weatherSamples(ivs, { dayRec: (d) => recs[d], since: ivs[1].fromD }));
  near(m.b, 0.25); assert.equal(m.n, 3);
});

test("Lernen: Abschnitte mit fehlendem Wetter werden übersprungen", () => {
  const { ivs, recs } = synth(0, 0.25, 16, 3, () => 4);
  delete recs[ivs[1].fromD + 2];
  const s = C.weatherSamples(ivs, { dayRec: (d) => recs[d] });
  assert.equal(s.length, 2);
});

test("Lernen: Pausentage zählen nicht mit", () => {
  // 14 Tage, davon 7 pausiert; verbraucht nur in den aktiven 7 Tagen à 10 Heizgrade × 0,2 = 14 l
  const recs = {}; for (let d = 100; d < 114; d++) recs[d] = rec(10);
  const s = C.weatherSamples([{ fromD: 100, toD: 114, liters: 14 }], { dayRec: (d) => recs[d], pauses: [{ from: 107, to: 114 }] });
  assert.equal(s[0].days, 7);
  near(C.fitWeather(s).b, 0.2);
});

test("Lernen: ohne Heizgrade (Sommer) → nur Grundlast", () => {
  const recs = {}; for (let d = 0; d < 14; d++) recs[d] = { h: C.BASES.map(() => 0) };
  const m = C.fitWeather(C.weatherSamples([{ fromD: 0, toD: 14, liters: 7 }], { dayRec: (d) => recs[d] }));
  near(m.a, 0.5); assert.equal(m.b, 0);
});

test("Lernen: nie negative Werte", () => {
  const recs = {}; let d0 = 0; const ivs = [];
  for (const [L, t] of [[10, 0], [12, 2], [1, 10], [30, 14]]) { // widersprüchliche Daten
    for (let d = d0; d < d0 + 7; d++) recs[d] = { h: C.BASES.map((b) => Math.max(0, b - t)) };
    ivs.push({ fromD: d0, toD: d0 + 7, liters: L }); d0 += 7;
  }
  const m = C.fitWeather(C.weatherSamples(ivs, { dayRec: (d) => recs[d] }));
  assert.ok(m.a >= 0 && m.b >= 0, JSON.stringify(m));
});

/* ---------- Klima ---------- */
test("Klima: Mittel gleicher Kalendertage über Jahre", () => {
  const recs = {};
  for (const y of [2023, 2024]) for (let i = 0; i < 40; i++) {
    const d = C.dayIdx(new Date(y, 11, 1)) + i; recs[d] = rec(y === 2023 ? 8 : 12);
  }
  const clim = C.climateFrom(recs);
  const r = clim(C.dayIdx(new Date(2026, 11, 10)));
  near(C.hddAt(r, 16), 10, 1e-9); assert.equal(r.climate, true);
  assert.equal(clim(C.dayIdx(new Date(2026, 6, 1))), null, "Juli unbekannt");
});

/* ---------- Tank-Simulation ---------- */
test("Tank: 30 l, 2 l/Tag → leer nach 15 Tagen", () => {
  const sim = C.simulateTank(30, 1000, () => 2);
  near(sim.emptyD, 1015); near(sim.left[0], 30); near(sim.left[10], 10);
});

test("Tank: Kälteeinbruch zieht den Leer-Tag vor, Pause schiebt ihn", () => {
  const cold = C.simulateTank(30, 0, (d) => (d >= 5 ? 4 : 2));
  near(cold.emptyD, 5 + 20 / 4);
  const paused = C.simulateTank(30, 0, (d) => (d >= 3 && d < 10 ? 0 : 2));
  near(paused.emptyD, 22);
});

test("Tank: ohne Daten kein Leer-Tag", () => {
  const sim = C.simulateTank(30, 0, (d) => (d < 3 ? 1 : null));
  assert.equal(sim.emptyD, null); assert.equal(sim.until, 3); near(sim.left[2], 28);
});

test("Tagesverbrauch: Pause = 0, ohne Wetter null", () => {
  const m = { a: 0.3, b: 0.2, base: 16 };
  near(C.usageOf(m, rec(10), false), 2.3);
  assert.equal(C.usageOf(m, rec(10), true), 0);
  assert.equal(C.usageOf(m, null, false), null);
});

/* ---------- Heizjahr-Prognose mit Wetter ---------- */
test("Heizjahr-Prognose nutzt Wetter-Tageswerte statt Kurve", () => {
  const f = []; let n = 0;
  const add = (date, L, full = true) => f.push({ id: "w" + ++n, date, liters: L, total: L * 2, full, created: n });
  add("2026-09-01", 60);
  for (let d = new Date(2026, 8, 8); d < new Date(2026, 10, 20); d.setDate(d.getDate() + 7)) add(iso(d), 7);
  const ivs = C.intervals(f, 0);
  const plain = C.forecast(ivs, { yearStart: 8, today: new Date(2026, 10, 20), price: 2 });
  const wx = C.forecast(ivs, { yearStart: 8, today: new Date(2026, 10, 20), price: 2, dayRate: () => ({ rate: 5, u: 0.1 }) });
  assert.equal(wx.usedWeather, true); assert.equal(plain.usedWeather, false);
  const restDays = C.dayIdx(wx.to) - C.dayIdx(new Date(2026, 10, 20));
  near(wx.restL, 5 * restDays, 1e-6);
  assert.ok(wx.high - wx.total < plain.high - plain.total, "Spanne mit Wetter enger");
});
