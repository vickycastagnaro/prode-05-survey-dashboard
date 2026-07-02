import { NextResponse } from "next/server";
import { appendDownloadLog, getDownloadLog } from "../../../lib/downloadLog";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    await appendDownloadLog(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const log = await getDownloadLog({ limit: 100 });
    return NextResponse.json({ log });
  } catch (err) {
    // No rompemos el dashboard si todavía no está configurado Google Sheets:
    // devolvemos lista vacía + el error para poder mostrarlo si hace falta.
    return NextResponse.json({ log: [], error: err.message }, { status: 200 });
  }
}
