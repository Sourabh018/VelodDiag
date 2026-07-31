import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import Header from "../components/Header";
import useIndexAdvisor from "../hooks/useIndexAdvisor";

function IndexAdvisor() {
  const { candidates, loading, error } = useIndexAdvisor();

  return (
    <>
      <Header />
      <Box sx={{ marginLeft: "220px", marginTop: "64px", padding: 4 }}>

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
          Index Advisor
        </Typography>
        <Typography variant="body2" sx={{ color: "#8C8C93", marginBottom: 2, fontSize: "15.5px" }}>
          Flags endpoints that are slow on every call rather than only under load — a pattern
          often associated with a missing database index.
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            padding: "10px 14px",
            borderRadius: "4px",
            marginBottom: 3,
            color: "#8C8C93",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            fontSize: "14px",
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#57575F", flexShrink: 0 }} />
          Heuristic only, superseded by the EXPLAIN-based Missing Index Candidate finding in Diagnosis. Based on
          response-time consistency, not actual query plan inspection — treat findings here as leads worth
          investigating, not confirmed diagnoses.
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress />
          </Box>
        ) : candidates.length === 0 ? (
          <Typography sx={{ color: "#57575F", fontSize: "15.5px" }}>
            No candidates found. Either nothing is both slow and consistently slow right now, or there isn't enough sample data yet (need at least 3 requests per endpoint).
          </Typography>
        ) : (
          candidates.map((c, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                padding: 2,
                marginBottom: 1.5,
                backgroundColor: "#111113",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontFamily: "IBM Plex Mono, ui-monospace, monospace", color: "#EDEDEF", fontSize: "16px" }}
                >
                  {c.endpoint}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    padding: "4px 10px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(217,162,75,0.12)",
                  }}
                >
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#D9A24B", flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#F0C989",
                      fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "14px",
                    }}
                  >
                    avg {c.avgDurationMs.toFixed(0)}ms
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "#8C8C93", marginBottom: 1, fontSize: "14.5px" }}>
                {c.message}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#57575F",
                  fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "12.5px",
                }}
              >
                stdDev: {c.stdDeviationMs.toFixed(0)}ms · coefficient of variation: {c.coefficientOfVariation.toFixed(2)} · samples: {c.sampleCount}
              </Typography>
            </Paper>
          ))
        )}
      </Box>
    </>
  );
}

export default IndexAdvisor;