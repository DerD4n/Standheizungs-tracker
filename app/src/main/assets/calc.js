/*
 * Standheizung Tracker – Rechenlogik (ohne Oberfläche, damit sie getestet werden kann).
 *
 * Alle Zeitrechnungen laufen über ganze Kalendertage (Tagesindex), nicht über
 * Millisekunden. Dadurch stimmen die Rechnungen auch über die Zeitumstellung.
 */
(function (root) {
  "use strict";

  const DAY = 86400000;

  /** Gradtagszahlen-Promille (Anteil am Jahresheizbedarf je Monat, Jan … Dez), Summe 1000. */
  const GTZ = [170, 150, 130, 80, 40, 13.3, 13.3, 13.4, 30, 80, 120, 160];

  /** "YYYY-MM-DD" → Date (lokale Mitternacht). */
  function parseD(s) {
    const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  /** Date → Tagesindex (ganze Tage seit 1970-01-01, unabhängig von Zeitzone/Sommerzeit). */
  function dayIdx(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
  }
  /** Tagesindex → Date (lokale Mitternacht). */
  function dateOf(i) {
    const u = new Date(i * DAY);
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
  }
  function monthOf(i) { return new Date(i * DAY).getUTCMonth(); }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  /** Anteil eines einzelnen Tages am Jahresheizbedarf laut Gradtagszahlen (Summe über ein Jahr ≈ 1000). */
  function weight(i) {
    const u = new Date(i * DAY);
    return GTZ[u.getUTCMonth()] / daysInMonth(u.getUTCFullYear(), u.getUTCMonth());
  }
  const toIdx = (d) => (d == null ? null : typeof d === "number" ? d : dayIdx(d));

  /* ---------- Heizjahr ---------- */
  function normStart(sm) { sm = +sm; return sm >= 0 && sm < 12 && Number.isInteger(sm) ? sm : 8; }
  /** Heizjahr (Startjahr) eines Datums. Beginn im Monat sm (0 = Januar … 8 = September). */
  function hjOf(date, sm) {
    sm = normStart(sm);
    return date.getMonth() >= sm ? date.getFullYear() : date.getFullYear() - 1;
  }
  /** [Beginn, Ende) eines Heizjahres als Date. */
  function hjRange(y, sm) {
    sm = normStart(sm);
    return [new Date(y, sm, 1), new Date(y + 1, sm, 1)];
  }

  /* ---------- Abschnitte zwischen Vollbetankungen ----------
     Liter eines Abschnitts = alles, was bis einschließlich der nächsten Vollbetankung
     nachgetankt wurde (= in der Zeit verbraucht).
     Kosten: Mit Tankgröße nach FIFO – verbraucht wird zuerst der älteste Sprit im Tank,
     zu dem Preis, zu dem er gekauft wurde. Ohne Tankgröße: Preis der Nachfüllung. */
  const ppl = (x) => (x.liters ? (x.total || 0) / x.liters : 0);
  function sortFills(fills) {
    return [...fills].sort((a, b) =>
      dayIdx(parseD(a.date)) - dayIdx(parseD(b.date)) || (a.created || 0) - (b.created || 0));
  }

  function intervals(fills, cap) {
    const f = sortFills(fills);
    const fifo = cap > 0;
    const out = [];
    let start = null, accL = 0, accC = 0, members = [];
    let q = [], lastP = 0;

    const take = (L, fallbackP) => {
      let cost = 0, rest = L;
      while (rest > 1e-9 && q.length) {
        const lot = q[0], t = Math.min(rest, lot.l);
        cost += t * lot.p; lot.l -= t; rest -= t; lastP = lot.p;
        if (lot.l <= 1e-9) q.shift();
      }
      if (rest > 1e-9) cost += rest * (lastP || fallbackP); // Angaben passen nicht zur Tankgröße
      return cost;
    };
    const reset = (x) => { start = x; q = [{ l: cap, p: ppl(x) }]; lastP = ppl(x); };

    for (const x of f) {
      if (start === null) { if (x.full) reset(x); continue; }
      accL += x.liters || 0; accC += x.total || 0; members.push(x);
      if (!x.full) { if (fifo) q.push({ l: x.liters || 0, p: ppl(x) }); continue; }

      const a = dayIdx(parseD(start.date)), b = dayIdx(parseD(x.date)), d = b - a;
      const fallbackP = accL ? accC / accL : 0;
      const cost = fifo ? take(accL, fallbackP) : accC;
      if (fifo) q.push({ l: x.liters || 0, p: ppl(x) });

      if (d > 0) {
        out.push({ from: dateOf(a), to: dateOf(b), fromD: a, toD: b, days: d, liters: accL, cost, paid: accC,
          rate: accL / d, costRate: cost / d, price: accL ? cost / accL : 0, end: x, members: [...members] });
        start = x;
      } else if (out.length) {
        // Zweite Vollbetankung am selben Tag: gehört zum vorigen Abschnitt
        const last = out[out.length - 1];
        last.liters += accL; last.cost += cost; last.paid += accC;
        last.rate = last.liters / last.days; last.costRate = last.cost / last.days;
        last.price = last.liters ? last.cost / last.liters : 0; last.end = x; last.members.push(...members);
        start = x;
      } else {
        reset(x); // noch kein Abschnitt: neuer Startpunkt
      }
      accL = 0; accC = 0; members = [];
    }
    return out;
  }

  /** Verbrauch/Kosten der Abschnitte anteilig im Zeitraum [a, b) (Date, Tagesindex oder null = offen). */
  function share(ivs, a, b) {
    const ai = toIdx(a), bi = toIdx(b);
    let L = 0, C = 0, D = 0;
    for (const iv of ivs) {
      const s = Math.max(iv.fromD, ai == null ? -Infinity : ai);
      const e = Math.min(iv.toD, bi == null ? Infinity : bi);
      if (e > s) { const d = e - s; L += iv.rate * d; C += iv.costRate * d; D += d; }
    }
    return { liters: L, cost: C, days: D };
  }

  /** Rate (l/Tag) des Abschnitts, der Tag i enthält, sonst null. */
  function rateAt(ivs, i) {
    for (const iv of ivs) if (i >= iv.fromD && i < iv.toD) return iv;
    return null;
  }

  /* ---------- Prognose fürs Heizjahr ----------
     1. Heizkurve: Tagesanteile aus den Gradtagszahlen (kalte Monate viel, Sommer fast nichts).
     2. Skalierung k: bekannter Verbrauch der letzten ≤ 365 Tage ÷ Summe der Kurvenanteile dieser Tage.
        → geschätzter Verbrauch eines Tages = k × Kurvenanteil.
     3. Ab dem 2. Jahr: Für Kalendermonate, die aus früheren Heizjahren bekannt sind (≥ 20 Tage),
        wird der eigene Wert (l/Tag) statt der Kurve verwendet.
     4. Kosten der geschätzten Liter mit dem zuletzt bezahlten Literpreis.
     5. Spanne: Unsicherheit je geschätztem Tag – Kurve 45 % (kaum Daten) … 15 % (ein Jahr Daten),
        eigene Monatswerte 12 %. */
  function forecast(ivs, opts) {
    if (!ivs || !ivs.length) return null;
    const sm = normStart(opts.yearStart);
    const today = opts.today || new Date();
    const T = dayIdx(today);
    const y = hjOf(today, sm);
    const [Ad, Bd] = hjRange(y, sm);
    const A = dayIdx(Ad), B = dayIdx(Bd);
    const firstFrom = ivs[0].fromD, lastTo = ivs[ivs.length - 1].toD;
    const price = opts.price != null ? opts.price : ivs[ivs.length - 1].price;

    // 2. Skalierung aus bis zu einem Jahr bekannter Daten
    const kFrom = Math.max(firstFrom, lastTo - 365);
    let kL = 0, kW = 0;
    for (let d = kFrom; d < lastTo; d++) {
      const iv = rateAt(ivs, d);
      if (iv) { kL += iv.rate; kW += weight(d); }
    }
    const k = kW > 0 ? kL / kW : 0;
    const coverage = Math.min(1, kW / 1000);
    const uProfile = 0.45 - 0.30 * coverage;
    const uOwn = 0.12;

    // 3. Eigene Monatswerte aus früheren Heizjahren
    const acc = Array.from({ length: 12 }, () => ({ L: 0, D: 0 }));
    for (let d = firstFrom; d < Math.min(A, lastTo); d++) {
      const iv = rateAt(ivs, d);
      if (iv) { const m = monthOf(d); acc[m].L += iv.rate; acc[m].D++; }
    }
    const own = acc.map((a) => (a.D >= 20 ? a.L / a.D : null));

    // Monate des Heizjahres
    const months = [];
    for (let i = 0; i < 12; i++) {
      const ms = dayIdx(new Date(Ad.getFullYear(), Ad.getMonth() + i, 1));
      const me = dayIdx(new Date(Ad.getFullYear(), Ad.getMonth() + i + 1, 1));
      const s = share(ivs, ms, me);
      months.push({ date: dateOf(ms), startD: ms, endD: me, actualL: s.liters, actualC: s.cost,
        estL: 0, estC: 0, estPastL: 0, own: false });
    }

    let gapL = 0, restL = 0, uC = 0, ownDays = 0, preDays = 0;
    for (let d = A; d < B; d++) {
      const known = d >= firstFrom && d < lastTo && rateAt(ivs, d);
      if (known) continue;
      const m = monthOf(d);
      const useOwn = own[m] != null;
      const r = useOwn ? own[m] : k * weight(d);
      if (useOwn) ownDays++;
      if (d < firstFrom) preDays++;
      const mo = months[Math.min(11, months.findIndex((x) => d >= x.startD && d < x.endD))];
      mo.estL += r; mo.estC += r * price; if (useOwn) mo.own = true;
      if (d < T) { gapL += r; mo.estPastL += r; } else restL += r;
      uC += r * price * (useOwn ? uOwn : uProfile);
    }

    const known = share(ivs, A, B);
    const spent = known.cost + gapL * price;
    const rest = restL * price;
    const total = spent + rest;
    return {
      y, from: Ad, to: Bd, price, k,
      knownL: known.liters, knownC: known.cost, gapL, restL,
      spent, rest, total,
      low: Math.max(known.cost, total - uC), high: total + uC,
      liters: known.liters + gapL + restL,
      months, usedOwn: ownDays > 0, preTracking: preDays > 0, coverage,
      lastKnown: dateOf(lastTo),
    };
  }

  /** Tankstand-Schätzung: Tank war am Tag der letzten Vollbetankung voll, Verbrauch mit rate l/Tag. */
  function tankLeft(cap, rate, fillDate, today) {
    if (!(cap > 0) || !(rate > 0)) return null;
    const since = Math.max(0, dayIdx(today) - dayIdx(fillDate));
    const left = Math.max(0, cap - rate * since);
    return { left, pct: (left / cap) * 100, daysLeft: left / rate, emptyD: dayIdx(fillDate) + cap / rate };
  }

  const Calc = { DAY, GTZ, parseD, dayIdx, dateOf, weight, daysInMonth, hjOf, hjRange,
    sortFills, intervals, share, forecast, tankLeft };
  if (typeof module !== "undefined" && module.exports) module.exports = Calc;
  else root.Calc = Calc;
})(typeof self !== "undefined" ? self : this);
