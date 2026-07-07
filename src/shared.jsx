// Birchline palette — shared across Anspar- & Entnahme-Rechner
export const CLAY = "#D97757";
export const CLAY_SOFT = "#E9A488";
export const SLATE = "#141413";
export const IVORY = "#FAF9F5";
export const OAT = "#E3DACC";
export const OAT_DEEP = "#CFC2AC";
export const MUTED = "#6B6458";
export const AMBER = "#B0701A";

export const KEST = 0.275; // Österreich: Kapitalertragsteuer

export const eur0 = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
export const eur2 = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export const sliderStyle = {
  width: "100%",
  accentColor: CLAY,
  height: 26,
  cursor: "pointer",
};

export function Field({ label, hint, children, value }) {
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

export function Toggle({ on, onClick, label }) {
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

export function MiniStat({ label, value, color }) {
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

// Decorative frame corners for the dark result card
export function Corners() {
  const base = { position: "absolute", width: 9, height: 9, borderColor: CLAY };
  const map = {
    tl: { top: 8, left: 8, borderTop: "2px solid", borderLeft: "2px solid" },
    tr: { top: 8, right: 8, borderTop: "2px solid", borderRight: "2px solid" },
    bl: { bottom: 8, left: 8, borderBottom: "2px solid", borderLeft: "2px solid" },
    br: { bottom: 8, right: 8, borderBottom: "2px solid", borderRight: "2px solid" },
  };
  return (
    <>
      {["tl", "tr", "bl", "br"].map((p) => (
        <span key={p} style={{ ...base, ...map[p] }} />
      ))}
    </>
  );
}
