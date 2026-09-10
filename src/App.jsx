import { useState } from "react";
import { CLAY, SLATE, IVORY, OAT_DEEP, MUTED } from "./shared.jsx";
import SparplanRechner, { useSparplanState } from "./SparplanRechner.jsx";
import EntnahmeRechner, { useEntnahmeState } from "./EntnahmeRechner.jsx";

const TABS = [
  { id: "anspar", label: "Ansparen", sub: "Vermögen aufbauen" },
  { id: "entnahme", label: "Entnehmen", sub: "Vom Depot leben" },
];

export default function App() {
  const [tab, setTab] = useState("anspar");
  // Eingabestate liegt hier, nicht in den Rechnern: die Tabs rendern bedingt,
  // lokaler State ginge beim Umschalten verloren.
  const sparplan = useSparplanState();
  const entnahme = useEntnahmeState();

  return (
    <div
      style={{
        background: IVORY,
        minHeight: "100vh",
        padding: "22px 16px 40px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: SLATE,
      }}
    >
      {/* Tab-Umschalter */}
      <div style={{ maxWidth: 720, margin: "0 auto 22px" }}>
        <div
          role="tablist"
          aria-label="Rechner"
          style={{
            display: "flex",
            gap: 6,
            background: "#fff",
            border: `2px solid ${SLATE}`,
            borderRadius: 999,
            padding: 5,
            boxShadow: `3px 3px 0 ${OAT_DEEP}`,
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  border: "none",
                  background: active ? CLAY : "transparent",
                  color: active ? "#fff" : MUTED,
                  borderRadius: 999,
                  padding: "9px 12px",
                  cursor: "pointer",
                  transition: "all .12s",
                  lineHeight: 1.15,
                }}
              >
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800 }}>{t.label}</span>
                <span style={{ display: "block", fontSize: 11, color: active ? "rgba(255,255,255,0.85)" : MUTED, marginTop: 1 }}>
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "anspar" ? (
          <SparplanRechner state={sparplan} />
        ) : (
          <EntnahmeRechner state={entnahme} />
        )}
      </div>
    </div>
  );
}
