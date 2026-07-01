import { NextResponse } from "next/server";
import { fetchSurveyRows } from "../../../lib/redash";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await fetchSurveyRows({ fresh: true });
    return NextResponse.json({ rows, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
