import countryMappingJson from "./countryMapping.json";

// Mapeo estático instancia -> país, exportado manualmente desde el Google
// Sheet "PRODE - Pipeline - Analysis" (pestaña "FREE TRIAL DEALS", columna
// "Main Country"). No es en vivo: hay que regenerarlo a mano cuando cambien
// datos. Ver README, sección "Mapeo de país por instancia".
const COUNTRY_MAPPING = countryMappingJson;

export function getCountryForInstance(instanceId) {
  if (instanceId == null) return null;
  return COUNTRY_MAPPING[String(instanceId)] || null;
}
