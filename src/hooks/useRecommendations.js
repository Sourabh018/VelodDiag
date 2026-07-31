import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useSelectedApp } from "../contexts/AppContext";

// Fetches GET /api/diagnosis/recommendations — findings that have a concrete
// suggestedFix, grouped by endpoint. Separate hook (not reused from
// useDashboardMetrics) since this page has its own single data source and
// its own loading/error lifecycle, not a bundle of several summary calls.
function useRecommendations() {
  const { selectedApp } = useSelectedApp();
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = selectedApp ? { applicationName: selectedApp } : {};
        const res = await apiClient.get("/api/diagnosis/recommendations", { params });
        if (!cancelled) {
          setRecommendations(res.data ?? {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Failed to load recommendations");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedApp]);

  return { recommendations, loading, error };
}

export default useRecommendations;