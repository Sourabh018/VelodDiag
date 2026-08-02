import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";

/**
 * Fetches and updates the Diagnosis Engine's configurable thresholds for a
 * single application. No polling — settings only change when the user
 * explicitly saves, or when applicationName changes (new fetch for the
 * newly-selected app).
 */
export default function useSettings(applicationName) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);

  const fetchSettings = useCallback(async () => {
    // Guard: no app selected yet (e.g. app list still loading) — skip
    // the request entirely rather than hitting the endpoint with an
    // empty applicationName.
    if (!applicationName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get("/api/settings", {
        params: { applicationName },
      });
      setSettings(res.data);
      setError(null);
    } catch (err) {
      console.error("Settings fetch failed:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [applicationName]);

  const saveSettings = useCallback(async (updated) => {
    if (!applicationName) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const res = await apiClient.put("/api/settings", updated, {
        params: { applicationName },
      });
      setSettings(res.data);
      setSaveSuccess(true);
    } catch (err) {
      console.error("Settings save failed:", err.message);
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  }, [applicationName]);

  // Reset feature is unchanged — it already took an explicit applicationName
  // per call (independent of whichever app is selected for threshold editing),
  // so it needs no changes for the per-app settings scoping.
  const resetApplication = useCallback(async (targetApplicationName, token) => {
    setResetting(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      const res = await apiClient.delete("/api/admin/reset-application", {
        params: { applicationName: targetApplicationName },
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

  // Re-fetch whenever the selected application changes.
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