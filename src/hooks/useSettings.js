import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";

/**
 * Fetches and updates the Diagnosis Engine's configurable thresholds.
 * No polling — settings only change when the user explicitly saves.
 */
export default function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Separate state for the reset feature — kept independent from the
  // threshold-save state above since they're unrelated actions on the
  // same page and shouldn't share a loading/error/success flag.
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null); // holds the result object on success, not just a boolean

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/settings");
      setSettings(res.data);
      setError(null);
    } catch (err) {
      console.error("Settings fetch failed:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (updated) => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const res = await apiClient.put("/api/settings", updated);
      setSettings(res.data);
      setSaveSuccess(true);
    } catch (err) {
      console.error("Settings save failed:", err.message);
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  }, []);

  // Wipes telemetry + slow query plans for one application. Token is passed
  // in per-call (typed by the user at reset time), never stored in state
  // beyond the lifetime of this request, never persisted anywhere.
  const resetApplication = useCallback(async (applicationName, token) => {
    setResetting(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      const res = await apiClient.delete("/api/admin/reset-application", {
        params: { applicationName },
        headers: { "X-Admin-Token": token },
      });
      setResetSuccess(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      console.error("Reset failed:", err.message);
      setResetError(err);
      return { ok: false, error: err };
    } finally {
      setResetting(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    saveError,
    saveSuccess,
    saveSettings,
    refetch: fetchSettings,
    resetting,
    resetError,
    resetSuccess,
    resetApplication,
  };
}