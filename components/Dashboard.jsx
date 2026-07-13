"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// Colores de texto (oscuros, para leer sobre fondos claros: pills, badges).
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
// Colores para rellenos de gráficos (más vivos, mismos usados en el chart de Q1).
const CHART_INTENT_COLORS = {
  yes: "#4ed364",
  maybe: "#f0b623",
  no: "#e74444",
};
const INTENT_ORDER = ["yes", "maybe", "no"];

const CONTINUITY_THRESHOLD = 70;

const DICT = {
  es: {
    title: "PRODE 05: Encuesta Satisfacción",
    pdfTitle: "Encuesta de Satisfacción",
    instanceShownLabel: "Instancia:",
    filterByIntent: "Intención:",
    userFallback: "Usuario",
    subtitle: "Fuente: Redash (query 49867) · Redash recalcula los datos cada 1 hora",
    refresh: "Actualizar datos",
    refreshing: "Actualizando...",
    downloadPdf: "Descargar PDF",
    generatingPdf: "Generando PDF...",
    updated: "Actualizado",
    generatedAt: "Generado",
    filterByInstance: "Filtrar por instancia:",
    allInstances: "Todas las instancias",
    clearFilter: "Limpiar filtro",
    searchInstance: "Buscar por nombre o id...",
    noResults: "Sin resultados.",
    filtersApplied: "Filtros aplicados",
    instanceLabel: "instancia",
    intentLabel: "intención",
    searchLabel: "búsqueda",
    kpiContinuity: "% Continuidad = Sí",
    kpiThreshold: (n) => `Umbral: ${n}%`,
    kpiResponses: "Respuestas",
    kpiAvgRating: "Rating promedio (1-5)",
    kpiWontContinue: "No continuarían",
    infoContinuity: (n) =>
      `Se considera "continuidad alcanzada" cuando el % de respuestas "Sí" en Q2 es mayor o igual al umbral de ${n}%. Por debajo de ese umbral, se marca en amarillo como punto de atención.`,
    infoIconLabel: "Ver criterio",
    q1Title: "Q1 — ¿Cómo fue tu experiencia usando Humand durante el Mundial?",
    q2Title: "Q2 — ¿Te gustaría que tu empresa siga usando Humand después del Mundial?",
    intentFull: {
      yes: "Sí, me gustaría seguir usándola",
      maybe: "Todavía no lo decidí",
      no: "No, preferiría no continuar",
    },
    themesTitle: "Temas mencionados en los comentarios (Q3)",
    themesSubtitle: "agrupado automáticamente por palabras clave",
    themesEmpty: "Todavía no hay suficientes comentarios para agrupar por tema.",
    moreCount: (n) => `+${n} más`,
    individualResponses: "Respuestas individuales",
    filterAllLabel: "Todos",
    searchComments: "Buscar en comentarios...",
    shownCount: (n) => `${n} mostrados`,
    hideEmptyComments: "Ocultar sin comentario",
    noResponsesFilter: "No hay respuestas para este filtro.",
    q3Label: "Q3 — Comentario",
    ratingWord: "Rating",
    instanceFallback: "Instancia",
    intents: { yes: "Sí", maybe: "Tal vez", no: "No" },
    themes: {
      usability: "Facilidad de uso",
      satisfaction: "Satisfacción general",
      support: "Soporte y atención",
      price: "Precio / costo",
      features: "Funcionalidades",
      performance: "Rendimiento / errores",
      other: "Otros comentarios",
    },
    dateLocale: "es-AR",
    downloadModalTitle: "Antes de descargar",
    downloadModalDesc: "Para llevar un registro de quién descarga el reporte y con qué filtros, contanos quién sos.",
    nameLabel: "Nombre",
    emailLabel: "Email (opcional)",
    cancelLabel: "Cancelar",
    confirmDownloadLabel: "Descargar",
    nameRequired: "Ingresá tu nombre para continuar.",
    downloadLogTitle: "Historial de descargas",
    downloadLogSubtitle: "quién descargó el PDF y con qué filtros",
    downloadLogEmpty: "Todavía no se descargó ningún PDF.",
    downloadLogLoading: "Cargando historial...",
    colName: "Nombre",
    colEmail: "Email",
    colDate: "Fecha",
    colInstance: "Instancia",
    colAe: "AE",
    colCountry: "País",
    colIntent: "Intención",
    colLang: "Idioma",
    filterByAe: "Filtrar por AE:",
    allAes: "Todos los AE",
    searchAe: "Buscar AE...",
    aeUnassigned: "Sin asignar",
    aeLabel: "AE",
    filterByCountry: "Filtrar por país:",
    allCountries: "Todos los países",
    searchCountry: "Buscar país...",
    countryLabel: "país",
    staticDataNote: (date) => `Datos de AE y país cargados manualmente al ${date} (no se actualizan solos)`,
  },
  en: {
    title: "PRODE 05: Satisfaction Survey",
    pdfTitle: "Satisfaction Survey",
    instanceShownLabel: "Instance:",
    filterByIntent: "Intent:",
    userFallback: "User",
    subtitle: "Source: Redash (query 49867) · Redash recomputes the data every hour",
    refresh: "Refresh data",
    refreshing: "Refreshing...",
    downloadPdf: "Download PDF",
    generatingPdf: "Generating PDF...",
    updated: "Updated",
    generatedAt: "Generated",
    filterByInstance: "Filter by instance:",
    allInstances: "All instances",
    clearFilter: "Clear filter",
    searchInstance: "Search by name or id...",
    noResults: "No results.",
    filtersApplied: "Filters applied",
    instanceLabel: "instance",
    intentLabel: "intent",
    searchLabel: "search",
    kpiContinuity: "% Continuity = Yes",
    kpiThreshold: (n) => `Threshold: ${n}%`,
    kpiResponses: "Responses",
    kpiAvgRating: "Average rating (1-5)",
    kpiWontContinue: "Would not continue",
    infoContinuity: (n) =>
      `"Continuity reached" is shown when the % of "Yes" answers in Q2 is at or above the ${n}% threshold. Below that, it's flagged yellow as a point of attention.`,
    infoIconLabel: "View criteria",
    q1Title: "Q1 — How was your experience using Humand during the World Cup?",
    q2Title: "Q2 — Would you like your company to keep using Humand after the World Cup?",
    intentFull: {
      yes: "Yes, I'd like to keep using it",
      maybe: "Haven't decided yet",
      no: "No, I'd rather not continue",
    },
    themesTitle: "Topics mentioned in comments (Q3)",
    themesSubtitle: "grouped automatically by keywords",
    themesEmpty: "Not enough comments yet to group by topic.",
    moreCount: (n) => `+${n} more`,
    individualResponses: "Individual responses",
    filterAllLabel: "All",
    searchComments: "Search comments...",
    shownCount: (n) => `${n} shown`,
    hideEmptyComments: "Hide without comment",
    noResponsesFilter: "No responses match this filter.",
    q3Label: "Q3 — Comment",
    ratingWord: "Rating",
    instanceFallback: "Instance",
    intents: { yes: "Yes", maybe: "Maybe", no: "No" },
    themes: {
      usability: "Ease of use",
      satisfaction: "General satisfaction",
      support: "Support",
      price: "Price / cost",
      features: "Features",
      performance: "Performance / bugs",
      other: "Other comments",
    },
    dateLocale: "en-US",
    downloadModalTitle: "Before downloading",
    downloadModalDesc: "To keep a record of who downloads the report and with which filters, tell us who you are.",
    nameLabel: "Name",
    emailLabel: "Email (optional)",
    cancelLabel: "Cancel",
    confirmDownloadLabel: "Download",
    nameRequired: "Enter your name to continue.",
    downloadLogTitle: "Download history",
    downloadLogSubtitle: "who downloaded the PDF and with which filters",
    downloadLogEmpty: "No PDF has been downloaded yet.",
    downloadLogLoading: "Loading history...",
    colName: "Name",
    colEmail: "Email",
    colDate: "Date",
    colInstance: "Instance",
    colAe: "AE",
    colCountry: "Country",
    colIntent: "Intent",
    colLang: "Language",
    filterByAe: "Filter by AE:",
    allAes: "All AEs",
    searchAe: "Search AE...",
    aeUnassigned: "Unassigned",
    aeLabel: "AE",
    filterByCountry: "Filter by country:",
    allCountries: "All countries",
    searchCountry: "Search country...",
    countryLabel: "country",
    staticDataNote: (date) => `AE and country data manually loaded on ${date} (does not auto-update)`,
  },
};

