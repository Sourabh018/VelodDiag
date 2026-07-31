import { AppBar, Toolbar, Typography, Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import AppSelector from "./AppSelector";

// Was primary.main (the new accent-blue, reserved for the Root Cause
// correlation card) — using it here too meant the "one accent, one meaning"
// decision from the theme was broken on every single page load. Switched to
// a quiet neutral so the pulse reads as ambient activity, not a signal.
function PulseStrip() {
  const bars = 14;
  return (
    <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 18 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 3,
            bgcolor: "rgba(255,255,255,0.18)",
            borderRadius: 1,
            animation: `pulse 1.2s ease-in-out ${i * 0.08}s infinite`,
            "@keyframes pulse": {
              "0%, 100%": { height: "30%", opacity: 0.4 },
              "50%": { height: "100%", opacity: 0.8 },
            },
          }}
        />
      ))}
    </Stack>
  );
}

function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "#0A0A0B",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: 64 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: 16.5, fontWeight: 500, color: "#EDEDEF", letterSpacing: "-0.01em" }}>
            VeloxDiag
          </Typography>
          <AppSelector />
        </Stack>

        <Stack direction="row" spacing={3} alignItems="center">
          <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5, color: "text.disabled" }}>
            {time.toLocaleTimeString()}
          </Typography>
          <PulseStrip />
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Was primary.main + a glow — glow effects read as decorative
                rather than premium, and "connected" is a status, not the
                app's one reserved accent, so it now uses a plain, quiet
                green dot with no shadow. */}
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#4ADE80" }} />
            <Typography sx={{ fontSize: 13.5, color: "text.secondary", fontFamily: "ui-monospace, monospace" }}>
              connected
            </Typography>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Header;