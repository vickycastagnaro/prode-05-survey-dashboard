"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const INTENT_COLORS = {
  yes: "#249637",
  maybe: "#935214",
  no: "#b22323",
};
const INTENT_BG = {
  yes: "#e6fbe9",
  maybe: "#fcf7ce",
  no: "#fde3e3",
};
const INTENT_LABELS = { yes: "Sí", maybe: "Tal vez", no: "No" };
const INTENT_ORDER = ["yes", "maybe", "no"];

const CONTINUITY_THRESHOLD = 70;

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

function ratingColor(n) {
  if (n <= 2) return "#e74444";
  if (n === 3) return "#f0b623";
  return "#4ed364";
}

export default function Dashboard({ initialRows, initialError }) {
  const [rows, setRows] = useState(initialRows || []);
  const [error, setError] = useState(initialError || null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [instanceFilter, setInstanceFilter] = useState("all");
  const [instanceQuery, setInstanceQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");
  const [search, setSearch] = useState("");

  const instances = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.instanceId == null) return;
      if (!map.has(r.instanceId) || (!map.get(r.instanceId) && r.instanceName)) {
        map.set(r.instanceId, r.instanceName || null);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({
        id,
        name,
        label: `${name || "Instancia"} (${id})`,
      }))
      .sort((a, b) => a.id - b.id);
  }, [rows]);

  const instanceFilteredRows = useMemo(() => {
    if (instanceFilter === "all") return rows;
    return rows.filter((r) => String(r.instanceId) === String(instanceFilter));
  }, [rows, instanceFilter]);

  const total = instanceFilteredRows.length;
  const avgRating = total
    ? (
        instanceFilteredRows.reduce((sum, r) => sum + (r.q1_rating || 0), 0) / total
      ).toFixed(2)
    : "-";

  const intentCounts = { yes: 0, maybe: 0, no: 0 };
  instanceFilteredRows.forEach((r) => {
    if (r.q2_continuity_intent && intentCounts[r.q2_continuity_intent] != null) {
      intentCounts[r.q2_continuity_intent] += 1;
    }
  });
  const pctYes = total ? Math.round((intentCounts.yes / total) * 100) : 0;
  const metGoal = pctYes >= CONTINUITY_THRESHOLD;

  const ratingData = [1, 2, 3, 4, 5].map((n) => ({
    rating: `${n}`,
    label: `Rating ${n}`,
    cantidad: instanceFilteredRows.filter((r) => r.q1_rating === n).length,
    color: ratingColor(n),
  }));
  const maxRatingCount = Math.max(1, ...ratingData.map((d) => d.cantidad));

  const listRows = useMemo(() => {
    let list = instanceFilteredRows;
    if (intentFilter !== "all") {
      list = list.filter((r) => r.q2_continuity_intent === intentFilter);
    }
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => (r.q3_comment || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [instanceFilteredRows, intentFilter, search]);

  function handleInstanceInput(value) {
    setInstanceQuery(value);
    if (value.trim() === "") {
      setInstanceFilter("all");
      return;
    }
    const match = instances.find((i) => i.label === value);
    if (match) {
      setInstanceFilter(match.id);
    }
  }

  function clearInstanceFilter() {
    setInstanceQuery("");
    setInstanceFilter("all");
  }

  async function handleRefresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/survey", { cache: "no-store" });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setRows(json.rows);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 16px 64px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>PRODE 05: Prode Satisfaction Survey</h1>
          <p style={{ color: "var(--text-lighter)", fontSize: 14, margin: "4px 0 0" }}>
            Fuente: Redash (query 49747) · Actualiza automáticamente cada 60s
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Pill
              text={metGoal ? "✓ Continuidad alcanzada" : "Continuidad por debajo del umbral"}
              color={metGoal ? "var(--green-700)" : "var(--yellow-800)"}
              bg={metGoal ? "#e6fbe9" : "#fcf7ce"}
              border={metGoal ? "#abedb6" : "#fbeb9d"}
            />
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                background: "#fff",
                color: "var(--text-default)",
                border: "1px solid var(--neutral-300)",
                borderRadius: "var(--radius-m)",
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Actualizando..." : "↺ Actualizar datos"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-lighter)", margin: "8px 0 0" }}>
            Actualizado: {lastUpdated.toLocaleString("es-AR")}
          </p>
        </div>
      </header>

      {error && (
        <div
          style={{
            background: "#fde3e3",
            color: "var(--red-700)",
            padding: 12,
            borderRadius: "var(--radius-m)",
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard
          label="% Continuidad = Sí"
          value={`${pctYes}%`}
          sublabel={`Umbral: ${CONTINUITY_THRESHOLD}%`}
          highlight={metGoal}
        />
        <KpiCard label="Respuestas" value={total} />
        <KpiCard label="Rating promedio (1-5)" value={avgRating} />
        <KpiCard
          label="No continuarían"
          value={intentCounts.no}
          accent={intentCounts.no > 0 ? "var(--red-700)" : undefined}
        />
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: "var(--radius-m)",
          boxShadow: "var(--shadow-4dp)",
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 15 }}>Q1 — ¿Qué tan satisfecho estás con la continuidad?</h2>
          <span style={{ fontSize: 12, color: "var(--text-lighter)" }}>n={total}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={ratingData}
            layout="vertical"
            margin={{ left: 12, right: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, maxRatingCount]} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={80} />
            <Tooltip />
            <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={22}>
              {ratingData.map((d) => (
                <Cell key={d.rating} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: "var(--radius-m)",
          boxShadow: "var(--shadow-4dp)",
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 15, marginBottom: 16 }}>Respuestas individuales</h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <FilterPill
            label={`Todos (${total})`}
            active={intentFilter === "all"}
            onClick={() => setIntentFilter("all")}
          />
          {INTENT_ORDER.map((k) => (
            <FilterPill
              key={k}
              label={`${INTENT_LABELS[k]} (${intentCounts[k]})`}
              active={intentFilter === k}
              onClick={() => setIntentFilter(k)}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en comentarios..."
            style={{
              flex: "1 1 220px",
              padding: "8px 12px",
              borderRadius: "var(--radius-s)",
              border: "1px solid var(--neutral-300)",
              fontSize: 13,
            }}
          />
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <input
              value={instanceQuery}
              onChange={(e) => handleInstanceInput(e.target.value)}
              list="instance-options"
              placeholder="Buscar instancia por nombre o id..."
              style={{
                width: "100%",
                padding: "8px 32px 8px 12px",
                borderRadius: "var(--radius-s)",
                border: "1px solid var(--neutral-300)",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            <datalist id="instance-options">
              {instances.map((i) => (
                <option key={i.id} value={i.label} />
              ))}
            </datalist>
            {instanceFilter !== "all" && (
              <button
                onClick={clearInstanceFilter}
                aria-label="Limpiar filtro de instancia"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-lighter)",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-lighter)", alignSelf: "center" }}>
            {listRows.length} mostrados
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {listRows.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--text-lighter)" }}>
              No hay respuestas para este filtro.
            </p>
          )}
          {listRows.map((r) => (
            <ResponseCard key={r.id} row={r} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ResponseCard({ row }) {
  const intent = row.q2_continuity_intent;
  const borderColor = INTENT_COLORS[intent] || "var(--neutral-300)";
  return (
    <div
      style={{
        border: "1px solid var(--neutral-200)",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "var(--radius-m)",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            Rating {row.q1_rating ?? "-"} ·{" "}
            {row.instanceName ? `${row.instanceName} (${row.instanceId})` : `Instancia ${row.instanceId}`}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-lighter)" }}>
            {formatDate(row.completedAt)}
          </p>
        </div>
        <Pill
          text={INTENT_LABELS[intent] || "-"}
          color={INTENT_COLORS[intent] || "var(--text-lighter)"}
          bg={INTENT_BG[intent] || "var(--neutral-100)"}
        />
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-lighter)" }}>
        Q3 — Comentario
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 14 }}>
        {row.q3_comment && row.q3_comment.trim() !== "" ? row.q3_comment : "—"}
      </p>
    </div>
  );
}

function KpiCard({ label, value, sublabel, accent, highlight }) {
  return (
    <div
      style={{
        background: highlight ? "#e6fbe9" : "#fff",
        border: highlight ? "1px solid #abedb6" : "1px solid var(--neutral-200)",
        borderRadius: "var(--radius-m)",
        padding: 16,
        boxShadow: "var(--shadow-4dp)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 600,
          color: accent || (highlight ? "var(--green-700)" : "var(--text-default)"),
        }}
      >
        {value}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: "var(--text-lighter)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </p>
      {sublabel && (
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-lighter)" }}>{sublabel}</p>
      )}
    </div>
  );
}

function Pill({ text, color, bg, border }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        border: `1px solid ${border || bg}`,
        borderRadius: 999,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--brand-500)" : "#fff",
        color: active ? "#fff" : "var(--text-default)",
        border: `1px solid ${active ? "var(--brand-500)" : "var(--neutral-300)"}`,
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
