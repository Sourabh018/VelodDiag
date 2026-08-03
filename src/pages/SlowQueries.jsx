import { useState, Fragment } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Collapse,
} from "@mui/material";
import Header from "../components/Header";
import useDashboardMetrics from "../hooks/useDashboardMetrics";
import { useSelectedApp } from "../contexts/AppContext";
import apiClient from "../api/client";

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

// One captured plan's card — SQL + EXPLAIN output plus the AI wow feature #1
// "Explain in plain English" lazy-fetch button. Same lazy-fetch-on-first-click
// pattern FindingCard uses for narrative/suggestion: fetch once, cache in
// local state, toggle visibility on repeat clicks without re-hitting Groq.
function QueryPlanCard({ plan }) {
  const [explainExpanded, setExplainExpanded] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState(null);

  async function handleToggleExplain() {
    if (explainExpanded) {
      setExplainExpanded(false);
      return;
    }
    setExplainExpanded(true);
    if (explanation !== null) return; // already fetched, just re-showing

    setExplainLoading(true);
    setExplainError(null);
    try {
      const res = await apiClient.get(`/api/slow-query-plans/${plan.id}/explain`);
      setExplanation(res.data.explanation);
    } catch (err) {
      setExplainError(err.message ?? "Failed to generate explanation");
    } finally {
      setExplainLoading(false);
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        padding: 1.5,
        marginBottom: 1,
        borderColor: "rgba(255,255,255,0.06)",
        borderRadius: "8px",
        backgroundColor: "#0C0C0E",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: 0.5 }}>
        <Typography sx={{ fontSize: 12, color: "text.disabled" }}>
          {new Date(plan.timestamp).toLocaleString()} · {plan.requestDurationMs}ms
        </Typography>
        <Typography
          sx={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.02em",
            color: plan.containsSeqScan ? "#F0C989" : "#8FD9A8",
            backgroundColor: plan.containsSeqScan ? "rgba(217,162,75,0.12)" : "rgba(143,217,168,0.12)",
            padding: "2px 8px",
            borderRadius: 10,
          }}
        >
          {plan.containsSeqScan ? "Seq Scan" : "Index Used"}
        </Typography>
      </Box>

      <Typography
        component="pre"
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "#7C7C86",
          margin: 0,
          marginBottom: 0.75,
        }}
      >
        {plan.sqlText}
      </Typography>

      <Typography
        component="pre"
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "#B0B0B6",
          margin: 0,
        }}
      >
        {plan.explainPlan}
      </Typography>

      <Box sx={{ marginTop: 1 }}>
        <Button
          size="small"
          variant="text"
          onClick={handleToggleExplain}
          disabled={explainLoading}
          sx={{ fontSize: 12.5, textTransform: "none", color: "primary.main", padding: 0, minWidth: 0 }}
        >
          {explainLoading ? <CircularProgress size={14} sx={{ mr: 1, color: "primary.main" }} /> : null}
          {explainExpanded ? "Hide explanation" : "Explain in plain English"}
        </Button>

        {explainExpanded && (
          <Box sx={{ marginTop: 1 }}>
            {explainError && (
              <Typography variant="caption" color="error">
                {explainError}
              </Typography>
            )}
            {explanation && (
              <Box
                sx={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(91,124,255,0.05)",
                  border: "1px solid rgba(91,124,255,0.15)",
                }}
              >
                <Typography sx={{ fontSize: 13, color: "#C3CCFF", lineHeight: 1.55 }}>
                  {explanation}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

function SlowQueries() {
  const { selectedApp } = useSelectedApp();
  const { slowEndpoints, loading, error } = useDashboardMetrics({ applicationName: selectedApp });
  const safeSlowEndpoints = Array.isArray(slowEndpoints) ? slowEndpoints : [];

  // Sort slowest-first so the worst offenders are immediately visible
  const sorted = [...safeSlowEndpoints].sort((a, b) => b.avgDuration - a.avgDuration);

  // Row-expand state, keyed by endpoint — click a row to fetch and reveal
  // its captured query plans below it, same lazy-fetch-on-first-click
  // pattern as FindingCard's "Show query plan" toggle.
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);
  const [plansByEndpoint, setPlansByEndpoint] = useState({});
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);

  async function handleRowClick(endpoint) {
    if (expandedEndpoint === endpoint) {
      setExpandedEndpoint(null);
      return;
    }
    setExpandedEndpoint(endpoint);
    if (plansByEndpoint[endpoint] !== undefined) return; // already fetched

    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await apiClient.get("/api/slow-query-plans", { params: { endpoint } });
      setPlansByEndpoint((prev) => ({ ...prev, [endpoint]: res.data }));
    } catch (err) {
      setPlansError(err.message ?? "Failed to load query plans");
    } finally {
      setPlansLoading(false);
    }
  }

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
          Endpoints averaging above the slow-request threshold, sorted worst-first. Click a row to see captured query plans.
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
                {sorted.map((ep, i) => {
                  const isExpanded = expandedEndpoint === ep.endpoint;
                  const plans = plansByEndpoint[ep.endpoint];
                  return (
                    <Fragment key={i}>
                      <TableRow
                        onClick={() => handleRowClick(ep.endpoint)}
                        sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(255,255,255,0.02)" } }}
                      >
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
                      <TableRow key={`${i}-expand`}>
                        <TableCell colSpan={4} sx={{ padding: isExpanded ? "12px 16px" : 0, border: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {plansLoading && !plans && <CircularProgress size={16} />}
                            {plansError && !plans && (
                              <Typography variant="caption" color="error">
                                {plansError}
                              </Typography>
                            )}
                            {plans?.length === 0 && (
                              <Typography variant="caption" color="text.secondary">
                                No captured plans found for this endpoint.
                              </Typography>
                            )}
                            {plans?.map((plan) => (
                              <QueryPlanCard key={plan.id} plan={plan} />
                            ))}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </>
  );
}

export default SlowQueries;