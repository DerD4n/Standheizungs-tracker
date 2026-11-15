// Tests der Rechenlogik – ausführen mit:  node --test tests/
// Läuft auf GitHub vor jedem Bau. Schlägt ein Test fehl, wird keine APK erstellt.
process.env.TZ = "Europe/Berlin"; // Zeitumstellung realistisch mitprüfen

const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../app/src/main/assets/calc.js");

const near = (a, b, eps = 1e-6, msg) =>
  assert.ok(Math.abs(a - b) <= eps, `${msg || ""} erwartet ${b}, erhalten ${a}`);
let n = 0;
const fill = (date, liters, total, full = true, extra = {}) =>
  ({ id: "f" + ++n, date, liters, total, full, created: n, ...extra });

/* ---------- Grundlagen ---------- */
test("Gradtagszahlen ergeben zusammen 1000 ‰", () => {
  near(C.GTZ.reduce((a, b) => a + b, 0), 1000, 1e-9);
});

test("Tagesindex ist über die Zeitumstellung stabil", () => {
  const a = C.dayIdx(new Date(2026, 2, 28)), b = C.dayIdx(new Date(2026, 2, 30));
  assert.equal(b - a, 2); // 29.3.2026 hat nur 23 Stunden
  const c = C.dayIdx(new Date(2026, 9, 24)), d = C.dayIdx(new Date(2026, 9, 26));
  assert.equal(d - c, 2); // 25.10.2026 hat 25 Stunden
  assert.equal(C.dayIdx(C.dateOf(a)), a);
});

/* ---------- Heizjahr ---------- */
test("Heizjahr mit Beginn im September", () => {
  assert.equal(C.hjOf(new Date(2026, 7, 31), 8), 2025);
  assert.equal(C.hjOf(new Date(2026, 8, 1), 8), 2026);
  const [a, b] = C.hjRange(2026, 8);
  assert.deepEqual([a.getFullYear(), a.getMonth(), a.getDate()], [2026, 8, 1]);
  assert.deepEqual([b.getFullYear(), b.getMonth(), b.getDate()], [2027, 8, 1]);
});

test("Heizjahr = Kalenderjahr bei Beginn im Januar", () => {
  assert.equal(C.hjOf(new Date(2026, 0, 1), 0), 2026);
  assert.equal(C.hjOf(new Date(2026, 11, 31), 0), 2026);
});

test("Ungültiger Beginn fällt auf September zurück", () => {
  assert.equal(C.hjOf(new Date(2026, 7, 15), 99), 2025);
});

/* ---------- Abschnitte & Kosten ---------- */
test("Beispiel aus der Erklärung: Kosten 100 € im Heizjahr", () => {
  const f = [fill("2026-09-01", 60, 102), fill("2026-10-01", 30, 51), fill("2026-10-15", 28, 49)];
  const iv = C.intervals(f, 0);
  assert.equal(iv.length, 2);
  assert.equal(iv[0].days, 30); near(iv[0].costRate, 1.7);
  assert.equal(iv[1].days, 14); near(iv[1].costRate, 3.5);
  const s = C.share(iv, ...C.hjRange(2026, 8));
  near(s.cost, 100); near(s.liters, 58); assert.equal(s.days, 44);
});

test("Erste Vollbetankung ist nur Startpunkt", () => {
  const iv = C.intervals([fill("2026-01-01", 50, 90)], 60);
  assert.equal(iv.length, 0);
});

test("Teilfüllungen vor der ersten Vollbetankung werden ignoriert", () => {
  const f = [fill("2026-01-01", 10, 17, false), fill("2026-01-05", 40, 68), fill("2026-01-15", 20, 34)];
  const iv = C.intervals(f, 0);
  assert.equal(iv.length, 1); near(iv[0].liters, 20); assert.equal(iv[0].days, 10);
});

