import { useState, useEffect } from "react";
import { Box, Typography, Chip, Paper, Button, CircularProgress } from "@mui/material";
import apiClient from "../api/client";

// Dot color per severity — paired with the ramp's own text tone for the
// outlined tag next to it, so the tag text stays legible against the dark
// card surface instead of relying on a filled, saturated background.
const severityStyle = {
  HIGH: { dot: "#E5484D", text: "#F5A3A3", bg: "rgba(229,72,77,0.12)" },
  MEDIUM: { dot: "#D9A24B", text: "#F0C989", bg: "rgba(217,162,75,0.12)" },
  LOW: { dot: "#5B7CFF", text: "#C3CCFF", bg: "rgba(91,124,255,0.12)" },
};

const ruleTypeLabel = {
  SLOW_REQUEST: "Slow Request",
  HIGH_ERROR_RATE: "High Error Rate",
  SERVER_ERROR: "Server Error",
  POSSIBLE_N_PLUS_ONE: "Possible N+1 Query",
  ROOT_CAUSE_CORRELATION: "Root Cause Insight",
};

function formatUnknownRuleType(ruleType) {
  return ruleType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRuleTypeLabel(ruleType) {
  return ruleTypeLabel[ruleType] ?? formatUnknownRuleType(ruleType);
}

function formatEvidenceValue(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([k, v]) => `${k} (${v} rows)`)
      .join(", ");
  }
  return String(value);
}

// Keys rendered separately (not in the generic evidence line below) because
// they get their own dedicated display treatment:
// - conditionMatched: shown as its own "why this fired" line, not buried
//   mid-list among counts and ratios.
// - insufficientSampleSize: already implied by the message text itself when
//   true; redundant as a raw evidence key.
const EVIDENCE_KEYS_SHOWN_SEPARATELY = ["conditionMatched", "insufficientSampleSize"];

function SeverityTag({ severity }) {
  const style = severityStyle[severity] ?? severityStyle.LOW;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box sx={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: style.dot }} />
      <Typography
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 11.5,
          letterSpacing: "0.03em",
          color: style.text,
          backgroundColor: style.bg,
          padding: "2px 8px",
          borderRadius: 10,
        }}
      >
        {severity}
      </Typography>
    </Box>
  );
}

// Confidence badge — separate from SeverityTag on purpose. Severity answers
// "how bad is this," confidence answers "how sure are we this reading is
// real, not noise." Only renders when the backend actually set a confidence
// value — SLOW_REQUEST and POSSIBLE_N_PLUS_ONE now carry one (consistency-
// based), correlation findings always have one, other rule types have none
// and the badge is simply omitted for them.
const confidenceStyle = {
  HIGH: "#8FD9A8",
  MEDIUM: "#F0C989",
  LOW: "#8A93A3",
};

function ConfidenceTag({ confidence }) {
  if (!confidence) return null;
  const color = confidenceStyle[confidence] ?? confidenceStyle.LOW;
  return (
    <Typography
      sx={{
        fontFamily: "ui-monospace, monospace",
        fontSize: 10.5,
        letterSpacing: "0.04em",
        color,
        border: `1px solid ${color}33`,
        padding: "2px 7px",
        borderRadius: 10,
        whiteSpace: "nowrap",
      }}
    >
      {confidence} CONFIDENCE
    </Typography>
  );
}

const NO_SUGGESTION_TYPES = ["HIGH_ERROR_RATE", "SERVER_ERROR", "ROOT_CAUSE_CORRELATION"];

