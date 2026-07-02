import { fetchSurveyRows } from "../lib/redash";
import Dashboard from "../components/Dashboard";

export const revalidate = 60;

export default async function Page() {
  let rows = [];
  let retrievedAt = null;
  let error = null;

  try {
    const result = await fetchSurveyRows();
    rows = result.rows;
    retrievedAt = result.retrievedAt;
  } catch (err) {
    error = err.message;
  }

  return <Dashboard initialRows={rows} initialError={error} initialRetrievedAt={retrievedAt} />;
}
