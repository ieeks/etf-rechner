import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Birchline palette
const CLAY = "#D97757";
const CLAY_SOFT = "#E9A488";
const SLATE = "#141413";
const IVORY = "#FAF9F5";
const OAT = "#E3DACC";
const OAT_DEEP = "#CFC2AC";
const MUTED = "#6B6458";
const AMBER = "#B0701A";

const KEST = 0.275; // Österreich: Kapitalertragsteuer

const eur0 = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eur2 = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const CORE_ETFS = [
  {
    name: "Vanguard FTSE All-World",
    suffix: "UCITS ETF (Acc)",
    isin: "IE00BK5BQT80",
    ter: "0,22 %",
    index: "FTSE All-World",
    holdings: "~3.700 Firmen · Industrie- + Schwellenländer",
    flatex: "sparplanfähig · Gratis-Flag prüfen",
    badge: "Favorit",
    free: false,
  },
  {
    name: "SPDR MSCI ACWI IMI",
    suffix: "UCITS ETF (Acc)",
    isin: "IE00B3YLTY66",
    ter: "0,17 %",
    index: "MSCI ACWI IMI",
    holdings: "~99 % Weltmarkt · inkl. Small Caps + EM",
    flatex: "sparplanfähig · Gratis-Flag prüfen",
    free: false,
  },
  {
    name: "iShares Core MSCI World",
    suffix: "UCITS ETF (Acc)",
    isin: "IE00B4L5Y983",
    ter: "0,20 %",
    index: "MSCI World",
    holdings: "~1.400 Firmen · nur Industrieländer",
    flatex: "gratis besparbar ✓",
    badge: "Gratis-Tipp",
    free: true,
  },
  {
    name: "Xtrackers MSCI World 1C",
    suffix: "UCITS ETF (Acc)",
    isin: "IE00BJ0KDQ92",
    ter: "0,19 %",
    index: "MSCI World",
    holdings: "~1.400 Firmen · nur Industrieländer",
    flatex: "sparplanfähig",
    free: false,
  },
];

const SATELLITE_ETFS = [
  {
    name: "iShares NASDAQ 100",
    suffix: "UCITS ETF (Acc)",
    isin: "IE00B53SZB19",
    ter: "0,30 %",
    index: "NASDAQ 100",
    holdings: "~100 US-Aktien · Tech-Schwerpunkt",
    flatex: "sparplanfähig",
    badge: "Tech-Tilt",
    free: false,
    warn: "Konzentrierte US-Tech-Wette — nur als kleine Beimischung (z. B. 10–20 %), nicht als Kern.",
  },
];

function simulate({ rate, years, annualReturn, feePerExec, plans, lump = 0 }) {
  const months = years * 12;
  const i = annualReturn / 100 / 12;
  const monthlyFee = feePerExec * plans;
  const invested = Math.max(0, rate - monthlyFee); // was tatsächlich in den ETF fließt

  let value = lump;
  const series = [{ year: 0, eingezahlt: Math.round(lump), wert: Math.round(lump) }];
  for (let m = 1; m <= months; m++) {
    value = value * (1 + i) + invested;
    if (m % 12 === 0) {
      const paidSoFar = lump + rate * m;
      series.push({
        year: m / 12,
        eingezahlt: Math.round(paidSoFar),
        wert: Math.round(value),
      });
    }
  }

  const totalPaid = lump + rate * months;
  const totalInvested = lump + invested * months;
  const totalFees = monthlyFee * months;
  const endValue = value;
  const gain = Math.max(0, endValue - totalInvested);
  const kest = gain * KEST;
  const netEnd = endValue - kest;

  return { series, totalPaid, totalInvested, totalFees, endValue, gain, kest, netEnd, months };
}

