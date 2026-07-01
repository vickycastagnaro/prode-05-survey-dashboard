"use client";

import { useMemo, useRef, useState } from "react";
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
  const [intentFilter, setIntentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const reportRef = useRef(null);

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

  const selectedInstanceLabel =
    instanceFilter === "all"
      ? "Todas las instancias"
      : instances.find((i) => String(i.id) === String(instanceFilter))?.label ||
        "Todas las instancias";

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

  async function handleDownloadPdf() {
    if (!reportRef.current) return;
    setGeneratingPdf(true);
    try {
      await new Promise((r) => requestAnimationFrame(r));
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`prode-05-survey-${dateStr}.pdf`);
    } catch (err) {
      setError("No se pudo generar el PDF: " + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <main
      ref={reportRef}
      className={generatingPdf ? "pdf-mode" : ""}
      style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 16px 64px", background: "#fff" }}
    >
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
            <button
              className="no-print"
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
            <button
              className="no-print"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--brand-500)",
                color: "#fff",
                border: "1px solid var(--brand-500)",
                borderRadius: "var(--radius-m)",
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: generatingPdf ? "default" : "pointer",
                opacity: generatingPdf ? 0.7 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12" />
                <path d="M7 10l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              {generatingPdf ? "Generando PDF..." : "Descargar PDF"}
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

      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-lighter)" }}>
          Filtrar por instancia:
        </span>
        <InstanceDropdown
          instances={instances}
          value={instanceFilter}
          label={selectedInstanceLabel}
          onChange={setInstanceFilter}
        />
        {instanceFilter !== "all" && (
          <button
            onClick={() => setInstanceFilter("all")}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-600)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {(instanceFilter !== "all" || intentFilter !== "all" || search.trim() !== "") && (
        <p className="print-only" style={{ fontSize: 12, color: "var(--text-lighter)", marginTop: -12, marginBottom: 20 }}>
          Filtros aplicados: instancia — {selectedInstanceLabel}
          {intentFilter !== "all" ? ` · intención — ${INTENT_LABELS[intentFilter]}` : ""}
          {search.trim() !== "" ? ` · búsqueda — "${search.trim()}"` : ""}
        </p>
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
          info={`Se considera "continuidad alcanzada" cuando el % de respuestas "Sí" en Q2 es mayor o igual al umbral de ${CONTINUITY_THRESHOLD}%. Por debajo de ese umbral, se marca en amarillo como punto de atención.`}
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

        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
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

        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
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

function KpiCard({ label, value, sublabel, accent, highlight, info }) {
  return (
    <div
      style={{
        position: "relative",
        background: highlight ? "#e6fbe9" : "#fff",
        border: highlight ? "1px solid #abedb6" : "1px solid var(--neutral-200)",
        borderRadius: "var(--radius-m)",
        padding: 16,
        boxShadow: "var(--shadow-4dp)",
      }}
    >
      {info && <InfoTooltip text={info} />}
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

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="no-print" style={{ position: "absolute", top: 10, right: 10 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label="Ver criterio"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1px solid var(--neutral-300)",
          background: "#fff",
          color: "var(--text-lighter)",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: "16px",
          padding: 0,
          cursor: "pointer",
        }}
      >
        i
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 0,
            width: 220,
            background: "var(--neutral-950)",
            color: "#fff",
            borderRadius: "var(--radius-s)",
            padding: 10,
            fontSize: 11,
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            lineHeight: 1.4,
            zIndex: 30,
            boxShadow: "var(--shadow-8dp)",
          }}
        >
          {text}
        </div>
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

function InstanceDropdown({ instances, value, label, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = instances.filter((i) =>
    i.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  function select(id) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "1px solid var(--neutral-300)",
          borderRadius: "var(--radius-m)",
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-default)",
          cursor: "pointer",
          minWidth: 220,
          justifyContent: "space-between",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--text-lighter)", fontSize: 11 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 20,
              background: "#fff",
              border: "1px solid var(--neutral-200)",
              borderRadius: "var(--radius-m)",
              boxShadow: "var(--shadow-8dp)",
              minWidth: 280,
              maxHeight: 320,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 10, borderBottom: "1px solid var(--neutral-200)" }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o id..."
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-s)",
                  border: "1px solid var(--neutral-300)",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ overflowY: "auto" }}>
              <DropdownOption
                text="Todas las instancias"
                selected={value === "all"}
                onClick={() => select("all")}
              />
              {filtered.length === 0 && (
                <p style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-lighter)" }}>
                  Sin resultados.
                </p>
              )}
              {filtered.map((i) => (
                <DropdownOption
                  key={i.id}
                  text={i.label}
                  selected={String(value) === String(i.id)}
                  onClick={() => select(i.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DropdownOption({ text, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "9px 14px",
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        color: selected ? "var(--brand-600)" : "var(--text-default)",
        background: selected ? "var(--blueprimary-100)" : "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      {text}
    </button>
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
