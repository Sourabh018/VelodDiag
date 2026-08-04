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

// Turns any SNAKE_CASE ruleType into "Title Case" automatically, e.g.
// "SLOW_AND_ERROR_PRONE" -> "Slow And Error Prone". This is the fallback for
// rules created dynamically via the rule engine (/api/rules) — new rules get
// a readable label immediately, with no frontend code change required.
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

// Formats a single evidence value for the footer line. Numbers with no
// fractional part (counts, thresholds) render as plain integers; numbers
// with a fractional part (durations, ratios) keep one decimal place.
// Nested objects — e.g. MISSING_INDEX_CANDIDATE's candidateTables map of
// { tableName: rowEstimate } — are expanded into readable "table (N rows)"
// pairs instead of falling through to the default "[object Object]" string
// coercion, which is what the naive template-literal approach produced.
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

// Small dot + outlined tag instead of a filled MUI Chip — a filled pill on
// every single card competes with the one card that's actually meant to
// stand out (the correlation card, which keeps the primary-blue border).
// Severity should read as a quiet signal, not a badge shouting on every row.
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

// Rule types the backend never produces a recommendation for (see
// RecommendationService.buildRecommendation's HIGH_ERROR_RATE/SERVER_ERROR/
// ROOT_CAUSE_CORRELATION branch — intentionally no honest generic fix
// exists for these). Every other rule type, including custom rules, CAN be
// explained via /explain even if it has no static template.
const NO_SUGGESTION_TYPES = ["HIGH_ERROR_RATE", "SERVER_ERROR", "ROOT_CAUSE_CORRELATION"];

function FindingCard({ finding, showExplain = true, showSuggestion = false, autoFetchSuggestion = false, fetchDelayMs = 0, compact = false }) {
  const { ruleType, severity, endpoint, message, evidence, relatedFindings } = finding;
  const isCorrelation = ruleType === "ROOT_CAUSE_CORRELATION";
  const isCustomRule = !(ruleType in ruleTypeLabel) && !isCorrelation;
  const isMissingIndex = ruleType === "MISSING_INDEX_CANDIDATE";

  // Query-plan expand state — only relevant for MISSING_INDEX_CANDIDATE cards.
  // Fetches on first expand only; subsequent toggles just show/hide the
  // already-fetched plans rather than re-requesting.
  const [plansExpanded, setPlansExpanded] = useState(false);
  const [plans, setPlans] = useState(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);

  // AI narrative state — same lazy-fetch-on-first-click pattern as the query
  // plan toggle above. Available on every card (not just correlation cards)
  // since the backend's getFindingsForEndpoint() pulls ALL findings for this
  // endpoint regardless of which specific card triggered the fetch, so the
  // narrative can reference findings beyond just the one on this card.
  const [narrativeExpanded, setNarrativeExpanded] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState(null);

  // AI suggestion state — same lazy-fetch-on-first-click pattern, but for the
  // fix side rather than the root-cause side. Replaces the old always-visible
  // static suggestedFix block, which rendered identical boilerplate text for
  // every endpoint hitting the same ruleType. Endpoint + ruleType together
  // identify which specific finding to tailor the suggestion to, since one
  // endpoint can carry several active findings at once.
  const [suggestionExpanded, setSuggestionExpanded] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

  // AI wow feature #3 — migration script state. Same lazy-fetch-on-first-click
  // pattern as narrative/suggestion above. Only rendered for MISSING_INDEX_CANDIDATE
  // cards (isMissingIndex) — same gate as the query-plan block, since a migration
  // script only makes sense when there's a real captured seq-scan plan behind it.
  const [migrationExpanded, setMigrationExpanded] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationError, setMigrationError] = useState(null);

  async function handleToggleplans() {
    if (plansExpanded) {
      setPlansExpanded(false);
      return;
    }
    setPlansExpanded(true);
    if (plans !== null) return; // already fetched, just re-showing

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
    if (narrative !== null) return; // already fetched, just re-showing

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

  // Recommendations page passes autoFetchSuggestion=true — no click needed,
  // fetch runs once on mount so every card shows its tailored suggestion
  // directly. Diagnosis page leaves this false and keeps the manual
  // click-to-reveal button (handleToggleSuggestion below), since that page
  // renders every finding including ones without a fix — auto-firing a
  // Gemini call per card there would burn quota on cards nobody's looking at.
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
    if (suggestion !== null) return; // already fetched, just re-showing
    await fetchSuggestion();
  }

  async function handleToggleMigration() {
    if (migrationExpanded) {
      setMigrationExpanded(false);
      return;
    }
    setMigrationExpanded(true);
    if (migrationResult !== null) return; // already fetched, just re-showing

    setMigrationLoading(true);
    setMigrationError(null);
    try {
      const res = await apiClient.get("/api/diagnosis/recommendations/migration", {
        params: { endpoint, ruleType },
      });
      setMigrationResult(res.data);
    } catch (err) {
      setMigrationError(err.message ?? "Failed to generate migration script");
    } finally {
      setMigrationLoading(false);
    }
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
        <SeverityTag severity={severity} />
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
            .map(([key, value]) => `${key}: ${formatEvidenceValue(value)}`)
            .join(" · ")}
        </Typography>
      )}

      {/* Gated on canSuggest (rule type is capable of a fix), not the static
          suggestedFix field — custom rules have no template but /explain can
          still generate a fresh AI suggestion for them. */}
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

      {isMissingIndex && (
        <Box sx={{ marginTop: 1.5 }}>
          <Button
            size="small"
            variant="text"
            onClick={handleToggleMigration}
            disabled={migrationLoading}
            sx={{ fontSize: 12.5, textTransform: "none", color: "#D9A24B", padding: 0, minWidth: 0 }}
          >
            {migrationLoading ? <CircularProgress size={14} sx={{ mr: 1, color: "#D9A24B" }} /> : null}
            {migrationExpanded ? "Hide migration script" : "Generate migration script"}
          </Button>

          {migrationExpanded && (
            <Box sx={{ marginTop: 1 }}>
              {migrationError && (
                <Typography variant="caption" color="error">
                  {migrationError}
                </Typography>
              )}

              {migrationResult && !migrationResult.aiGenerated && (
                <Typography variant="caption" color="text.secondary">
                  {migrationResult.unavailableReason}
                </Typography>
              )}

              {migrationResult?.aiGenerated && (
                <Box
                  sx={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(217,162,75,0.06)",
                    border: "1px solid rgba(217,162,75,0.18)",
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: "#F0C989", letterSpacing: "0.03em", marginBottom: 0.5 }}>
                    MIGRATION SCRIPT
                  </Typography>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: "#F0C989",
                      margin: 0,
                      marginBottom: 1,
                    }}
                  >
                    {migrationResult.migrationScript}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#F0C989", letterSpacing: "0.03em", marginBottom: 0.5 }}>
                    COMMIT MESSAGE
                  </Typography>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: "#D4D4D8",
                      margin: 0,
                    }}
                  >
                    {migrationResult.commitMessage}
                  </Typography>
                </Box>
              )}
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