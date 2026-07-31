import { Box, Typography, CircularProgress } from "@mui/material";
import Header from "../components/Header";
import FindingCard from "../components/FindingCard";
import useRecommendations from "../hooks/useRecommendations";

// Groups actionable findings by endpoint — reuses FindingCard as-is so a
// card here looks identical to the same finding's card on the Diagnosis
// page, rather than inventing a second visual language for the same data.
// The only difference from Diagnosis: this page only ever shows findings
// that have a suggestedFix, and it's organized by endpoint section instead
// of one flat list — the point of this page is "what do I do", not "what's
// wrong", so grouping by the thing you'd actually go fix (the endpoint)
// matters more here than it does on Diagnosis. It also hides the "Explain
// this" root-cause narrative (showExplain=false) — that's Diagnosis page's
// job; this page only surfaces the fix-side "Get AI Suggestion" action.
function Recommendations() {
  const { recommendations, loading, error } = useRecommendations();
  const endpoints = Object.keys(recommendations);

  return (
    <>
      <Header />
      <Box sx={{ marginLeft: "220px", marginTop: "64px", padding: 4 }}>
        <Typography sx={{ fontSize: 16.5, fontWeight: 500, color: "#EDEDEF", marginBottom: 0.5 }}>
          Recommendations
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary", marginBottom: 3 }}>
          Concrete, actionable fixes for endpoints with active findings — grouped by endpoint.
        </Typography>

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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress size={24} sx={{ color: "text.disabled" }} />
          </Box>
        ) : endpoints.length === 0 ? (
          <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>
            No actionable recommendations right now — either everything's healthy, or active
            findings don't have a concrete fix to suggest yet.
          </Typography>
        ) : (
          endpoints.map((endpoint) => (
            <Box key={endpoint} sx={{ marginBottom: 3.5 }}>
              <Typography
                sx={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 13.5,
                  color: "text.secondary",
                  marginBottom: 1,
                  letterSpacing: "0.02em",
                }}
              >
                {endpoint}
              </Typography>
              {recommendations[endpoint].map((finding, i) => (
                <FindingCard
                  key={`${endpoint}-${i}`}
                  finding={finding}
                  showExplain={false}
                  showSuggestion
                  compact
                />
              ))}
            </Box>
          ))
        )}
      </Box>
    </>
  );
}

export default Recommendations;