import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";
import { useSelectedApp } from "../contexts/AppContext";

/**
 * Fetches heuristic index-advisor candidates — endpoints that are both
 * slow and consistently slow (low variance), a proxy signal for missing indexes.
 */
export default function useIndexAdvisor({ intervalMs = 15000 } = {}) {
  const { selectedApp } = useSelectedApp();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCandidates = useCallback(async () => {
    try {
      const params = selectedApp ? { applicationName: selectedApp } : {};
      const res = await apiClient.get("/api/index-advisor/candidates", { params });
      setCandidates(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("Index advisor fetch failed:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [selectedApp]);

  useEffect(() => {
    fetchCandidates();
    const id = setInterval(fetchCandidates, intervalMs);
    return () => clearInterval(id);
  }, [fetchCandidates, intervalMs]);

  return { candidates, loading, error, refetch: fetchCandidates };
}