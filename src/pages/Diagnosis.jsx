import { Box, Typography, CircularProgress } from "@mui/material";
import Header from "../components/Header";
import FindingCard from "../components/FindingCard";
import useDiagnosis from "../hooks/useDiagnosis";
import { useSelectedApp } from "../contexts/AppContext";

function Diagnosis() {
  const { selectedApp } = useSelectedApp();
  const { findings, loading, error } = useDiagnosis({ applicationName: selectedApp });

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

        <Typography sx={{ fontSize: 16.5, fontWeight: 500, color: "#EDEDEF", marginBottom: 2 }}>
          Diagnosis Findings
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress size={24} sx={{ color: "text.disabled" }} />
          </Box>
        ) : findings.length === 0 ? (
          <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>
            No issues detected. The engine scans telemetry for slow requests, high error rates, and server errors.
          </Typography>
        ) : (
          findings.map((finding, i) => <FindingCard key={i} finding={finding} />)
        )}
      </Box>
    </>
  );
}

export default Diagnosis;