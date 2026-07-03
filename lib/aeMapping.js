import aeMappingJson from "./aeMapping.json";

// Mapeo estático instancia -> Account Executive, exportado manualmente desde
// el Google Sheet "AEs Meeting links" (pestaña "Output"). No es en vivo: hay
// que regenerarlo a mano cuando cambien asignaciones de AE.
// Ver README, sección "Mapeo de AE por instancia" para el paso a paso.
const AE_MAPPING = aeMappingJson;

export function getAeForInstance(instanceId) {
  if (instanceId == null) return null;
  return AE_MAPPING[String(instanceId)] || null;
}

export function getAllAeNames() {
  return Array.from(new Set(Object.values(AE_MAPPING))).sort((a, b) => a.localeCompare(b));
}