test("Teilfüllungen zählen zur nächsten Vollbetankung", () => {
  const f = [fill("2026-01-01", 40, 68), fill("2026-01-05", 10, 17, false), fill("2026-01-11", 20, 34)];
  const iv = C.intervals(f, 0);
  assert.equal(iv.length, 1); near(iv[0].liters, 30); near(iv[0].rate, 3); near(iv[0].paid, 51);
});

test("Zwei Vollbetankungen am selben Tag landen im selben Abschnitt", () => {
  const f = [fill("2026-01-01", 40, 68), fill("2026-01-11", 20, 34), fill("2026-01-11", 5, 8.5)];
  const iv = C.intervals(f, 0);
  assert.equal(iv.length, 1); near(iv[0].liters, 25); near(iv[0].rate, 2.5);
});

test("Gleicher Tag ganz am Anfang: zweite Füllung wird neuer Startpunkt", () => {
  const f = [fill("2026-01-01", 40, 68), fill("2026-01-01", 5, 8.5), fill("2026-01-11", 20, 34)];
  const iv = C.intervals(f, 60);
  assert.equal(iv.length, 1); near(iv[0].liters, 20); assert.equal(iv[0].days, 10);
});

test("Reihenfolge der Eingabe spielt keine Rolle", () => {
  const f = [fill("2026-10-15", 28, 49), fill("2026-09-01", 60, 102), fill("2026-10-01", 30, 51)];
  const iv = C.intervals(f, 0);
  assert.equal(iv.length, 2); near(iv[0].cost, 51); near(iv[1].cost, 49);
});

test("FIFO: Verbrauch wird zum Preis des Sprits im Tank berechnet", () => {
  // Tank 60 l, voll mit Sprit zu 1,70 €/l. Danach teurer nachgetankt.
  const f = [fill("2026-09-01", 60, 102), fill("2026-10-01", 30, 54), fill("2026-10-15", 28, 50.4)];
  const iv = C.intervals(f, 60);
  near(iv[0].cost, 30 * 1.7, 1e-9, "1. Abschnitt");   // alter Sprit, nicht 54 €
  near(iv[1].cost, 28 * 1.7, 1e-9, "2. Abschnitt");   // immer noch alter Sprit im Tank
  near(iv[0].paid, 54); near(iv[1].paid, 50.4);       // bezahlt bleibt unverändert
});

test("FIFO: Wechsel Diesel → Heizöl wird anteilig berechnet", () => {
  // 60-l-Tank: 60 l Diesel à 1,80. Verbrauch 50 l, nachgetankt 50 l Heizöl à 1,00.
  // Dann Verbrauch 30 l: 10 l Diesel (Rest) + 20 l Heizöl = 18 + 20 = 38 €.
  const f = [fill("2026-11-01", 60, 108, true, { fuel: "Diesel" }),
             fill("2026-11-11", 50, 50, true, { fuel: "Heizöl" }),
             fill("2026-11-21", 30, 30, true, { fuel: "Heizöl" })];
  const iv = C.intervals(f, 60);
  near(iv[0].cost, 90); near(iv[1].cost, 38);
});

test("FIFO: Summe der Kosten = Summe verbrauchter Liter × Kaufpreise", () => {
  const f = [fill("2026-01-01", 50, 80), fill("2026-01-08", 20, 34), fill("2026-01-12", 15, 27, false),
             fill("2026-01-20", 10, 19), fill("2026-02-01", 30, 51)];
  const iv = C.intervals(f, 50);
  const consumed = iv.reduce((a, x) => a + x.liters, 0);
  near(consumed, 75);
  // Verbraucht: 50 l @1,60 + 25 l aus späteren Füllungen (20 @1,70 + 5 @1,80)
  near(iv.reduce((a, x) => a + x.cost, 0), 50 * 1.6 + 20 * 1.7 + 5 * 1.8, 1e-9);
});

test("Ohne Tankgröße: Kosten = Betrag der Nachfüllungen", () => {
  const f = [fill("2026-09-01", 60, 102), fill("2026-10-01", 30, 54)];
  near(C.intervals(f, 0)[0].cost, 54);
});

