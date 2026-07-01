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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const INTENT_COLORS = {
  yes: "#4ed364",
  maybe: "#f0b623",
  no: "#e74444",
};
const INTENT_LABELS = { yes: "Sí", maybe: "Tal vez", no: "No" };

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

export default function Dashboard({ initialRows, initialError }) {
  const [rows, setRows] = useState(initialRows || []);
  const [error, setError] = useState(initialError || null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [instanceFilter, setInstanceFilter] = useState("all");

  const instances = useMemo(() => {
    const set = new Set(rows.map((r) => r.instanceId).filter((v) => v != null));
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (instanceFilter === "all") return rows;
    return rows.filter((r) => String(r.instanceId) === String(instanceFilter));
  }, [rows, instanceFilter]);

  const total = filteredRows.length;
  const avgRating = total
    ? (
        filteredRows.reduce((sum, r) => sum + (r.q1_rating || 0), 0) / total
      ).toFixed(2)
    : "-";

  const intentCounts = { yes: 0, maybe: 0, no: 0 };
  filteredRows.forEach((r) => {
    if (r.q2_continuity_intent && intentCounts[r.q2_continuity_intent] != null) {
      intentCounts[r.q2_continuity_intent] += 1;
    }
  });
  const pctYes = total ? Math.round((intentCounts.yes / total) * 100) : 0;

  const commentsRows = filteredRows
    .filter((r) => r.q3_comment && r.q3_comment.trim() !== "")
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const ratingData = [1, 2, 3, 4, 5].map((n) => ({
    rating: String(n),
    cantidad: filteredRows.filter((r) => r.q1_rating === n).length,
  }));

  const intentData = ["yes", "maybe", "no"].map((k) => ({
    key: k,
    name: INTENT_LABELS[k],
    value: intentCounts[k],
  }));

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
          <h1 style={{ fontSize: 24 }}>TRIAL_CONTINUITY_2026</h1>
          <p style={{ color: "var(--text-lighter)", fontSize: 14, margin: "4px 0 0" }}>
            Resultados de la encuesta · fuente: Redash
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              background: "var(--brand-500)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-m)",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Actualizando..." : "Actualizar ahora"}
          </button>
          <p style={{ fontSize: 12, color: "var(--text-lighter)", margin: "6px 0 0" }}>
            Última actualización: {lastUpdated.toLocaleTimeString("es-AR")}
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

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>
          Filtrar por instancia:
        </label>
        <select
          value={instanceFilter}
          onChange={(e) => setInstanceFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "var(--radius-s)",
            border: "1px solid var(--neutral-300)",
            fontSize: 14,
          }}
        >
          <option value="all">Todas las instancias</option>
          {instances.map((id) => (
            <option key={id} value={id}>
              Instancia {id}
            </option>
          ))}
        </select>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <KpiCard label="Total de respuestas" value={total} />
        <KpiCard label="Rating promedio (1-5)" value={avgRating} />
        <KpiCard label="% Continuidad = Sí" value={`${pctYes}%`} accent="var(--green-700)" />
        <KpiCard label="Comentarios con texto" value={commentsRows.length} />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <ChartCard title="Distribución de rating (Q1)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" />
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Intención de continuidad (Q2)">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={intentData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
              >
                {intentData.map((entry) => (
                  <Cell key={entry.key} fill={INTENT_COLORS[entry.key]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Comentarios ({commentsRows.length})</h2>
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--radius-m)",
            boxShadow: "var(--shadow-4dp)",
            overflow: "hidden",
          }}
        >
          {commentsRows.length === 0 && (
            <p style={{ padding: 16, fontSize: 14, color: "var(--text-lighter)" }}>
              No hay comentarios para este filtro.
            </p>
          )}
          {commentsRows.map((r, i) => (
            <div
              key={r.id}
              style={{
                padding: "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--neutral-200)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 14 }}>{r.q3_comment}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-lighter)" }}>
                  Rating {r.q1_rating} · {INTENT_LABELS[r.q2_continuity_intent] || "-"} ·{" "}
                  {formatDate(r.completedAt)} · Instancia {r.instanceId}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "var(--blueprimary-100)",
        borderRadius: "var(--radius-m)",
        padding: 16,
        boxShadow: "var(--shadow-4dp)",
      }}
    >
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--blueprimary-800)" }}>
        {label}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 28,
          fontWeight: 600,
          color: accent || "var(--brand-600)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--radius-m)",
        boxShadow: "var(--shadow-4dp)",
        padding: 16,
      }}
    >
      <h3 style={{ fontSize: 14, marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}
