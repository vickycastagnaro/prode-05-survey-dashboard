import { getAeForInstance } from "./aeMapping";
import { getCountryForInstance } from "./countryMapping";

const BASE_URL = process.env.REDASH_BASE_URL || "https://redash.humand.co";
const QUERY_ID = process.env.REDASH_QUERY_ID || "49867";
const API_KEY = process.env.REDASH_API_KEY;

// Instancias de test que no deben aparecer en el dashboard (usadas solo para
// armar/probar el reporte, no son clientes reales).
const EXCLUDED_INSTANCE_IDS = [269840]; // Whale Testing

export async function fetchSurveyRows({ fresh = false } = {}) {
  if (!API_KEY) {
    throw new Error(
      "Falta REDASH_API_KEY. Configurala en las variables de entorno del proyecto (ver .env.example)."
    );
  }

  const url = `${BASE_URL}/api/queries/${QUERY_ID}/results.json?api_key=${API_KEY}`;
  const res = await fetch(
    url,
    fresh ? { cache: "no-store" } : { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    throw new Error(`Redash respondió con estado ${res.status}`);
  }

  const json = await res.json();
  const rows = json?.query_result?.data?.rows || [];
  // Momento en que Redash calculó este resultado (no cuando esta app lo pidió).
  const retrievedAt = json?.query_result?.retrieved_at || null;

  const mappedRows = rows
    .filter((r) => !EXCLUDED_INSTANCE_IDS.includes(r.instanceId))
    .map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user_name || null,
      instanceId: r.instanceId,
      instanceName: r.instance_name || null,
      completedAt: r.completedAt,
      q1_rating: r.q1_rating,
      q2_continuity_intent: r.q2_continuity_intent,
      q3_comment: r.q3_comment,
      aeName: getAeForInstance(r.instanceId),
      countryName: getCountryForInstance(r.instanceId),
    }));

  return { rows: mappedRows, retrievedAt };
}
