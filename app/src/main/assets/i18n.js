/*
 * Standheizung Tracker – Übersetzungen (Deutsch / Englisch).
 * Neue Texte immer in BEIDEN Sprachen eintragen – ein Test prüft das vor jedem Bau.
 * Platzhalter: {name}. Mehrzahl: Schlüssel mit ".one" / ".other" und tn(key, n).
 */
(function (root) {
  "use strict";

  const DICT = {
    de: {
      "app.defaultName": "Standheizung",
      "sub.default": "{fuel}-Verbrauch & Kosten",
      "hsw.aria": "Heizung wechseln",
      "sync.loading": "Lädt…",
      "sync.local": "Nur auf diesem Gerät",
      "sync.cloudDown": "Die Cloud-Speicherung ist gerade nicht erreichbar – Einträge werden vorerst nur in diesem Browser gespeichert.",
      "sync.ok": "Synchronisiert",
      "sync.err": "Sync-Fehler",
      "sync.interrupted": "Synchronisierung unterbrochen ({code}). Lade die Seite später neu.",
      "err": "Fehler",

      "tab.home": "Übersicht", "tab.list": "Tankfüllungen", "tab.stats": "Statistik", "tab.settings": "Einstellungen",
      "fab": "Getankt",

      "home.recent": "Letzte Tankfüllungen",
      "hero.welcome": "Willkommen!",
      "hero.welcome1": "Trag beim nächsten Tanken einfach Menge und Preis ein – am besten jedes Mal voll machen.",
      "hero.welcome2": "Ab der zweiten Vollbetankung siehst du hier deinen Verbrauch.",
      "hero.start": "Startpunkt gesetzt",
      "hero.startText": "Erste Füllung am {date} gespeichert. Sobald du das nächste Mal voll tankst, berechnet die App den Verbrauch.",
      "hero.current": "Aktueller Verbrauch · seit {date}",
      "hero.perDay": "pro Tag", "hero.perMonth": "pro Monat", "hero.perHour": "pro Stunde (Ø)",
      "tank.est": "Tank geschätzt", "tank.soon": "bald tanken!",
      "tank.of": "<b>ca. {left}</b> von {cap}",
      "tank.lasts": "reicht noch ca. <b>{days}</b>",
      "tank.emptyOn": "leer um den {date}",
      "tank.unknown": "Tankstand unbekannt – die letzte Füllung war keine Vollbetankung.",

      "days.one": "{n} Tag", "days.other": "{n} Tage",
      "fills.one": "{n} Füllung", "fills.other": "{n} Füllungen",
      "fillups.one": "{n} Tankfüllung", "fillups.other": "{n} Tankfüllungen",
      "entries.one": "{n} Eintrag", "entries.other": "{n} Einträgen",

      "fill.interval": "{days} · {rate}/Tag · {cost}/Tag",
      "fill.partial": "Teilfüllung – zählt zur nächsten Vollbetankung",
      "badge.partial": "teilweise",
      "empty.recent": "Noch keine Tankfüllung.<br>Tippe auf <b>+ Getankt</b>.",
      "empty.list": "Noch keine Tankfüllung.",

      "kpi.used": "Verbraucht", "kpi.cost": "Kosten", "kpi.bought": "Getankt", "kpi.avgPrice": "Ø Preis",
      "kpi.perDayAvg": "Ø {v} pro Tag", "kpi.noData": "noch keine Daten",
      "kpi.costUntil": "bis {date} · Ø {v}/Tag", "kpi.allFills": "über alle Füllungen",
      "kpi.overDays": "über {days}", "kpi.burnedUntil": "verheizt bis {date}", "kpi.prorata": "anteilig nach Verbrauch",
      "kpi.avgDay": "Ø pro Tag", "kpi.avgMonth": "Ø pro Monat", "kpi.perDay": "{v} pro Tag", "kpi.perMonth": "{v} pro Monat",

      "per.season": "Heizjahr", "per.year": "Kalenderjahr", "per.12m": "12 Monate", "per.all": "Alles",
      "per.yearN": "Jahr {y}", "per.last12": "Letzte 12 Monate", "per.hj": "Heizjahr {y}", "per.allTime": "Gesamter Zeitraum",
      "season.aria": "Heizjahr wählen", "season.current": " · aktuell", "home.season": "Dieses Heizjahr",

      "stats.period": "Zeitraum", "stats.rate": "Verbrauch pro Tag", "stats.cost": "Kosten pro Monat",
      "stats.price": "Kraftstoffpreis", "stats.byFuel": "Nach Kraftstoff", "stats.years": "Heizjahre im Vergleich",
      "chart.noData": "keine Daten",
      "chart.priceEmpty": "Ab zwei Tankfüllungen im Zeitraum siehst du hier die Preisentwicklung.",
      "chart.rateT": "Ø Liter pro Tag, je Monat · {p}",
      "chart.onlyDays": "nur {n} Tage erfasst",
      "chart.costT": "{p}: {v} · anteilig nach Verbrauch",
      "chart.partialMonth": "Monat nur teilweise erfasst",
      "chart.lastPrice": "Zuletzt {v} ({fuel}) · {p}",
      "th.fuel": "Kraftstoff", "th.litres": "Liter", "th.amount": "Betrag", "th.share": "Anteil", "th.hj": "Heizjahr", "th.cost": "Kosten",
      "fuel.hint": "Getankte Mengen im Zeitraum · {p}",

      "fc.title": "Prognose Heizjahr {name}", "fc.approx": "ca. {v}", "fc.range": "Spanne {a} – {b}",
      "fc.sofar": "bisher ~{v}", "fc.rest": "noch ~{v} bis {date}",
      "fc.own": "Kurve aus deinen eigenen Monatswerten der Vorjahre, ergänzt um die Standard-Heizkurve.",
      "fc.adapted": "Standard-Heizkurve (Gradtagszahlen), angepasst an deinen Verbrauch.",
      "fc.firstYear": "Erstes Jahr: Standard-Heizkurve (Gradtagszahlen), hochgerechnet aus deinen bisherigen Werten. Wird mit jedem Monat genauer.",
      "fc.pre": " Monate vor deinem ersten Eintrag sind mitgeschätzt.",
      "fc.restPrice": " Kosten der Restmenge mit {p} (zuletzt bezahlt).",
      "fc.used": "verbraucht", "fc.forecast": "Prognose", "fc.perMonthL": "Liter je Monat", "fc.ownVals": " (eigene Werte)",

      "set.heater": "Heizung", "set.heaterMulti": "Heizung: {name}", "noName": "ohne Namen",
      "set.name": "Name", "set.name.ph": "z. B. Wohnmobil, Werkstatt, Gartenhaus",
      "set.model": "Heizungsmodell", "set.model.ph": "z. B. Webasto Air Top 2000",
      "set.fuel": "Standard-Kraftstoff", "set.tank": "Tankgröße (Liter)", "optional": "optional",
      "set.tankHint": "Mit Tankgröße zeigt die App, wie voll der Tank ungefähr noch ist und wie lange er reicht.",
      "set.addMore": "Weitere Heizung (z. B. Werkstatt, zweites Fahrzeug)?",
      "heater.add": "+ Heizung hinzufügen", "heaters.title": "Heizungen", "heater.newName": "Heizung {n}",
      "heater.delConfirm": "Mit {n} löschen?",
      "btn.delete": "Löschen", "btn.save": "Speichern", "btn.cancel": "Abbrechen", "btn.done": "Fertig", "btn.sure": "Wirklich?",

      "lang.title": "Sprache", "lang.auto": "Automatisch",

      "n.title": "Tankstand-Erinnerung",
      "n.subOff": "Rechtzeitig Bescheid bekommen, bevor der Tank leer ist.",
      "n.subOn": "Aktiv · {days} vorher um {h}:00",
      "n.daysLabel": "Erinnern, wenn der Tank nur noch reicht für",
      "n.week": "1 Woche", "n.time": "Uhrzeit", "n.heaters": "Für diese Heizungen",
      "n.test": "Test-Benachrichtigung senden",
      "n.perm": "Benachrichtigungen für diese App sind in Android ausgeschaltet.",
      "n.openSys": "Android-Einstellungen öffnen",
      "n.web": "📱 Erinnerungen gibt es in der Android-App. Hier im Browser kannst du sie nicht empfangen.",
      "n.noTank": "keine Tankgröße",
      "n.soonNow": "bald (Schwelle ist schon erreicht)",
      "n.next": "Nächste Erinnerung · {when}",
      "n.msgTitle": "{name}: Tank bald leer",
      "n.msgBody": "Laut Schätzung reicht der Tank noch ca. {days}. Zeit zum Tanken!",
      "n.none": "Noch keine Erinnerung geplant",
      "n.whyTank": "Trag oben bei der Heizung die Tankgröße ein – dann kann die App den Tankstand schätzen.",
      "n.whyData": "Sobald zwei Vollbetankungen erfasst sind, kennt die App deinen Verbrauch.",
      "n.whyFull": "Die letzte Füllung war keine Vollbetankung – nach dem nächsten Volltanken geht's wieder.",
      "n.whyOff": "Für diese Heizung ist die Erinnerung ausgeschaltet.",
      "n.whyNone": "Gerade ist keine Erinnerung geplant.",
      "n.testBody": "So sieht deine Erinnerung aus. Zeit zum Tanken! ⛽",
      "when.at": "{day} um {h}:00",

      "hj.title": "Heizjahr", "hj.starts": "Heizjahr beginnt im",
      "hj.calHint": "Das Heizjahr entspricht dem Kalenderjahr (Jan – Dez).",
      "hj.hint": "Ein Heizjahr läuft {span}, z. B. „Heizjahr {name}“. Am besten liegt der Wechsel in den Monaten, in denen du kaum heizt. Deine Einträge bleiben beim Ändern unverändert.",
      "hj.recommended": " (empfohlen)", "hj.calendar": " (= Kalenderjahr)", "hj.toast": "Heizjahr: {span}",

      "app.title": "App", "ver.check": "Nach Updates suchen",
      "widget.title": "Widget",
      "widget.howto": "Tankstand und Reichweite direkt auf dem Startbildschirm: Lange auf eine freie Stelle des Startbildschirms tippen → <b>Widgets</b> → <b>Standheizung</b>.",
      "widget.shows": "Widget zeigt", "widget.current": "Die gerade gewählte Heizung",

      "calc.title": "So wird gerechnet",
      "calc.p1": "<b>Verbrauch:</b> Was du beim Volltanken nachfüllst, wurde seit dem letzten Volltanken verbraucht – geteilt durch die Tage dazwischen ergibt das den Verbrauch pro Tag. Teilfüllungen zählen zur nächsten Vollbetankung, die erste Füllung ist nur der Startpunkt.",
      "calc.p2": "<b>Kosten:</b> Mit eingetragener Tankgröße wird verbraucht, was zuerst im Tank war – zu dem Preis, zu dem du es gekauft hast (wichtig, wenn du z.&nbsp;B. zwischen Diesel und Heizöl wechselst). Ohne Tankgröße zählt der Preis der Nachfüllung. Die Kosten reichen bis zur letzten Vollbetankung.",
      "calc.p3": "<b>Prognose:</b> Standard-Heizkurve nach Gradtagszahlen (viel im Winter, fast nichts im Sommer), hochgerechnet aus deinem Verbrauch. Ab dem zweiten Jahr ersetzen deine eigenen Monatswerte die Kurve.",

      "bk.title": "Datensicherung",
      "bk.intro": "Sichere deine Tankfüllungen oder übertrage sie auf ein anderes Gerät (z.&nbsp;B. von der Web-Version in die Android-App).",
      "bk.export": "Backup exportieren", "bk.csv": "CSV für Excel", "bk.import": "Backup importieren",
      "bk.paste": "Backup-Text hier einfügen…", "bk.doImport": "Importieren",
      "bk.importHint": "Vorhandene Einträge bleiben erhalten, doppelte werden übersprungen.",
      "bk.shareHint": "{title} – Text kopieren und z. B. in einer Notiz oder Mail speichern.",
      "bk.csvTitle": "Tankfüllungen {name} (CSV)", "bk.backupTitle": "Standheizung-Backup",
      "bk.invalid": "Ungültiges Backup", "bk.imported": "{n} importiert", "bk.nothing": "Nichts Neues zum Importieren",
      "csv.head": "Datum;Kraftstoff;Liter;Preis_EUR_l;Betrag_EUR;Voll;Tage_seit_Vollbetankung;Verbrauch_l_Tag;Kosten_EUR_Tag;Notiz",
      "csv.yes": "ja", "csv.no": "nein",

      "f.new": "Getankt", "f.edit": "Tankfüllung bearbeiten",
      "f.date": "Datum", "f.fuel": "Kraftstoff", "f.liters": "Menge (Liter)", "f.price": "Preis (€/l)", "f.total": "Gesamtbetrag (€)",
      "f.full": "Tank voll gemacht", "f.fullHint": "Nur dann lässt sich der Verbrauch exakt berechnen",
      "f.note": "Notiz", "f.note.ph": "optional, z. B. Tankstelle",

      "toast.copied": "In die Zwischenablage kopiert", "toast.saved": "Gespeichert", "toast.deleted": "Gelöscht",
      "toast.full": "Speicher voll – bitte alte Einträge löschen.", "toast.saveFail": "Speichern fehlgeschlagen",
      "toast.heaterSwitched": "Heizung gewechselt", "toast.newHeater": "Neue Heizung angelegt – gib ihr einen Namen",
      "toast.heaterDeleted": "Heizung gelöscht", "toast.notifyOn": "Erinnerung ist an 🔔",
      "toast.appOnly": "Nur in der Android-App", "toast.enterAmount": "Bitte Menge eingeben",
      "toast.lang": "Sprache: Deutsch",

      "upd.searching": "Suche nach Updates …", "upd.latestToast": "Du hast die neueste Version 👍",
      "upd.noConn": "Keine Verbindung zu GitHub", "upd.dlFail": "Download fehlgeschlagen – bitte später nochmal",
      "upd.version": "Version {v}", "upd.newAvail": "Neue Version {v} verfügbar",
      "upd.defaultNote": "Verbesserungen und Fehlerbehebungen",
      "upd.loading": "Wird geladen … {p} %", "upd.opening": "Installation wird geöffnet …",
      "upd.later": "Später", "upd.install": "Installieren", "upd.banner": "Update auf {v} verfügbar",
      "upd.laterToast": "Erinnere dich in den Einstellungen → App", "upd.isLatest": "Du hast die neueste Version",
      "upd.unavailable": "Update-Prüfung gerade nicht möglich",

      "u.l": "l", "u.lpd": "l/Tag", "u.lPerDay": "l / Tag", "u.eurl": "€/l",

      "fuel.Diesel": "Diesel", "fuel.Heizöl": "Heizöl", "fuel.HVO100": "HVO100",
      "fuel.Petroleum": "Petroleum", "fuel.Benzin": "Benzin", "fuel.Sonstiges": "Sonstiges",

      "months": "Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez",
      "monthsLong": "Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember",
    },

    en: {
      "app.defaultName": "Parking heater",
      "sub.default": "{fuel} consumption & cost",
      "hsw.aria": "Switch heater",
      "sync.loading": "Loading…",
      "sync.local": "This device only",
      "sync.cloudDown": "Cloud storage is unavailable right now – entries are saved in this browser for now.",
      "sync.ok": "Synced",
      "sync.err": "Sync error",
      "sync.interrupted": "Sync interrupted ({code}). Please reload the page later.",
      "err": "error",

      "tab.home": "Overview", "tab.list": "Fill-ups", "tab.stats": "Statistics", "tab.settings": "Settings",
      "fab": "Fill-up",

      "home.recent": "Recent fill-ups",
      "hero.welcome": "Welcome!",
      "hero.welcome1": "Next time you fill up, just enter the amount and price – ideally fill to full every time.",
      "hero.welcome2": "From the second full fill-up you'll see your consumption here.",
      "hero.start": "Starting point set",
      "hero.startText": "First fill-up saved on {date}. As soon as you fill up to full again, the app calculates your consumption.",
      "hero.current": "Current consumption · since {date}",
      "hero.perDay": "per day", "hero.perMonth": "per month", "hero.perHour": "per hour (avg)",
      "tank.est": "Tank (estimated)", "tank.soon": "refill soon!",
      "tank.of": "<b>approx. {left}</b> of {cap}",
      "tank.lasts": "lasts approx. <b>{days}</b>",
      "tank.emptyOn": "empty around {date}",
      "tank.unknown": "Tank level unknown – the last fill-up wasn't to full.",

      "days.one": "{n} day", "days.other": "{n} days",
      "fills.one": "{n} fill-up", "fills.other": "{n} fill-ups",
      "fillups.one": "{n} fill-up", "fillups.other": "{n} fill-ups",
      "entries.one": "{n} entry", "entries.other": "{n} entries",

      "fill.interval": "{days} · {rate}/day · {cost}/day",
      "fill.partial": "Partial fill – counts towards the next full fill-up",
      "badge.partial": "partial",
      "empty.recent": "No fill-ups yet.<br>Tap <b>+ Fill-up</b>.",
      "empty.list": "No fill-ups yet.",

      "kpi.used": "Used", "kpi.cost": "Cost", "kpi.bought": "Filled", "kpi.avgPrice": "Avg price",
      "kpi.perDayAvg": "avg {v} per day", "kpi.noData": "no data yet",
      "kpi.costUntil": "until {date} · avg {v}/day", "kpi.allFills": "across all fill-ups",
      "kpi.overDays": "over {days}", "kpi.burnedUntil": "used up to {date}", "kpi.prorata": "pro rata by consumption",
      "kpi.avgDay": "Avg per day", "kpi.avgMonth": "Avg per month", "kpi.perDay": "{v} per day", "kpi.perMonth": "{v} per month",

      "per.season": "Heating year", "per.year": "Calendar year", "per.12m": "12 months", "per.all": "All",
      "per.yearN": "Year {y}", "per.last12": "Last 12 months", "per.hj": "Heating year {y}", "per.allTime": "All time",
      "season.aria": "Choose heating year", "season.current": " · current", "home.season": "This heating year",

      "stats.period": "Period", "stats.rate": "Consumption per day", "stats.cost": "Cost per month",
      "stats.price": "Fuel price", "stats.byFuel": "By fuel", "stats.years": "Heating years compared",
      "chart.noData": "no data",
      "chart.priceEmpty": "With two fill-ups in this period you'll see the price trend here.",
      "chart.rateT": "Avg litres per day, by month · {p}",
      "chart.onlyDays": "only {n} days recorded",
      "chart.costT": "{p}: {v} · pro rata by consumption",
      "chart.partialMonth": "month only partly recorded",
      "chart.lastPrice": "Last {v} ({fuel}) · {p}",
      "th.fuel": "Fuel", "th.litres": "Litres", "th.amount": "Amount", "th.share": "Share", "th.hj": "Heating year", "th.cost": "Cost",
      "fuel.hint": "Amounts filled in period · {p}",

      "fc.title": "Forecast heating year {name}", "fc.approx": "approx. {v}", "fc.range": "Range {a} – {b}",
      "fc.sofar": "so far ~{v}", "fc.rest": "~{v} more until {date}",
      "fc.own": "Curve from your own monthly data of previous years, filled in with the standard heating curve.",
      "fc.adapted": "Standard heating curve (heating degree days), adjusted to your consumption.",
      "fc.firstYear": "First year: standard heating curve (heating degree days), projected from your data so far. Gets more accurate every month.",
      "fc.pre": " Months before your first entry are included as estimates.",
      "fc.restPrice": " Remaining amount priced at {p} (last paid).",
      "fc.used": "used", "fc.forecast": "Forecast", "fc.perMonthL": "Litres per month", "fc.ownVals": " (own data)",

      "set.heater": "Heater", "set.heaterMulti": "Heater: {name}", "noName": "unnamed",
      "set.name": "Name", "set.name.ph": "e.g. camper van, workshop, cabin",
      "set.model": "Heater model", "set.model.ph": "e.g. Webasto Air Top 2000",
      "set.fuel": "Default fuel", "set.tank": "Tank size (litres)", "optional": "optional",
      "set.tankHint": "With a tank size the app estimates how full the tank is and how long it will last.",
      "set.addMore": "Another heater (e.g. workshop, second vehicle)?",
      "heater.add": "+ Add heater", "heaters.title": "Heaters", "heater.newName": "Heater {n}",
      "heater.delConfirm": "Delete with {n}?",
      "btn.delete": "Delete", "btn.save": "Save", "btn.cancel": "Cancel", "btn.done": "Done", "btn.sure": "Sure?",

      "lang.title": "Language", "lang.auto": "Automatic",

      "n.title": "Low tank reminder",
      "n.subOff": "Get notified before the tank runs dry.",
      "n.subOn": "On · {days} ahead at {h}:00",
      "n.daysLabel": "Remind me when the tank only lasts",
      "n.week": "1 week", "n.time": "Time", "n.heaters": "For these heaters",
      "n.test": "Send test notification",
      "n.perm": "Notifications for this app are turned off in Android.",
      "n.openSys": "Open Android settings",
      "n.web": "📱 Reminders are available in the Android app. They can't be received here in the browser.",
      "n.noTank": "no tank size",
      "n.soonNow": "soon (threshold already reached)",
      "n.next": "Next reminder · {when}",
      "n.msgTitle": "{name}: tank running low",
      "n.msgBody": "Estimated range: about {days} left. Time to refill!",
      "n.none": "No reminder scheduled yet",
      "n.whyTank": "Enter the tank size for the heater above – then the app can estimate the tank level.",
      "n.whyData": "Once two full fill-ups are recorded, the app knows your consumption.",
      "n.whyFull": "The last fill-up wasn't to full – reminders resume after the next full fill-up.",
      "n.whyOff": "Reminders are switched off for this heater.",
      "n.whyNone": "No reminder is scheduled right now.",
      "n.testBody": "This is what your reminder looks like. Time to refill! ⛽",
      "when.at": "{day} at {h}:00",

      "hj.title": "Heating year", "hj.starts": "Heating year starts in",
      "hj.calHint": "The heating year matches the calendar year (Jan – Dec).",
      "hj.hint": "A heating year runs {span}, e.g. “Heating year {name}”. Ideally the switch falls in months when you hardly heat. Your entries stay unchanged when you change this.",
      "hj.recommended": " (recommended)", "hj.calendar": " (= calendar year)", "hj.toast": "Heating year: {span}",

      "app.title": "App", "ver.check": "Check for updates",
      "widget.title": "Widget",
      "widget.howto": "Tank level and range right on your home screen: long-press an empty spot on the home screen → <b>Widgets</b> → <b>Parking Heater</b>.",
      "widget.shows": "Widget shows", "widget.current": "The currently selected heater",

      "calc.title": "How it's calculated",
      "calc.p1": "<b>Consumption:</b> What you top up when filling to full was used since the last full fill-up – divided by the days in between, that gives consumption per day. Partial fills count towards the next full fill-up; the very first fill-up is only the starting point.",
      "calc.p2": "<b>Cost:</b> With a tank size entered, the fuel that went into the tank first is used first – at the price you paid for it (useful if you switch e.g. between diesel and heating oil). Without a tank size, the price of the top-up counts. Costs run up to the last full fill-up.",
      "calc.p3": "<b>Forecast:</b> Standard heating curve based on heating degree days (a lot in winter, almost nothing in summer), projected from your consumption. From the second year on, your own monthly figures replace the curve.",

      "bk.title": "Backup",
      "bk.intro": "Back up your fill-ups or move them to another device (e.g. from the web version to the Android app).",
      "bk.export": "Export backup", "bk.csv": "CSV for Excel", "bk.import": "Import backup",
      "bk.paste": "Paste backup text here…", "bk.doImport": "Import",
      "bk.importHint": "Existing entries are kept, duplicates are skipped.",
      "bk.shareHint": "{title} – copy the text and save it e.g. in a note or email.",
      "bk.csvTitle": "Fill-ups {name} (CSV)", "bk.backupTitle": "Parking heater backup",
      "bk.invalid": "Invalid backup", "bk.imported": "{n} imported", "bk.nothing": "Nothing new to import",
      "csv.head": "Date;Fuel;Litres;Price_EUR_L;Amount_EUR;Full;Days_since_full;Consumption_L_day;Cost_EUR_day;Note",
      "csv.yes": "yes", "csv.no": "no",

      "f.new": "New fill-up", "f.edit": "Edit fill-up",
      "f.date": "Date", "f.fuel": "Fuel", "f.liters": "Amount (litres)", "f.price": "Price (€/L)", "f.total": "Total (€)",
      "f.full": "Filled to full", "f.fullHint": "Only then can consumption be calculated exactly",
      "f.note": "Note", "f.note.ph": "optional, e.g. fuel station",

      "toast.copied": "Copied to clipboard", "toast.saved": "Saved", "toast.deleted": "Deleted",
      "toast.full": "Storage full – please delete old entries.", "toast.saveFail": "Saving failed",
      "toast.heaterSwitched": "Heater switched", "toast.newHeater": "New heater added – give it a name",
      "toast.heaterDeleted": "Heater deleted", "toast.notifyOn": "Reminder is on 🔔",
      "toast.appOnly": "Only in the Android app", "toast.enterAmount": "Please enter an amount",
      "toast.lang": "Language: English",

      "upd.searching": "Checking for updates …", "upd.latestToast": "You're on the latest version 👍",
      "upd.noConn": "Can't reach GitHub", "upd.dlFail": "Download failed – please try again later",
      "upd.version": "Version {v}", "upd.newAvail": "New version {v} available",
      "upd.defaultNote": "Improvements and bug fixes",
      "upd.loading": "Downloading … {p} %", "upd.opening": "Opening installer …",
      "upd.later": "Later", "upd.install": "Install", "upd.banner": "Update to {v} available",
      "upd.laterToast": "You'll find it in Settings → App", "upd.isLatest": "You're on the latest version",
      "upd.unavailable": "Update check not possible right now",

      "u.l": "L", "u.lpd": "L/day", "u.lPerDay": "L / day", "u.eurl": "€/L",

      "fuel.Diesel": "Diesel", "fuel.Heizöl": "Heating oil", "fuel.HVO100": "HVO100",
      "fuel.Petroleum": "Kerosene", "fuel.Benzin": "Petrol", "fuel.Sonstiges": "Other",

      "months": "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",
      "monthsLong": "January|February|March|April|May|June|July|August|September|October|November|December",
    },
  };

  const LOCALES = { de: "de-DE", en: "en-GB" };
  let lang = "de";

  function detect(pref, navLang) {
    if (pref === "de" || pref === "en") return pref;
    return String(navLang || "").toLowerCase().startsWith("de") ? "de" : "en";
  }
  function setLang(l) { lang = DICT[l] ? l : "de"; return lang; }
  function getLang() { return lang; }
  function locale() { return LOCALES[lang]; }

  function fill(s, vars) {
    return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
  }
  /** Text holen; fehlt er in der Sprache, Deutsch, sonst der Schlüssel selbst. */
  function t(key, vars) {
    const s = DICT[lang][key] ?? DICT.de[key] ?? key;
    return fill(s, vars);
  }
  /** Mehrzahl: tn("days", 3) → "3 Tage" / "3 days". {n} wird bereits formatiert übergeben (nStr). */
  function tn(key, n, nStr, vars) {
    return t(`${key}.${n === 1 ? "one" : "other"}`, { n: nStr ?? n, ...vars });
  }
  const months = () => t("months").split("|");
  const monthsLong = () => t("monthsLong").split("|");

  const I18N = { DICT, LOCALES, detect, setLang, getLang, locale, t, tn, months, monthsLong };
  if (typeof module !== "undefined" && module.exports) module.exports = I18N;
  else root.I18N = I18N;
})(typeof self !== "undefined" ? self : this);