function Stat({ label, value, accent, big }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, letterSpacing: 0.3, color: MUTED, textTransform: "uppercase" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: big ? 34 : 19,
          fontWeight: big ? 800 : 700,
          color: accent || SLATE,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Field({ label, hint, children, value }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: SLATE }}>{label}</label>
        <span style={{ fontSize: 15, fontWeight: 800, color: CLAY, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const sliderStyle = {
  width: "100%",
  accentColor: CLAY,
  height: 26,
  cursor: "pointer",
};

export default function SparplanRechner() {
  const [rate, setRate] = useState(150);
  const [lump, setLump] = useState(0);
  const [years, setYears] = useState(17);
  const [annualReturn, setAnnualReturn] = useState(6);
  const [freeEtf, setFreeEtf] = useState(true);
  const [split, setSplit] = useState(true);
  const [afterTax, setAfterTax] = useState(true);
  const [copied, setCopied] = useState(null);

  async function copyIsin(isin) {
    const fallback = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = isin;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch (_) {
        return false;
      }
    };
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(isin);
        ok = true;
      } else {
        ok = fallback();
      }
    } catch (_) {
      ok = fallback();
    }
    if (ok) {
      setCopied(isin);
      setTimeout(() => setCopied((c) => (c === isin ? null : c)), 1300);
    }
  }

  const plans = split ? 2 : 1;
  const feePerExec = freeEtf ? 0 : 1.5;

  const r = useMemo(
    () => simulate({ rate, years, annualReturn, feePerExec, plans, lump }),
    [rate, years, annualReturn, feePerExec, plans, lump]
  );

  const scenarios = useMemo(
    () =>
      [4, 6, 8].map((pct) => {
        const s = simulate({ rate, years, annualReturn: pct, feePerExec, plans, lump });
        return { pct, net: s.netEnd, gross: s.endValue };
      }),
    [rate, years, feePerExec, plans, lump]
  );

  const shownEnd = afterTax ? r.netEnd : r.endValue;
  const perChild = shownEnd / plans;

  const corner = (pos) => {
    const base = { position: "absolute", width: 9, height: 9, borderColor: CLAY };
    const map = {
      tl: { top: 8, left: 8, borderTop: "2px solid", borderLeft: "2px solid" },
      tr: { top: 8, right: 8, borderTop: "2px solid", borderRight: "2px solid" },
      bl: { bottom: 8, left: 8, borderBottom: "2px solid", borderLeft: "2px solid" },
      br: { bottom: 8, right: 8, borderBottom: "2px solid", borderRight: "2px solid" },
    };
    return <span style={{ ...base, ...map[pos] }} />;
  };

  return (
    <div
      style={{
        background: IVORY,
        minHeight: "100vh",
        padding: "22px 16px 40px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: SLATE,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: CLAY, fontWeight: 700, textTransform: "uppercase" }}>
            flatex · Österreich · ETF-Sparplan
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 800, margin: "4px 0 0", letterSpacing: -0.5 }}>
            Sparplan-Rechner
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: "6px 0 0" }}>
            Für 2 Kinder · Rendite und Sparrate frei durchspielen.
          </p>
        </div>

        {/* Inputs */}
        <div
          style={{
            background: "#fff",
            border: `2px solid ${SLATE}`,
            borderRadius: 14,
            padding: "20px 18px 8px",
            boxShadow: `3px 3px 0 ${OAT_DEEP}`,
            marginBottom: 20,
          }}
        >
          <Field
            label="Sparrate gesamt"
            value={`${eur0.format(rate)} / Monat`}
            hint={split ? `${eur0.format(rate / 2)} pro Kind · 2 Sparpläne` : "1 Sparplan"}
          >
            <input type="range" min={25} max={2000} step={25} value={rate} onChange={(e) => setRate(+e.target.value)} style={sliderStyle} />
          </Field>

          <Field
            label="Einmalige Startanlage"
            value={eur0.format(lump)}
            hint={
              lump === 0
                ? "Optional: einmaliges Startkapital zu Beginn"
                : split
                ? `${eur0.format(lump / 2)} pro Kind · einmalig zu Beginn`
                : "einmalig zu Beginn investiert"
            }
          >
            <input type="range" min={0} max={500000} step={5000} value={lump} onChange={(e) => setLump(+e.target.value)} style={sliderStyle} />
          </Field>

          <Field label="Laufzeit" value={`${years} Jahre`} hint="Zeithorizont bis zur Auszahlung / Schenkung">
            <input type="range" min={5} max={30} step={1} value={years} onChange={(e) => setYears(+e.target.value)} style={sliderStyle} />
          </Field>

          <Field
            label="Erwartete Rendite p. a."
            value={`${annualReturn.toLocaleString("de-AT", { minimumFractionDigits: 1 })} %`}
            hint="Breiter Aktien-ETF historisch ~7–9 %. Konservativ planen: 4–6 %. Keine Garantie."
          >
            <input type="range" min={0} max={10} step={0.5} value={annualReturn} onChange={(e) => setAnnualReturn(+e.target.value)} style={sliderStyle} />
          </Field>

          {/* Toggles */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "4px 0 14px" }}>
            <Toggle on={freeEtf} onClick={() => setFreeEtf((v) => !v)} label={freeEtf ? "Gratis-ETF (0 €)" : "1,50 € / Ausführung"} />
            <Toggle on={split} onClick={() => setSplit((v) => !v)} label={split ? "auf 2 Kinder" : "1 Depot"} />
            <Toggle on={afterTax} onClick={() => setAfterTax((v) => !v)} label={afterTax ? "nach KESt" : "vor Steuer"} />
          </div>
        </div>

        {/* Result */}
        <div
          style={{
            position: "relative",
            background: SLATE,
            color: IVORY,
            borderRadius: 14,
            padding: "26px 24px",
            boxShadow: `3px 3px 0 ${CLAY}`,
            marginBottom: 20,
          }}
        >
          {corner("tl")}{corner("tr")}{corner("bl")}{corner("br")}
          <div style={{ fontSize: 12, letterSpacing: 0.4, color: CLAY_SOFT, textTransform: "uppercase", fontWeight: 700 }}>
            Endkapital {afterTax ? "netto (nach KESt)" : "brutto"} nach {years} Jahren
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1.05, margin: "6px 0 2px" }}>
            {eur0.format(shownEnd)}
          </div>
          {split && (
            <div style={{ fontSize: 14, color: OAT }}>
              ≈ {eur0.format(perChild)} pro Kind
            </div>
          )}

          <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "18px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <MiniStat label="Eingezahlt" value={eur0.format(r.totalPaid)} color={OAT} />
            <MiniStat label="Gewinn (brutto)" value={eur0.format(r.gain)} color={CLAY_SOFT} />
            <MiniStat label="KESt 27,5 %" value={"– " + eur0.format(r.kest)} color={OAT} />
            {feePerExec > 0 && <MiniStat label="Gebühren gesamt" value={"– " + eur0.format(r.totalFees)} color={OAT} />}
          </div>
        </div>

        {/* Chart */}
        <div
          style={{
            background: "#fff",
            border: `2px solid ${SLATE}`,
            borderRadius: 14,
            padding: "18px 12px 12px",
            boxShadow: `3px 3px 0 ${OAT_DEEP}`,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, padding: "0 6px 10px" }}>
            Einzahlungen vs. Depotwert (brutto)
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={r.series} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gWert" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CLAY} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={CLAY} stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="gEin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={OAT_DEEP} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={OAT_DEEP} stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={OAT} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: OAT_DEEP }} unit="J" />
                <YAxis
                  tick={{ fontSize: 11, fill: MUTED }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) =>
                    v >= 1e6
                      ? `${(v / 1e6).toLocaleString("de-AT", { maximumFractionDigits: 1 })}M`
                      : v >= 1000
                      ? `${Math.round(v / 1000)}k`
                      : v
                  }
                />
                <Tooltip
                  formatter={(v, n) => [eur0.format(v), n === "wert" ? "Depotwert" : "Eingezahlt"]}
                  labelFormatter={(l) => `Jahr ${l}`}
                  contentStyle={{ borderRadius: 10, border: `2px solid ${SLATE}`, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="eingezahlt" stroke={OAT_DEEP} strokeWidth={2} fill="url(#gEin)" />
                <Area type="monotone" dataKey="wert" stroke={CLAY} strokeWidth={2.5} fill="url(#gWert)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scenarios */}
        <div
          style={{
            background: OAT,
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, marginBottom: 12 }}>
            Szenarien bei {eur0.format(rate)} / Monat{lump > 0 ? ` + ${eur0.format(lump)} Start` : ""} über {years} Jahre ({afterTax ? "netto" : "brutto"})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {scenarios.map((s) => (
              <div
                key={s.pct}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "12px 10px",
                  border: s.pct === Math.round(annualReturn) ? `2px solid ${CLAY}` : `2px solid transparent`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{s.pct} % p. a.</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: SLATE, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                  {eur0.format(afterTax ? s.net : s.gross)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ETF-Auswahl */}
        <div
          style={{
            background: "#fff",
            border: `2px solid ${SLATE}`,
            borderRadius: 14,
            padding: "18px 16px 8px",
            boxShadow: `3px 3px 0 ${OAT_DEEP}`,
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, marginBottom: 3 }}>
            ETF-Auswahl — breit & thesaurierend (Acc)
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 14 }}>
            ISIN antippen zum Kopieren · vor dem Anlegen Gratis-Flag im flatex Sparplan-Finder prüfen
          </div>
          <SubHead>Kern — breit gestreut (einen wählen)</SubHead>
          {CORE_ETFS.map((e) => (
            <EtfCard key={e.isin} e={e} copied={copied === e.isin} onCopy={() => copyIsin(e.isin)} />
          ))}
          <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, margin: "2px 2px 16px" }}>
            FTSE All-World / ACWI IMI = ganze Welt inkl. Schwellenländer. MSCI World = nur Industrieländer,
            dafür sicher gratis besparbar. Einen wählen reicht — nicht kombinieren, sie überschneiden sich.
          </p>
          <SubHead>Optional — Beimischung (konzentriert)</SubHead>
          {SATELLITE_ETFS.map((e) => (
            <EtfCard key={e.isin} e={e} copied={copied === e.isin} onCopy={() => copyIsin(e.isin)} />
          ))}
        </div>

        <p style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.55, margin: 0 }}>
          Vereinfachte Modellrechnung, keine Anlageberatung. KESt wird hier vereinfacht mit 27,5 % auf den
          Gesamtgewinn bei Auszahlung gerechnet — bei thesaurierenden ETFs fällt ein Teil schon laufend an
          (ausschüttungsgleiche Erträge), das übernimmt flatex als steuereinfacher Broker automatisch. Renditen
          schwanken stark und können negativ sein; vergangene Wertentwicklung ist keine Garantie. Inflation ist
          nicht berücksichtigt.
        </p>
      </div>
    </div>
  );
}

