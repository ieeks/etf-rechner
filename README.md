# ETF-Rechner — Ansparen & Entnehmen

Interaktiver ETF-Rechner für Österreich mit zwei umschaltbaren Modi: **Ansparen** (Vermögen aufbauen) und **Entnehmen** (vom Depot leben). Optimiert für flatex-Anleger.

**Live:** https://ieeks.github.io/etf-rechner/

---

## Features

### Ansparen (Sparplan-Rechner)
- **Sparrate & Einmalanlage** — frei einstellbar per Slider
- **Rendite-Szenarien** — Vergleich bei 4 %, 6 % und 8 % p.a.
- **KESt-Berechnung** — 27,5 % Kapitalertragsteuer (Österreich) ein-/ausblendbar
- **2-Kinder-Modus** — Aufteilung auf zwei Depots mit Anzeige pro Kind
- **Gebührenrechnung** — Gratis-ETF (0 €) vs. 1,50 € pro Ausführung
- **Flächendiagramm** — Einzahlungen vs. Depotwert über die Zeit (recharts)
- **ETF-Empfehlungen** — kuratierte Liste mit ISIN-Kopieren per Klick

### Entnehmen (Entnahmeplan-Rechner)
- **Zwei Modi** — **Kapitalerhalt** (nur den realen Ertrag entnehmen, Substanz bleibt erhalten) und **Kapitalverzehr** (Depot planmäßig über X Jahre aufbrauchen)
- **Inflationsbereinigt** — alle Auszahlungen in heutiger Kaufkraft; die nominale Rate steigt Monat für Monat mit der Inflation
- **KESt auf den Ertragsanteil** — grobe 27,5-%-Schätzung auf den Ertragsanteil der Entnahmen, keine belastbare Nettoauszahlung
- **Depotverlauf** — nominal vs. real im Flächendiagramm
- **Rendite-Szenarien** — mögliche Monatsentnahme bei 4 %, 6 % und 8 % p.a.

## ETF-Auswahl

### Kern (einen wählen)
| ETF | ISIN | TER | Index |
|-----|------|-----|-------|
| Vanguard FTSE All-World (Acc) | IE00BK5BQT80 | 0,22 % | FTSE All-World |
| SPDR MSCI ACWI IMI (Acc) | IE00B3YLTY66 | 0,17 % | MSCI ACWI IMI |
| iShares Core MSCI World (Acc) | IE00B4L5Y983 | 0,20 % | MSCI World |
| Xtrackers MSCI World 1C (Acc) | IE00BJ0KDQ92 | 0,19 % | MSCI World |

### Beimischung (optional)
| ETF | ISIN | TER | Hinweis |
|-----|------|-----|---------|
| iShares NASDAQ 100 (Acc) | IE00B53SZB19 | 0,30 % | Max. 10–20 % als Beimischung |

## Tech Stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [recharts](https://recharts.org/) für das Flächendiagramm
- Kein CSS-Framework — reines Inline-Styling (Birchline-Palette)
- Deploy via GitHub Actions → GitHub Pages

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Build für Production:

```bash
npm run build
npm run preview
```

## Deploy

Bei jedem Push auf `main` baut GitHub Actions die App und deployt sie automatisch auf GitHub Pages (Branch `gh-pages`).

---

> **Hinweis:** Vereinfachte Modellrechnung, keine Anlageberatung. Renditen können negativ sein; vergangene Wertentwicklung ist keine Garantie. Der Sparplan-Rechner berücksichtigt keine Inflation; der Entnahmeplan-Rechner rechnet inflationsbereinigt in heutiger Kaufkraft.
>
> **Rechenmodell:** Die eingegebene Rendite ist in beiden Rechnern die *effektive* Jahresrendite; daraus wird der effektive Monatszins gebildet. Die Sparrate wird jeweils am Monatsende eingezahlt, eine Startanlage zu Beginn.
>
> **Steuern:** Die KESt-Angaben sind grobe Schätzungen, keine belastbare Nettoauszahlung. Im Sparplan wird vereinfacht einmalig auf den Gesamtgewinn bei Auszahlung gerechnet; im Entnahmeplan fehlt der steuerliche Einstandswert des vorhandenen Depots, und laufende Fondssteuern (ausschüttungsgleiche Erträge) werden nicht simuliert. Standardmäßig zeigen beide Rechner deshalb den Bruttowert.
