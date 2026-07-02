import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// En Vercel, los saltos de línea de la private key vienen escapados como "\n".
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

// Nombre de la hoja (tab) dentro del Google Sheet donde se van a loguear las
// descargas. Debe existir con este nombre exacto y tener en la fila 1 los
// encabezados: Nombre | Email | Fecha | Instancia | Intención | Idioma
const SHEET_RANGE = "Descargas!A:F";

function getAuth() {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error(
      "Faltan credenciales de Google (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY). Ver .env.example."
    );
  }
  return new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendDownloadLog({ name, email, instanceLabel, intentLabel, lang }) {
  if (!SHEET_ID) {
    throw new Error("Falta GOOGLE_SHEET_ID. Ver .env.example.");
  }
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [name || "", email || "", timestamp, instanceLabel || "", intentLabel || "", lang || ""],
      ],
    },
  });
}

export async function getDownloadLog({ limit = 50 } = {}) {
  if (!SHEET_ID) {
    throw new Error("Falta GOOGLE_SHEET_ID. Ver .env.example.");
  }
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = res.data.values || [];
  // Salteamos la fila de encabezado si está presente.
  const dataRows = rows.filter((r, idx) => !(idx === 0 && r[0] === "Nombre"));

  const mapped = dataRows.map((r) => ({
    name: r[0] || "",
    email: r[1] || "",
    date: r[2] || "",
    instance: r[3] || "",
    intent: r[4] || "",
    lang: r[5] || "",
  }));

  return mapped.slice(-limit).reverse();
}
