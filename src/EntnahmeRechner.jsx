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
import {
  CLAY,
  CLAY_SOFT,
  SLATE,
  IVORY,
  OAT,
  OAT_DEEP,
  MUTED,
  AMBER,
  KEST,
  eur0,
  monthlyRate,
  sliderStyle,
  Field,
  Toggle,
  MiniStat,
  Corners,
} from "./shared.jsx";

/**
 * Entnahmeplan-Simulation, gerechnet in heutiger Kaufkraft (real).
 *
 * mode "erhalt"  — Kapitalerhalt: es wird nur der reale Ertrag entnommen,
 *                  das Vermögen bleibt real konstant (derstandard-Ansatz).
 * mode "verzehr" — Kapitalverzehr: das Depot wird über `years` planmäßig
 *                  auf 0 heruntergefahren, höhere Rate.
 *
 * `years` ist bei "verzehr" die Entnahmedauer, bei "erhalt" der Anzeigezeitraum.
 * Die reale Entnahme ist konstant (gleiche Kaufkraft); die nominale Auszahlung
 * steigt jährlich mit der Inflation.
 */
function simulateEntnahme({ startCapital, annualReturn, inflation, mode, years }) {
  const months = years * 12;
  const iNom = monthlyRate(annualReturn);
  // realer Monatszins: Rendite abzüglich Inflation
  const iReal = (1 + monthlyRate(annualReturn)) / (1 + monthlyRate(inflation)) - 1;

  // reale Monatsentnahme (heutige Kaufkraft)
  let monthlyReal;
  let sustainable = true;
  // "gleichstand" = Rendite entspricht der Inflation (kein realer Ertrag, aber
  // auch kein realer Substanzverlust); "unterdeckung" = Rendite < Inflation.
  let shortfall = null;
  if (mode === "erhalt") {
    // nur den realen Ertrag entnehmen → reales Kapital bleibt konstant
    monthlyReal = startCapital * iReal;
    if (iReal <= 1e-12) {
      monthlyReal = 0;
      sustainable = false; // kein realer Ertrag → keine reale Entnahme möglich
      shortfall = iReal < -1e-12 ? "unterdeckung" : "gleichstand";
    }
  } else {
    // Annuität in realen Größen: Depot über `months` auf 0 verzehren
    monthlyReal =
      Math.abs(iReal) < 1e-9
        ? startCapital / months
        : (startCapital * iReal) / (1 - Math.pow(1 + iReal, -months));
  }

  // Nominalen Depotverlauf simulieren (für Chart & Restwert)
  const infMonthly = monthlyRate(inflation);
  let capNom = startCapital;
  let totalWithdrawnNom = 0;
  const series = [{ year: 0, wert: Math.round(startCapital), real: Math.round(startCapital) }];
  for (let m = 1; m <= months; m++) {
    const grown = capNom * (1 + iNom);
    const withdrawalNom = Math.min(monthlyReal * Math.pow(1 + infMonthly, m), Math.max(0, grown));
    capNom = grown - withdrawalNom;
    if (capNom < 0) capNom = 0;
    totalWithdrawnNom += withdrawalNom; // was tatsächlich ausgezahlt wurde
    if (m % 12 === 0) {
      const realFactor = Math.pow(1 + infMonthly, m);
      series.push({
        year: m / 12,
        wert: Math.round(capNom),
        real: Math.round(capNom / realFactor),
      });
    }
  }

  const endNom = capNom;
  const endReal = endNom / Math.pow(1 + infMonthly, months);

  // KESt — bewusst nur eine grobe Schätzung, keine belastbare Nettoauszahlung:
  // Kapitalerhalt: Substanz bleibt erhalten → Auszahlungen gelten (näherungsweise)
  // als reiner Ertrag → voller KESt-Satz. Kapitalverzehr: der über die gesamte
  // Laufzeit ermittelte Gewinnanteil wird pauschal auf jede Monatsentnahme gelegt.
  //
  // Bekannte Grenzen: der steuerliche Einstandswert des vorhandenen Depots ist
  // nicht bekannt (bereits aufgelaufene Gewinne im Startkapital bleiben deshalb
  // unberücksichtigt) und die laufende Fondsbesteuerung wird nicht simuliert.
  let gainShare;
  if (mode === "erhalt") {
    gainShare = 1;
  } else {
    gainShare = totalWithdrawnNom > 0 ? Math.max(0, (totalWithdrawnNom - startCapital) / totalWithdrawnNom) : 0;
  }
  const netFactor = 1 - KEST * gainShare;

  return {
    monthlyReal,
    monthlyRealNet: monthlyReal * netFactor,
    gainShare,
    endReal,
    endNom,
    totalWithdrawnNom,
    sustainable,
    shortfall,
    series,
    months,
  };
}

