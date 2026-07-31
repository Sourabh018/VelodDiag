import { Card, CardContent, Typography, Stack, Box } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Was primary.main by default — that made every plain stat (even ones with
// no threshold, like a raw request count) light up in the app's one
// reserved accent color, the same blue meant to mark the Root Cause
// correlation card specifically. A number with nothing wrong with it should
// read as neutral; color should only appear when a threshold is actually
// crossed, and even then the color used should be status-driven, not the
// brand accent.
const NEUTRAL = "#EDEDEF";
const GOOD = "#8FD9A8";
const WARN = "#D9A24B";
const CRIT = "#E5484D";

function StatCard({ title, value, unit = "", delta = 0, history = [], invert = false, thresholds, reverseThresholds = false }) {
  const isUp = delta > 0;
  const isGood = invert ? delta <= 0 : delta >= 0;

  let statusColor = NEUTRAL;
  if (thresholds) {
    // Default assumption elsewhere on this dashboard is "higher = worse"
    // (errors, durations). Health score is the opposite — "higher = better" —
    // so reverseThresholds flips the comparison direction rather than forcing
    // callers to invert their threshold numbers to fake the same effect.
    if (reverseThresholds) {
      if (value <= thresholds.critical) statusColor = CRIT;
      else if (value <= thresholds.warning) statusColor = WARN;
      else statusColor = GOOD;
    } else {
      if (value >= thresholds.critical) statusColor = CRIT;
      else if (value >= thresholds.warning) statusColor = WARN;
    }
  }

  const sparkData = history.map((v, i) => ({ i, v }));
  // Sparkline follows the same status color as the headline number instead
  // of always being teal — a critical stat now has a critical-colored trend
  // line too, reinforcing the same signal rather than a decorative accent
  // fighting with it.
  const sparkColor = statusColor === NEUTRAL ? "#6B6B73" : statusColor;

  return (
    <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography
            sx={{ fontSize: 12, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            {title}
          </Typography>
          {delta !== 0 && (
            <Stack direction="row" alignItems="center" spacing={0.3} sx={{ color: isGood ? GOOD : CRIT }}>
              {isUp ? <ArrowUpwardIcon sx={{ fontSize: 15.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 15.5 }} />}
              <Typography sx={{ fontSize: 12.5, fontFamily: "ui-monospace, monospace" }}>
                {Math.abs(delta)}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Typography
          sx={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 35,
            fontWeight: 500,
            color: statusColor,
            mt: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
          <Box component="span" sx={{ fontSize: 17.5, color: "text.disabled", ml: 0.5 }}>
            {unit}
          </Box>
        </Typography>

        {history.length > 0 && (
          <Box sx={{ height: 36, mt: 1.5, mx: -2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#spark-${title})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;