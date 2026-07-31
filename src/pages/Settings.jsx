import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, CircularProgress, Paper, Grid } from "@mui/material";
import Header from "../components/Header";
import useSettings from "../hooks/useSettings";

function Settings() {
  const { settings, loading, saving, error, saveError, saveSuccess, saveSettings } = useSettings();

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
        <Typography variant="body2" sx={{ color: "#8C8C93", marginBottom: 3, fontSize: "15.5px" }}>
          Adjust the Diagnosis Engine's rule thresholds and lookback window. Changes apply immediately to future scans and are persisted, so they survive server restarts and redeploys.
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
                    Settings saved.
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Button
                  onClick={handleSave}
                  disabled={saving}
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
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </>
  );
}

export default Settings;