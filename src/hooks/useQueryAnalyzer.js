import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";
import { useSelectedApp } from "../contexts/AppContext";

/**
 * Fetches per-endpoint duration trends from the Query Analyzer.
 * Polls on an interval so trends stay current as new telemetry arrives.
 */
export default function useQueryAnalyzer({ intervalMs = 15000 } = {}) {
  const { selectedApp } = useSelectedApp();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrends = useCallback(async () => {
    try {
      const params = selectedApp ? { applicationName: selectedApp } : {};
      const res = await apiClient.get("/api/query-analyzer/trends", { params });
      setTrends(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("Query analyzer fetch failed:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [selectedApp]);

  useEffect(() => {
    fetchTrends();
    const id = setInterval(fetchTrends, intervalMs);
    return () => clearInterval(id);
  }, [fetchTrends, intervalMs]);

  return { trends, loading, error, refetch: fetchTrends };
}