/* ---------- Verteilen auf Zeiträume ---------- */
test("Abschnitt über den Heizjahr-Wechsel wird nach Tagen aufgeteilt", () => {
  const f = [fill("2026-08-20", 40, 68), fill("2026-09-10", 21, 42)]; // 21 Tage, 1 l/Tag, 2 €/Tag
  const iv = C.intervals(f, 0);
  const alt = C.share(iv, ...C.hjRange(2025, 8)), neu = C.share(iv, ...C.hjRange(2026, 8));
  near(alt.liters, 12); near(neu.liters, 9); near(alt.cost + neu.cost, 42);
});

test("Zeitumstellung: Monatsanteile ergeben genau die Gesamtmenge", () => {
  for (const [a, b] of [["2026-03-20", "2026-04-03"], ["2026-10-20", "2026-11-03"]]) {
    const iv = C.intervals([fill(a, 40, 68), fill(b, 28, 49)], 0);
    assert.equal(iv[0].days, 14);
    const d1 = C.parseD(a), m1 = new Date(d1.getFullYear(), d1.getMonth(), 1);
    const m2 = new Date(d1.getFullYear(), d1.getMonth() + 1, 1), m3 = new Date(d1.getFullYear(), d1.getMonth() + 2, 1);
    const s = C.share(iv, m1, m2).liters + C.share(iv, m2, m3).liters;
    near(s, 28, 1e-9, `${a}–${b}`);
  }
});

test("Offene Zeiträume (null) umfassen alles", () => {
  const iv = C.intervals([fill("2026-01-01", 40, 68), fill("2026-01-11", 20, 34)], 0);
  near(C.share(iv, null, null).liters, 20);
});

/* ---------- Prognose ---------- */
// Erzeugt Tankfüllungen, deren Verbrauch genau der Heizkurve folgt: k Liter je 1 ‰.
function curveFills(fromStr, toStr, k, everyDays = 7, price = 1.7, mult = () => 1) {
  const out = [fill(fromStr, 60, 60 * price)];
  let d = C.dayIdx(C.parseD(fromStr)); const end = C.dayIdx(C.parseD(toStr));
  while (d < end) {
    const next = Math.min(d + everyDays, end); let L = 0;
    for (let i = d; i < next; i++) L += k * C.weight(i) * mult(C.dateOf(i).getMonth());
    const dt = C.dateOf(next);
    const s = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    out.push(fill(s, L, L * price)); d = next;
  }
  return out;
}

test("Prognose ohne Daten ist null", () => {
  assert.equal(C.forecast([], { yearStart: 8, today: new Date(2026, 10, 15) }), null);
});

test("Prognose im 1. Jahr folgt der Heizkurve statt dem Tagesdurchschnitt", () => {
  // Jahresverbrauch 900 l genau nach Kurve, Einträge seit 1.9.
  const iv = C.intervals(curveFills("2026-09-01", "2026-11-15", 0.9), 0);
  const fc = C.forecast(iv, { yearStart: 8, today: new Date(2026, 10, 15), price: 1.7 });
  near(fc.liters, 900, 900 * 0.02, "Jahresliter");
  near(fc.total, 900 * 1.7, 900 * 1.7 * 0.02, "Jahreskosten");
  assert.ok(fc.low < fc.total && fc.total < fc.high, "Spanne umschließt den Wert");
  assert.equal(fc.usedOwn, false);
  // Sommer fast nichts, Januar am meisten
  const by = (m) => fc.months.find((x) => x.date.getMonth() === m);
  assert.ok(by(6).estL < by(0).estL / 10, "Juli viel kleiner als Januar");
  // Der alte Ansatz (aktueller Tagesverbrauch × Resttage) läge weit darüber
  const naive = fc.knownL + iv[iv.length - 1].rate * (C.dayIdx(fc.to) - C.dayIdx(new Date(2026, 10, 15)));
  assert.ok(naive > fc.liters * 1.2, `naiv ${naive} vs. Kurve ${fc.liters}`);
});

