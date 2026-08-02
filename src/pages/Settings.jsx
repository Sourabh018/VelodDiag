import { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, CircularProgress, Paper, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
} from "@mui/material";
import Header from "../components/Header";
import useSettings from "../hooks/useSettings";
import apiClient from "../api/client";
import { useSelectedApp } from "../contexts/AppContext";

function Settings() {
  // Reuses the same global app selector already in the Header (AppSelector.jsx)
  // instead of adding a second, separate dropdown on this page. Whatever app
  // the user has selected app-wide is what these thresholds edit.
  const { selectedApp } = useSelectedApp();

  // Apps list — used only for the Reset Application Data section below,
  // which intentionally lists every app regardless of the global selection.
  const [apps, setApps] = useState([]);
  useEffect(() => {
    apiClient
      .get("/api/dashboard/applications")
      .then((res) => setApps(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Fetch applications failed:", err.message));
  }, []);

  // useSettings is scoped to the globally-selected app — null/empty before
  // AppSelector has loaded is a guarded no-op inside the hook.
  const {
    settings, loading, saving, error, saveError, saveSuccess, saveSettings,
    resetting, resetError, resetSuccess, resetApplication,
  } = useSettings(selectedApp);

  const [form, setForm] = useState({
    slowRequestThresholdMs: "",
    highErrorRateThreshold: "",
    serverErrorStatusThreshold: "",
    lookbackDays: "",
    seqScanRowThreshold: "",
    minAvgDurationMs: "",
    lowVarianceThreshold: "",
    possibleNPlusOneQueryThreshold: "",
  });

  const [resetTarget, setResetTarget] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  const openResetDialog = (appName) => {
    setResetTarget(appName);
    setConfirmText("");
    setTokenInput("");
  };

  const closeResetDialog = () => {
    setResetTarget(null);
    setConfirmText("");
    setTokenInput("");
  };

  const handleConfirmReset = async () => {
    if (confirmText !== resetTarget) return;
    const result = await resetApplication(resetTarget, tokenInput);
    if (result.ok) {
      closeResetDialog();
    }
  };

  // Re-populate the form whenever settings reload — either on first load
  // or because selectedApp changed and useSettings re-fetched for the new app.
  useEffect(() => {
    if (settings) {
      setForm({
        slowRequestThresholdMs: settings.slowRequestThresholdMs,
        highErrorRateThreshold: settings.highErrorRateThreshold,
        serverErrorStatusThreshold: settings.serverErrorStatusThreshold,
        lookbackDays: settings.lookbackDays,
        seqScanRowThreshold: settings.seqScanRowThreshold,
        minAvgDurationMs: settings.minAvgDurationMs,
        lowVarianceThreshold: settings.lowVarianceThreshold,
        possibleNPlusOneQueryThreshold: settings.possibleNPlusOneQueryThreshold,
      });
    }
  }, [settings]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    saveSettings({
      applicationName: selectedApp,
      slowRequestThresholdMs: Number(form.slowRequestThresholdMs),
      highErrorRateThreshold: Number(form.highErrorRateThreshold),
      serverErrorStatusThreshold: Number(form.serverErrorStatusThreshold),
      lookbackDays: Number(form.lookbackDays),
      seqScanRowThreshold: Number(form.seqScanRowThreshold),
      minAvgDurationMs: Number(form.minAvgDurationMs),
      lowVarianceThreshold: Number(form.lowVarianceThreshold),
      possibleNPlusOneQueryThreshold: Number(form.possibleNPlusOneQueryThreshold),
    });
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#0C0C0E",
      "& fieldset": { borderColor: "rgba(255,255,255,0.07)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.14)" },
      "&.Mui-focused fieldset": { borderColor: "#5B7CFF" },
    },
    "& .MuiInputLabel-root": { color: "#8C8C93", fontSize: "14.5px" },
    "& .MuiInputBase-input": {
      color: "#EDEDEF",
      fontFamily: "IBM Plex Mono, ui-monospace, monospace",
      fontVariantNumeric: "tabular-nums",
      fontSize: "15.5px",
    },
    "& .MuiFormHelperText-root": { color: "#57575F", fontSize: "12.5px" },
  };

  return (
    <>
      <Header />
      <Box sx={{ marginLeft: "220px", marginTop: "64px", padding: 4, maxWidth: 600 }}>

        {error && (
          <Box
            sx={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: "4px",
              marginBottom: 2,
              color: "#F5A3A3",
              backgroundColor: "rgba(229,72,77,0.12)",
              fontSize: "14.5px",
            }}
          >
            Could not reach VeloxDiag server — showing last known data
          </Box>
        )}

        <Typography variant="h5" sx={{ marginBottom: 1, color: "#EDEDEF" }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: "#8C8C93", marginBottom: 1, fontSize: "15.5px" }}>
          Adjust the Diagnosis Engine's rule thresholds and lookback window for <strong style={{ color: "#EDEDEF" }}>{selectedApp || "the selected application"}</strong> (use the app selector in the header to switch). Each application has its own independent thresholds. Changes apply immediately to future scans of this application and are persisted, so they survive server restarts and redeploys.
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              padding: 3,
              backgroundColor: "#111113",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Lookback Window (days)"
                  helperText="Diagnosis, Query Analyzer, and Index Advisor only scan telemetry from this many days back — prevents stale historical data from skewing current findings"
                  type="number"
                  fullWidth
                  value={form.lookbackDays}
                  onChange={handleChange("lookbackDays")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Slow Request Threshold (ms)"
                  helperText="Endpoints averaging above this duration are flagged as SLOW_REQUEST"
                  type="number"
                  fullWidth
                  value={form.slowRequestThresholdMs}
                  onChange={handleChange("slowRequestThresholdMs")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="High Error Rate Threshold (count)"
                  helperText="Endpoints with this many 4xx/5xx errors or more are flagged as HIGH_ERROR_RATE"
                  type="number"
                  fullWidth
                  value={form.highErrorRateThreshold}
                  onChange={handleChange("highErrorRateThreshold")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Server Error Status Threshold"
                  helperText="Status codes at or above this value are counted as SERVER_ERROR (standard: 500)"
                  type="number"
                  fullWidth
                  value={form.serverErrorStatusThreshold}
                  onChange={handleChange("serverErrorStatusThreshold")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Seq Scan Row Threshold"
                  helperText="A captured EXPLAIN plan's Seq Scan is only flagged as MISSING_INDEX_CANDIDATE if the estimated row count exceeds this — filters out small tables where a full scan is the correct planner choice"
                  type="number"
                  fullWidth
                  value={form.seqScanRowThreshold}
                  onChange={handleChange("seqScanRowThreshold")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Possible N+1 Query Threshold (count)"
                  helperText="If a single request triggers this many SQL statements or more, it's flagged as POSSIBLE_N_PLUS_ONE"
                  type="number"
                  fullWidth
                  value={form.possibleNPlusOneQueryThreshold}
                  onChange={handleChange("possibleNPlusOneQueryThreshold")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Index Advisor: Min Avg Duration (ms)"
                  helperText="Endpoints must average at least this duration to be considered as a heuristic missing-index candidate"
                  type="number"
                  fullWidth
                  value={form.minAvgDurationMs}
                  onChange={handleChange("minAvgDurationMs")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Index Advisor: Low Variance Threshold"
                  helperText="Coefficient of variation (stdDev / avg) at or below this value is considered 'consistently slow' — a candidate signal for a missing index (e.g. 0.20 = requests typically vary by 20% or less from the average)"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  fullWidth
                  value={form.lowVarianceThreshold}
                  onChange={handleChange("lowVarianceThreshold")}
                  sx={fieldSx}
                />
              </Grid>

              {saveError && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      color: "#F5A3A3",
                      backgroundColor: "rgba(229,72,77,0.12)",
                      fontSize: "14.5px",
                    }}
                  >
                    Failed to save settings. Please try again.
                  </Box>
                </Grid>
              )}
              {saveSuccess && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      color: "#8FD9A8",
                      backgroundColor: "rgba(143,217,168,0.12)",
                      fontSize: "14.5px",
                    }}
                  >
                    Settings saved for {selectedApp}.
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Button
                  onClick={handleSave}
                  disabled={saving || !selectedApp}
                  sx={{
                    textTransform: "none",
                    color: "#EDEDEF",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "6px 18px",
                    fontSize: "14.5px",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.09)" },
                    "&.Mui-disabled": { color: "#57575F" },
                  }}
                >
                  {saving ? "Saving..." : `Save Changes for ${selectedApp || "..."}`}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Reset section — separate card, unchanged in shape (already correctly
            per-app before this change), still lists every app regardless of
            which one is selected above for threshold editing. */}
        <Paper
          variant="outlined"
          sx={{
            padding: 3,
            marginTop: 3,
            backgroundColor: "#111113",
            borderColor: "rgba(229,72,77,0.25)",
          }}
        >
          <Typography variant="h6" sx={{ color: "#EDEDEF", fontSize: "16.5px", marginBottom: 0.5 }}>
            Reset Application Data
          </Typography>
          <Typography variant="body2" sx={{ color: "#8C8C93", fontSize: "14.5px", marginBottom: 2 }}>
            Permanently deletes all telemetry and slow-query-plan records for the selected application only — other applications are never affected. This cannot be undone. Requires the admin reset token configured on the server.
          </Typography>

          {apps.length === 0 ? (
            <Typography sx={{ color: "#57575F", fontSize: "14px" }}>No applications found yet.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {apps.map((appName) => (
                <Box
                  key={appName}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#0C0C0E",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Typography sx={{ color: "#EDEDEF", fontFamily: "ui-monospace, monospace", fontSize: "14.5px" }}>
                    {appName}
                  </Typography>
                  <Button
                    onClick={() => openResetDialog(appName)}
                    sx={{
                      textTransform: "none",
                      color: "#F5A3A3",
                      backgroundColor: "rgba(229,72,77,0.08)",
                      border: "1px solid rgba(229,72,77,0.25)",
                      padding: "4px 14px",
                      fontSize: "13.5px",
                      "&:hover": { backgroundColor: "rgba(229,72,77,0.14)" },
                    }}
                  >
                    Reset Data
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Dialog open={resetTarget !== null} onClose={closeResetDialog} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: "#EDEDEF", backgroundColor: "#111113" }}>
            Reset "{resetTarget}" data?
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: "#111113" }}>
            <DialogContentText sx={{ color: "#8C8C93", fontSize: "14px", marginBottom: 2 }}>
              This permanently deletes all telemetry and slow-query-plan records for{" "}
              <strong style={{ color: "#EDEDEF" }}>{resetTarget}</strong> only. Type the application name below to confirm, then enter the admin reset token.
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              label={`Type "${resetTarget}" to confirm`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              sx={{ marginBottom: 2, ...fieldSx }}
            />
            <TextField
              fullWidth
              type="password"
              label="Admin reset token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              sx={fieldSx}
            />
            {resetError && (
              <Box
                sx={{
                  marginTop: 2,
                  padding: "8px 12px",
                  borderRadius: "4px",
                  color: "#F5A3A3",
                  backgroundColor: "rgba(229,72,77,0.12)",
                  fontSize: "13.5px",
                }}
              >
                Reset failed — check the token is correct and try again.
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ backgroundColor: "#111113", padding: 2 }}>
            <Button onClick={closeResetDialog} sx={{ textTransform: "none", color: "#8C8C93" }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReset}
              disabled={confirmText !== resetTarget || !tokenInput || resetting}
              sx={{
                textTransform: "none",
                color: "#F5A3A3",
                backgroundColor: "rgba(229,72,77,0.1)",
                "&:hover": { backgroundColor: "rgba(229,72,77,0.18)" },
                "&.Mui-disabled": { color: "#57575F", backgroundColor: "transparent" },
              }}
            >
              {resetting ? "Resetting..." : "Permanently Reset"}
            </Button>
          </DialogActions>
        </Dialog>

        {resetSuccess && (
          <Typography sx={{ color: "#8FD9A8", fontSize: "13.5px", marginTop: 1.5 }}>
            Reset complete for {resetSuccess.applicationName}: {resetSuccess.telemetryRowsDeleted} telemetry rows, {resetSuccess.slowQueryPlanRowsDeleted} slow-query-plan rows deleted.
          </Typography>
        )}
      </Box>
    </>
  );
}

export default Settings;