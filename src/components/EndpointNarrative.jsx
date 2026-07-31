import { useState } from "react";
import { Box, Button, CircularProgress, Typography, Alert } from "@mui/material";
import axios from "axios";

// Swap this for wherever your existing axios instance / base URL config lives
// (you already have one — same place TelemetryClient's POST URL bug was fixed).
const API_BASE = import.meta.env.VITE_API_URL;

export default function EndpointNarrative({ endpoint }) {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNarrative = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/diagnosis/narrative`, {
        params: { endpoint },
        timeout: 20000, // Render cold starts — same reasoning as your other axios calls
      });
      setNarrative(res.data.narrative);
    } catch (err) {
      setError("Couldn't generate an explanation right now.");
    } finally {
      setLoading(false);
    }
  };

  if (narrative) {
    return (
      <Box sx={{ mt: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
        <Typography variant="body2">{narrative}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Button size="small" variant="outlined" onClick={fetchNarrative} disabled={loading}>
        {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
        Explain this
      </Button>
      {error && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}