const AE_DATA_DATE = "03/07/2026";

function formatDate(iso, locale) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function ratingColor(n) {
  if (n <= 2) return "#e74444";
  if (n === 3) return "#f0b623";
  return "#4ed364";
}

const THEME_RULES = [
  { key: "usability", keywords: ["facil", "fácil", "simple", "sencill", "intuitiv"] },
  {
    key: "satisfaction",
    keywords: ["encanta", "encant", "gust", "excelente", "genial", "buena", "buenisim", "buenísim", "ador", "perfect"],
  },
  { key: "support", keywords: ["soporte", "atenci", "ayuda", "respuesta", "acompañ"] },
  { key: "price", keywords: ["precio", "costo", "caro", "barato", "plan de pago", " pago"] },
  {
    key: "features",
    keywords: ["función", "funcion", "feature", "módulo", "modulo", "reporte", "falta ", "necesito", "necesita"],
  },
  { key: "performance", keywords: ["lento", "bug", "error", "falla", "problema", "traba"] },
];

function classifyTheme(comment) {
  if (!comment || comment.trim() === "") return null;
  const text = comment.toLowerCase();
  for (const rule of THEME_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.key;
  }
  return "other";
}

export default function Dashboard({ initialRows, initialError, initialRetrievedAt }) {
  const [rows, setRows] = useState(initialRows || []);
  const [error, setError] = useState(initialError || null);
  const [loading, setLoading] = useState(false);
  const [redashUpdatedAt, setRedashUpdatedAt] = useState(initialRetrievedAt || null);
  const [instanceFilter, setInstanceFilter] = useState("all");
  const [aeFilter, setAeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [hideEmptyComments, setHideEmptyComments] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [lang, setLang] = useState("es");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloaderName, setDownloaderName] = useState("");
  const [downloaderEmail, setDownloaderEmail] = useState("");
  const [nameError, setNameError] = useState(false);
  const [downloadLog, setDownloadLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const reportRef = useRef(null);

  const t = DICT[lang];

  // Instancia -> AE / país (una instancia tiene un único AE y un único país
  // asignados) — se usan para auto-seleccionar el AE y el país correspondiente
  // cuando se elige una instancia, y para saber si una instancia sigue siendo
  // válida cuando cambian los otros filtros.
  const aeByInstance = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.instanceId != null && r.aeName && !map.has(String(r.instanceId))) {
        map.set(String(r.instanceId), r.aeName);
      }
    });
    return map;
  }, [rows]);

  const countryByInstance = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.instanceId != null && r.countryName && !map.has(String(r.instanceId))) {
        map.set(String(r.instanceId), r.countryName);
      }
    });
    return map;
  }, [rows]);

  // Las opciones de instancia se acotan al AE y/o país elegidos.
  const instances = useMemo(() => {
    const source = rows.filter(
      (r) =>
        (aeFilter === "all" || r.aeName === aeFilter) &&
        (countryFilter === "all" || r.countryName === countryFilter)
    );
    const map = new Map();
    source.forEach((r) => {
      if (r.instanceId == null) return;
      if (!map.has(r.instanceId) || (!map.get(r.instanceId) && r.instanceName)) {
        map.set(r.instanceId, r.instanceName || null);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({
        id,
        name,
        label: `${name || t.instanceFallback} (${id})`,
      }))
      .sort((a, b) => a.id - b.id);
  }, [rows, aeFilter, countryFilter, t.instanceFallback]);

  // Las opciones de AE se acotan al país elegido.
  const aeOptions = useMemo(() => {
    const source = countryFilter === "all" ? rows : rows.filter((r) => r.countryName === countryFilter);
    const set = new Set();
    source.forEach((r) => {
      if (r.aeName) set.add(r.aeName);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, name, label: name }));
  }, [rows, countryFilter]);

  // Las opciones de país se acotan al AE elegido.
  const countryOptions = useMemo(() => {
    const source = aeFilter === "all" ? rows : rows.filter((r) => r.aeName === aeFilter);
    const set = new Set();
    source.forEach((r) => {
      if (r.countryName) set.add(r.countryName);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, name, label: name }));
  }, [rows, aeFilter]);

  // Cambiar cualquiera de los tres filtros (instancia / AE / país) mantiene a
  // los otros dos consistentes entre sí:
  // - Elegir una instancia autoselecciona el AE y el país que le corresponden.
  // - Elegir un AE o un país limpia la instancia si ya no encaja, y limpia el
  //   otro filtro (AE/país) si la combinación deja de tener sentido.
  function applyFilterChange(dimension, value) {
    let nextInstance = instanceFilter;
    let nextAe = aeFilter;
    let nextCountry = countryFilter;

    if (dimension === "instance") {
      nextInstance = value;
      if (value !== "all") {
        nextAe = aeByInstance.get(String(value)) || "all";
        nextCountry = countryByInstance.get(String(value)) || "all";
      }
    } else if (dimension === "ae") {
      nextAe = value;
    } else if (dimension === "country") {
      nextCountry = value;
    }

    if (dimension !== "instance" && nextInstance !== "all") {
      const row = rows.find((r) => String(r.instanceId) === String(nextInstance));
      const okAe = nextAe === "all" || (row && row.aeName === nextAe);
      const okCountry = nextCountry === "all" || (row && row.countryName === nextCountry);
      if (!okAe || !okCountry) nextInstance = "all";
    }

    if (dimension === "ae" && nextCountry !== "all") {
      const stillValid = rows.some((r) => r.aeName === nextAe && r.countryName === nextCountry);
      if (!stillValid) nextCountry = "all";
    }
    if (dimension === "country" && nextAe !== "all") {
      const stillValid = rows.some((r) => r.aeName === nextAe && r.countryName === nextCountry);
      if (!stillValid) nextAe = "all";
    }

    setInstanceFilter(nextInstance);
    setAeFilter(nextAe);
    setCountryFilter(nextCountry);
  }

  function handleInstanceFilterChange(value) {
    applyFilterChange("instance", value);
  }

  function handleAeFilterChange(value) {
    applyFilterChange("ae", value);
  }

  function handleCountryFilterChange(value) {
    applyFilterChange("country", value);
  }

  const instanceFilteredRows = useMemo(() => {
    if (instanceFilter === "all") return rows;
    return rows.filter((r) => String(r.instanceId) === String(instanceFilter));
  }, [rows, instanceFilter]);

  const aeFilteredRows = useMemo(() => {
    if (aeFilter === "all") return instanceFilteredRows;
    return instanceFilteredRows.filter((r) => r.aeName === aeFilter);
  }, [instanceFilteredRows, aeFilter]);

  const countryFilteredRows = useMemo(() => {
    if (countryFilter === "all") return aeFilteredRows;
    return aeFilteredRows.filter((r) => r.countryName === countryFilter);
  }, [aeFilteredRows, countryFilter]);

  // Conteo por intención dentro del alcance de instancia + AE + país (sin
  // aplicar el propio filtro de intención) — se usa solo para los números en
  // los pills de filtro, así siempre muestran cuántas respuestas hay
  // disponibles para cada opción.
  const pillIntentCounts = { yes: 0, maybe: 0, no: 0 };
  countryFilteredRows.forEach((r) => {
    if (r.q2_continuity_intent && pillIntentCounts[r.q2_continuity_intent] != null) {
      pillIntentCounts[r.q2_continuity_intent] += 1;
    }
  });

  // Filtro global: instancia + AE + país + intención (Sí/Tal vez/No). Afecta
  // KPIs, gráfico, temas y la lista de respuestas individuales — no solo la
  // última sección.
  const scopedRows = useMemo(() => {
    if (intentFilter === "all") return countryFilteredRows;
    return countryFilteredRows.filter((r) => r.q2_continuity_intent === intentFilter);
  }, [countryFilteredRows, intentFilter]);

  const total = scopedRows.length;
  const avgRating = total
    ? (scopedRows.reduce((sum, r) => sum + (r.q1_rating || 0), 0) / total).toFixed(2)
    : "-";

  const intentCounts = { yes: 0, maybe: 0, no: 0 };
  scopedRows.forEach((r) => {
    if (r.q2_continuity_intent && intentCounts[r.q2_continuity_intent] != null) {
      intentCounts[r.q2_continuity_intent] += 1;
    }
  });
  const pctYes = total ? Math.round((intentCounts.yes / total) * 100) : 0;
  const metGoal = pctYes >= CONTINUITY_THRESHOLD;

  const q2Data = INTENT_ORDER.map((k) => ({
    key: k,
    label: t.intentFull[k],
    cantidad: intentCounts[k],
    color: CHART_INTENT_COLORS[k],
  }));
  const maxQ2Count = Math.max(1, ...q2Data.map((d) => d.cantidad));

  const ratingData = [1, 2, 3, 4, 5].map((n) => ({
    rating: `${n}`,
    label: `${t.ratingWord} ${n}`,
    cantidad: scopedRows.filter((r) => r.q1_rating === n).length,
    color: ratingColor(n),
  }));
  const maxRatingCount = Math.max(1, ...ratingData.map((d) => d.cantidad));

  const listRows = useMemo(() => {
    let list = scopedRows;
    if (hideEmptyComments) {
      list = list.filter((r) => (r.q3_comment || "").trim() !== "");
    }
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => (r.q3_comment || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [scopedRows, search, hideEmptyComments]);

  const themeGroups = useMemo(() => {
    const map = new Map();
    scopedRows.forEach((r) => {
      const key = classifyTheme(r.q3_comment);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, count: items.length, items }))
      .sort((a, b) => b.count - a.count);
  }, [scopedRows]);

  const selectedInstanceLabel =
    instanceFilter === "all"
      ? t.allInstances
      : instances.find((i) => String(i.id) === String(instanceFilter))?.label || t.allInstances;

  const selectedInstanceName =
    instanceFilter === "all"
      ? t.allInstances
      : instances.find((i) => String(i.id) === String(instanceFilter))?.name || t.instanceFallback;

  const selectedAeLabel = aeFilter === "all" ? t.allAes : aeFilter;
  const selectedCountryLabel = countryFilter === "all" ? t.allCountries : countryFilter;

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
        setRedashUpdatedAt(json.retrievedAt || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleRefreshRef = useRef(handleRefresh);
  handleRefreshRef.current = handleRefresh;

  useEffect(() => {
    const AUTO_REFRESH_MS = 5 * 60 * 1000;
    const id = setInterval(() => {
      handleRefreshRef.current();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  async function fetchDownloadLog() {
    setLoadingLog(true);
    try {
      const res = await fetch("/api/log-download", { cache: "no-store" });
      const json = await res.json();
      setDownloadLog(json.log || []);
    } catch (err) {
      // silencioso: el historial no es crítico para el resto del dashboard
    } finally {
      setLoadingLog(false);
    }
  }

  useEffect(() => {
    fetchDownloadLog();
  }, []);

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

  async function handleConfirmDownload() {
    if (!downloaderName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setShowDownloadModal(false);

    const intentLabelForLog = intentFilter === "all" ? t.filterAllLabel : t.intents[intentFilter];

    await handleDownloadPdf();

    try {
      await fetch("/api/log-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: downloaderName.trim(),
          email: downloaderEmail.trim(),
          instanceLabel: selectedInstanceLabel,
          aeLabel: selectedAeLabel,
          countryLabel: selectedCountryLabel,
          intentLabel: intentLabelForLog,
          lang,
        }),
      });
    } catch (err) {
      // no bloqueamos la descarga si falla el registro
    }

    setDownloaderName("");
    setDownloaderEmail("");
    fetchDownloadLog();
  }

  const filtersAppliedText =
    instanceFilter !== "all" ||
    aeFilter !== "all" ||
    countryFilter !== "all" ||
    intentFilter !== "all" ||
    search.trim() !== ""
      ? `${t.filtersApplied}: ${t.instanceLabel} — ${selectedInstanceLabel}` +
        (aeFilter !== "all" ? ` · ${t.aeLabel} — ${selectedAeLabel}` : "") +
        (countryFilter !== "all" ? ` · ${t.countryLabel} — ${selectedCountryLabel}` : "") +
        (intentFilter !== "all" ? ` · ${t.intentLabel} — ${t.intents[intentFilter]}` : "") +
        (search.trim() !== "" ? ` · ${t.searchLabel} — "${search.trim()}"` : "")
      : null;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 16px 64px" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <LangToggle lang={lang} onChange={setLang} />
      </div>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>{t.title}</h1>
          <InstanceBadge label={t.instanceShownLabel} name={selectedInstanceName} />
          <p style={{ color: "var(--text-lighter)", fontSize: 14, margin: "10px 0 0" }}>
            {t.subtitle}
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
                borderRadius: "var(--radius-s)",
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? `↺ ${t.refreshing}` : `↺ ${t.refresh}`}
            </button>
            <button
              className="no-print"
              onClick={() => setShowDownloadModal(true)}
              disabled={generatingPdf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--brand-500)",
                color: "#fff",
                border: "1px solid var(--brand-500)",
                borderRadius: "var(--radius-s)",
                padding: "8px 16px",
                fontSize: 14,
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
              {generatingPdf ? t.generatingPdf : t.downloadPdf}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-lighter)", margin: "8px 0 0" }}>
            {t.updated}: {formatDate(redashUpdatedAt, t.dateLocale)}
          </p>
        </div>
      </header>

      {error && (
        <div
          style={{
            background: "#fde3e3",
            color: "var(--red-700)",
            padding: 12,
            borderRadius: "var(--radius-s)",
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
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-lighter)" }}>
          {t.filterByInstance}
        </span>
        <InstanceDropdown
          instances={instances}
          value={instanceFilter}
          label={selectedInstanceLabel}
          onChange={handleInstanceFilterChange}
          t={t}
        />
        {instanceFilter !== "all" && (
          <button
            onClick={() => setInstanceFilter("all")}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-600)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t.clearFilter}
          </button>
        )}
      </div>

      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-lighter)" }}>
          {t.filterByAe}
        </span>
        <InstanceDropdown
          instances={aeOptions}
          value={aeFilter}
          label={selectedAeLabel}
          onChange={handleAeFilterChange}
          t={{ ...t, allInstances: t.allAes, searchInstance: t.searchAe }}
        />
        {aeFilter !== "all" && (
          <button
            onClick={() => setAeFilter("all")}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-600)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t.clearFilter}
          </button>
        )}
      </div>

      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-lighter)" }}>
          {t.filterByCountry}
        </span>
        <InstanceDropdown
          instances={countryOptions}
          value={countryFilter}
          label={selectedCountryLabel}
          onChange={handleCountryFilterChange}
          t={{ ...t, allInstances: t.allCountries, searchInstance: t.searchCountry }}
        />
        {countryFilter !== "all" && (
          <button
            onClick={() => setCountryFilter("all")}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-600)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t.clearFilter}
          </button>
        )}
        <span className="no-print" style={{ fontSize: 12, color: "var(--text-lighter)" }}>
          {t.staticDataNote(AE_DATA_DATE)}
        </span>
      </div>

      <div
        className="no-print"
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-lighter)" }}>
          {t.filterByIntent}
        </span>
        <FilterPill
          label={`${t.filterAllLabel} (${countryFilteredRows.length})`}
          active={intentFilter === "all"}
          onClick={() => setIntentFilter("all")}
        />
        {INTENT_ORDER.map((k) => (
          <FilterPill
            key={k}
            label={`${t.intents[k]} (${pillIntentCounts[k]})`}
            active={intentFilter === k}
            onClick={() => setIntentFilter(k)}
          />
        ))}
      </div>

      {filtersAppliedText && (
        <p className="print-only" style={{ fontSize: 12, color: "var(--text-lighter)", margin: 0 }}>
          {filtersAppliedText}
        </p>
      )}
      <div style={{ marginBottom: 32 }} />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <KpiCard
          label={t.kpiContinuity}
          value={`${pctYes}%`}
          sublabel={t.kpiThreshold(CONTINUITY_THRESHOLD)}
          highlight={metGoal}
          info={t.infoContinuity(CONTINUITY_THRESHOLD)}
          infoLabel={t.infoIconLabel}
        />
        <KpiCard label={t.kpiResponses} value={total} />
        <KpiCard label={t.kpiAvgRating} value={avgRating} />
        <KpiCard
          label={t.kpiWontContinue}
          value={intentCounts.no}
          accent={intentCounts.no > 0 ? "var(--red-700)" : undefined}
        />
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: "var(--radius-l)",
          boxShadow: "var(--shadow-4dp)",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 16 }}>{t.q1Title}</h2>
          <span style={{ fontSize: 12, color: "var(--text-lighter)" }}>n={total}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ratingData} layout="vertical" margin={{ left: 12, right: 24 }}>
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
          borderRadius: "var(--radius-l)",
          boxShadow: "var(--shadow-4dp)",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 16 }}>{t.q2Title}</h2>
          <span style={{ fontSize: 12, color: "var(--text-lighter)" }}>n={total}</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={q2Data} layout="vertical" margin={{ left: 12, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, maxQ2Count]} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={200} />
            <Tooltip />
            <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={22}>
              {q2Data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: "var(--radius-l)",
          boxShadow: "var(--shadow-4dp)",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 16 }}>{t.themesTitle}</h2>
          <span style={{ fontSize: 12, color: "var(--text-lighter)" }}>{t.themesSubtitle}</span>
        </div>
        <ThemeSummary groups={themeGroups} t={t} />
      </section>

      <section
        className="no-print"
        style={{
          background: "#fff",
          borderRadius: "var(--radius-l)",
          boxShadow: "var(--shadow-4dp)",
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>{t.individualResponses}</h2>

        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchComments}
            style={{
              flex: "1 1 220px",
              padding: "8px 12px",
              borderRadius: "var(--radius-s)",
              border: "1px solid var(--neutral-300)",
              fontSize: 14,
            }}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              color: "var(--text-default)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={hideEmptyComments}
              onChange={(e) => setHideEmptyComments(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            {t.hideEmptyComments}
          </label>
          <span style={{ fontSize: 12, color: "var(--text-lighter)", alignSelf: "center" }}>
            {t.shownCount(listRows.length)}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {listRows.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--text-lighter)" }}>{t.noResponsesFilter}</p>
          )}
          {listRows.map((r) => (
            <ResponseCard key={r.id} row={r} t={t} />
          ))}
        </div>
      </section>

      <section
        className="no-print"
        style={{
          background: "#fff",
          borderRadius: "var(--radius-l)",
          boxShadow: "var(--shadow-4dp)",
          padding: 24,
          marginTop: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16 }}>{t.downloadLogTitle}</h2>
          <span style={{ fontSize: 12, color: "var(--text-lighter)" }}>{t.downloadLogSubtitle}</span>
        </div>
        <DownloadLogTable log={downloadLog} loading={loadingLog} t={t} />
      </section>

      {showDownloadModal && (
        <DownloadModal
          t={t}
          name={downloaderName}
          email={downloaderEmail}
          nameError={nameError}
          onNameChange={(v) => {
            setDownloaderName(v);
            if (v.trim()) setNameError(false);
          }}
          onEmailChange={setDownloaderEmail}
          onCancel={() => {
            setShowDownloadModal(false);
            setNameError(false);
          }}
          onConfirm={handleConfirmDownload}
        />
      )}

      {/* Snapshot oculto fuera de la pantalla: es lo único que se captura para el PDF.
          Nunca se muestra, así que generar el PDF no produce ningún parpadeo visual
          en la página real. Muestra temas agrupados en vez de cada respuesta individual. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -99999,
          width: 960,
          background: "#fff",
        }}
      >
        <div ref={reportRef} style={{ width: 960, background: "#fff", padding: 56, boxSizing: "border-box" }}>
          <h1 style={{ fontSize: 22 }}>{t.pdfTitle}</h1>
          <InstanceBadge label={t.instanceShownLabel} name={selectedInstanceName} />
          <p style={{ color: "var(--text-lighter)", fontSize: 13, margin: "10px 0 24px" }}>
            {t.subtitle} · {t.generatedAt}: {formatDate(redashUpdatedAt, t.dateLocale)}
          </p>

          {filtersAppliedText && (
            <p style={{ fontSize: 12, color: "var(--text-lighter)", marginBottom: 16 }}>
              {filtersAppliedText}
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <KpiCard
              label={t.kpiContinuity}
              value={`${pctYes}%`}
              sublabel={t.kpiThreshold(CONTINUITY_THRESHOLD)}
              highlight={metGoal}
            />
            <KpiCard label={t.kpiResponses} value={total} />
            <KpiCard label={t.kpiAvgRating} value={avgRating} />
            <KpiCard
              label={t.kpiWontContinue}
              value={intentCounts.no}
              accent={intentCounts.no > 0 ? "var(--red-700)" : undefined}
            />
          </div>

          <div
            style={{
              border: "1px solid var(--neutral-200)",
              borderRadius: "var(--radius-l)",
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16 }}>{t.q1Title}</h2>
              <span style={{ fontSize: 12, color: "var(--text-lighter)" }}>n={total}</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingData} layout="vertical" margin={{ left: 12, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, maxRatingCount]} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={80} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={22}>
                  {ratingData.map((d) => (
                    <Cell key={d.rating} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              border: "1px solid var(--neutral-200)",
              borderRadius: "var(--radius-l)",
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16 }}>{t.q2Title}</h2>
              <span style={{ fontSize: 12, color: "var(--text-lighter)" }}>n={total}</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={q2Data} layout="vertical" margin={{ left: 12, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, maxQ2Count]} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={200} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={22}>
                  {q2Data.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              border: "1px solid var(--neutral-200)",
              borderRadius: "var(--radius-l)",
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>{t.themesTitle}</h2>
            <ThemeSummary groups={themeGroups} t={t} />
          </div>
        </div>
      </div>
    </main>
  );
}

function InstanceBadge({ label, name }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 0" }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-lighter)" }}>{label}</span>
      <span
        style={{
          display: "inline-block",
          background: "var(--blueprimary-100)",
          color: "var(--brand-600)",
          borderRadius: 999,
          padding: "6px 16px",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {name}
      </span>
    </div>
  );
}

function LangToggle({ lang, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--neutral-300)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      {["es", "en"].map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-pressed={lang === code}
          style={{
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: lang === code ? "var(--brand-500)" : "#fff",
            color: lang === code ? "#fff" : "var(--text-lighter)",
          }}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function ThemeSummary({ groups, t }) {
  if (groups.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-lighter)" }}>{t.themesEmpty}</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {groups.map((g) => (
        <div
          key={g.key}
          style={{
            border: "1px solid var(--neutral-200)",
            borderRadius: "var(--radius-l)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t.themes[g.key]}</span>
            <Pill text={`${g.count}`} color="var(--brand-600)" bg="var(--blueprimary-100)" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {g.items.slice(0, 3).map((r) => (
              <p key={r.id} style={{ margin: 0, fontSize: 12, color: "var(--text-lighter)", fontStyle: "italic" }}>
                “{r.q3_comment.length > 110 ? r.q3_comment.slice(0, 110) + "…" : r.q3_comment}”
              </p>
            ))}
            {g.items.length > 3 && (
              <p style={{ margin: 0, fontSize: 10, color: "var(--text-lighter)" }}>
                {t.moreCount(g.items.length - 3)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResponseCard({ row, t }) {
  const intent = row.q2_continuity_intent;
  const borderColor = INTENT_COLORS[intent] || "var(--neutral-300)";
  return (
    <div
      style={{
        border: "1px solid var(--neutral-200)",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "var(--radius-l)",
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
          marginBottom: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {row.userName || `${t.userFallback} ${row.userId}`}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-lighter)" }}>
            {t.ratingWord} {row.q1_rating ?? "-"} ·{" "}
            {row.instanceName ? `${row.instanceName} (${row.instanceId})` : `${t.instanceFallback} ${row.instanceId}`}
            {" · "}
            {formatDate(row.completedAt, t.dateLocale)}
          </p>
        </div>
        <Pill
          text={t.intents[intent] || "-"}
          color={INTENT_COLORS[intent] || "var(--text-lighter)"}
          bg={INTENT_BG[intent] || "var(--neutral-100)"}
        />
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-lighter)" }}>
        {t.q3Label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 14 }}>
        {row.q3_comment && row.q3_comment.trim() !== "" ? row.q3_comment : "—"}
      </p>
    </div>
  );
}

function KpiCard({ label, value, sublabel, accent, highlight, info, infoLabel }) {
  return (
    <div
      style={{
        position: "relative",
        background: highlight ? "#e6fbe9" : "#fff",
        border: highlight ? "1px solid #abedb6" : "1px solid var(--neutral-200)",
        borderRadius: "var(--radius-l)",
        padding: 16,
        boxShadow: "var(--shadow-4dp)",
      }}
    >
      {info && <InfoTooltip text={info} label={infoLabel} />}
      <p
        style={{
          margin: 0,
          fontSize: 32,
          lineHeight: 1.3,
          fontWeight: 600,
          color: accent || (highlight ? "var(--green-700)" : "var(--text-default)"),
        }}
      >
        {value}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 600, color: "var(--text-lighter)", textTransform: "uppercase" }}>
        {label}
      </p>
      {sublabel && (
        <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--text-lighter)" }}>{sublabel}</p>
      )}
    </div>
  );
}

function InfoTooltip({ text, label }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="no-print" style={{ position: "absolute", top: 12, right: 12 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label={label || "info"}
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1px solid var(--neutral-300)",
          background: "#fff",
          color: "var(--text-lighter)",
          fontSize: 10,
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
            top: 24,
            right: 0,
            width: 220,
            background: "var(--neutral-950)",
            color: "#fff",
            borderRadius: "var(--radius-s)",
            padding: 12,
            fontSize: 10,
            fontWeight: 400,
            textTransform: "none",
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

function InstanceDropdown({ instances, value, label, onChange, t }) {
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
          borderRadius: "var(--radius-s)",
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-default)",
          cursor: "pointer",
          minWidth: 220,
          justifyContent: "space-between",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--text-lighter)", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
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
              borderRadius: "var(--radius-l)",
              boxShadow: "var(--shadow-8dp)",
              minWidth: 280,
              maxHeight: 320,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 12, borderBottom: "1px solid var(--neutral-200)" }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchInstance}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-s)",
                  border: "1px solid var(--neutral-300)",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ overflowY: "auto" }}>
              <DropdownOption text={t.allInstances} selected={value === "all"} onClick={() => select("all")} />
              {filtered.length === 0 && (
                <p style={{ padding: "12px 16px", fontSize: 14, color: "var(--text-lighter)" }}>
                  {t.noResults}
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
        padding: "8px 16px",
        fontSize: 14,
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

function DownloadModal({ t, name, email, nameError, onNameChange, onEmailChange, onCancel, onConfirm }) {
  return (
    <div
      className="no-print"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--radius-l)",
          boxShadow: "var(--shadow-8dp)",
          padding: 24,
          width: "100%",
          maxWidth: 360,
        }}
      >
        <h3 style={{ fontSize: 18, margin: "0 0 8px" }}>{t.downloadModalTitle}</h3>
        <p style={{ fontSize: 12, color: "var(--text-lighter)", margin: "0 0 16px" }}>
          {t.downloadModalDesc}
        </p>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          {t.nameLabel}
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "var(--radius-s)",
            border: `1px solid ${nameError ? "var(--red-700)" : "var(--neutral-300)"}`,
            fontSize: 14,
            boxSizing: "border-box",
            marginBottom: nameError ? 4 : 16,
          }}
        />
        {nameError && (
          <p style={{ fontSize: 12, color: "var(--red-700)", margin: "0 0 12px" }}>{t.nameRequired}</p>
        )}

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          {t.emailLabel}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "var(--radius-s)",
            border: "1px solid var(--neutral-300)",
            fontSize: 14,
            boxSizing: "border-box",
            marginBottom: 20,
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              background: "#fff",
              color: "var(--text-default)",
              border: "1px solid var(--neutral-300)",
              borderRadius: "var(--radius-s)",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: "var(--brand-500)",
              color: "#fff",
              border: "1px solid var(--brand-500)",
              borderRadius: "var(--radius-s)",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.confirmDownloadLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DownloadLogTable({ log, loading, t }) {
  if (loading) {
    return <p style={{ fontSize: 14, color: "var(--text-lighter)" }}>{t.downloadLogLoading}</p>;
  }
  if (log.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-lighter)" }}>{t.downloadLogEmpty}</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {[t.colName, t.colEmail, t.colDate, t.colInstance, t.colAe, t.colCountry, t.colIntent, t.colLang].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--neutral-200)",
                  color: "var(--text-lighter)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {log.map((entry, idx) => (
            <tr key={idx}>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)" }}>{entry.name || "-"}</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)" }}>{entry.email || "-"}</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)", whiteSpace: "nowrap" }}>
                {formatDate(entry.date, t.dateLocale)}
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)" }}>{entry.instance || "-"}</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)" }}>{entry.ae || "-"}</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)" }}>{entry.country || "-"}</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)" }}>{entry.intent || "-"}</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--neutral-100)" }}>
                {(entry.lang || "-").toUpperCase()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
