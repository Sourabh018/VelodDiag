import { Card, CardContent, Typography, Box } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function TrendChart({ history = [] }) {
  const data = history.map((v, i) => ({ t: i, duration: v }));

  const maxDuration = data.length > 0 ? Math.max(...data.map((d) => d.duration)) : 100;
  const yMax = Math.ceil((maxDuration * 1.1) / 100) * 100; // 10% headroom, rounded to nearest 100

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography
          sx={{ fontSize: 12, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          Response Time Trend
        </Typography>
        <Box sx={{ height: 220, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                {/*
                  Was #2FE0C4 (teal) — the main Dashboard chart is the most
                  visible thing on the page, so giving it the app's one
                  reserved accent color would compete with the Root Cause
                  correlation card for attention. Kept it neutral/monochrome
                  instead — reads like an instrument trace, not a highlight.
                */}
                <linearGradient id="durationFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B0B0B6" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#B0B0B6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, yMax]} tick={{ fill: "#57575F", fontSize: 12.5 }} width={40} />
              <Tooltip
                contentStyle={{
                  background: "#111113",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 13.5,
                }}
                labelFormatter={() => ""}
                formatter={(v) => [`${v}ms`, "Avg Duration"]}
              />
              <Area type="monotone" dataKey="duration" stroke="#B0B0B6" strokeWidth={1.5} fill="url(#durationFill)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

export default TrendChart;