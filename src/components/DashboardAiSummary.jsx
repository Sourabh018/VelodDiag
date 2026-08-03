import { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import apiClient from "../api/client";

function DashboardAiSummary({ applicationName }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(false);
    try {
      const appParam = applicationName ? { applicationName } : {};
      const res = await apiClient.get("/api/dashboard/ai-summary", { params: appParam });
      setSummary(res.data.summary);
    } catch (err) {
      console.error("AI summary fetch failed:", err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#111113",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "16px 20px",
        marginBottom: 3,
      }}
    >
      {!summary && !loading && (
        <Button
          onClick={fetchSummary}
          size="small"
          sx={{ textTransform: "none", color: "#C3CCFF", fontSize: 14 }}
        >
          Summarize current state with AI
        </Button>
      )}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={16} sx={{ color: "text.disabled" }} />
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Generating summary…</Typography>
        </Box>
      )}
      {error && (
        <Typography sx={{ fontSize: 14, color: "#F5A3A3" }}>
          Couldn't generate summary — try again.
        </Typography>
      )}
      {summary && !loading && (
        <Typography sx={{ fontSize: 14.5, color: "#EDEDEF", lineHeight: 1.6 }}>
          {summary}
        </Typography>
      )}
    </Box>
  );
}

export default DashboardAiSummary;