function EtfCard({ e, copied, onCopy }) {
  const isFav = e.badge === "Favorit";
  const warn = !!e.warn;
  return (
    <div
      style={{
        border: `1.5px solid ${isFav ? CLAY : warn ? AMBER : OAT}`,
        borderRadius: 12,
        padding: "13px 13px 12px",
        marginBottom: 10,
        background: IVORY,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: SLATE, lineHeight: 1.15 }}>{e.name}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{e.suffix}</div>
        </div>
        {e.badge && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 999,
              color: isFav ? "#fff" : warn ? AMBER : SLATE,
              background: isFav ? CLAY : "transparent",
              border: isFav ? "none" : `1.5px solid ${warn ? AMBER : SLATE}`,
            }}
          >
            {e.badge}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "11px 0 9px" }}>
        <button
          onClick={onCopy}
          title="ISIN kopieren"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 13,
            fontWeight: 700,
            color: SLATE,
            background: "#fff",
            border: `1.5px solid ${copied ? CLAY : OAT_DEEP}`,
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
            transition: "border-color .12s",
          }}
        >
          {e.isin}
          <span style={{ fontSize: 11, fontWeight: 700, color: copied ? CLAY : MUTED }}>
            {copied ? "kopiert ✓" : "kopieren"}
          </span>
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: CLAY, marginLeft: "auto" }}>TER {e.ter}</span>
      </div>

      <div style={{ fontSize: 12.5, color: SLATE }}>
        <span style={{ color: MUTED }}>Index:</span> {e.index}
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{e.holdings}</div>
      <div
        style={{
          fontSize: 11.5,
          color: e.free ? "#3a7d44" : MUTED,
          marginTop: 6,
          fontWeight: e.free ? 700 : 500,
        }}
      >
        flatex: {e.flatex}
      </div>
      {warn && (
        <div
          style={{
            fontSize: 11.5,
            color: AMBER,
            fontWeight: 600,
            lineHeight: 1.45,
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px dashed ${OAT_DEEP}`,
          }}
        >
          ⚠ {e.warn}
        </div>
      )}
    </div>
  );
}

function SubHead({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: MUTED,
        margin: "4px 2px 10px",
      }}
    >
      {children}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function Toggle({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `2px solid ${on ? CLAY : OAT_DEEP}`,
        background: on ? CLAY : "#fff",
        color: on ? "#fff" : MUTED,
        borderRadius: 999,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .12s",
      }}
    >
      {label}
    </button>
  );
}