/**
 * Eingabestate des Entnahmeplan-Rechners. Wird in App gehalten, damit die
 * Eingaben einen Tabwechsel überleben.
 */
export function useEntnahmeState() {
  const [startCapital, setStartCapital] = useState(300000);
  const [annualReturn, setAnnualReturn] = useState(6);
  const [inflation, setInflation] = useState(2);
  const [years, setYears] = useState(25);
  const [mode, setMode] = useState("erhalt"); // "erhalt" | "verzehr"
  const [afterTax, setAfterTax] = useState(false);
  return {
    startCapital, setStartCapital,
    annualReturn, setAnnualReturn,
    inflation, setInflation,
    years, setYears,
    mode, setMode,
    afterTax, setAfterTax,
  };
}

export default function EntnahmeRechner({ state }) {
  const {
    startCapital, setStartCapital,
    annualReturn, setAnnualReturn,
    inflation, setInflation,
    years, setYears,
    mode, setMode,
    afterTax, setAfterTax,
  } = state;

  const r = useMemo(
    () => simulateEntnahme({ startCapital, annualReturn, inflation, mode, years }),
    [startCapital, annualReturn, inflation, mode, years]
  );

  // Szenarien: gleiche Entnahme bei 4/6/8 % Rendite
  const scenarios = useMemo(
    () =>
      [4, 6, 8].map((pct) => {
        const s = simulateEntnahme({ startCapital, annualReturn: pct, inflation, mode, years });
        return { pct, net: s.monthlyRealNet, gross: s.monthlyReal };
      }),
    [startCapital, inflation, mode, years]
  );

  const shownMonthly = afterTax ? r.monthlyRealNet : r.monthlyReal;
  const isErhalt = mode === "erhalt";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, color: CLAY, fontWeight: 700, textTransform: "uppercase" }}>
          Depot · Österreich · Entnahmeplan
        </div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: "4px 0 0", letterSpacing: -0.5 }}>
          Entnahmeplan-Rechner
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "6px 0 0" }}>
          Wie viel kannst du dir monatlich auszahlen? Alle Beträge in heutiger Kaufkraft.
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
        {/* Modus-Umschalter */}
        <div style={{ marginBottom: 18 }}>
          <div id="en-mode-label" style={{ fontSize: 14, fontWeight: 600, color: SLATE, marginBottom: 8 }}>
            Modus
          </div>
          <div role="group" aria-labelledby="en-mode-label" style={{ display: "flex", gap: 8 }}>
            <ModeButton
              active={isErhalt}
              onClick={() => setMode("erhalt")}
              title="Kapitalerhalt"
              sub="Substanz bleibt real erhalten"
            />
            <ModeButton
              active={!isErhalt}
              onClick={() => setMode("verzehr")}
              title="Kapitalverzehr"
              sub={`Depot über ${years} J. aufbrauchen`}
            />
          </div>
        </div>

        <Field
          htmlFor="en-capital"
          label="Depotwert (Start)"
          value={eur0.format(startCapital)}
          hint="Vorhandenes Vermögen, aus dem entnommen wird"
        >
          <input
            id="en-capital"
            type="range"
            min={10000}
            max={2000000}
            step={10000}
            value={startCapital}
            onChange={(e) => setStartCapital(+e.target.value)}
            style={sliderStyle}
          />
        </Field>

        <Field
          htmlFor="en-return"
          label="Erwartete Rendite p. a."
          value={`${annualReturn.toLocaleString("de-AT", { minimumFractionDigits: 1 })} %`}
          hint="Effektive Jahresrendite. Breiter Aktien-ETF historisch ~7–9 %. Konservativ planen: 4–6 %. Keine Garantie."
        >
          <input id="en-return" type="range" min={0} max={10} step={0.5} value={annualReturn} onChange={(e) => setAnnualReturn(+e.target.value)} style={sliderStyle} />
        </Field>

        <Field
          htmlFor="en-inflation"
          label="Inflation p. a."
          value={`${inflation.toLocaleString("de-AT", { minimumFractionDigits: 1 })} %`}
          hint="Zieht die Kaufkraft der Auszahlung über die Jahre. EZB-Ziel ~2 %."
        >
          <input id="en-inflation" type="range" min={0} max={5} step={0.25} value={inflation} onChange={(e) => setInflation(+e.target.value)} style={sliderStyle} />
        </Field>

        <Field
          htmlFor="en-years"
          label={isErhalt ? "Anzeigezeitraum" : "Entnahmedauer"}
          value={`${years} Jahre`}
          hint={
            isErhalt
              ? r.sustainable
                ? "Nur zur Darstellung — Depot bleibt real konstant, die Rente läuft unbefristet."
                : "Nur zur Darstellung — bei dieser Rendite ist keine Entnahme mit Kapitalerhalt möglich."
              : "Nach dieser Zeit ist das Depot planmäßig aufgebraucht (0 €)."
          }
        >
          <input id="en-years" type="range" min={5} max={40} step={1} value={years} onChange={(e) => setYears(+e.target.value)} style={sliderStyle} />
        </Field>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "4px 0 14px" }}>
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
        <Corners />
        <div style={{ fontSize: 12, letterSpacing: 0.4, color: CLAY_SOFT, textTransform: "uppercase", fontWeight: 700 }}>
          Mögliche Entnahme {afterTax ? "netto (nach KESt)" : "brutto"} · pro Monat
        </div>
        {r.sustainable ? (
          <>
            <div style={{ fontSize: 44, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1.05, margin: "6px 0 2px" }}>
              {eur0.format(shownMonthly)}
            </div>
            <div style={{ fontSize: 14, color: OAT }}>
              ≈ {eur0.format(shownMonthly * 12)} pro Jahr · in heutiger Kaufkraft
            </div>
            <div style={{ fontSize: 11.5, color: OAT, lineHeight: 1.45, marginTop: 8, opacity: 0.85 }}>
              {afterTax
                ? isErhalt
                  ? "Grobe Steuerschätzung, keine belastbare Nettoauszahlung: jede Entnahme wird voll als Gewinn versteuert. Bereits im Startdepot enthaltene Anschaffungskosten und laufende Fondssteuern sind nicht berücksichtigt."
                  : "Grobe Steuerschätzung, keine belastbare Nettoauszahlung: der Gewinnanteil der gesamten Laufzeit wird pauschal auf jede Monatsentnahme gelegt. Der steuerliche Einstandswert des Startdepots ist unbekannt und fehlt in der Rechnung."
                : "Brutto vor KESt. Der Schalter „nach KESt“ zeigt eine grobe Steuerschätzung — der steuerliche Einstandswert des Startdepots ist dem Rechner nicht bekannt."}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 20, fontWeight: 700, color: CLAY_SOFT, margin: "10px 0 2px", lineHeight: 1.3 }}>
            {r.shortfall === "gleichstand"
              ? "Rendite und Inflation gleichen sich genau aus — das Depot hält real seinen Wert, wirft darüber hinaus aber nichts ab. Für echten Kapitalerhalt ist keine Entnahme möglich."
              : "Bei dieser Rendite deckt der Ertrag nicht einmal die Inflation — das Depot verliert real schon ohne Entnahme an Wert."}{" "}
            Höhere Rendite wählen oder in den Kapitalverzehr wechseln.
          </div>
        )}

        <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "18px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MiniStat label="Entnahme brutto / Monat" value={eur0.format(r.monthlyReal)} color={OAT} />
          <MiniStat
            label={
              isErhalt
                ? r.sustainable
                  ? "Depot real (bleibt)"
                  : `Depot real nach ${years} J.`
                : `Restwert real nach ${years} J.`
            }
            value={eur0.format(r.endReal)}
            color={CLAY_SOFT}
          />
          <MiniStat label="entnommen gesamt (nominal)" value={eur0.format(r.totalWithdrawnNom)} color={OAT} />
          {afterTax && (
            <MiniStat label="KESt-Anteil d. Entnahme" value={`${Math.round(r.gainShare * KEST * 100)} %`} color={OAT} />
          )}
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
        <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, padding: "0 6px 4px" }}>
          Depotwert über die Zeit
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, padding: "0 6px 10px" }}>
          <span style={{ color: CLAY, fontWeight: 700 }}>Nominal</span> = tatsächlicher Kontostand ·{" "}
          <span style={{ color: OAT_DEEP, fontWeight: 700 }}>Real</span> = heutige Kaufkraft
        </div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={r.series} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="eWert" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CLAY} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={CLAY} stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="eReal" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v, n) => [eur0.format(v), n === "wert" ? "Nominal" : "Real (heute)"]}
                labelFormatter={(l) => `Jahr ${l}`}
                contentStyle={{ borderRadius: 10, border: `2px solid ${SLATE}`, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="real" stroke={OAT_DEEP} strokeWidth={2} fill="url(#eReal)" />
              <Area type="monotone" dataKey="wert" stroke={CLAY} strokeWidth={2.5} fill="url(#eWert)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Szenarien */}
      <div style={{ background: OAT, borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, marginBottom: 12 }}>
          Monatliche Entnahme bei {eur0.format(startCapital)} Depot ({isErhalt ? "Kapitalerhalt" : `Verzehr über ${years} J.`}, {afterTax ? "netto" : "brutto"})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {scenarios.map((s) => (
            <div
              key={s.pct}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: "12px 10px",
                border: s.pct === annualReturn ? `2px solid ${CLAY}` : `2px solid transparent`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{s.pct} % p. a.</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: SLATE, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                {eur0.format(afterTax ? s.net : s.gross)}
              </div>
              <div style={{ fontSize: 10.5, color: MUTED, marginTop: 1 }}>/ Monat</div>
            </div>
          ))}
        </div>
      </div>

      {/* Erklärung Modi */}
      <div
        style={{
          background: "#fff",
          border: `2px solid ${SLATE}`,
          borderRadius: 14,
          padding: "16px 16px 6px",
          boxShadow: `3px 3px 0 ${OAT_DEEP}`,
          marginBottom: 18,
        }}
      >
        <ModeExplain
          active={isErhalt}
          title="Kapitalerhalt"
          text="Du entnimmst nur den realen Ertrag — also nur das, was die Rendite über der Inflation abwirft. Das Vermögen bleibt in heutiger Kaufkraft gleich groß — die Entnahme kann theoretisch unbefristet laufen und du kannst die Substanz vererben. Dafür fällt die Rate niedriger aus."
        />
        <div style={{ height: 10 }} />
        <ModeExplain
          active={!isErhalt}
          title="Kapitalverzehr"
          text={`Du brauchst das Depot über ${years} Jahre planmäßig auf. Die Rate ist deutlich höher, am Ende bleibt aber (planmäßig) nichts übrig. Wird man älter als geplant, ist das Risiko, dass das Geld ausgeht.`}
        />
      </div>

      <p style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.55, margin: 0 }}>
        Vereinfachte Modellrechnung, keine Anlageberatung. Alle Auszahlungen sind in heutiger Kaufkraft angegeben und
        über die Zeit inflationsbereinigt — die nominale Auszahlung steigt Monat für Monat mit der Inflation. Die
        KESt-Angabe ist eine grobe Schätzung und keine belastbare Nettoauszahlung: gerechnet wird vereinfacht mit
        27,5 % auf den Ertragsanteil der Entnahmen (beim Kapitalerhalt näherungsweise auf die volle Entnahme, da die
        Substanz nicht angetastet wird). Der steuerliche Einstandswert des vorhandenen Depots ist dem Rechner nicht
        bekannt, laufende Fondssteuern werden nicht simuliert. Renditen schwanken stark und können negativ sein; gerade
        in der Entnahmephase kann eine schlechte Börsenphase zu Beginn (Sequence-of-Returns-Risiko) den Plan stärker
        treffen, als eine konstante Durchschnittsrendite vermuten lässt. Vergangene Wertentwicklung ist keine Garantie.
      </p>
    </div>
  );
}

function ModeButton({ active, onClick, title, sub }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "left",
        border: `2px solid ${active ? CLAY : OAT_DEEP}`,
        background: active ? CLAY : "#fff",
        color: active ? "#fff" : SLATE,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "all .12s",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.85)" : MUTED, marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function ModeExplain({ active, title, text }) {
  return (
    <div style={{ opacity: active ? 1 : 0.5 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: active ? CLAY : SLATE, display: "flex", alignItems: "center", gap: 6 }}>
        {active && <span style={{ fontSize: 11 }}>▶</span>}
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, marginTop: 3 }}>{text}</div>
    </div>
  );
}
