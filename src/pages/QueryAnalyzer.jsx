import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useState } from "react";
import Header from "../components/Header";
import TrendCard from "../components/TrendCard";
import useQueryAnalyzer from "../hooks/useQueryAnalyzer";

const filters = [
  { value: "ALL", label: "All" },
  { value: "WORSENING", label: "Worsening" },
  { value: "IMPROVING", label: "Improving" },
  { value: "STABLE", label: "Stable" },
];

function QueryAnalyzer() {
  const { trends, loading, error } = useQueryAnalyzer();
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? trends : trends.filter((t) => t.trendDirection === filter);

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
          Query Analyzer
        </Typography>
        <Typography variant="body2" sx={{ color: "#8C8C93", marginBottom: 3, fontSize: "15.5px" }}>
          Per-endpoint response time trends, comparing earliest vs. most recent day of data. Requires at least 2 days of telemetry per endpoint.
        </Typography>

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(e, val) => val && setFilter(val)}
          size="small"
          sx={{
            marginBottom: 3,
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontSize: "14.5px",
              color: "#8C8C93",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "4px 14px",
              "&.Mui-selected": {
                color: "#EDEDEF",
                backgroundColor: "rgba(255,255,255,0.06)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              },
              "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
            },
          }}
        >
          {filters.map((f) => (
            <ToggleButton key={f.value} value={f.value}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Typography sx={{ color: "#57575F", fontSize: "15.5px" }}>
            {trends.length === 0
              ? "No endpoints have enough history yet (need at least 2 days of data)."
              : "No endpoints match this filter."}
          </Typography>
        ) : (
          filtered.map((trend, i) => <TrendCard key={i} trend={trend} />)
        )}
      </Box>
    </>
  );
}

export default QueryAnalyzer;