test("Prognose: Monate vor den ersten Einträgen werden geschätzt und markiert", () => {
  const iv = C.intervals(curveFills("2026-11-01", "2026-12-01", 0.9), 0);
  const fc = C.forecast(iv, { yearStart: 8, today: new Date(2026, 11, 1), price: 1.7 });
  assert.equal(fc.preTracking, true);
  assert.ok(fc.months[0].estL > 0 && fc.months[0].actualL === 0, "September geschätzt");
  near(fc.liters, 900, 900 * 0.03);
});

test("Prognose ab dem 2. Jahr nutzt eigene Monatswerte", () => {
  // Vorjahr: im März doppelt so viel, wie die Kurve sagt (z. B. kalter Ort).
  const prev = curveFills("2025-09-01", "2026-09-01", 0.9, 7, 1.7, (m) => (m === 2 ? 2 : 1));
  const f = [...prev, ...curveFills("2026-09-01", "2026-11-15", 0.9).slice(1)];
  const iv = C.intervals(f, 0);
  const fc = C.forecast(iv, { yearStart: 8, today: new Date(2026, 10, 15), price: 1.7 });
  assert.equal(fc.usedOwn, true);
  const march = fc.months.find((x) => x.date.getMonth() === 2);
  const jan = fc.months.find((x) => x.date.getMonth() === 0);
  assert.ok(march.own && jan.own, "März und Januar aus eigenen Daten");
  near(march.estL, 0.9 * C.GTZ[2] * 2, 0.9 * C.GTZ[2] * 0.15, "März ≈ doppelte Kurve");
  near(jan.estL, 0.9 * C.GTZ[0], 0.9 * C.GTZ[0] * 0.15, "Januar ≈ Kurve");
});

test("Prognose: 'bisher' enthält die Tage seit der letzten Vollbetankung", () => {
  const iv = C.intervals(curveFills("2026-09-01", "2026-11-01", 0.9), 0);
  const fc = C.forecast(iv, { yearStart: 8, today: new Date(2026, 10, 15), price: 2 });
  assert.ok(fc.gapL > 0);
  near(fc.spent, fc.knownC + fc.gapL * 2, 1e-9);
  assert.ok(fc.spent > fc.knownC);
});

test("Prognose wird nie negativ und Spanne unten nie unter bekannte Kosten", () => {
  const iv = C.intervals([fill("2026-09-01", 60, 100), fill("2026-09-02", 0.1, 0.2)], 0);
  const fc = C.forecast(iv, { yearStart: 8, today: new Date(2026, 8, 2), price: 2 });
  assert.ok(fc.total >= 0 && fc.rest >= 0);
  assert.ok(fc.low >= fc.knownC);
});

test("Prognose funktioniert mit Heizjahr = Kalenderjahr", () => {
  const iv = C.intervals(curveFills("2026-01-01", "2026-03-01", 0.9), 0);
  const fc = C.forecast(iv, { yearStart: 0, today: new Date(2026, 2, 1), price: 1.7 });
  assert.equal(fc.from.getMonth(), 0);
  near(fc.liters, 900, 900 * 0.02);
});

/* ---------- Tankstand ---------- */
test("Tankstand: 60 l, 2 l/Tag, vor 10 Tagen voll → 40 l, 20 Tage", () => {
  const t = C.tankLeft(60, 2, new Date(2026, 10, 1), new Date(2026, 10, 11));
  near(t.left, 40); near(t.daysLeft, 20); near(t.pct, 100 * 40 / 60);
  assert.equal(t.emptyD, C.dayIdx(new Date(2026, 10, 1)) + 30);
});

test("Tankstand: nie unter 0, ohne Tankgröße null", () => {
  near(C.tankLeft(60, 2, new Date(2026, 10, 1), new Date(2026, 11, 31)).left, 0);
  assert.equal(C.tankLeft(0, 2, new Date(), new Date()), null);
});
