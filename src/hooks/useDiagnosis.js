import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";

/**
 * Fetches diagnosis findings from the VeloxDiag server's rule-based engine.
 * Polls on an interval so findings stay current as new telemetry arrives.
 * Pass applicationName — always a real app name once AppSelector has loaded;
 * null briefly before then, which sends no filter (harmless first-tick case).
 */
export default function useDiagnosis({ intervalMs = 15000, applicationName } = {}) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFindings = useCallback(async () => {
    try {
      const appParam = applicationName ? { applicationName } : {};
      const res = await apiClient.get("/api/diagnosis", { params: appParam });
      setFindings(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("Diagnosis fetch failed:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [applicationName]);

  useEffect(() => {
    fetchFindings();
    const id = setInterval(fetchFindings, intervalMs);
    return () => clearInterval(id);
  }, [fetchFindings, intervalMs]);

  return { findings, loading, error, refetch: fetchFindings };
}