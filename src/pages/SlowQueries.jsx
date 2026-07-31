import { Box, Typography, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, Paper } from "@mui/material";
import Header from "../components/Header";
import useDashboardMetrics from "../hooks/useDashboardMetrics";
import { useSelectedApp } from "../contexts/AppContext";

// Same severity ramp used on Dashboard's Slow Endpoints and FindingCard —
// one duration-to-severity mapping reused everywhere instead of three
// slightly different definitions of "how slow is bad."
function severityForDuration(ms) {
  if (ms >= 3000) return { dot: "#E5484D", text: "#F5A3A3", bg: "rgba(229,72,77,0.12)", label: "HIGH" };
  if (ms >= 1000) return { dot: "#D9A24B", text: "#F0C989", bg: "rgba(217,162,75,0.12)", label: "MEDIUM" };
  return { dot: "#5B7CFF", text: "#C3CCFF", bg: "rgba(91,124,255,0.12)", label: "LOW" };
}

function SeverityTag({ avgDuration }) {
  const s = severityForDuration(avgDuration);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box sx={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: s.dot }} />
      <Typography
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 11.5,
          letterSpacing: "0.03em",
          color: s.text,
          backgroundColor: s.bg,
          padding: "2px 8px",
          borderRadius: 10,
        }}
      >
        {s.label}
      </Typography>
    </Box>
  );
}

function SlowQueries() {
  const { selectedApp } = useSelectedApp();
  const { slowEndpoints, loading, error } = useDashboardMetrics({ applicationName: selectedApp });
  const safeSlowEndpoints = Array.isArray(slowEndpoints) ? slowEndpoints : [];

  // Sort slowest-first so the worst offenders are immediately visible
  const sorted = [...safeSlowEndpoints].sort((a, b) => b.avgDuration - a.avgDuration);

  return (
    <>
      <Header />
      <Box sx={{ marginLeft: "220px", marginTop: "64px", padding: 4 }}>

        {error && (
          <Typography
            sx={{
              display: "inline-block",
              fontSize: 13.5,
              color: "#F5A3A3",
              border: "1px solid rgba(229,72,77,0.25)",
              backgroundColor: "rgba(229,72,77,0.08)",
              borderRadius: 10,
              padding: "4px 12px",
              marginBottom: 2,
            }}
          >
            Could not reach VeloxDiag server — showing last known data
          </Typography>
        )}

        <Typography sx={{ fontSize: 16.5, fontWeight: 500, color: "#EDEDEF", marginBottom: 0.5 }}>
          Slow Queries
        </Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary", marginBottom: 3 }}>
          Endpoints averaging above the slow-request threshold, sorted worst-first.
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress size={24} sx={{ color: "text.disabled" }} />
          </Box>
        ) : sorted.length === 0 ? (
          <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>No slow endpoints recorded.</Typography>
        ) : (
          <Paper
            variant="outlined"
            sx={{ backgroundColor: "#111113", borderColor: "rgba(255,255,255,0.07)", borderRadius: "10px" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Endpoint", "Avg Duration", "Sample Count", "Severity"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{ fontSize: 12, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((ep, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: "#EDEDEF", borderColor: "rgba(255,255,255,0.05)" }}>
                      {ep.endpoint}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: "#D4D4D8", fontVariantNumeric: "tabular-nums", borderColor: "rgba(255,255,255,0.05)" }}>
                      {ep.avgDuration.toFixed(0)}ms
                    </TableCell>
                    <TableCell sx={{ fontSize: 13.5, color: "text.secondary", borderColor: "rgba(255,255,255,0.05)" }}>
                      {ep.count}
                    </TableCell>
                    <TableCell sx={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <SeverityTag avgDuration={ep.avgDuration} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </>
  );
}

export default SlowQueries;