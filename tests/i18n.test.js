// Prüft die Übersetzungen: Jeder Text muss auf Deutsch UND Englisch da sein,
// mit denselben Platzhaltern, und jeder in der App benutzte Schlüssel muss existieren.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const I = require("../app/src/main/assets/i18n.js");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "app/src/main/assets/index.html"), "utf8");
const de = I.DICT.de, en = I.DICT.en;
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("Deutsch und Englisch haben genau dieselben Schlüssel", () => {
  const onlyDe = Object.keys(de).filter((k) => !(k in en));
  const onlyEn = Object.keys(en).filter((k) => !(k in de));
  assert.deepEqual(onlyDe, [], "fehlen auf Englisch");
  assert.deepEqual(onlyEn, [], "fehlen auf Deutsch");
});

test("Platzhalter stimmen in beiden Sprachen überein", () => {
  for (const k of Object.keys(de)) {
    assert.deepEqual(placeholders(en[k]), placeholders(de[k]), `Schlüssel ${k}`);
  }
});

test("Keine leeren Texte", () => {
  for (const [lang, d] of Object.entries(I.DICT))
    for (const [k, v] of Object.entries(d)) assert.ok(String(v).trim().length > 0, `${lang}: ${k}`);
});

test("Monatsnamen: je 12", () => {
  for (const l of ["de", "en"]) {
    I.setLang(l);
    assert.equal(I.months().length, 12, l);
    assert.equal(I.monthsLong().length, 12, l);
  }
});

test("Alle in der App benutzten Schlüssel existieren", () => {
  const used = new Set();
  for (const m of html.matchAll(/\bt\("([\w.]+)"(?!\s*\+)/g)) used.add(m[1]); // "fuel."+name wird unten geprüft
  for (const m of html.matchAll(/\btn\("([\w.]+)"/g)) { used.add(m[1] + ".one"); used.add(m[1] + ".other"); }
  for (const m of html.matchAll(/data-i18n(?:-html|-ph|-aria)?="([\w.]+)"/g)) used.add(m[1]);
  // Kraftstoffe werden dynamisch über "fuel." + Name übersetzt
  const fuels = [...html.matchAll(/\["([^"]+)","#[0-9a-f]{6}","#[0-9a-f]{6}"\]/g)].map((m) => "fuel." + m[1]);
  assert.ok(fuels.length >= 6, "Kraftstoffliste gefunden");
  fuels.forEach((k) => used.add(k));
  assert.ok(used.size > 100, `nur ${used.size} Schlüssel gefunden – Muster prüfen`);
  const missing = [...used].filter((k) => !(k in de) || !(k in en));
  assert.deepEqual(missing, [], "fehlende Übersetzungen");
});

test("Sprache automatisch: deutsches Handy → de, alles andere → en", () => {
  assert.equal(I.detect("auto", "de-DE"), "de");
  assert.equal(I.detect("auto", "de-AT"), "de");
  assert.equal(I.detect("auto", "en-US"), "en");
  assert.equal(I.detect("auto", "fr-FR"), "en");
  assert.equal(I.detect("de", "en-US"), "de");
  assert.equal(I.detect("en", "de-DE"), "en");
});

test("Mehrzahl und Platzhalter werden eingesetzt", () => {
  I.setLang("de");
  assert.equal(I.tn("days", 1, "1"), "1 Tag");
  assert.equal(I.tn("days", 3, "3"), "3 Tage");
  I.setLang("en");
  assert.equal(I.tn("days", 1, "1"), "1 day");
  assert.equal(I.t("fc.range", { a: "€1", b: "€2" }), "Range €1 – €2");
  I.setLang("de");
});

test("Android-Texte (Texts.java) gibt es in beiden Sprachen mit gleichen Platzhaltern", () => {
  const java = fs.readFileSync(path.join(ROOT, "app/src/main/java/de/standheizung/tank/Texts.java"), "utf8");
  const calls = [...java.matchAll(/put\("([\w.]+)",\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\)/gs)];
  assert.ok(calls.length >= 15, "Texte gefunden");
  const fmt = (s) => [...s.matchAll(/%[.\d]*[sdf]/g)].map((m) => m[0].slice(-1)).join(",");
  for (const [, key, d, e] of calls) {
    assert.ok(d.length && e.length, key);
    assert.equal(fmt(e), fmt(d), `Platzhalter ${key}`);
  }
  // Jeder im Java-Code benutzte Schlüssel existiert
  const keys = new Set(calls.map((c) => c[1]));
  const srcDir = path.join(ROOT, "app/src/main/java/de/standheizung/tank");
  for (const f of fs.readdirSync(srcDir)) {
    const src = fs.readFileSync(path.join(srcDir, f), "utf8");
    for (const m of src.matchAll(/Texts\.get\([^,]+,\s*"([\w.]+)"/g)) assert.ok(keys.has(m[1]), `${f}: ${m[1]}`);
  }
});
