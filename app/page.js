import { fetchSurveyRows } from "../lib/redash";
import Dashboard from "../components/Dashboard";

export const revalidate = 60;

export default async function Page() {
  let rows = [];
  let error = null;

  try {
    rows = await fetchSurveyRows();
  } catch (err) {
    error = err.message;
  }

  return <Dashboard initialRows={rows} initialError={error} />;
}
