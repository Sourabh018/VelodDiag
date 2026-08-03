import { Grid, Box, Typography, CircularProgress } from "@mui/material";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import TrendChart from "../components/TrendChart";
import DashboardAiSummary from "../components/DashboardAiSummary";
import useDashboardMetrics from "../hooks/useDashboardMetrics";
import { useSelectedApp } from "../contexts/AppContext";

// Same severity ramp as FindingCard — duration bands reused here so a slow
// endpoint reads the same way whether you see it on the Dashboard or on the
// Diagnosis page, instead of two different visual languages for the same
// underlying signal.
function severityForDuration(ms) {
  if (ms >= 3000) return { dot: "#E5484D", text: "#F5A3A3" };
  if (ms >= 1000) return { dot: "#D9A24B", text: "#F0C989" };
  return { dot: "#5B7CFF", text: "#C3CCFF" };
}

function SlowEndpointRow({ endpoint, avgDuration, count }) {
  const style = severityForDuration(avgDuration);
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box sx={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: style.dot, flexShrink: 0 }} />
      <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: "#EDEDEF", flex: 1 }}>
        {endpoint}
      </Typography>
      <Typography
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 14,
          color: style.text,
          fontVariantNumeric: "tabular-nums",
          minWidth: 70,
          textAlign: "right",
        }}
      >
        {avgDuration.toFixed(0)}ms
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: "text.disabled", minWidth: 90, textAlign: "right" }}>
        {count} requests
      </Typography>
    </Box>
  );
}

function Dashboard() {
  const { selectedApp } = useSelectedApp();
  const { summary, slowEndpoints, trends, loading, error } = useDashboardMetrics({
    applicationName: selectedApp,
  });

  const safeSlowEndpoints = Array.isArray(slowEndpoints) ? slowEndpoints : [];
  const safeTrends = Array.isArray(trends) ? trends : [];

  const totalRequests = summary?.totalRequests ?? 0;
  const errorCount = summary?.errorRequests ?? 0;
  // Defaults to 100 (not 0) when summary hasn't loaded yet, so the card
  // never flashes "critically unhealthy" for a split second on initial load
  // before real data arrives.
  const healthScore = summary?.healthScore ?? 100;
  const avgSlowDuration =
    safeSlowEndpoints.length > 0
      ? Math.round(safeSlowEndpoints.reduce((sum, e) => sum + e.avgDuration, 0) / safeSlowEndpoints.length)
      : 0;

  const trendHistory = safeTrends.map((t) => t.avgDuration ?? 0);

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

        {!loading && <DashboardAiSummary applicationName={selectedApp} />}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress size={24} sx={{ color: "text.disabled" }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard
                title="Health Score"
                value={healthScore}
                unit="/100"
                thresholds={{ warning: 70, critical: 40 }}
                reverseThresholds
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard title="Total Requests" value={totalRequests} unit="" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard title="Errors" value={errorCount} unit=""
                thresholds={{ warning: 5, critical: 15 }} invert />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard title="Avg Slow Endpoint Duration" value={avgSlowDuration} unit="ms"
                thresholds={{ warning: 1000, critical: 3000 }} invert />
            </Grid>

            <Grid size={{ xs: 12 }}>
              {trendHistory.length > 0 ? (
                <TrendChart history={trendHistory} />
              ) : (
                <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>
                  Not enough data yet to show trends. Trends need more telemetry over time.
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: 16.5, fontWeight: 500, color: "#EDEDEF", marginBottom: 1.5 }}>
                Slow Endpoints
              </Typography>
              {safeSlowEndpoints.length === 0 ? (
                <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>
                  No slow endpoints recorded.
                </Typography>
              ) : (
                <Box
                  sx={{
                    backgroundColor: "#111113",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "10px",
                    padding: "4px 16px",
                  }}
                >
                  {safeSlowEndpoints.map((ep, i) => (
                    <SlowEndpointRow key={i} endpoint={ep.endpoint} avgDuration={ep.avgDuration} count={ep.count} />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </Box>
    </>
  );
}

export default Dashboard;