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

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, saving, error, saveError, saveSuccess, saveSettings, refetch: fetchSettings };
}