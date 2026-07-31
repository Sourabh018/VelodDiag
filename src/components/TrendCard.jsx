import { Box, Typography } from "@mui/material";
import TrendUpIcon from "@mui/icons-material/TrendingUp";
import TrendDownIcon from "@mui/icons-material/TrendingDown";
import TrendFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendChart from "./TrendChart";

const directionConfig = {
  WORSENING: {
    dot: "#E5484D",
    text: "#F5A3A3",
    bg: "rgba(229,72,77,0.12)",
    icon: TrendUpIcon,
    label: "Worsening",
  },
  IMPROVING: {
    dot: "#8FD9A8",
    text: "#8FD9A8",
    bg: "rgba(143,217,168,0.12)",
    icon: TrendDownIcon,
    label: "Improving",
  },
  STABLE: {
    dot: "#57575F",
    text: "#8C8C93",
    bg: "rgba(255,255,255,0.06)",
    icon: TrendFlatIcon,
    label: "Stable",
  },
};

function TrendCard({ trend }) {
  const { endpoint, points, trendDirection, percentChange, firstAvgMs, latestAvgMs } = trend;
  const config = directionConfig[trendDirection] ?? directionConfig.STABLE;
  const Icon = config.icon;
  const history = points.map((p) => p.avgDurationMs);

  return (
    <Box
      sx={{
        marginBottom: 2,
        padding: 2,
        borderRadius: 1,
        border: "1px solid rgba(255,255,255,0.07)",
        backgroundColor: "#111113",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1.5 }}>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontFamily: "IBM Plex Mono, ui-monospace, monospace", color: "#EDEDEF", fontSize: "16px" }}
          >
            {endpoint}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#8C8C93",
              fontFamily: "IBM Plex Mono, ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
              fontSize: "13.5px",
            }}
          >
            {firstAvgMs.toFixed(0)}ms → {latestAvgMs.toFixed(0)}ms over {points.length} day{points.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: config.bg,
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: config.dot, flexShrink: 0 }} />
          <Icon sx={{ fontSize: 15.5, color: config.text }} />
          <Typography
            variant="caption"
            sx={{
              color: config.text,
              fontFamily: "IBM Plex Mono, ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
              fontSize: "14px",
            }}
          >
            {config.label} · {percentChange >= 0 ? "+" : ""}
            {percentChange.toFixed(0)}%
          </Typography>
        </Box>
      </Box>
      <TrendChart history={history} />
    </Box>
  );
}

export default TrendCard;