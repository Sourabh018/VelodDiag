import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";

/**
 * Fetches real dashboard data from the VeloxDiag server.
 * Polls on an interval so the dashboard stays live.
 * Pass applicationName — always a real app name once AppSelector has loaded;
 * null briefly before then, which sends no filter (harmless first-tick case).
 */
export default function useDashboardMetrics({ intervalMs = 15000, applicationName } = {}) {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [errors, setErrors] = useState([]);
  const [slowEndpoints, setSlowEndpoints] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const appParam = applicationName ? { applicationName } : {};

      const [summaryRes, recentRes, errorsRes, slowRes, trendsRes] = await Promise.all([
        apiClient.get("/api/dashboard/summary", { params: appParam }),
        apiClient.get("/api/dashboard/recent", { params: { limit: 20, ...appParam } }),
        apiClient.get("/api/dashboard/errors", { params: { limit: 20, ...appParam } }),
        apiClient.get("/api/dashboard/slow-endpoints", { params: { limit: 10, ...appParam } }),
        apiClient.get("/api/dashboard/trends", { params: { hours: 24, ...appParam } }),
      ]);

      setSummary(summaryRes.data);
      setRecent(recentRes.data);
      setErrors(errorsRes.data);
      setSlowEndpoints(slowRes.data);
      setTrends(trendsRes.data);
      setError(null);
    } catch (err) {
      console.error("Dashboard fetch failed:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [applicationName]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, intervalMs);
    return () => clearInterval(id);
  }, [fetchAll, intervalMs]);

  return { summary, recent, errors, slowEndpoints, trends, loading, error, refetch: fetchAll };
}