# ETF-Sparplan-Rechner

Interaktiver Sparplan-Rechner für ETF-Investments via flatex Österreich — optimiert für Eltern, die Vermögen für Kinder aufbauen.

**Live:** https://ieeks.github.io/etf-rechner/

---

## Features

- **Sparrate & Einmalanlage** — frei einstellbar per Slider
- **Rendite-Szenarien** — Vergleich bei 4 %, 6 % und 8 % p.a.
- **KESt-Berechnung** — 27,5 % Kapitalertragsteuer (Österreich) ein-/ausblendbar
- **2-Kinder-Modus** — Aufteilung auf zwei Depots mit Anzeige pro Kind
- **Gebührenrechnung** — Gratis-ETF (0 €) vs. 1,50 € pro Ausführung
- **Flächendiagramm** — Einzahlungen vs. Depotwert über die Zeit (recharts)
- **ETF-Empfehlungen** — kuratierte Liste mit ISIN-Kopieren per Klick

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

> **Hinweis:** Vereinfachte Modellrechnung, keine Anlageberatung. Renditen können negativ sein; vergangene Wertentwicklung ist keine Garantie. Inflation ist nicht berücksichtigt.