function FindingCard({ finding, showExplain = true, showSuggestion = false, autoFetchSuggestion = false, fetchDelayMs = 0, compact = false }) {
  const { ruleType, severity, endpoint, message, evidence, relatedFindings, confidence } = finding;
  const isCorrelation = ruleType === "ROOT_CAUSE_CORRELATION";
  const isCustomRule = !(ruleType in ruleTypeLabel) && !isCorrelation;
  const isMissingIndex = ruleType === "MISSING_INDEX_CANDIDATE";
  const conditionMatched = evidence?.conditionMatched;

  const [plansExpanded, setPlansExpanded] = useState(false);
  const [plans, setPlans] = useState(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);

  const [narrativeExpanded, setNarrativeExpanded] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState(null);

  const [suggestionExpanded, setSuggestionExpanded] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

  async function handleToggleplans() {
    if (plansExpanded) {
      setPlansExpanded(false);
      return;
    }
    setPlansExpanded(true);
    if (plans !== null) return;

    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await apiClient.get("/api/slow-query-plans", {
        params: { endpoint },
      });
      setPlans(res.data);
    } catch (err) {
      setPlansError(err.message ?? "Failed to load query plans");
    } finally {
      setPlansLoading(false);
    }
  }

  async function handleToggleNarrative() {
    if (narrativeExpanded) {
      setNarrativeExpanded(false);
      return;
    }
    setNarrativeExpanded(true);
    if (narrative !== null) return;

    setNarrativeLoading(true);
    setNarrativeError(null);
    try {
      const res = await apiClient.get("/api/diagnosis/narrative", {
        params: { endpoint },
      });
      setNarrative(res.data.narrative);
    } catch (err) {
      setNarrativeError(err.message ?? "Failed to generate explanation");
    } finally {
      setNarrativeLoading(false);
    }
  }

  const canSuggest = !NO_SUGGESTION_TYPES.includes(ruleType);

  async function fetchSuggestion() {
    setSuggestionLoading(true);
    setSuggestionError(null);
    try {
      const res = await apiClient.get("/api/diagnosis/recommendations/explain", {
        params: { endpoint, ruleType },
      });
      setSuggestion(res.data.suggestion);
    } catch (err) {
      setSuggestionError(err.message ?? "Failed to generate suggestion");
    } finally {
      setSuggestionLoading(false);
    }
  }

  useEffect(() => {
    if (showSuggestion && autoFetchSuggestion && canSuggest) {
      setSuggestionExpanded(true);
      const timer = setTimeout(fetchSuggestion, fetchDelayMs);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleSuggestion() {
    if (suggestionExpanded) {
      setSuggestionExpanded(false);
      return;
    }
    setSuggestionExpanded(true);
    if (suggestion !== null) return;
    await fetchSuggestion();
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        padding: "16px 18px",
        marginBottom: 1.25,
        borderColor: isCorrelation ? "rgba(91,124,255,0.18)" : "rgba(255,255,255,0.07)",
        borderRadius: "10px",
        backgroundColor: "#111113",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 }}>
        <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: "#EDEDEF" }}>
          {endpoint}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <ConfidenceTag confidence={confidence} />
          <SeverityTag severity={severity} />
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, marginBottom: 1 }}>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
          {getRuleTypeLabel(ruleType)}
        </Typography>
        {isCustomRule && (
          <Chip
            label="Custom Rule"
            size="small"
            variant="outlined"
            sx={{ height: 17, fontSize: "0.6rem", borderColor: "rgba(255,255,255,0.1)", color: "text.secondary" }}
          />
        )}
      </Box>

      {!compact && (
        <Typography sx={{ fontSize: 13.5, color: "#9B9BA1", lineHeight: 1.55, marginBottom: 1 }}>
          {message}
        </Typography>
      )}

      {isCorrelation && relatedFindings?.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", marginBottom: 1 }}>
          {relatedFindings.map((related) => (
            <Typography
              key={related}
              sx={{
                fontSize: 12,
                color: "text.secondary",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {getRuleTypeLabel(related)}
            </Typography>
          ))}
        </Box>
      )}

      {/* "Why this fired" — the literal rule condition that matched, verbatim
          from the backend (evidence.conditionMatched). Given its own line so
          it reads as a receipt/log line, not buried in the generic evidence
          dump. Only renders for rule types that currently populate it. */}
      {conditionMatched && !compact && (
        <Typography
          sx={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 11.5,
            color: "#6B7280",
            marginBottom: 1,
            paddingLeft: 1,
            borderLeft: "2px solid rgba(255,255,255,0.08)",
          }}
        >
          {conditionMatched}
        </Typography>
      )}

      {evidence && !compact && (
        <Typography
          sx={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 11.5,
            letterSpacing: "0.01em",
            color: "text.disabled",
          }}
        >
          {Object.entries(evidence)
            .filter(([key]) => !EVIDENCE_KEYS_SHOWN_SEPARATELY.includes(key))
            .map(([key, value]) => `${key}: ${formatEvidenceValue(value)}`)
            .join(" · ")}
        </Typography>
      )}

      {showSuggestion && canSuggest && (
        <Box sx={{ marginTop: 1.5 }}>
          {!autoFetchSuggestion && (
            <Button
              size="small"
              variant="text"
              onClick={handleToggleSuggestion}
              disabled={suggestionLoading}
              sx={{ fontSize: 12.5, textTransform: "none", color: "#8FD9A8", padding: 0, minWidth: 0 }}
            >
              {suggestionLoading ? <CircularProgress size={14} sx={{ mr: 1, color: "#8FD9A8" }} /> : null}
              {suggestionExpanded ? "Hide suggestion" : "Suggestion"}
            </Button>
          )}

          {(autoFetchSuggestion || suggestionExpanded) && (
            <Box sx={{ marginTop: autoFetchSuggestion ? 0 : 1 }}>
              {suggestionLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={14} sx={{ color: "#8FD9A8" }} />
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Generating suggestion…
                  </Typography>
                </Box>
              )}

              {suggestionError && (
                <Typography variant="caption" color="error">
                  {suggestionError}
                </Typography>
              )}

              {suggestion && (
                <Box
                  sx={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(143,217,168,0.06)",
                    border: "1px solid rgba(143,217,168,0.15)",
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: "#8FD9A8", letterSpacing: "0.03em", marginBottom: 0.5 }}>
                    SUGGESTED FIX
                  </Typography>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: "#C8E6CD",
                      margin: 0,
                    }}
                  >
                    {suggestion}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {isMissingIndex && (
        <Box sx={{ marginTop: 1.5 }}>
          <Button
            size="small"
            variant="text"
            onClick={handleToggleplans}
            sx={{ fontSize: 12.5, textTransform: "none", color: "primary.main", padding: 0, minWidth: 0 }}
          >
            {plansExpanded ? "Hide query plan" : "Show query plan"}
          </Button>

          {plansExpanded && (
            <Box sx={{ marginTop: 1 }}>
              {plansLoading && <CircularProgress size={16} />}

              {plansError && (
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
                <Paper
                  key={plan.id}
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
                      color: "#B0B0B6",
                      margin: 0,
                    }}
                  >
                    {plan.explainPlan}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {showExplain && (
        <Box sx={{ marginTop: 1.5 }}>
          <Button
            size="small"
            variant="text"
            onClick={handleToggleNarrative}
            sx={{ fontSize: 12.5, textTransform: "none", color: "primary.main", padding: 0, minWidth: 0 }}
          >
            {narrativeExpanded ? "Hide explanation" : "Explain this"}
          </Button>

          {narrativeExpanded && (
            <Box sx={{ marginTop: 1 }}>
              {narrativeLoading && <CircularProgress size={16} />}

              {narrativeError && (
                <Typography variant="caption" color="error">
                  {narrativeError}
                </Typography>
              )}

              {narrative && (
                <Paper
                  variant="outlined"
                  sx={{
                    padding: 1.5,
                    borderColor: "rgba(91,124,255,0.15)",
                    borderRadius: "8px",
                    backgroundColor: "rgba(91,124,255,0.05)",
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#C3CCFF", lineHeight: 1.55 }}>
                    {narrative}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default FindingCard;