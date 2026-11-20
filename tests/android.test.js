// Prüft die Android-Widget-Layouts: Jede View-ID, die TankWidget.java beschreibt,
// muss in JEDER Widget-Variante vorhanden sein (sonst bleibt das Widget je nach Größe leer).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "app/src/main/java/de/standheizung/tank/TankWidget.java"), "utf8");
const layouts = [...src.matchAll(/R\.layout\.(\w+)/g)].map((m) => m[1]);
const usedIds = new Set([...src.matchAll(/R\.id\.(\w+)/g)].map((m) => m[1]));

test("Widget hat mehrere Größen-Varianten", () => {
  assert.ok(new Set(layouts).size >= 2, "kompakte und volle Variante");
});

for (const name of new Set(layouts)) {
  test(`Layout ${name}: enthält alle benutzten IDs`, () => {
    const xml = fs.readFileSync(path.join(ROOT, `app/src/main/res/layout/${name}.xml`), "utf8");
    const ids = new Set([...xml.matchAll(/android:id="@\+id\/(\w+)"/g)].map((m) => m[1]));
    const missing = [...usedIds].filter((id) => !ids.has(id));
    assert.deepEqual(missing, [], `fehlende IDs in ${name}`);
  });
}

test("Haupt-Mengenzeile bricht nie um (maxLines=1)", () => {
  for (const name of new Set(layouts)) {
    const xml = fs.readFileSync(path.join(ROOT, `app/src/main/res/layout/${name}.xml`), "utf8");
    const block = xml.split("<TextView").find((b) => b.includes('@+id/w_main'));
    assert.match(block, /android:maxLines="1"/, name);
  }
});
